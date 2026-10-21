import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import API from "@/src/services/api";
import { useAuth } from "@/context/AuthContext";

type Option={id:number;name:string};
type Service={id:number;name:string;code:string};
type Mode="pricing"|"personnel";
const money=(v:string)=>v.trim()!=="" && /^\d+(\.\d{1,2})?$/.test(v);
export default function VerificationConfiguration(){
 const {isAuthenticated,loading:authLoading}=useAuth();
 const [allowed,setAllowed]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [mode,setMode]=useState<Mode>("pricing"),[services,setServices]=useState<Service[]>([]),[states,setStates]=useState<Option[]>([]),[areas,setAreas]=useState<Option[]>([]);
 const [serviceId,setServiceId]=useState<number|null>(null),[stateId,setStateId]=useState<number|null>(null),[areaId,setAreaId]=useState<number|null>(null);
 const [picker,setPicker]=useState<string|null>(null);
 const [base,setBase]=useState(""),[platform,setPlatform]=useState("0"),[transport,setTransport]=useState("");
 const [start,setStart]=useState(new Date().toISOString().slice(0,10)),[end,setEnd]=useState("");
 const [userId,setUserId]=useState(""),[fee,setFee]=useState(""),[qualification,setQualification]=useState<"pending"|"approved">("pending");
 const [records,setRecords]=useState<any[]>([]);
 useEffect(()=>{if(authLoading)return;if(!isAuthenticated){router.replace("/auth/LoginScreen");return;}
 let active=true;(async()=>{try{
   const access=await API.get("/management/access");if(!(access.data?.permissions??[]).includes("verification.quotes.prepare")){setAllowed(false);return;}
   setAllowed(true);
   const [loc,srv]=await Promise.all([API.getPropertyDropdowns(),API.get("/verification/services")]);
   if(active){setStates(loc.data?.data?.states??loc.data?.states??[]);setServices(srv.data?.data??[]);}
 }catch(e:any){if(active)Alert.alert("Configuration unavailable",e?.response?.data?.message??"Unable to load configuration.");}
 finally{if(active)setLoading(false);}
 })();return()=>{active=false};},[authLoading,isAuthenticated]);
 useEffect(()=>{if(!stateId){setAreas([]);return;}let active=true;
 API.getPropertyArea(stateId).then(r=>{if(active)setAreas(r.data?.data?.areas??r.data?.data??[]);}).catch(()=>{if(active)setAreas([]);});
 return()=>{active=false};
 },[stateId]);
 const refresh=async()=>{if(!serviceId||!stateId){setRecords([]);return;}
 try{const r=await API.get(mode==="pricing"?"/management/verification/configuration/prices":"/management/verification/configuration/professionals",{params:{service_id:serviceId,state_id:stateId}});
 setRecords(mode==="pricing"?(r.data?.data??[]):(r.data?.data??[]));}catch{setRecords([]);}};
 useEffect(()=>{if(allowed)void refresh();},[serviceId,stateId,mode,allowed]);
 const submit=async()=>{
  if(!serviceId||!stateId){Alert.alert("Required","Choose a service and state.");return;}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||end&&!/^\d{4}-\d{2}-\d{2}$/.test(end)){Alert.alert("Dates","Use YYYY-MM-DD dates.");return;}
  if(end&&end<start){Alert.alert("Dates","End date cannot precede start date.");return;}
  if(mode==="pricing"&&(!money(base)||!money(platform)||(transport&&!money(transport)))){Alert.alert("Pricing","Enter valid positive NGN amounts, with no more than two decimal places.");return;}
  if(mode==="personnel"&&(!/^\d+$/.test(userId)||!fee||!money(fee))){Alert.alert("Professional","Enter a valid OHLAM user ID and agreed fee.");return;}
  setBusy(true);
  try {
   const common={service_id:serviceId,state_id:stateId,area_id:areaId,valid_from:start,valid_until:end||null};
   if(mode==="pricing"){
     await API.post("/management/verification/configuration/prices",{...common,customer_base_price:base,platform_fee:platform,transport_rate_per_km:transport||null,is_active:false});
   }else{
     await API.post("/management/verification/configuration/professionals",{...common,user_id:Number(userId),contracted_fee:fee,qualification_status:qualification,is_active:false});
   }
   Alert.alert("Saved as inactive","A record has been created, but it does not activate a live price or professional. Approval and activation require a separate controlled process.");
   await refresh();
  }catch(e:any){const errors=e?.response?.data?.errors;Alert.alert("Could not save",errors?Object.values(errors).flat().join("\n"):e?.response?.data?.message??"Please retry.");}
  finally{setBusy(false);}
 };
 const pickerBox=(name:string,choices:Option[],selected:Option|undefined,choose:(o:Option)=>void)=> <View style={styles.field}>
  <Text style={styles.label}>{name}</Text>
  <TouchableOpacity style={styles.select} onPress={()=>setPicker(picker===name?null:name)}><Text>{selected?.name??"Select "+name}</Text><Text>⌄</Text></TouchableOpacity>
  {picker===name&&<ScrollView nestedScrollEnabled style={styles.options}>{choices.map(o=><TouchableOpacity style={styles.option} key={o.id} onPress={()=>{choose(o);setPicker(null);}}><Text>{o.name}</Text></TouchableOpacity>)}</ScrollView>}
 </View>;
 if(loading||authLoading)return <View style={styles.center}><ActivityIndicator size="large"/></View>;
 if(!allowed)return <View style={styles.center}><Text>Administrator access required.</Text></View>;
 return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
  <TouchableOpacity onPress={()=>router.back()}><Text style={styles.link}>← Admin dashboard</Text></TouchableOpacity>
  <Text style={styles.title}>Verification configuration</Text>
  <Text style={styles.muted}>Create draft pricing and professional records. This screen does not activate a service, approve credentials or release payment.</Text>
  <View style={styles.tabs}>
   {(["pricing","personnel"] as Mode[]).map(m=><TouchableOpacity key={m} style={[styles.tab,mode===m&&styles.activeTab]} onPress={()=>setMode(m)}><Text style={mode===m?styles.white:styles.link}>{m==="pricing"?"Service prices":"Professionals"}</Text></TouchableOpacity>)}
  </View>
  {pickerBox("Service",services.map(s=>({id:s.id,name:s.name})),services.find(s=>s.id===serviceId),o=>setServiceId(o.id))}
  {pickerBox("State",states,states.find(s=>s.id===stateId),o=>{setStateId(o.id);setAreaId(null);})}
  {pickerBox("LGA (optional; blank = state-wide)",areas,areas.find(s=>s.id===areaId),o=>setAreaId(o.id))}
  {areaId!==null&&<TouchableOpacity onPress={()=>setAreaId(null)}><Text style={styles.link}>Clear LGA — use state-wide coverage</Text></TouchableOpacity>}
  {mode==="pricing"?<>
   <Text style={styles.label}>Customer base price (NGN)</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={base} onChangeText={setBase} placeholder="0.00"/>
   <Text style={styles.label}>OHLAM platform fee (NGN)</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={platform} onChangeText={setPlatform}/>
   <Text style={styles.label}>Transportation tariff per km (NGN, optional)</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={transport} onChangeText={setTransport} placeholder="Not yet approved"/>
  </>:<>
   <Text style={styles.label}>Registered professional's OHLAM user ID</Text><TextInput style={styles.input} keyboardType="number-pad" value={userId} onChangeText={setUserId} placeholder="Existing user ID"/>
   <Text style={styles.label}>Contracted professional fee (NGN)</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={fee} onChangeText={setFee} placeholder="Agreed amount"/>
   <Text style={styles.label}>Qualification review</Text><TouchableOpacity style={styles.select} onPress={()=>setQualification(qualification==="pending"?"approved":"pending")}><Text>{qualification==="pending"?"Pending review":"Approved (documented review required)"}</Text></TouchableOpacity>
  </>}
  <Text style={styles.label}>Valid from (YYYY-MM-DD)</Text><TextInput style={styles.input} value={start} onChangeText={setStart}/>
  <Text style={styles.label}>Valid until (optional)</Text><TextInput style={styles.input} value={end} onChangeText={setEnd} placeholder="YYYY-MM-DD"/>
  <View style={styles.notice}><Text style={styles.muted}>New records are inactive by default. Verification of professional credentials and an agreed fee must be documented before an authorised activation process is implemented.</Text></View>
  <TouchableOpacity disabled={busy} style={[styles.save,busy&&{opacity:.5}]} onPress={()=>void submit()}><Text style={styles.white}>{busy?"Saving...":"Save inactive draft"}</Text></TouchableOpacity>
  <Text style={styles.section}>Existing records</Text>
  {records.length===0?<Text style={styles.muted}>No records for this selection.</Text>:records.slice(0,30).map(x=><View key={x.id} style={styles.record}>
   <Text style={styles.recordTitle}>#{x.id} · {x.is_active?"Active":"Inactive"}</Text>
   <Text style={styles.muted}>{mode==="pricing"?`Base ₦${x.customer_base_price} · Platform ₦${x.platform_fee}`:`Professional #${x.user_id} · ${x.qualification_status} · ₦${x.contracted_fee??"not set"}`}</Text>
   <Text style={styles.muted}>State #{x.state_id}{x.area_id?` · LGA #${x.area_id}`:" · all LGAs"} · {x.valid_from??"unset"}–{x.valid_until??"open"}</Text>
  </View>)}
 </ScrollView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:"#f6faff"},content:{padding:20,paddingBottom:70,gap:12},center:{flex:1,alignItems:"center",justifyContent:"center"},title:{fontSize:27,fontWeight:"900",color:"#153a56"},section:{fontSize:18,fontWeight:"800",color:"#153a56",marginTop:12},muted:{color:"#52687a",lineHeight:21},label:{fontWeight:"700",color:"#2a4961"},field:{gap:8},input:{borderWidth:1,borderColor:"#c6d6e3",backgroundColor:"#fff",padding:13,borderRadius:12},select:{borderWidth:1,borderColor:"#c6d6e3",backgroundColor:"#fff",borderRadius:12,padding:14,flexDirection:"row",justifyContent:"space-between"},options:{maxHeight:200,backgroundColor:"#fff",borderWidth:1,borderColor:"#d4e1e9",borderRadius:12},option:{padding:12,borderBottomWidth:1,borderColor:"#edf2f5"},tabs:{flexDirection:"row",gap:10},tab:{flex:1,padding:13,alignItems:"center",borderWidth:1,borderColor:"#176A9C",borderRadius:10},activeTab:{backgroundColor:"#176A9C"},white:{color:"#fff",fontWeight:"800"},link:{color:"#176A9C",fontWeight:"800"},notice:{backgroundColor:"#e9f2fa",padding:14,borderRadius:12},save:{backgroundColor:"#176A9C",borderRadius:12,padding:16,alignItems:"center"},record:{padding:14,backgroundColor:"#fff",borderColor:"#dce8f0",borderWidth:1,borderRadius:12,gap:6},recordTitle:{color:"#173b56",fontWeight:"800"}});
