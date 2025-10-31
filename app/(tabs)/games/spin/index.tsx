import WheelOfFortuneExpo from "components/WheelOfFortuneExpo";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "@/config";
import Protected from "components/Protected";
import Navbar from "components/Navbar";
import { Platform } from "react-native";
import Dashboard from "components/Dashboard";

export default function SpinScreen() {

  const [totalCoins, setTotalCoins] = useState(0);
  const segments = [
     { label: "0", color: "#AA6347" },
    { label: "10", color: "#FF6347" },
    { label: "20", color: "#FFD700" },   
    { label: "50", color: "#32CD32" },
    { label: "100", color: "#8A2BE2" },
    { label: "200", color: "#FF69B4" },
     { label: "500", color: "#1E90FF" },
  ];
  

  useEffect(() =>{
    const fetchTotalCoins = async () => {
      try{
        const token = await AsyncStorage.getItem("token");
        const res = await API.get("/getCoin",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json", 
            }
          }
        );

        setTotalCoins(res.data.total_coins);
        console.log(res.data);

      }catch(err){
        console.log(err);
      }
    }
    fetchTotalCoins();
  },[])
  
  return (
     <Protected>      
        <KeyboardAvoidingView behavior="padding" style={styles.keyboardContainer}>
            <ScrollView>
                <Navbar />
                <Dashboard/>
                <View>
          <Text style={styles.totalCoinsText}>Total Coins Wallet: {totalCoins}</Text>
          </View> 
         <View style={styles.container}>
          
          <Text style={styles.header}>🎡 Spin & Win Coins!</Text>
         
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <WheelOfFortuneExpo segments={segments}
       
 />
    </View>
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
    </Protected>
  
  );
}


const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 5,
  },
  resultText: {
    fontSize: 20,
    color: "green",
    marginBottom: 15,
  },
  wheelContainer: {
    marginVertical: 30,
    alignItems: "center",
    justifyContent: "center",
   
  },
totalCoinsText: {
fontSize: 18, 
textAlign: "right",
marginRight: Platform.OS === "web" ? 80: 20,
padding: 5,
fontFamily: "Poppins_400Regular, Arial, sans-serif",
fontWeight: "bold",
color: "green", 
},
});
