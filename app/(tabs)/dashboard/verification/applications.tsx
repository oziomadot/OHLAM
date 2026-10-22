import React,{useCallback,useState} from "react";
import {ActivityIndicator,FlatList,RefreshControl,StyleSheet,Text,TouchableOpacity,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import {useAuth} from "@/context/AuthContext";
import API from "@/src/services/api";
type Application={id:number;vacancy_id:number;name:string;email:string;phone:string;status:string;created_at:string;vacancy:string};
export default function VerificationApplicants(){
 const {isAuthenticated,loading:authLoading}=useAuth();
 const [allowed,setAllowed]=useState(false),[busy,setBusy]=useState(true),[items,setItems]=useState<Application[]>([]),[error,setError]=useState("");
 const load=useCallback(async()=>{if(authLoading)return;if(!isAuthenticated){router.replace("/auth/LoginScreen");return;}
  setBusy(true);setError("");
  try{const auth=await API.get("/management/access");if(!(auth.data?.permissions??[]).includes("verification.orders.read")){setAllowed(false);return;}
   setAllowed(true);const res=await API.get("/management/recruitment/applications");setItems(res.data?.data??[]);
  }catch(e:any){setError(e?.response?.data?.message??"Unable to load applications.");}finally{setBusy(false);}
 },[authLoading,isAuthenticated]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 return <View style={styles.page}>
   <TouchableOpacity onPress={()=>router.back()}><Text style={styles.link}>← Verification management</Text></TouchableOpacity>
   <Text style={styles.title}>OHLAM applications</Text>
   <Text style={styles.muted}>Applicant information is confidential. A submitted application does not grant verification permissions.</Text>
   {busy?<ActivityIndicator/>:!allowed?<Text>Management permission required.</Text>:<FlatList data={items} keyExtractor={x=>String(x.id)}
     refreshControl={<RefreshControl refreshing={busy} onRefresh={()=>void load()}/>}
     ListEmptyComponent={<Text style={styles.muted}>{error||"No applications yet."}</Text>}
     renderItem={({item})=><View style={styles.card}>
       <Text style={styles.name}>{item.name}</Text>
       <Text style={styles.muted}>{item.vacancy}</Text>
       <Text style={styles.muted}>{item.email} · {item.phone}</Text>
       <Text style={styles.status}>Application #{item.id} · {item.status}</Text>
     </View>}/>}
 </View>;
}
const styles=StyleSheet.create({page:{flex:1,padding:20,gap:12,backgroundColor:"#f8fbfe"},link:{fontWeight:"800",color:"#176A9C"},title:{fontSize:25,fontWeight:"900",color:"#18364e"},muted:{color:"#546b7d",lineHeight:21},card:{backgroundColor:"#fff",borderRadius:12,borderWidth:1,borderColor:"#dae5ef",padding:15,gap:6,marginBottom:10},name:{fontWeight:"800",fontSize:16,color:"#17364e"},status:{fontWeight:"700",color:"#176A9C"}});
