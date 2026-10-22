import React,{useCallback,useState} from "react";
import {ActivityIndicator,Alert,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import API from "@/src/services/api";
import {useAuth} from "@/context/AuthContext";

type Item={id:number;title:string;description:string;requirements:string;status:string;service_id:number;state_id:number;area_id:number|null;service_name:string;state_name:string;area_name:string|null;closes_at:string|null};
type Option={id:number;name:string};
export default function VerificationVacancies(){
 const {isAuthenticated,loading:authLoading}=useAuth();
 const [permitted,setPermitted]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [items,setItems]=useState<Item[]>([]),[services,setServices]=useState<Option[]>([]),[states,setStates]=useState<Option[]>([]),[areas,setAreas]=useState<Option[]>([]);
 const [service,setService]=useState<number|null>(null),[state,setState]=useState<number|null>(null),[area,setArea]=useState<number|null>(null),[picker,setPicker]=useState("");
 const [title,setTitle]=useState(""),[description,setDescription]=useState(""),[requirements,setRequirements]=useState(""),[closing,setClosing]=useState("");
 const [editing,setEditing]=useState<number|null>(null);
 const refresh=useCallback(async()=>{
  const response=await API.get("/management/verification/vacancies");
  setItems(response.data?.data??[]);
 },[]);
 useFocusEffect(useCallback(()=>{let live=true;if(authLoading)return;
  if(!isAuthenticated){router.replace("/auth/LoginScreen");return;}
  (async()=>{try{
   const access=await API.get("/management/access");
   if(!(access.data?.permissions??[]).includes("verification.quotes.prepare"))return;
   if(!live)return;setPermitted(true);
   const [v,s,l]=await Promise.all([
    API.get("/management/verification/vacancies"),
    API.get("/management/verification/configuration/services"),
    API.getPropertyDropdowns()
   ]);
   if(live){setItems(v.data?.data??[]);setServices(s.data?.data??[]);setStates(l.data?.data?.states??[]);}
  }catch(e:any){if(live)Alert.alert("Load failed",e?.response?.data?.message??"Unable to load vacancy management.");}
  finally{if(live)setLoading(false);}})();
  return()=>{live=false};
 },[authLoading,isAuthenticated]));
 const chooseState=async(id:number)=>{setState(id);setArea(null);setPicker("");
  try{const r=await API.getPropertyArea(id);setAreas(r.data?.data?.areas??r.data?.data??[]);}
  catch{setAreas([]);}
 };
 const save=async()=>{
  if(!service||!state||!title.trim()||!description.trim()||!requirements.trim()){Alert.alert("Missing information","Select service and state and provide title, duties, and qualifications.");return;}
  setBusy(true);
  try{
   const fields={title:title.trim(),description:description.trim(),requirements:requirements.trim(),closes_at:closing.trim()||null};
   if(editing)await API.patch(`/management/verification/vacancies/${editing}`,fields);
   else await API.post("/management/verification/vacancies",{...fields,service_id:service,state_id:state,area_id:area});
   Alert.alert("Draft saved","You can review the vacancy and publish it when recruitment is ready.");
   setEditing(null);setTitle("");setDescription("");setRequirements("");setClosing("");
   await refresh();
  }catch(e:any){Alert.alert("Cannot save",Object.values(e?.response?.data?.errors??{}).flat().join("\n")||e?.response?.data?.message||"Please try again.");}
  finally{setBusy(false);}
 };
 const transition=(item:Item,action:"publish"|"close")=>{
  Alert.alert(action==="publish"?"Publish vacancy?":"Close vacancy?",action==="publish"?"This advert will become publicly visible and accept applications.":"This vacancy will stop accepting applications.",[
   {text:"Cancel",style:"cancelled"},{text:"Confirm",onPress:async()=>{try{
    await API.post(`/management/verification/vacancies/${item.id}/transition`,{action});await refresh();
   }catch(e:any){Alert.alert("Action failed",e?.response?.data?.message||"Please retry.");}}}
  ]);
 };
 const selector=(name:string,options:Option[],id:number|null,onPick:(x:number)=>void)=> <View style={styles.field}>
  <Text style={styles.label}>{name}</Text><TouchableOpacity style={styles.input} onPress={()=>setPicker(picker===name?"":name)}><Text>{options.find(o=>o.id===id)?.name??"Select "+name}</Text></TouchableOpacity>
  {picker===name&&<ScrollView nestedScrollEnabled style={styles.choices}>{options.map(o=><TouchableOpacity key={o.id} style={styles.choice} onPress={()=>{onPick(o.id);setPicker("");}}><Text>{o.name}</Text></TouchableOpacity>)}</ScrollView>}
 </View>;
 if(loading||authLoading)return <View style={styles.center}><ActivityIndicator/></View>;
 if(!permitted)return <View style={styles.center}><Text>Admin access required.</Text></View>;
 return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
  <TouchableOpacity onPress={()=>router.back()}><Text style={styles.link}>← Admin dashboard</Text></TouchableOpacity>
  <Text style={styles.title}>Verification recruitment</Text>
  <Text style={styles.muted}>Create location-specific vacancies for field verifiers and qualified professionals. Review drafts before publication.</Text>
  <Text style={styles.heading}>{editing?"Edit draft vacancy":"Create vacancy"}</Text>
  {selector("Verification service",services,service,setService)}
  {selector("State",states,state,id=>{void chooseState(id);})}
  {selector("LGA (optional, statewide role)",areas,area,setArea)}
  {area!==null&&<TouchableOpacity onPress={()=>setArea(null)}><Text style={styles.link}>Clear LGA</Text></TouchableOpacity>}
  <TextInput style={styles.input} placeholder="Vacancy title" value={title} onChangeText={setTitle} maxLength={160}/>
  <TextInput style={[styles.input,styles.multi]} placeholder="Responsibilities, assignment type and contractor terms" value={description} onChangeText={setDescription} multiline maxLength={10000}/>
  <TextInput style={[styles.input,styles.multi]} placeholder="Requirements: smartphone, training or professional registration, as applicable" value={requirements} onChangeText={setRequirements} multiline maxLength={10000}/>
  <TextInput style={styles.input} placeholder="Closing date/time (optional, ISO 8601)" value={closing} onChangeText={setClosing}/>
  <TouchableOpacity disabled={busy} style={styles.primary} onPress={()=>void save()}><Text style={styles.white}>{busy?"Saving...":editing?"Update draft":"Save draft vacancy"}</Text></TouchableOpacity>
  <Text style={styles.heading}>Vacancy register</Text>
  {items.map(x=><View style={styles.card} key={x.id}>
    <Text style={styles.name}>{x.title}</Text>
    <Text style={styles.muted}>{x.service_name} · {x.area_name??"Statewide"}, {x.state_name}</Text>
    <Text style={styles.muted}>Status: {x.status}</Text>
    <View style={styles.actions}>
     {x.status==="draft"&&<><TouchableOpacity onPress={()=>{setEditing(x.id);setService(x.service_id);void chooseState(x.state_id);setArea(x.area_id);setTitle(x.title);setDescription(x.description);setRequirements(x.requirements);setClosing(x.closes_at??"");}}><Text style={styles.link}>Edit</Text></TouchableOpacity><TouchableOpacity onPress={()=>transition(x,"publish")}><Text style={styles.link}>Publish</Text></TouchableOpacity></>}
     {x.status==="published"&&<TouchableOpacity onPress={()=>transition(x,"close")}><Text style={styles.danger}>Close applications</Text></TouchableOpacity>}
    </View>
  </View>)}
  {!items.length&&<Text style={styles.muted}>No vacancies created yet.</Text>}
 </ScrollView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:"#f7faff"},content:{padding:20,paddingBottom:75,gap:12},center:{flex:1,justifyContent:"center",alignItems:"center"},title:{fontSize:25,fontWeight:"900",color:"#17384f"},heading:{fontSize:19,fontWeight:"800",color:"#17384f",marginTop:10},muted:{color:"#566c7e",lineHeight:21},label:{fontWeight:"700",color:"#243f53"},field:{gap:7},input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#cad9e5",padding:13,borderRadius:11,color:"#1b3449"},multi:{minHeight:85,textAlignVertical:"top"},choices:{maxHeight:190,backgroundColor:"#fff",borderWidth:1,borderColor:"#ccdce8"},choice:{padding:12,borderBottomWidth:1,borderBottomColor:"#e8eef4"},primary:{backgroundColor:"#176A9C",padding:16,alignItems:"center",borderRadius:11},white:{color:"#fff",fontWeight:"800"},link:{fontWeight:"800",color:"#176A9C"},danger:{fontWeight:"800",color:"#a52820"},card:{backgroundColor:"#fff",borderRadius:12,borderWidth:1,borderColor:"#dce8f1",padding:14,gap:8},name:{fontSize:16,fontWeight:"800",color:"#193b51"},actions:{flexDirection:"row",gap:22,paddingTop:8}});
