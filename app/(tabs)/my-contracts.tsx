import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import API from "@/src/services/api";
import { shareRecruitmentContractPdf } from "@/src/services/recruitmentContractPdf";
type Contract = { id: number; title: string; version: number; status: string; terms?: string; issued_at?: string };
export default function MyContracts() {
 const [items,setItems]=useState<Contract[]>([]);
 const [selected,setSelected]=useState<Contract|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const refresh=useCallback(async()=>{
   setBusy(true);
   try {const r=await API.get("/recruitment/my-contracts");setItems(r.data?.data??[]);setError("");}
   catch(e:any){setError(e?.response?.data?.message??"Unable to load contracts.");}
   finally{setBusy(false);}
 },[]);
 useFocusEffect(useCallback(()=>{void refresh();},[refresh]));
 const open=async(id:number)=>{
  setBusy(true);
  try{const r=await API.get(`/recruitment/contracts/${id}`);setSelected(r.data?.data??null);}
  catch(e:any){Alert.alert("Unavailable",e?.response?.data?.message??"Could not load contract.");}
  finally{setBusy(false);}
 };
 const respond=async(action:"acknowledge"|"decline")=>{
  if(!selected)return;
  setBusy(true);
  try {
   await API.post(`/recruitment/contracts/${selected.id}/respond`,{action});
   Alert.alert("Response recorded",action==="acknowledge"?"You acknowledged receipt. This is not a legal signature.":"Your decline was recorded.");
   await refresh();setSelected(null);
  }catch(e:any){Alert.alert("Unable to respond",e?.response?.data?.message??"Please try again.");}
  finally{setBusy(false);}
 };
 return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
  <Stack.Screen options={{title:"My contracts",headerShown:true}}/>
  <Text style={styles.title}>My contracts</Text>
  <Text style={styles.note}>Review issued contract terms. Acknowledging receipt does not sign your contract or authorize you to begin work. You can open or export the official PDF after authenticating.</Text>
  {busy&&<ActivityIndicator/>}
  {!!error&&<Text style={styles.error}>{error}</Text>}
  {items.length===0&&!busy&&<Text>No issued contracts yet.</Text>}
  {items.map(c=><TouchableOpacity key={c.id} style={styles.card} onPress={()=>void open(c.id)}>
    <Text style={styles.bold}>{c.title} · v{c.version}</Text><Text>Status: {c.status}</Text><Text style={styles.link}>Read contract terms</Text>
  </TouchableOpacity>)}
  {selected&&<View style={styles.card}>
    <Text style={styles.bold}>{selected.title}</Text>
    <Text selectable style={styles.terms}>{selected.terms}</Text>
    <TouchableOpacity style={styles.button} disabled={busy} onPress={() => void (async () => { try { setBusy(true); await shareRecruitmentContractPdf(selected.id); } catch (e: any) { Alert.alert("Unable to open PDF", e?.message ?? "PDF unavailable."); } finally { setBusy(false); } })()}><Text style={styles.white}>Open or export official contract PDF</Text></TouchableOpacity>
    <Text style={styles.note}>The document may contain personal data. Only share it with trusted recipients.</Text>
    {selected.status==="issued"&&<>
      <TouchableOpacity style={styles.button} disabled={busy} onPress={()=>Alert.alert("Acknowledge receipt?","This records that you received the terms; it is NOT an electronic signature.",[{text:"Cancel"},{text:"Acknowledge",onPress:()=>void respond("acknowledge")}])}><Text style={styles.white}>Acknowledge receipt only</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button} disabled={busy} onPress={()=>Alert.alert("Decline contract?","You can ask management for revised terms.",[{text:"Cancel"},{text:"Decline",style:"destructive",onPress:()=>void respond("decline")}])}><Text style={styles.white}>Decline terms</Text></TouchableOpacity>
    </>}
    <TouchableOpacity onPress={()=>setSelected(null)}><Text style={styles.link}>Close</Text></TouchableOpacity>
  </View>}
 </ScrollView>;
}
const styles=StyleSheet.create({
 page:{flex:1,backgroundColor:"#f8fafc"},
 content:{padding:16,gap:12,paddingBottom:50},
 title:{fontSize:24,fontWeight:"800",color:"#0f172a"},
 note:{fontSize:13,color:"#475569"},error:{color:"#b91c1c"},
 card:{backgroundColor:"white",borderRadius:10,padding:14,gap:9},
 bold:{fontWeight:"700",color:"#0f172a"},link:{color:"#1d4ed8",fontWeight:"700"},
 terms:{color:"#0f172a",lineHeight:21},button:{backgroundColor:"#1d4ed8",padding:14,borderRadius:8},
 white:{color:"white",fontWeight:"700",textAlign:"center"}
});