import React from "react";
import {ScrollView,StyleSheet,Text,TouchableOpacity,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
export default function VerificationRequestOutcome(){
 const {requestId,propertyIds,hasSpecial,hasWishlist}=useLocalSearchParams<{requestId?:string;propertyIds?:string;hasSpecial?:string;hasWishlist?:string}>();
 return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
   <Text style={styles.title}>Verification request received</Text>
   <Text style={styles.sub}>Reference #{requestId||"pending"}</Text>
   {hasSpecial==="1"&&<View style={styles.card}><Text style={styles.heading}>Special professional search</Text><Text style={styles.body}>OHLAM does not currently have a confirmed local professional for one or more selected services. We will try to locate an appropriately qualified professional outside the service area. Availability, transport and any higher charges require the professional's acceptance and your approval of a final quotation. No payment is due now.</Text></View>}
   {hasWishlist==="1"&&<View style={styles.card}><Text style={styles.heading}>Wishlist recorded</Text><Text style={styles.body}>These services have been recorded as unmet demand. OHLAM can contact you when suitable coverage becomes available, subject to your notification preferences. Wishlist entries are not appointments or confirmed services.</Text></View>}
   <View style={styles.card}><Text style={styles.heading}>Supporting documents</Text><Text style={styles.body}>Upload the survey plan and other service-specific supporting documents for each property so the review team can assess the request.</Text></View>
   <TouchableOpacity style={styles.button} onPress={()=>router.replace({pathname:"/verification/documents",params:{propertyIds:propertyIds??""}})}><Text style={styles.white}>Continue to upload documents</Text></TouchableOpacity>
   <TouchableOpacity onPress={()=>router.replace("/(tabs)/home")}><Text style={styles.link}>Finish for now</Text></TouchableOpacity>
 </ScrollView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:"#f7faff"},content:{padding:20,gap:16},title:{fontSize:25,fontWeight:"900",color:"#173b56"},sub:{color:"#536b7c"},card:{backgroundColor:"#fff",padding:18,borderWidth:1,borderColor:"#dce7ed",borderRadius:14,gap:8},heading:{fontSize:17,fontWeight:"800",color:"#184b69"},body:{color:"#486477",lineHeight:23},button:{backgroundColor:"#176A9C",padding:16,borderRadius:12,alignItems:"center"},white:{color:"#fff",fontWeight:"800"},link:{color:"#176A9C",textAlign:"center",fontWeight:"800"}});
