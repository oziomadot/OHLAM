import { submitQueuedProperty } from "@/src/services/submitQueuedProperty";
import React, {useCallback,useState} from "react";
import {ActivityIndicator,Alert,ScrollView,StyleSheet,Text,TouchableOpacity,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import {useAuth} from "@/context/AuthContext";
import API from "@/src/services/api";
import {deletePendingPropertyUpload,listPendingPropertyUploads,pendingPropertyToFormData,PendingPropertyUpload} from "@/src/services/propertyUploadQueue";

export default function PendingUploadsScreen(){
 const {user}=useAuth();
 const [items,setItems]=useState<PendingPropertyUpload[]>([]);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const owner=String(user?.id??"");
 const refresh=useCallback(async()=>{
  if(!owner){setItems([]);setLoading(false);return;}
  try{setItems(await listPendingPropertyUploads(owner));}
  catch(e:any){Alert.alert("Saved uploads",e.message??"Could not read saved uploads.");}
  finally{setLoading(false);}
 },[owner]);
 useFocusEffect(useCallback(()=>{void refresh();},[refresh]));
 const retry=async(item:PendingPropertyUpload)=>{
   if(busy) return;
   setBusy(true);
   try {
     const result=await submitQueuedProperty(item);
     if(result?.success===false) throw new Error(result.message||"Property was not accepted.");
     await deletePendingPropertyUpload(item.id,owner);
     await refresh();
     Alert.alert("Property received","OHLAM has received this listing. It may still require moderation.");
   } catch(e:any) {
     const status=e?.response?.status;
     Alert.alert(status===422?"Validation failed":status===413?"Media too large":"Upload not confirmed",
       e?.response?.data?.message || (status===413?"Reduce the media size before resubmitting.":"Your saved copy remains on this phone. Retry after checking your connection."));
   }finally{setBusy(false);}
 };
 const remove=(id:string)=>{
  Alert.alert("Delete local draft?","This removes the saved form and files from this phone. It does not delete a listing on OHLAM.",[
   {text:"Cancel",style:"cancel"},
   {text:"Delete local copy",style:"destructive",onPress:async()=>{
    setBusy(true);try{await deletePendingPropertyUpload(id,owner);await refresh();}
    catch(e:any){Alert.alert("Unable to delete",e.message??"Try again.");}
    finally{setBusy(false);}
   }}
  ]);
 };
 return <ScrollView contentContainerStyle={styles.container}>
  <Text style={styles.title}>Pending Property Uploads</Text>
  <Text style={styles.notice}>These are copies stored on this device, not confirmed online listings. Before retrying an interrupted submission, check My Properties to make sure the server did not receive it.</Text>
  {loading?<ActivityIndicator/>:items.length===0?<Text style={styles.body}>No pending uploads saved on this device.</Text>:
    items.map(item=><View key={item.id} style={styles.card}>
      <Text style={styles.heading}>{String(item.form.address||"Property draft")}</Text>
      <Text style={styles.body}>Saved: {new Date(item.createdAt).toLocaleString()}</Text>
      <Text style={styles.body}>Files preserved: {Object.keys(item.files).length}</Text>
      <Text style={styles.body}>Upload state: {item.state === "blocked" ? "Needs your attention" : "Waiting for network / retry"}</Text>
      <Text style={styles.body}>Attempts: {item.attempts ?? 0}</Text>
      {item.lastError ? <Text style={styles.warning}>{item.lastError}</Text> : null}
      {item.nextAttemptAt && item.state !== "blocked" ? <Text style={styles.body}>Next eligible retry: {new Date(item.nextAttemptAt).toLocaleString()}</Text> : null}
      <Text style={styles.warning}>Saved on this device. Retrying uses the same submission ID so the server can recognize duplicates.</Text>
      <TouchableOpacity disabled={busy} style={styles.button} onPress={()=>void retry(item)}>
        <Text style={styles.buttonText}>{busy?"Uploading...":"Retry upload"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={()=>router.push("/(tabs)/properties/view" as any)}>
       <Text style={styles.buttonText}>Check My Properties</Text>
      </TouchableOpacity>
      <TouchableOpacity disabled={busy} onPress={()=>remove(item.id)} style={styles.deleteButton}>
       <Text style={styles.deleteText}>Remove local copy</Text>
      </TouchableOpacity>
    </View>)}
 </ScrollView>;
}
const styles=StyleSheet.create({
 container:{padding:18,paddingBottom:60,backgroundColor:"#f8fafc"},title:{fontSize:23,fontWeight:"900",color:"#0f172a",marginBottom:12},
 notice:{color:"#475569",lineHeight:20,marginBottom:18},card:{padding:16,backgroundColor:"#fff",borderRadius:12,borderWidth:1,borderColor:"#cbd5e1",marginBottom:12},
 heading:{fontSize:16,fontWeight:"800",color:"#0f172a",marginBottom:8},body:{color:"#334155",marginBottom:5},
 warning:{backgroundColor:"#fef3c7",color:"#92400e",padding:10,marginTop:7,marginBottom:10,borderRadius:8},
 button:{backgroundColor:"#1d4ed8",padding:12,borderRadius:8,alignItems:"center"},buttonText:{color:"#fff",fontWeight:"800"},
 deleteButton:{marginTop:12,padding:10,alignItems:"center"},deleteText:{color:"#991b1b",fontWeight:"700"}
});
