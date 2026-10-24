import React,{useCallback,useState} from "react";
import {ActivityIndicator,Alert,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from "react-native";
import {useFocusEffect} from "expo-router";
import API from "@/src/services/api";

type Item={id:number;reference:string;purpose:string;description:string;amount_kobo:number;currency:string;recipient_name:string;status:string;requested_by:number};
export default function PayoutRequests(){
 const [items,setItems]=useState<Item[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [userId,setUserId]=useState<number|null>(null);
 const [purpose,setPurpose]=useState("agent_challenge"),[description,setDescription]=useState(""),[amount,setAmount]=useState("");
 const [recipient_name,setRecipientName]=useState(""),[recipient_bank_code,setBankCode]=useState(""),[recipient_account_number,setAccount]=useState("");
 const [decisionReasons,setDecisionReasons]=useState<Record<number,string>>({});
 const load=useCallback(async()=>{try{
  const [access,list]=await Promise.all([API.get("/management/access"),API.get("/management/payout-requests")]);
  if(!(access.data?.permissions??[]).includes("payouts.read"))throw new Error("Admin permission required.");
  setItems(list.data?.data?.data??[]);
 }catch(e:any){Alert.alert("Unable to load",e?.response?.data?.message??e.message??"Request failed.");}
 finally{setLoading(false);}},[]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 const create=async()=>{
  if(!description.trim()||!recipient_name.trim()||!/^\d{10}$/.test(recipient_account_number)||!recipient_bank_code.trim()||Number(amount)<100){
   Alert.alert("Check details","Provide a description, recipient, bank code, 10-digit account and at least ₦100.");return;
  }
  setBusy(true);try{
   await API.post("/management/payout-requests",{purpose,description,amount:Number(amount),recipient_name,recipient_bank_code,recipient_account_number});
   setDescription("");setAmount("");setRecipientName("");setBankCode("");setAccount("");
   await load();Alert.alert("Request created","No transfer has been made. Another administrator must approve it.");
  }catch(e:any){Alert.alert("Failed",e?.response?.data?.message??"Unable to create request.");}finally{setBusy(false);}
 };
 const decide=(item:Item,decision:"approve"|"reject")=>{
  const reason=(decisionReasons[item.id]??"").trim();
  if(decision==="reject"&&reason.length<10){Alert.alert("Reason required","Enter a rejection reason of at least 10 characters.");return;}
  Alert.alert("Confirm",`Review payout request #${item.id}? No bank transfer will be initiated.`,[
    {text:"Cancel",style:"cancel"},{text:"Confirm",onPress:async()=>{setBusy(true);try{
      await API.post(`/management/payout-requests/${item.id}/decision`,{decision,reason:reason||null});
      await load();Alert.alert("Recorded","Approval status updated. Payment has NOT been sent.");
    }catch(e:any){Alert.alert("Failed",e?.response?.data?.message??"Unable to approve.");}finally{setBusy(false);}}}
  ]);
 };
 return <ScrollView contentContainerStyle={styles.page}>
  <Text style={styles.title}>Admin Payout Requests</Text>
  <Text style={styles.warning}>Approval workflow only. Paystack transfers and downloadable proof-of-payment are not enabled yet. Never treat an approval as evidence of payment.</Text>
  <View style={styles.card}>
   <Text style={styles.heading}>Create payment request</Text>
   <Text style={styles.label}>Purpose</Text>
   <View style={styles.row}>{["agent_challenge","contractor_fee","refund","other"].map(x=><TouchableOpacity key={x} onPress={()=>setPurpose(x)} style={[styles.chip,purpose===x&&styles.chipSelected]}><Text style={styles.text}>{x.replace("_"," ")}</Text></TouchableOpacity>)}</View>
   {([["Description",description,setDescription],["Amount (NGN)",amount,setAmount],["Recipient's name",recipient_name,setRecipientName],["Paystack bank code",recipient_bank_code,setBankCode],["10-digit account number",recipient_account_number,setAccount]] as const).map(([label,value,change])=><View key={label}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={change} style={styles.input} placeholder={label} placeholderTextColor="#64748b" keyboardType={label.includes("Amount")||label.includes("account number")?"numeric":"default"}/></View>)}
   <TouchableOpacity disabled={busy} style={styles.button} onPress={create}><Text style={styles.buttonText}>Submit for approval</Text></TouchableOpacity>
  </View>
  <Text style={styles.heading}>Payment requests</Text>
  {loading?<ActivityIndicator/>:items.map(item=><View style={styles.card} key={item.id}>
    <Text style={styles.heading}>#{item.id} · {item.status.replace(/_/g," ")}</Text>
    <Text style={styles.text}>{item.purpose.replace(/_/g," ")} · ₦{(item.amount_kobo/100).toLocaleString("en-NG")}</Text>
    <Text style={styles.text}>{item.recipient_name} · {item.description}</Text>
    {item.status==="awaiting_approval"&&<><Text style={styles.label}>Rejection reason (required if rejecting)</Text>
      <TextInput style={styles.input} value={decisionReasons[item.id]??""} onChangeText={value=>setDecisionReasons(p=>({...p,[item.id]:value}))} placeholder="Reason" placeholderTextColor="#64748b"/>
      <View style={styles.row}><TouchableOpacity style={styles.button} disabled={busy} onPress={()=>decide(item,"approve")}><Text style={styles.buttonText}>Approve (not paid)</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.button,{backgroundColor:"#991b1b"}]} disabled={busy} onPress={()=>decide(item,"reject")}><Text style={styles.buttonText}>Reject</Text></TouchableOpacity></View></>}
  </View>)}
 </ScrollView>;
}
const styles=StyleSheet.create({page:{padding:16,paddingBottom:60,backgroundColor:"#f8fafc"},title:{fontSize:22,fontWeight:"900",color:"#0f172a"},warning:{padding:12,backgroundColor:"#fffbeb",color:"#92400e",marginVertical:14,borderRadius:8},card:{backgroundColor:"#fff",padding:14,borderRadius:12,marginBottom:12},heading:{fontSize:17,fontWeight:"800",color:"#0f172a",marginBottom:10},label:{fontWeight:"700",color:"#334155",marginBottom:5},text:{color:"#0f172a"},input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#94a3b8",borderRadius:8,padding:10,color:"#0f172a",marginBottom:12},row:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:12},chip:{padding:8,borderWidth:1,borderColor:"#cbd5e1",borderRadius:8},chipSelected:{backgroundColor:"#bfdbfe"},button:{padding:11,borderRadius:8,backgroundColor:"#1d4ed8",marginBottom:8},buttonText:{color:"#fff",fontWeight:"800"}});
