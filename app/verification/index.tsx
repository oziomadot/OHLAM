import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import API from "@/src/services/api";
import { getItemSafe } from "@/utils/storage";

type Service = { id:number; code:string; name:string; description?:string };
type Lookup = {status:string;message?:string;candidates?:{place_id:string|null;formatted_address:string;latitude:number|null;longitude:number|null;partial_match:boolean}[]};
export default function VerificationRequestScreen() {
  const [services,setServices] = useState<Service[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [serviceId,setServiceId] = useState<number|null>(null);
  const [address,setAddress] = useState("");
  const [state,setState] = useState("");
  const [lga,setLga] = useState("");
  const [note,setNote] = useState("");
  const [lookup,setLookup] = useState<Lookup|null>(null);
  const [selectedPin,setSelectedPin] = useState<{latitude:number;longitude:number}|null>(null);
  const [assistance,setAssistance] = useState(false);
  const [signedIn,setSignedIn] = useState(false);

  useEffect(()=>{let mounted=true;(async()=>{
    try {
      const token=await getItemSafe("auth_token");
      if(mounted)setSignedIn(Boolean(token?.trim()));
      const response=await API.get("/verification/services");
      if(mounted)setServices(Array.isArray(response.data?.data)?response.data.data:[]);
    }catch {if(mounted)Alert.alert("Service unavailable","We couldn't load verification services. Please try again.");}
    finally {if(mounted)setLoading(false);}
  })();return()=>{mounted=false};},[]);

  const checkAddress=async()=>{
    if(address.trim().length<8 || !state.trim()){Alert.alert("Address required","Enter a detailed address and state first.");return;}
    setBusy(true);setLookup(null);setSelectedPin(null);
    try {
      const r=await API.post("/verification/address-lookup",{address:address.trim(),state:state.trim()});
      setLookup(r.data?.data??{status:"unavailable"});
    }catch(e:any){
      if(e?.response?.status===401)Alert.alert("Sign in required","Log in to check an address with Google Maps.");
      else Alert.alert("Lookup unavailable","Please retry later. You can still submit the verification request.");
    }finally{setBusy(false);}
  };
  const submit=async()=>{
    if(!serviceId){Alert.alert("Select a service","Select one active verification service.");return;}
    if(address.trim().length<8||!state.trim()){Alert.alert("Location required","Enter a detailed property address and state.");return;}
    if(!signedIn){Alert.alert("Sign in required","Please log in before requesting a verification service.");return;}
    setBusy(true);
    try {
      const r=await API.post("/verification/orders",{
        service_id:serviceId,address:address.trim(),state:state.trim(),lga:lga.trim()||null,
        customer_note:note.trim()||null,google_address_assistance_requested:assistance,
        ...(selectedPin?selectedPin:{}),
      });
      const id=r.data?.data?.id;
      Alert.alert("Request received",`Your verification request ${id?"#"+id:""} has been submitted. OHLAM will review availability and contact you before any payment.`,[
        {text:"OK",onPress:()=>router.replace("/(tabs)/home")}
      ]);
    }catch(e:any){
      Alert.alert("Request not submitted",e?.response?.data?.message||"Please check your information and try again.");
    }finally{setBusy(false);}
  };
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <TouchableOpacity onPress={()=>router.back()} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={22} color="#17365a"/><Text style={styles.backText}>Back</Text></TouchableOpacity>
    <MaterialCommunityIcons name="shield-home-outline" size={42} color="#176A9C"/>
    <Text style={styles.title}>Verify a property</Text>
    <Text style={styles.info}>Request an independent visit or professional investigation before you commit money. Services are available only in activated locations.</Text>
    <Text style={styles.heading}>Choose a service</Text>
    {loading?<ActivityIndicator/>:services.length===0?<View style={styles.notice}><Text style={styles.noticeText}>Verification requests are not accepting new orders yet. OHLAM will activate services when approved professionals are available.</Text></View>:services.map(s=><TouchableOpacity key={s.id} onPress={()=>setServiceId(s.id)} style={[styles.card,serviceId===s.id&&styles.selected]}><Text style={styles.cardTitle}>{s.name}</Text><Text style={styles.info}>{s.description}</Text></TouchableOpacity>)}
    <Text style={styles.heading}>Property location</Text>
    <TextInput style={styles.input} placeholder="Full property address *" value={address} onChangeText={v=>{setAddress(v);setLookup(null);setSelectedPin(null)}} maxLength={500} multiline/>
    <TextInput style={styles.input} placeholder="State (e.g. Enugu) *" value={state} onChangeText={v=>{setState(v);setLookup(null);setSelectedPin(null)}} maxLength={100}/>
    <TextInput style={styles.input} placeholder="LGA (optional)" value={lga} onChangeText={setLga} maxLength={150}/>
    <TouchableOpacity style={styles.secondaryButton} onPress={checkAddress} disabled={busy}><MaterialCommunityIcons name="map-search" size={19} color="#176A9C"/><Text style={styles.secondaryText}>Check address on Google Maps</Text></TouchableOpacity>
    {lookup&&<View style={styles.notice}><Text style={styles.cardTitle}>Address check: {lookup.status.replace(/_/g," ")}</Text><Text style={styles.info}>{lookup.message||"A map search cannot verify property ownership."}</Text>
      {lookup.candidates?.map((c,i)=><TouchableOpacity key={c.place_id||String(i)} style={styles.candidate} onPress={()=>c.latitude!==null&&c.longitude!==null&&setSelectedPin({latitude:c.latitude,longitude:c.longitude})}><Text style={styles.info}>{selectedPin?.latitude===c.latitude&&selectedPin?.longitude===c.longitude?"✓ ":""}{c.formatted_address}</Text><Text style={styles.small}>Tap to use this candidate pin. Confirm actual location during inspection.</Text></TouchableOpacity>)}
    </View>}
    {(lookup?.status==="not_found"||lookup?.status==="needs_confirmation")&&<TouchableOpacity onPress={()=>setAssistance(!assistance)} style={styles.card}><Text style={styles.cardTitle}>{assistance?"☑":"☐"} Free Google Maps address assistance</Text><Text style={styles.info}>OHLAM may help submit a missing-address correction after verification. Google decides whether to publish it. No guaranteed publication.</Text></TouchableOpacity>}
    <Text style={styles.heading}>Additional information</Text>
    <TextInput style={[styles.input,{minHeight:100}]} multiline placeholder="What should our verifier know? (optional)" value={note} onChangeText={setNote} maxLength={3000}/>
    <View style={styles.notice}><Text style={styles.noticeText}>Submitting is not payment. A visit does not establish legal title. The team will confirm availability and quotation separately.</Text></View>
    <TouchableOpacity disabled={busy||loading||!services.length} style={[styles.button,(busy||loading||!services.length)&&styles.disabled]} onPress={submit}><Text style={styles.buttonText}>{busy?"Please wait...":"Submit verification request"}</Text></TouchableOpacity>
  </ScrollView>;
}
const styles=StyleSheet.create({
  page:{flex:1,backgroundColor:"#f8fbff"},content:{padding:22,paddingBottom:60,gap:12},back:{flexDirection:"row",gap:8,alignItems:"center",marginBottom:6},backText:{color:"#17365a",fontWeight:"600"},title:{fontSize:28,fontWeight:"800",color:"#122b43"},heading:{fontSize:18,fontWeight:"700",color:"#122b43",marginTop:10},info:{color:"#53677a",fontSize:14,lineHeight:21},card:{padding:16,borderRadius:15,backgroundColor:"#fff",borderWidth:1,borderColor:"#dce5ef",gap:6},selected:{borderColor:"#176A9C",borderWidth:2},cardTitle:{fontWeight:"700",color:"#18344c",fontSize:15},input:{borderRadius:12,padding:14,borderWidth:1,borderColor:"#cad7e3",backgroundColor:"#fff",fontSize:15,color:"#172f44",textAlignVertical:"top"},secondaryButton:{borderRadius:12,borderWidth:1,borderColor:"#176A9C",padding:14,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},secondaryText:{color:"#176A9C",fontWeight:"700"},notice:{borderRadius:12,backgroundColor:"#eaf3fc",padding:14,gap:7},noticeText:{color:"#2c4a60",lineHeight:20},candidate:{paddingVertical:10,borderTopWidth:1,borderColor:"#ccdce8"},small:{color:"#607589",fontSize:12},button:{backgroundColor:"#176A9C",padding:17,alignItems:"center",borderRadius:14},disabled:{opacity:.5},buttonText:{color:"#fff",fontWeight:"800",fontSize:16}
});
