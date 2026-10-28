import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import API from "@/src/services/api";
import { useAuth } from "@/context/AuthContext";

type Order = { id:number; customer_id:number; status:string; address:string; state:string; lga?:string|null; created_at:string; google_address_assistance_requested:boolean; service?:{name:string} };
export default function ManagementVerificationQueue() {
  const {isAuthenticated,loading:authLoading}=useAuth();
  const [allowed,setAllowed]=useState(false),[loading,setLoading]=useState(true);
  const [orders,setOrders]=useState<Order[]>([]);
  const load=useCallback(async()=>{
    if(authLoading)return;
    if(!isAuthenticated){setLoading(false);setAllowed(false);router.replace("/auth/LoginScreen");return;}
    setLoading(true);
    try{
      const access=await API.get("/management/access");
      if(!(access.data?.permissions??[]).includes("verification.orders.read")){setAllowed(false);return;}
      setAllowed(true);
      const response=await API.get("/management/verification/orders");
      setOrders(response.data?.data??[]);
    }catch(e:any){setAllowed(false);if(e?.response?.status!==403)Alert.alert("Unable to load",e?.response?.data?.message??"Please try again.");}
    finally{setLoading(false);}
  },[isAuthenticated,authLoading]);
  useFocusEffect(useCallback(()=>{void load();},[load]));
  if(loading||authLoading)return <View style={styles.center}><ActivityIndicator size="large"/></View>;
  if(!allowed)return <View style={styles.center}><Text style={styles.title}>Access restricted</Text><Text>Only authorised OHLAM management staff can view customer verification requests.</Text></View>;
  return <View style={styles.page}>
    <TouchableOpacity onPress={()=>router.back()} style={styles.back}><MaterialCommunityIcons name="arrow-left" size={22} color="#176A9C"/><Text style={styles.link}>Dashboard</Text></TouchableOpacity>
    <Text style={styles.title}>Verification requests</Text>
    <Text style={styles.subtitle}>Management review queue · Read-only pilot</Text>
    <FlatList data={orders} keyExtractor={x=>String(x.id)} refreshControl={<RefreshControl refreshing={loading} onRefresh={()=>void load()}/>}
      ListEmptyComponent={<Text style={styles.empty}>No verification requests available.</Text>}
      renderItem={({item})=><View style={styles.card}>
        <Text style={styles.row}>#{item.id} · {item.status.replace(/_/g," ")}</Text>
        <Text style={styles.name}>{item.service?.name??"Verification service"}</Text>
        <Text style={styles.sub}>{item.address}, {item.lga?item.lga+", ":""}{item.state}</Text>
        <Text style={styles.sub}>Customer ID: {item.customer_id} · {new Date(item.created_at).toLocaleDateString()}</Text>
        {item.google_address_assistance_requested&&<Text style={styles.link}>Google Maps address assistance requested</Text>}
      </View>}/>
  </View>;
}
const styles=StyleSheet.create({
  page:{flex:1,backgroundColor:"#f5f9fd",padding:18},center:{flex:1,padding:25,justifyContent:"center",alignItems:"center",gap:12},back:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:20},link:{color:"#176A9C",fontWeight:"700"},title:{fontSize:25,fontWeight:"800",color:"#18354b"},subtitle:{color:"#617587",marginVertical:12},card:{borderRadius:16,backgroundColor:"#fff",padding:18,marginBottom:12,borderWidth:1,borderColor:"#dfebf4",gap:6},row:{color:"#176A9C",fontWeight:"800",textTransform:"capitalize"},name:{fontSize:17,fontWeight:"800",color:"#1b354b"},sub:{color:"#506579",lineHeight:20},empty:{color:"#697c8b",textAlign:"center",marginTop:60}
});
