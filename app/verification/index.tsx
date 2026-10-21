import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import API from "@/src/services/api";
import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Option={id:number;name:string};
type Service={id:number;name:string;description?:string;coverage_status:"local_available"|"outside_lga_review_required"|"wishlist_only";message:string};
type RequestProperty={key:number;state_id:number|null;area_id:number|null;address:string;service_ids:number[];services:Service[];areas:Option[];lookup_status:string;lookup_message:string;is_owner:boolean;map_assistance_requested:boolean;building_name:string;street_name:string;landmark:string;postal_code:string;note:string;request_mode:"review"|"wishlist";};
const blank=(key:number):RequestProperty=>({key,state_id:null,area_id:null,address:"",service_ids:[],services:[],areas:[],lookup_status:"unchecked",lookup_message:"",is_owner:false,map_assistance_requested:false,building_name:"",street_name:"",landmark:"",postal_code:"",note:"",request_mode:"review"});
export default function VerificationRequestScreen(){
  const {isAuthenticated,loading:authLoading}=useAuth();
  const [states,setStates]=useState<Option[]>([]);
  const [items,setItems]=useState<RequestProperty[]>([blank(1)]);
  const [expanded,setExpanded]=useState<string|null>(null);
  const [loading,setLoading]=useState(true),[sending,setSending]=useState(false);
  const keyRef=useRef(2),timers=useRef<Record<number,ReturnType<typeof setTimeout>>>({});
  const update=(key:number,patch:Partial<RequestProperty>)=>setItems(old=>old.map(p=>p.key===key?{...p,...patch}:p));
  useEffect(()=>{if(authLoading)return;if(!isAuthenticated){router.replace("/auth/LoginScreen");return;}
    let active=true;
    (async()=>{try{
      const response=await API.getPropertyDropdowns();
      const options=response.data?.data?.states??response.data?.states??[];
      if(active)setStates(Array.isArray(options)?options:[]);
    }catch{Alert.alert("Location list unavailable","Unable to load state list. Try again shortly.");}finally{if(active)setLoading(false);}})();
    return()=>{active=false;Object.values(timers.current).forEach(clearTimeout)};
  },[authLoading,isAuthenticated]);
  const chooseState=async(p:RequestProperty,s:Option)=>{
    update(p.key,{state_id:s.id,area_id:null,areas:[],address:"",services:[],service_ids:[],lookup_status:"unchecked",lookup_message:""});
    setExpanded(null);
    try{const response=await API.getPropertyArea(s.id);const areas=response.data?.data?.areas??response.data?.data??[];update(p.key,{areas:Array.isArray(areas)?areas:[]});}
    catch{Alert.alert("Location unavailable","Could not load LGAs for this state.");}
  };
  const chooseArea=async(p:RequestProperty,a:Option)=>{
    update(p.key,{area_id:a.id,services:[],service_ids:[],lookup_status:"unchecked",lookup_message:""});setExpanded(null);
    try{const r=await API.get("/verification/available-services",{params:{state_id:p.state_id,area_id:a.id}});
      update(p.key,{services:r.data?.data?.services??[]});
    }catch{Alert.alert("Services unavailable","Unable to load available verification services for this location.");}
  };
  const checkAddress=useCallback(async(p:RequestProperty,address:string)=>{
    if(!p.state_id||!p.area_id||address.trim().length<8)return;
    const state=states.find(x=>x.id===p.state_id)?.name,area=p.areas.find(x=>x.id===p.area_id)?.name;
    if(!state||!area)return;
    update(p.key,{lookup_status:"checking",lookup_message:"Checking map address..."});
    try{
      const r=await API.post("/verification/address-lookup",{address:address.trim()+", "+area,state});
      const result=r.data?.data??{status:"unavailable"};
      update(p.key,{lookup_status:result.status,lookup_message:result.message??""});
    }catch{update(p.key,{lookup_status:"unavailable",lookup_message:"The Google Maps check is unavailable. You may still request verification."});}
  },[states]);
  const changeAddress=(p:RequestProperty,value:string)=>{
    update(p.key,{address:value,lookup_status:"unchecked",lookup_message:"",map_assistance_requested:false});
    clearTimeout(timers.current[p.key]);
    if(value.trim().length>=8&&p.state_id&&p.area_id)timers.current[p.key]=setTimeout(()=>void checkAddress(p,value),1200);
  };
  const submit=async()=>{
    if(items.some(p=>!p.state_id||!p.area_id||p.address.trim().length<8||!p.service_ids.length)){
      Alert.alert("Complete properties","Every property needs a state, LGA, full address, and at least one service.");return;
    }
    if(items.some(p=>p.map_assistance_requested&&!p.is_owner)){
      Alert.alert("Owner confirmation","Only owners or authorised representatives may request help contributing an address to Google Maps.");return;
    }
    setSending(true);
    try{
      const r=await API.post("/verification/requests",{properties:items.map(p=>({
        state_id:p.state_id,area_id:p.area_id,address:p.address.trim(),service_ids:p.service_ids,
        is_owner:p.is_owner,map_assistance_requested:p.map_assistance_requested,
        map_assistance_details:p.map_assistance_requested?{building_name:p.building_name,street_name:p.street_name,landmark:p.landmark,postal_code:p.postal_code}:null,
        note:p.note.trim()||null,request_mode:p.request_mode,
      }))});
      const propertyIds=r.data?.data?.property_ids??[];
      Alert.alert("Request received",`Reference #${r.data?.data?.id??""}. Please upload supporting documents for each property.`,[{text:"Continue to documents",onPress:()=>router.replace({pathname:"/verification/documents",params:{propertyIds:propertyIds.join(",")}})}]);
    }catch(e:any){Alert.alert("Unable to submit",e?.response?.data?.message??"Please check your entries and try again.");}
    finally{setSending(false);}
  };
  if(authLoading||!isAuthenticated)return <View style={styles.center}><ActivityIndicator/></View>;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <TouchableOpacity style={styles.back} onPress={()=>router.back()}><MaterialCommunityIcons name="arrow-left" size={22} color="#176A9C"/><Text style={styles.link}>Back</Text></TouchableOpacity>
    <Text style={styles.title}>Property Verification</Text>
    <Text style={styles.muted}>Add multiple properties. Select the verification services you need for each location.</Text>
    {loading?<ActivityIndicator/>:items.map((p,index)=>{
      const state=states.find(x=>x.id===p.state_id),area=p.areas.find(x=>x.id===p.area_id);
      const unstaffed=p.service_ids.some(id=>p.services.find(s=>s.id===id)?.coverage_status!=="local_available");
      return <View key={p.key} style={styles.property}>
        <View style={styles.headingRow}><Text style={styles.heading}>Property {index+1}</Text>{items.length>1&&<TouchableOpacity onPress={()=>setItems(old=>old.filter(x=>x.key!==p.key))}><Text style={styles.remove}>Remove</Text></TouchableOpacity>}</View>
        <Text style={styles.label}>State *</Text>
        <TouchableOpacity style={styles.select} onPress={()=>setExpanded(expanded===`state-${p.key}`?null:`state-${p.key}`)}><Text>{state?.name??"Select state"}</Text><MaterialCommunityIcons name="chevron-down" size={20}/></TouchableOpacity>
        {expanded===`state-${p.key}`&&<ScrollView nestedScrollEnabled style={styles.dropdown}>{states.map(s=><TouchableOpacity key={s.id} style={styles.option} onPress={()=>void chooseState(p,s)}><Text>{s.name}</Text></TouchableOpacity>)}</ScrollView>}
        <Text style={styles.label}>Local Government Area *</Text>
        <TouchableOpacity disabled={!state} style={styles.select} onPress={()=>setExpanded(expanded===`area-${p.key}`?null:`area-${p.key}`)}><Text>{area?.name??"Select LGA"}</Text><MaterialCommunityIcons name="chevron-down" size={20}/></TouchableOpacity>
        {expanded===`area-${p.key}`&&<ScrollView nestedScrollEnabled style={styles.dropdown}>{p.areas.map(a=><TouchableOpacity key={a.id} style={styles.option} onPress={()=>void chooseArea(p,a)}><Text>{a.name}</Text></TouchableOpacity>)}</ScrollView>}
        <Text style={styles.label}>Street address / property description *</Text>
        <TextInput multiline style={styles.input} editable={!!area} placeholder="House number, street, estate or landmark" value={p.address} onChangeText={v=>changeAddress(p,v)} maxLength={500}/>
        {p.lookup_status!=="unchecked"&&<View style={styles.notice}><Text style={styles.status}>{p.lookup_status==="candidate_found"?"✓ Possible Google Maps address found":p.lookup_status==="not_found"?"No matching address found on Google Maps":p.lookup_status==="checking"?"Checking Google Maps...":"Address needs manual confirmation"}</Text><Text style={styles.muted}>{p.lookup_message}</Text></View>}
        {(p.lookup_status==="not_found"||p.lookup_status==="needs_confirmation")&&<>
          <Text style={styles.muted}>A map search did not confirm an exact address. This does not mean the property is nonexistent or fraudulent. Owners may request free assistance submitting an address suggestion to Google.</Text>
          <TouchableOpacity style={styles.checkbox} onPress={()=>update(p.key,{is_owner:!p.is_owner,map_assistance_requested:false})}><Text>{p.is_owner?"☑":"☐"} I own this property or am authorised to request an address correction</Text></TouchableOpacity>
          {p.is_owner&&<TouchableOpacity style={styles.checkbox} onPress={()=>update(p.key,{map_assistance_requested:!p.map_assistance_requested})}><Text>{p.map_assistance_requested?"☑":"☐"} Request free Google Maps address assistance</Text></TouchableOpacity>}
          {p.map_assistance_requested&&<>
            <TextInput style={styles.input} placeholder="Building / estate name" value={p.building_name} onChangeText={v=>update(p.key,{building_name:v})}/>
            <TextInput style={styles.input} placeholder="Street name" value={p.street_name} onChangeText={v=>update(p.key,{street_name:v})}/>
            <TextInput style={styles.input} placeholder="Nearest landmark" value={p.landmark} onChangeText={v=>update(p.key,{landmark:v})}/>
            <TextInput style={styles.input} placeholder="Postal code (optional)" value={p.postal_code} onChangeText={v=>update(p.key,{postal_code:v})}/>
            <Text style={styles.muted}>Google reviews submissions independently; OHLAM cannot guarantee an address will be published.</Text>
          </>}
        </>}
        <Text style={styles.label}>Requested services * (select multiple)</Text>
        {p.area_id&&p.services.length===0&&<Text style={styles.muted}>No enabled services for this area yet.</Text>}
        {p.services.map(s=><TouchableOpacity key={s.id} style={styles.service} onPress={()=>update(p.key,{service_ids:p.service_ids.includes(s.id)?p.service_ids.filter(x=>x!==s.id):[...p.service_ids,s.id]})}>
          <Text style={styles.serviceName}>{p.service_ids.includes(s.id)?"☑":"☐"} {s.name}</Text><Text style={styles.muted}>{s.message}</Text>
        </TouchableOpacity>)}
        {unstaffed&&<View style={styles.notice}><Text style={styles.status}>Professional coverage requires confirmation</Text><Text style={styles.muted}>No active professional is confirmed in this LGA for all selected services. OHLAM may contact another professional in the state. Acceptance, travel and price remain subject to review.</Text><TouchableOpacity style={styles.checkbox} onPress={()=>update(p.key,{request_mode:"review"})}><Text>{p.request_mode==="review"?"◉":"◯"} Proceed with manual assessment</Text></TouchableOpacity><TouchableOpacity style={styles.checkbox} onPress={()=>update(p.key,{request_mode:"wishlist"})}><Text>{p.request_mode==="wishlist"?"◉":"◯"} Add to wishlist for future coverage</Text></TouchableOpacity></View>}
        <TextInput style={styles.input} multiline placeholder="Other notes (optional)" value={p.note} onChangeText={v=>update(p.key,{note:v})}/>
      </View>;
    })}
    <TouchableOpacity style={styles.add} onPress={()=>setItems(old=>[...old,blank(keyRef.current++)])} disabled={items.length>=10}><MaterialCommunityIcons name="plus-circle-outline" color="#176A9C" size={22}/><Text style={styles.link}>Add another property ({items.length}/10)</Text></TouchableOpacity>
    <View style={styles.notice}><Text style={styles.muted}>Prices will be shown only after admin pricing and personnel coverage are configured. No automatic charges or guaranteed personnel assignments are made by this form.</Text></View>
    <TouchableOpacity style={[styles.submit,sending&&{opacity:.5}]} disabled={sending||loading} onPress={()=>void submit()}><Text style={styles.white}>{sending?"Submitting...":"Submit properties for assessment"}</Text></TouchableOpacity>
  </ScrollView>;
}
const styles=StyleSheet.create({
  page:{flex:1,backgroundColor:"#f6faff"},content:{padding:18,paddingBottom:60,gap:13},center:{flex:1,justifyContent:"center",alignItems:"center"},back:{flexDirection:"row",alignItems:"center",gap:7},link:{fontWeight:"700",color:"#176A9C"},title:{fontSize:26,color:"#18344c",fontWeight:"900"},muted:{color:"#536b7f",lineHeight:21},property:{backgroundColor:"#fff",borderColor:"#dbe7f1",borderWidth:1,borderRadius:17,padding:16,gap:10},headingRow:{flexDirection:"row",justifyContent:"space-between"},heading:{fontSize:19,fontWeight:"800",color:"#1a3a54"},remove:{color:"#b42318",fontWeight:"700"},label:{fontSize:14,fontWeight:"800",color:"#294358"},select:{borderWidth:1,borderColor:"#bfd0df",borderRadius:11,padding:13,flexDirection:"row",justifyContent:"space-between",backgroundColor:"#f8fbff"},dropdown:{maxHeight:180,borderColor:"#cadaea",borderWidth:1,borderRadius:10},option:{padding:12,borderBottomWidth:1,borderBottomColor:"#edf2f7"},input:{borderWidth:1,borderColor:"#bfd0df",borderRadius:11,padding:13,color:"#18344c",minHeight:48,textAlignVertical:"top"},notice:{padding:13,borderRadius:11,backgroundColor:"#eaf3fc",gap:8},status:{fontWeight:"800",color:"#1a4769"},checkbox:{paddingVertical:7},service:{padding:12,borderRadius:10,backgroundColor:"#f4f8fc",gap:3},serviceName:{fontSize:15,fontWeight:"700",color:"#223d54"},add:{padding:16,borderRadius:12,borderWidth:1,borderColor:"#176A9C",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},submit:{backgroundColor:"#176A9C",padding:17,alignItems:"center",borderRadius:12},white:{color:"#fff",fontWeight:"800",fontSize:16}
});
