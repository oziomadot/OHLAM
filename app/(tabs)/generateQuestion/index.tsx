import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, 
  Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Platform
 } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import Protected from "components/Protected";
import Navbar from "components/Navbar";
import Dashboard from "components/Dashboard";
import API from "@/config";

const  GenerateQuestionsScreen = () => {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState();
  const [difficulty, setDifficulty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ focus, setFocus ] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert("Error", "Please enter a topic");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(`/generate-questions`, {
        topic,
        num_questions: parseInt(numQuestions),
        difficulty: difficulty,
        focus, 
      });

      if (res.data.status === 200) {
        Alert.alert("Success", "Questions generated successfully!");
        console.log(res.data.questions);
      } else {
        Alert.alert("Error", "Something went wrong");
      }
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert("Error", "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Protected>
           
            <KeyboardAvoidingView behavior="padding" style={styles.keyboardContainer}>
       <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.scrollView}>
         <Navbar/>
            <Dashboard/>
            <View style={styles.pageContainer}>
    <View style={styles.pageView}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Generate Knowledge Base Questions</Text>

      <TextInput
        placeholder="Enter topic (e.g. Nigerian history)"
        value={topic}
        onChangeText={setTopic}
        style={styles.textInput}
      />

      <TextInput
        placeholder="Number of questions"
        keyboardType="numeric"
        value={numQuestions}
        onChangeText={setNumQuestions}
        style={styles.textInput}
      />

      <Picker
        selectedValue={difficulty}
        onValueChange={(itemValue) => setDifficulty(itemValue)}
        style={styles.textInput}
      >
        <Picker.Item label="Easy" value='1' />
        <Picker.Item label="Medium" value='2' />
        <Picker.Item label="Difficult" value="3" />
      </Picker>

      <TextInput
        placeholder="Enter focus (e.g. Nigeria, AFrica, etc)"
        value={focus}
        onChangeText={setFocus}
        style={styles.textInput}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <Button title="Generate Questions" onPress={handleGenerate} />
      )}
    </View>
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
    </Protected>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    alignItems: "center",

    
    
  },
  pageView: {

    padding: 20, 
    justifyContent: 'center',
    width: Platform.OS === "web" ? "40%" : "100%", 
    alignItems: "center",
    borderColor: "#ccc", 
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
    

  },
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
  textInput: {
    borderWidth: 1,
     borderColor: '#ccc', 
     padding: 10, 
     borderRadius: 8, 
     marginBottom: 10,
     width: "50%",
  },

});

export default GenerateQuestionsScreen;
