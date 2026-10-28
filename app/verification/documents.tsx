import React,{useEffect,useState} from "react";
import { ActivityIndicator,Alert,ScrollView,StyleSheet,Text,TouchableOpacity,View } from "react-native";
import { useLocalSearchParams,router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import API from "@/src/services/api";
import { useAuth } from "@/context/AuthContext";

type Requirement={document_type:string;label:string;is_required:boolean};
export default function VerificationDocuments(){
 const {isAuthenticated,loading:authLoading}=useAuth();
 const {propertyIds}=useLocalSearchParams<{propertyIds?:string}>();
 const ids=String(propertyIds??"").split(",").map(Number).filter(n=>Number.isSafeInteger(n)&&n>0).slice(0,10);
 const [index,setIndex]=useState(0),[requirements,setRequirements]=useState<Requirement[]>([]);
 const [uploaded,setUploaded]=useState<Record<string,boolean>>({});
 const [busy,setBusy]=useState(false);
 const property=ids[index];
 useEffect(()=>{if(!authLoading&&!isAuthenticated)router.replace("/auth/LoginScreen");},[authLoading,isAuthenticated]);
 useEffect(()=>{let active=true;if(!property)return;
   API.get(`/verification/request-properties/${property}/document-requirements`).then(r=>{if(active)setRequirements(r.data?.data??[]);})
   .catch(()=>Alert.alert("Document requirements unavailable","Please retry before uploading evidence."));
   return()=>{active=false;setRequirements([]);};
 },[property]);
 const upload=async(req:Requirement)=>{
   try{
     const result=await DocumentPicker.getDocumentAsync({type:["application/pdf","image/jpeg","image/png"],copyToCacheDirectory:true});
     if(result.canceled||!result.assets?.length)return;
     const file=result.assets[0];if(file.size&&file.size>10*1024*1024){Alert.alert("File too large","Maximum 10 MB per document.");return;}
     setBusy(true);
     const form=new FormData();
     form.append("document_type",req.document_type);
     form.append("file",{uri:file.uri,name:file.name||"evidence.pdf",type:file.mimeType||"application/pdf"} as any);
     await API.post(`/verification/request-properties/${property}/documents`,form,{headers:{"Content-Type":"multipart/form-data"}});
     setUploaded(old=>({...old,[property+":"+req.document_type]:true}));
     Alert.alert("Document uploaded","This file is stored privately and awaits OHLAM review.");
   }catch(e:any){Alert.alert("Upload failed",e?.response?.data?.message||"Please try again.");}
   finally{setBusy(false);}
 };
 const pending=requirements.filter(r=>r.is_required&&!uploaded[property+":"+r.document_type]);
 return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
  <Text style={styles.title}>Property documents</Text>
  <Text style={styles.muted}>Property {index+1} of {ids.length}. Upload evidence for each requested service. Documents are private and reviewed by OHLAM personnel.</Text>
  {requirements.length===0?<View style={styles.panel}><Text style={styles.muted}>No document requirements configured for this property yet, or the list is still loading.</Text></View>:
  requirements.map(r=><View key={r.document_type} style={styles.panel}>
    <Text style={styles.name}>{r.label} {r.is_required?"*":"(optional)"}</Text>
    <Text style={styles.muted}>{uploaded[property+":"+r.document_type]?"Uploaded — awaiting review":"PDF, JPG or PNG • up to 10 MB"}</Text>
    <TouchableOpacity disabled={busy} style={styles.buttonOutline} onPress={()=>void upload(r)}><Text style={styles.link}>{busy?"Uploading...":"Select document to upload"}</Text></TouchableOpacity>
  </View>)}
  <Text style={styles.muted}>A survey plan is important to help establish the specific parcel or boundaries claimed. It alone does not prove ownership or accuracy.</Text>
  {pending.length>0&&<Text style={styles.warning}>{pending.length} required document type(s) remain. You can return later, but a quotation cannot be prepared until required evidence is provided.</Text>}
  <TouchableOpacity style={styles.button} onPress={()=>{if(index<ids.length-1){setIndex(index+1);}else router.replace("/(tabs)/home");}}><Text style={styles.white}>{index<ids.length-1?"Next property":"Finish for now"}</Text></TouchableOpacity>
 </ScrollView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:"#f6faff"},content:{padding:20,paddingBottom:70,gap:14},title:{fontSize:25,fontWeight:"800",color:"#173b56"},muted:{color:"#53697d",lineHeight:21},panel:{padding:17,borderRadius:15,backgroundColor:"#fff",borderWidth:1,borderColor:"#d5e2ec",gap:10},name:{fontSize:17,fontWeight:"700",color:"#1c354a"},buttonOutline:{borderWidth:1,borderColor:"#176A9C",padding:12,borderRadius:10,alignItems:"center"},link:{color:"#176A9C",fontWeight:"800"},warning:{color:"#9a4d08"},button:{backgroundColor:"#176A9C",borderRadius:11,padding:16,alignItems:"center"},white:{color:"#fff",fontWeight:"800"}});
