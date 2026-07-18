import React from "react";
import { Keyboard, KeyboardAvoidingView, SafeAreaView, StyleSheet } from "react-native";
import Protected from "components/Protected";
import RagChatWidget from "components/RagChatWidget";
import ScreenWrapper from "components/ScreenWrapper";

export default function PolicyAssistantScreen() {
  return (
    
  
      
        <RagChatWidget />
     
 
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
});