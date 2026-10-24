import React, {useCallback,useState} from "react";
import {ActivityIndicator,Alert,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from "react-native";
import {useFocusEffect} from "expo-router";
import API from "@/src/services/api";

type RequestItem={id:number;address:string;reason:string;status:string;requested_at:string;owner?:{name:string;oramex_id:string}};
export default function PropertyDeleteRequests(){
 const [items,setItems]=useState<RequestItem[]>([]),[permissions,setPermissions]=useState<string[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState<number|null>(null);
 const [reason,setReason]=useState<Record<number,string>>({});
 const load=useCallback(async()=>{try{
  const [access,list]=await Promise.all([API.get("/management/access"),API.get("/management/property-delete-requests")]);
  setPermissions(access.data?.permissions??[]);
  setItems(list.data?.data?.data??[]);
 }catch(e:any){Alert.alert("Unable to load",e?.response?.data?.message??"Could not load deletion requests.");}
 finally{setLoading(false);}},[]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 const decide=(id:number,decision:"approve"|"reject")=>{
  const message=(reason[id]??"").trim();
  if(message.length<10){Alert.alert("Reason required","Enter at least 10 characters explaining the decision.");return;}
  Alert.alert("Confirm decision",`Are you sure you want to ${decision} deletion of property #${id}?`,[
   {text:"Cancel",style:"cancel"},
   {text:"Confirm",style:"destructive",onPress:async()=>{setBusy(id);try{
    await API.post(`/management/property-delete-requests/${id}/decision`,{decision,reason:message});
    await load();
    Alert.alert("Recorded","Decision saved to the management audit log.");
   }catch(e:any){Alert.alert("Failed",e?.response?.data?.message??"Decision could not be saved.");}finally{setBusy(null);}}}
  ]);
 };
 return <ScrollView contentContainerStyle={styles.page}>
  <Text style={styles.title}>Property Deletion Reviews</Text>
  <Text style={styles.note}>Review pending requests, lister explanations and transaction blockers before making a decision.</Text>
  {loading?<ActivityIndicator/>:items.length===0?<Text>No pending property deletion requests.</Text>:items.map(item=><View key={item.id} style={styles.card}>
   <Text style={styles.heading}>Property #{item.id}</Text>
   <Text style={styles.text}>{item.address}</Text>
   <Text style={styles.text}>Lister: {item.owner?.name??"Unknown"} ({item.owner?.oramex_id??"N/A"})</Text>
   <Text style={styles.text}>Requested: {item.requested_at??"N/A"}</Text>
   <Text style={styles.text}>Reason: {item.reason??"Not supplied"}</Text>
   {permissions.includes("properties.delete.decide")&&<><Text style={styles.label}>Decision reason (required)</Text>
    <TextInput style={styles.input} placeholder="Explain approval or rejection" placeholderTextColor="#64748b" multiline value={reason[item.id]??""} onChangeText={value=>setReason(r=>({...r,[item.id]:value}))}/>
    <View style={styles.buttons}><TouchableOpacity style={styles.approve} disabled={busy!==null} onPress={()=>decide(item.id,"approve")}><Text style={styles.btnText}>Approve removal</Text></TouchableOpacity>
    <TouchableOpacity style={styles.reject} disabled={busy!==null} onPress={()=>decide(item.id,"reject")}><Text style={styles.btnText}>Reject request</Text></TouchableOpacity></View></>}
  </View>)}
 </ScrollView>;
}
const styles=StyleSheet.create({
 page:{padding:18,paddingBottom:50,backgroundColor:"#f8fafc"},title:{fontSize:23,fontWeight:"900",color:"#0f172a",marginBottom:8},
 note:{color:"#475569",marginBottom:18},card:{padding:16,backgroundColor:"#fff",borderRadius:14,marginBottom:12,borderWidth:1,borderColor:"#cbd5e1"},
 heading:{fontSize:17,fontWeight:"800",color:"#0f172a",marginBottom:8},text:{color:"#334155",marginBottom:5},
 label:{fontWeight:"700",color:"#0f172a",marginTop:8},input:{borderWidth:1,borderColor:"#94a3b8",borderRadius:8,padding:12,color:"#0f172a",backgroundColor:"#fff",minHeight:74,marginVertical:10},
 buttons:{flexDirection:"row",gap:8,flexWrap:"wrap"},approve:{backgroundColor:"#166534",padding:12,borderRadius:8},reject:{backgroundColor:"#991b1b",padding:12,borderRadius:8},
 btnText:{color:"#fff",fontWeight:"700"}
});
