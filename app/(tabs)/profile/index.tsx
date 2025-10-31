import { Text, View, KeyboardAvoidingView, ScrollView, 
    StyleSheet,
    TouchableOpacity} from 'react-native';
import Protected from "components/Protected";
import Navbar from "components/Navbar";
import Dashboard from "components/Dashboard";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";



const Profile = () => {
    const { user } = useAuth();
    const router = useRouter();

    useEffect( () => {

        if(!user){
            router.replace("/auth/loginScreen");
        }


    })

    return (
             <Protected>
           
            <KeyboardAvoidingView behavior="padding" style={styles.keyboardContainer}>
       <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.scrollView}>
         <Navbar/>
            <Dashboard/>
            <View style={styles.pageContainer}>
            <Text>Profile</Text>
        </View>
        <View>
            <Text> {user?.firstname}</Text>
        </View>
        <View style={styles.buttonContainer}>
            <TouchableOpacity
            onPress={()=>router.push("/profile/edit")}
            style={styles.button}
            >
                <Text>Edit Profile</Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
</KeyboardAvoidingView>
        </Protected>
    )
}

const styles = StyleSheet.create({
     pageContainer: {
    flex: 1,
    
    
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
    buttonContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#57AAEF",
    color: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default Profile;