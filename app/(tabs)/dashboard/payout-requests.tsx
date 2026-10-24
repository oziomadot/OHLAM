import React,{useCallback,useState} from "react";
import {ActivityIndicator,Alert,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from "react-native";
import {useFocusEffect} from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {getItemSafe} from "@/utils/storage";
import API from "@/src/services/api";
import {BASE_URL} from "@/src/services/api";

type Bank={id:number;bank_code:string;account_name:string;account_last4:string;ready:boolean};
type User={id:number;oramex_id:string;name:string;email:string;phone:string;bank_accounts:Bank[]};
type Choice={user_id:number;bank_account_id:number;name:string;bank:string};
type Item={id:number;reference:string;batch_id?:string;purpose:string;description:string;amount_kobo:number;currency:string;recipient_name:string;status:string;requested_by:number;provider_reference?:string};
const formatMoney=(kobo:number)=>"₦"+(Number(kobo)/100).toLocaleString("en-NG",{minimumFractionDigits:2});
const errorText=(e:any)=>e?.response?.data?.message||(!e?.response?"Check your internet connection and try again.":"Please try again or contact management.");

export default function PayoutRequests(){
 const [items,setItems]=useState<Item[]>([]);
 const [permissions,setPermissions]=useState<string[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [query,setQuery]=useState(""),[results,setResults]=useState<User[]>([]);
 const [selected,setSelected]=useState<Choice[]>([]);
 const [purpose,setPurpose]=useState("agent_challenge"),[description,setDescription]=useState(""),[amount,setAmount]=useState("");
 const [decisionReasons,setDecisionReasons]=useState<Record<number,string>>({});
 const load=useCallback(async()=>{try{
  const [access,list]=await Promise.all([API.get("/management/access"),API.get("/management/payout-requests")]);
  setPermissions(access.data?.permissions??[]);
  setItems(list.data?.data?.data??[]);
 }catch(e:any){Alert.alert("Unable to load payments",errorText(e));}
 finally{setLoading(false);}},[]);
 useFocusEffect(useCallback(()=>{void load();},[load]));
 const lookup=async()=>{
  if(query.trim().length<3){Alert.alert("Enter search details","Search with at least 3 characters of an OHLAM ID, telephone number or email.");return;}
  setBusy(true);try{
    const response=await API.get("/management/payout-beneficiaries",{params:{q:query.trim()}});
    setResults(response.data?.data??[]);
  }catch(e:any){Alert.alert("Search unavailable",errorText(e));}finally{setBusy(false);}
 };
 const notifyUser=async(user:User)=>{
  Alert.alert("Request bank details",`Send ${user.name} an in-app notification asking them to add verified bank details for a pending payout?`,[
   {text:"Cancel",style:"cancel"},
   {text:"Notify user",onPress:async()=>{
    setBusy(true);
    try {
      const response=await API.post(`/management/payout-beneficiaries/${user.id}/request-bank-details`);
      Alert.alert(response.data?.already_notified?"Already notified":"Notification sent",
        response.data?.message||"The user has been asked to add their bank details.");
    } catch(e:any) {
      Alert.alert("Notification not sent",errorText(e));
    } finally {setBusy(false);}
   }}
  ]);
 };
 const select=(user:User,bank:Bank)=>{
  if(selected.some(s=>s.user_id===user.id)){
    Alert.alert("Beneficiary already selected","Each beneficiary can only be added once per batch.");return;
  }
  setSelected(old=>[...old,{user_id:user.id,bank_account_id:bank.id,name:user.name,bank:bank.account_name+" ••••"+bank.account_last4}]);
 };
 const create=async()=>{
  const money=Number(amount.replace(/,/g,""));
  if(selected.length===0||!Number.isFinite(money)||money<100||description.trim().length<10){
    Alert.alert("Complete the payment details","Select at least one verified beneficiary, enter a valid amount of ₦100 or more, and a description of at least 10 characters.");return;
  }
  const total=money*selected.length;
  Alert.alert("Confirm payout requests",
   `Create ${selected.length} request(s) of ₦${money.toLocaleString("en-NG")} each (total ₦${total.toLocaleString("en-NG")})? These require approval and are not sent immediately.`,[
   {text:"Cancel",style:"cancel"},
   {text:"Create requests",onPress:async()=>{
    setBusy(true);try{
      await API.post("/management/payout-requests",{
        purpose,description:description.trim(),amount:money,
        recipients:selected.map(({user_id,bank_account_id})=>({user_id,bank_account_id}))
      });
      setSelected([]);setDescription("");setAmount("");setResults([]);setQuery("");
      await load();Alert.alert("Requests created","Another administrator must approve them before any bank transfer.");
    }catch(e:any){Alert.alert("Could not create payouts",errorText(e));}finally{setBusy(false);}
   }}
  ]);
 };
 const action=(item:Item,action:"approve"|"reject"|"send"|"verify")=>{
  const reason=(decisionReasons[item.id]??"").trim();
  if(action==="reject" && reason.length<10){Alert.alert("Reason required","Enter at least 10 characters explaining why you are rejecting this payout.");return;}
  const message=action==="send"
   ? `Send ${formatMoney(item.amount_kobo)} to ${item.recipient_name} through Paystack? This moves real money if live Paystack keys are enabled.`
   : action==="approve"?"Approve this payout for a separate sending step?"
   :action==="reject"?"Reject this payout request?"
   :"Ask Paystack to verify this transfer's latest status?";
  Alert.alert("Confirm "+action,message,[
    {text:"Cancel",style:"cancel"},
    {text:"Confirm",onPress:async()=>{
      setBusy(true);try{
        if(action==="approve"||action==="reject"){
          await API.post(`/management/payout-requests/${item.id}/decision`,{decision:action,reason:reason||null});
        }else{
          await API.post(`/management/payout-requests/${item.id}/${action}`);
        }
        await load();
        Alert.alert("Request updated",action==="send"?"Paystack initiation requested. Verify the transfer before downloading a receipt.":"Status updated. Check the record before proceeding.");
      }catch(e:any){Alert.alert("Action not completed",errorText(e));}finally{setBusy(false);}
    }}
  ]);
 };
 const receipt=async(item:Item)=>{
  setBusy(true);try{
    const token=await getItemSafe("auth_token");
    if(!token)throw new Error("Please log in again.");
    const uri=`${BASE_URL.replace(/\/$/,"")}/management/payout-requests/${item.id}/receipt`;
    const destination=(FileSystem.cacheDirectory||FileSystem.documentDirectory)+`ohlam-payment-${item.id}.pdf`;
    const download=await FileSystem.downloadAsync(uri,destination,{headers:{Authorization:`Bearer ${token}`,Accept:"application/pdf"}});
    if(download.status!==200)throw new Error("The verified PDF receipt is not available yet.");
    if(!(await Sharing.isAvailableAsync()))throw new Error("PDF sharing is not available on this device.");
    await Sharing.shareAsync(download.uri,{mimeType:"application/pdf",dialogTitle:"Save or share OHLAM payment receipt"});
  }catch(e:any){Alert.alert("Receipt unavailable",errorText(e)=== "Please try again or contact management." ? e.message:errorText(e));}finally{setBusy(false);}
 };
 return <ScrollView contentContainerStyle={styles.page}>
   <Text style={styles.title}>OHLAM Admin Payments</Text>
   <Text style={styles.note}>Find a registered beneficiary, select a verified bank account and create one or more payouts. Bank transfers require separate approval, sending and Paystack confirmation.</Text>
   <View style={styles.card}>
    <Text style={styles.heading}>1. Find beneficiary</Text>
    <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="OHLAM ID, phone number or email" placeholderTextColor="#64748b" autoCapitalize="none"/>
    <TouchableOpacity style={styles.button} disabled={busy} onPress={()=>void lookup()}><Text style={styles.buttonText}>Search users</Text></TouchableOpacity>
    {results.map(user=><View key={user.id} style={styles.result}>
      <Text style={styles.name}>{user.name} · {user.oramex_id}</Text>
      <Text style={styles.text}>{user.email} · {user.phone}</Text>
      {!user.bank_accounts.some(bank=>bank.ready)?<View>
        <Text style={styles.warning}>This beneficiary does not yet have an active verified bank account ready for payout.</Text>
        <TouchableOpacity disabled={busy||!permissions.includes("payouts.create")} style={styles.button} onPress={()=>void notifyUser(user)}>
          <Text style={styles.buttonText}>Notify user to add bank details</Text>
        </TouchableOpacity>
      </View>:null}
      {user.bank_accounts.map(bank=>
      <TouchableOpacity key={bank.id} disabled={busy||!bank.ready||selected.some(x=>x.user_id===user.id)}
       style={[styles.bank,!bank.ready&&styles.disabled]} onPress={()=>select(user,bank)}>
       <Text style={styles.text}>{bank.account_name} · Bank {bank.bank_code} · ••••{bank.account_last4}</Text>
       <Text style={styles.hint}>{bank.ready?"Tap to add beneficiary":"Paystack recipient not yet configured"}</Text>
      </TouchableOpacity>)}
    </View>)}
   </View>
   <View style={styles.card}>
    <Text style={styles.heading}>2. Beneficiaries ({selected.length})</Text>
    {!selected.length?<Text style={styles.hint}>No beneficiaries selected yet.</Text>:selected.map(s=><View style={styles.selected} key={s.user_id}>
      <View style={{flex:1}}><Text style={styles.name}>{s.name}</Text><Text style={styles.hint}>{s.bank}</Text></View>
      <TouchableOpacity onPress={()=>setSelected(old=>old.filter(x=>x.user_id!==s.user_id))}><Text style={styles.remove}>Remove</Text></TouchableOpacity>
    </View>)}
    <Text style={styles.heading}>3. Payment details</Text>
    <Text style={styles.label}>Purpose</Text>
    <View style={styles.row}>{["agent_challenge","contractor_fee","refund","other"].map(x=><TouchableOpacity key={x} style={[styles.chip,purpose===x&&styles.chipSelected]} onPress={()=>setPurpose(x)}><Text style={styles.text}>{x.replace("_"," ")}</Text></TouchableOpacity>)}</View>
    <Text style={styles.label}>Amount per beneficiary (NGN)</Text>
    <TextInput style={styles.input} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="e.g. 10000"/>
    <Text style={styles.label}>Description / payment narration</Text>
    <TextInput style={[styles.input,{minHeight:72}]} multiline value={description} onChangeText={setDescription} placeholder="Reason for payment (at least 10 characters)"/>
    <Text style={styles.name}>Total proposed: ₦{((Number(amount.replace(/,/g,""))||0)*selected.length).toLocaleString("en-NG")}</Text>
    <TouchableOpacity style={styles.button} disabled={busy||!permissions.includes("payouts.create")} onPress={()=>void create()}><Text style={styles.buttonText}>Submit {selected.length} payout request(s) for approval</Text></TouchableOpacity>
   </View>
   <Text style={styles.heading}>Recent payout requests</Text>
   {loading?<ActivityIndicator/>:items.map(item=><View key={item.id} style={styles.card}>
      <Text style={styles.name}>#{item.id} · {item.status.replace(/_/g," ")}</Text>
      <Text style={styles.text}>{item.recipient_name} · {formatMoney(item.amount_kobo)}</Text>
      <Text style={styles.text}>{item.description}</Text>
      {item.status==="awaiting_approval"&&permissions.includes("payouts.approve")&&<>
        <TextInput style={styles.input} value={decisionReasons[item.id]??""} onChangeText={v=>setDecisionReasons(p=>({...p,[item.id]:v}))} placeholder="Rejection reason, if rejecting"/>
        <View style={styles.row}><TouchableOpacity style={styles.button} disabled={busy} onPress={()=>action(item,"approve")}><Text style={styles.buttonText}>Approve</Text></TouchableOpacity><TouchableOpacity style={[styles.button,styles.danger]} disabled={busy} onPress={()=>action(item,"reject")}><Text style={styles.buttonText}>Reject</Text></TouchableOpacity></View>
      </>}
      {item.status==="approved_not_sent"&&permissions.includes("payouts.approve")&&<TouchableOpacity style={styles.button} disabled={busy} onPress={()=>action(item,"send")}><Text style={styles.buttonText}>Send via Paystack</Text></TouchableOpacity>}
      {["pending_verification","needs_reconciliation","sending"].includes(item.status)&&permissions.includes("payouts.approve")&&<TouchableOpacity style={styles.button} disabled={busy} onPress={()=>action(item,"verify")}><Text style={styles.buttonText}>Verify Paystack status</Text></TouchableOpacity>}
      {item.status==="paid"&&<TouchableOpacity style={styles.button} disabled={busy} onPress={()=>void receipt(item)}><Text style={styles.buttonText}>Download PDF payment receipt</Text></TouchableOpacity>}
   </View>)}
 </ScrollView>;
}
const styles=StyleSheet.create({
 page:{padding:16,paddingBottom:80,backgroundColor:"#f8fafc"},title:{fontSize:23,fontWeight:"900",color:"#0f172a",marginBottom:8},note:{color:"#475569",lineHeight:20,marginBottom:14},
 card:{backgroundColor:"#fff",padding:15,borderRadius:12,marginBottom:14,borderColor:"#e2e8f0",borderWidth:1},
 heading:{fontSize:17,fontWeight:"800",color:"#0f172a",marginVertical:10},name:{fontWeight:"800",color:"#0f172a",marginBottom:6},text:{color:"#334155",marginBottom:4},hint:{fontSize:12,color:"#64748b",marginTop:4},
 warning:{color:"#92400e",marginVertical:6},result:{paddingVertical:12,borderBottomWidth:1,borderColor:"#e2e8f0"},bank:{padding:10,backgroundColor:"#eff6ff",borderRadius:8,marginTop:7},disabled:{opacity:0.5},
 selected:{flexDirection:"row",alignItems:"center",paddingVertical:10,borderBottomWidth:1,borderColor:"#e2e8f0"},remove:{fontWeight:"700",color:"#b91c1c"},
 input:{borderWidth:1,borderColor:"#94a3b8",borderRadius:8,padding:12,backgroundColor:"#fff",color:"#0f172a",marginVertical:9},
 row:{flexDirection:"row",gap:8,flexWrap:"wrap",marginVertical:8},chip:{padding:8,borderColor:"#cbd5e1",borderWidth:1,borderRadius:8},chipSelected:{backgroundColor:"#bfdbfe"},
 button:{backgroundColor:"#1d4ed8",padding:12,borderRadius:8,alignItems:"center",marginVertical:6},danger:{backgroundColor:"#991b1b"},buttonText:{color:"#fff",fontWeight:"800",textAlign:"center"}
});
