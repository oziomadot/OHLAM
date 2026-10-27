import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getItemSafe } from "@/utils/storage";
import API, { BASE_URL } from "@/src/services/api";
import { useAuth } from "@/context/AuthContext";

type Application = { id:number; vacancy_id:number; name:string; email:string; phone:string; status:string; created_at:string; vacancy:string; department?:string; experience?:string };
type Document = { id:number; kind:string; original_name:string; mime_type:string; size_bytes:number; risk_status:string; risk_signals:string[]|string|null };
type Review = { id:number; from_status:string; to_status:string; notes:string; created_at:string; reviewer:string };
type Details = { application:Application; documents:Document[]; reviews:Review[] };
const actions = ["under_review", "shortlisted", "rejected", "accepted"] as const;

export default function RecruitmentApplicants() {
 const {isAuthenticated, loading:authLoading}=useAuth();
 const [allowed,setAllowed]=useState(false);
 const [isAdmin,setIsAdmin]=useState(false);
 const [busy,setBusy]=useState(true);
 const [saving,setSaving]=useState(false);
 const [items,setItems]=useState<Application[]>([]);
 const [selected,setSelected]=useState<Details|null>(null);
 const [notes,setNotes]=useState("");
 const [error,setError]=useState("");

 const load=useCallback(async()=>{
  if(authLoading)return;
  if(!isAuthenticated){router.replace("/auth/LoginScreen");return;}
  setBusy(true);setError("");
  try {
   const access=await API.get("/management/access");
   const permissions:string[]=access.data?.permissions??[];
   const canReview=permissions.includes("recruitment.review");
   setAllowed(canReview);
   setIsAdmin(permissions.includes("recruitment.decide"));
   if(!canReview)return;
   const result=await API.get("/management/recruitment/applications");
   const payload=result.data?.data;
   setItems(Array.isArray(payload)?payload:(payload?.data??[]));
  }catch(e:any){setError(e?.response?.data?.message??"Unable to load applications.");}
  finally{setBusy(false);}
 },[authLoading,isAuthenticated]);
 useFocusEffect(useCallback(()=>{void load();},[load]));

 const show=async(id:number)=>{
  setBusy(true);setError("");
  try {
   const res=await API.get(`/management/recruitment/applications/${id}`);
   setSelected(res.data?.data??null);
   setNotes("");
  }catch(e:any){Alert.alert("Unable to open application",e?.response?.data?.message??"Please try again.");}
  finally{setBusy(false);}
 };
 const download=async(doc:Document)=>{
  if(!selected)return;
  setSaving(true);
  try {
   const token=await getItemSafe("auth_token");
   if(!token)throw new Error("Please log in again.");
   const path=`${BASE_URL.replace(/\/$/,"")}/management/recruitment/applications/${selected.application.id}/documents/${doc.id}`;
   const uri=(FileSystem.cacheDirectory||FileSystem.documentDirectory)+`recruitment-${doc.id}-${doc.original_name.replace(/[^A-Za-z0-9._-]/g,"_")}`;
   const file=await FileSystem.downloadAsync(path,uri,{headers:{Authorization:`Bearer ${token}`,Accept:"application/octet-stream"}});
   if(file.status!==200)throw new Error("Document download failed.");
   if(!(await Sharing.isAvailableAsync()))throw new Error("Document sharing is unavailable on this device.");
   await Sharing.shareAsync(file.uri,{dialogTitle:"Review recruitment document"});
  }catch(e:any){Alert.alert("Download unavailable",e.message??"Please try again.");}
  finally{setSaving(false);}
 };
 const refreshDetails=async()=>{if(selected)await show(selected.application.id);};
 const changeStatus=(action:typeof actions[number])=>{
  if(!selected||notes.trim().length<10){Alert.alert("Review notes required","Enter at least 10 characters of review notes.");return;}
  Alert.alert("Confirm application decision",`Change status to ${action.replace(/_/g," ")}?`,[
   {text:"Cancel",style:"cancel"},
   {text:"Confirm",onPress:()=>{void(async()=>{
    setSaving(true);
    try {
     await API.post(`/management/recruitment/applications/${selected.application.id}/review`,{action,notes:notes.trim()});
     await refreshDetails();await load();
     Alert.alert("Review saved","The application status has been updated.");
    }catch(e:any){Alert.alert("Review failed",e?.response?.data?.message??"Unable to update application.");}
    finally{setSaving(false);}
   })();}}
  ]);
 };
 const assess=(doc:Document,decision:"reviewed"|"review_flag")=>{
  if(!selected||notes.trim().length<10){Alert.alert("Notes required","Explain the basis for this assessment (at least 10 characters).");return;}
  Alert.alert("Confirm document review",`Mark document as ${decision.replace("_"," ")}?`,[
   {text:"Cancel",style:"cancel"},
   {text:"Confirm",onPress:()=>{void(async()=>{
    setSaving(true);
    try {
     await API.post(`/management/recruitment/applications/${selected.application.id}/documents/${doc.id}/assess`,{decision,notes:notes.trim()});
     await refreshDetails();setNotes("");
    }catch(e:any){Alert.alert("Document review failed",e?.response?.data?.message??"Try again.");}
    finally{setSaving(false);}
   })();}}
  ]);
 };

 return <View style={styles.page}>
  <TouchableOpacity onPress={()=>selected?setSelected(null):router.back()}><Text style={styles.link}>← {selected?"Applications":"Management"}</Text></TouchableOpacity>
  <Text style={styles.title}>{selected?"Applicant review":"Recruitment Applications"}</Text>
  <Text style={styles.muted}>Private applicant documents. A suspicious-file flag is not proof of forgery and must be verified independently.</Text>
  {error?<Text style={styles.warning}>{error}</Text>:null}
  {busy?<ActivityIndicator/>:!allowed?<Text>Recruitment review permission required.</Text>:selected?<ScrollView contentContainerStyle={{paddingBottom:60,gap:12}}>
   <View style={styles.card}>
    <Text style={styles.name}>{selected.application.name}</Text>
    <Text selectable>{selected.application.email} · {selected.application.phone}</Text>
    <Text>{selected.application.vacancy}</Text>
    <Text style={styles.status}>Status: {selected.application.status}</Text>
    {selected.application.experience?<Text>Applicant statement: {selected.application.experience}</Text>:null}
   </View>
   <Text style={styles.name}>Submitted documents</Text>
   {!selected.documents.length?<Text>No attachments recorded (older application).</Text>:selected.documents.map(doc=><View style={styles.card} key={doc.id}>
    <Text style={styles.name}>{doc.kind.replace("_"," ")}: {doc.original_name}</Text>
    <Text style={styles.status}>Integrity screening: {doc.risk_status.replace("_"," ")}</Text>
    <Text style={styles.muted}>A duplicate-file signal requires human investigation; it is not a forgery verdict.</Text>
    <TouchableOpacity disabled={saving} onPress={()=>void download(doc)}><Text style={styles.link}>Download privately</Text></TouchableOpacity>
    <View style={styles.row}>
     <TouchableOpacity disabled={saving} onPress={()=>assess(doc,"reviewed")}><Text style={styles.link}>Mark reviewed</Text></TouchableOpacity>
     <TouchableOpacity disabled={saving} onPress={()=>assess(doc,"review_flag")}><Text style={styles.warning}>Flag for verification</Text></TouchableOpacity>
    </View>
   </View>)}
   <Text style={styles.name}>Review notes *</Text>
   <TextInput style={styles.input} multiline value={notes} onChangeText={setNotes} placeholder="Explain your findings or reason for decision" />
   <View style={styles.row}>
    {actions.filter(a=>a!=="accepted"||isAdmin).map(a=><TouchableOpacity style={styles.action} key={a} disabled={saving||selected.application.status===a} onPress={()=>changeStatus(a)}>
      <Text style={styles.link}>{a.replace("_"," ")}</Text>
    </TouchableOpacity>)}
   </View>
   <Text style={styles.name}>Review history</Text>
   {selected.reviews.map(r=><View style={styles.card} key={r.id}><Text>{r.from_status} → {r.to_status}</Text><Text>{r.notes}</Text><Text style={styles.muted}>{r.reviewer} · {r.created_at}</Text></View>)}
  </ScrollView>:<FlatList data={items} keyExtractor={a=>String(a.id)} refreshControl={<RefreshControl refreshing={busy} onRefresh={()=>void load()}/>}
   ListEmptyComponent={<Text>No applications available.</Text>}
   renderItem={({item})=><View style={styles.card}>
    <Text style={styles.name}>{item.name}</Text>
    <Text>{item.vacancy}</Text><Text selectable>{item.email} · {item.phone}</Text>
    <Text style={styles.status}>#{item.id} · {item.status}</Text>
    <TouchableOpacity onPress={()=>void show(item.id)}><Text style={styles.link}>Review application and documents</Text></TouchableOpacity>
   </View>} />}
 </View>;
}
const styles=StyleSheet.create({
 page:{flex:1,padding:16,gap:12,backgroundColor:"#f8fbfe"},
 title:{fontSize:23,fontWeight:"900",color:"#18364e"},
 muted:{color:"#546b7d",lineHeight:20,fontSize:12},
 warning:{color:"#b45309",fontWeight:"700"},
 card:{backgroundColor:"#fff",borderRadius:12,borderWidth:1,borderColor:"#dae5ef",padding:14,gap:9,marginBottom:9},
 name:{fontWeight:"800",fontSize:16,color:"#17364e"},
 status:{fontWeight:"700",color:"#176a9c"},
 link:{fontWeight:"800",color:"#176a9c"},
 row:{flexDirection:"row",gap:12,flexWrap:"wrap"},
 action:{borderColor:"#dae5ef",borderWidth:1,padding:10,borderRadius:7},
 input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#94a3b8",padding:12,minHeight:80,borderRadius:8,textAlignVertical:"top"}
});
