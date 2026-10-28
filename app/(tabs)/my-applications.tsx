import React, {useCallback, useState} from "react";
import {ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {router, useFocusEffect} from "expo-router";
import API from "@/src/services/api";
import {useAuth} from "@/context/AuthContext";

type Application = {
  application_reference: string;
  status: string;
  vacancy: string;
  department: string;
  created_at: string;
  contract_status: string | null;
  training_status: string | null;
  verification_authorization_status: string | null;
};

export default function MyRecruitmentApplications() {
 const {isAuthenticated, loading:authLoading}=useAuth();
 const [items,setItems]=useState<Application[]>([]);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState("");
 const load=useCallback(async()=>{
  if(authLoading)return;
  if(!isAuthenticated) {setError("Sign in to view applications linked to your OHLAM account.");setBusy(false);return;}
  setBusy(true);setError("");
  try {
   const response=await API.get("/recruitment/my-applications");
   setItems(response.data?.data?.data??[]);
  } catch(e:any) {
   setError(e?.response?.data?.message??"Unable to load your applications.");
  } finally {setBusy(false);}
 },[isAuthenticated,authLoading]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 return <View style={styles.container}>
   <TouchableOpacity onPress={()=>router.back()}><Text style={styles.link}>← Vacancies</Text></TouchableOpacity>
   <Text style={styles.title}>My applications</Text>
   <Text style={styles.sub}>Track application review and post-acceptance progress. Decisions appear here and in your OHLAM notifications.</Text>
   {busy?<ActivityIndicator/>:error?<Text style={styles.error}>{error}</Text>:<FlatList
    data={items} keyExtractor={item=>item.application_reference}
    ListEmptyComponent={<Text>There are no applications linked to this account.</Text>}
    renderItem={({item})=><View style={styles.card}>
     <Text style={styles.name}>{item.vacancy}</Text>
     <Text style={styles.status}>Application: {item.status.replace(/_/g," ")}</Text>
     <Text selectable style={styles.sub}>Reference: {item.application_reference}</Text>
     {item.contract_status ? <>
       <Text>Contract: {item.contract_status.replace(/_/g," ")}</Text>
       <Text>Training: {item.training_status?.replace(/_/g," ")}</Text>
       <Text>Verification duty authorization: {item.verification_authorization_status?.replace(/_/g," ")}</Text>
     </>:null}
     <Text style={styles.sub}>Status updates are not authorization to begin fieldwork.</Text>
    </View>}
   />}
 </View>;
}
const styles=StyleSheet.create({
 container:{flex:1,padding:18,backgroundColor:"#f8fafc",gap:12},
 title:{fontSize:24,fontWeight:"800",color:"#0f172a"},
 link:{color:"#1d4ed8",fontWeight:"700"},
 sub:{fontSize:12,color:"#475569"},
 error:{color:"#b91c1c"},
 card:{padding:14,borderRadius:10,backgroundColor:"white",marginBottom:12,gap:7},
 name:{fontWeight:"800",color:"#0f172a"},
 status:{fontWeight:"700",color:"#1d4ed8"}
});
