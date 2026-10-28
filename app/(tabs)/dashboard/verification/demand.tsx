import React,{useCallback,useState} from "react";
import {ActivityIndicator,FlatList,RefreshControl,StyleSheet,Text,TouchableOpacity,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import API from "@/src/services/api";
import {useAuth} from "@/context/AuthContext";
type Demand={service_id:number;service_name:string;state_id:number;state_name:string;area_id:number;area_name:string;fulfilment_status:string;request_count:number};
export default function VerificationDemand(){
 const {isAuthenticated,loading:authLoading}=useAuth();
 const [allowed,setAllowed]=useState(false),[busy,setBusy]=useState(true),[rows,setRows]=useState<Demand[]>([]),[error,setError]=useState("");
 const load=useCallback(async()=>{
  if(authLoading)return;
  if(!isAuthenticated){router.replace("/auth/LoginScreen");return;}
  setBusy(true);setError("");
  try{
   const access=await API.get("/management/access");
   if(!(access.data?.permissions??[]).includes("verification.orders.read")){setAllowed(false);return;}
   setAllowed(true);
   const r=await API.get("/management/verification/demand");
   setRows(Array.isArray(r.data?.data)?r.data.data:[]);
  }catch(e:any){setError(e?.response?.status===403?"Permission denied":"Could not load demand. Check staging API.");}
  finally{setBusy(false);}
 },[isAuthenticated,authLoading]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 return <View style={styles.page}>
  <TouchableOpacity onPress={()=>router.back()}><Text style={styles.link}>← Verification management</Text></TouchableOpacity>
  <Text style={styles.title}>Unmet verification demand</Text>
  <Text style={styles.description}>Use these requests to identify areas needing professional recruitment. Totals include wishlist and special-search requests; they are not confirmed assignments.</Text>
  {busy?<ActivityIndicator size="large"/>:!allowed?<Text style={styles.description}>Management access required.</Text>:
   <FlatList data={rows} keyExtractor={(x,i)=>String(i)} refreshControl={<RefreshControl refreshing={busy} onRefresh={()=>void load()}/>}
    ListEmptyComponent={<Text style={styles.description}>{error||"No unmet service demand recorded."}</Text>}
    renderItem={({item})=><View style={styles.card}>
      <Text style={styles.name}>{item.service_name}</Text>
      <Text style={styles.description}>{item.area_name}, {item.state_name}</Text>
      <View style={styles.footer}><Text style={styles.count}>{item.request_count} request(s)</Text><Text style={styles.tag}>{item.fulfilment_status==="wishlist"?"Wishlist":"Special search"}</Text></View>
    </View>}/>}
 </View>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:"#f7faff",padding:20,gap:14},link:{color:"#176A9C",fontWeight:"700"},title:{fontSize:24,fontWeight:"900",color:"#1c344a"},description:{color:"#566c7e",lineHeight:21},card:{padding:15,backgroundColor:"#fff",borderWidth:1,borderColor:"#d6e3ed",borderRadius:14,gap:6,marginBottom:10},name:{fontSize:16,fontWeight:"800",color:"#243d52"},footer:{flexDirection:"row",justifyContent:"space-between"},count:{color:"#176A9C",fontWeight:"800"},tag:{color:"#7d5e20",fontWeight:"700"}});
