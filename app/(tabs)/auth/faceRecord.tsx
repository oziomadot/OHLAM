import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  Platform
} from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import {getItemSafe} from "@/utils/storage";
import { useRouter } from "expo-router";
import  API from "@/src/services/api";



const CHALLENGES = [
  "Blink twice",
  "Turn your head left",
  "Turn your head right",
  "Smile",
];

export default function FaceLivenessScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [challenge, setChallenge] = useState("");
  const [recording, setRecording] = useState(false);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const photoCameraRef = useRef<CameraView>(null);
  const videoCameraRef = useRef<CameraView>(null);

  const [captureMode, setCaptureMode] =
     useState<"selfie" | "video">("selfie");

  useEffect(() => {
    const fetchData = async () => {
     
      const userData = await getItemSafe("user");
      setUser(userData);
    };
    fetchData();
  }, []);

  const pickChallenge = () => {
    return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  };

  const requestPermissions = async () => {
    const camera = await requestCameraPermission();
    const mic = await requestMicPermission();

    if (!camera.granted || !mic.granted) {
      Alert.alert("Permission required", "Camera and microphone permissions are required.");
      return false;
    }

    return true;
  };

  const startLiveness = async () => {
   const allowed = await requestPermissions();

   await new Promise(resolve => setTimeout(resolve, 1500));

   if (!allowed) return;

   try {

      // SELFIE STEP
      setCaptureMode("selfie");

      await new Promise(r => setTimeout(r,1000));

      const photo =
         await photoCameraRef.current?.takePictureAsync({
            quality:1,
            skipProcessing:false,
         });

      if(!photo?.uri)
         throw new Error("Selfie failed");

      setSelfieUri(photo.uri);

      // VIDEO STEP
      setCaptureMode("video");

      await new Promise(r => setTimeout(r,1000));

      const selectedChallenge =
         pickChallenge();

      setChallenge(selectedChallenge);

      setRecording(true);

      const video =
         await videoCameraRef.current?.recordAsync({
            maxDuration:6
         });

      if(video?.uri)
         setVideoUri(video.uri);

   } catch(e){
      console.log(e);
   } finally{
      setRecording(false);
   }
};

  
  const stopRecording = () => {
    cameraRef.current?.stopRecording();
  };

  const uploadLiveness = async () => {
    const User = typeof user === "string" ? JSON.parse(user) : user;

    console.log("uploading video liveliness");
    if (!selfieUri || !videoUri || !challenge) {
      Alert.alert("Missing data", "Please complete face recording again.");
      return;
    }

    try {
      setLoading(true);

      const token = await getItemSafe("token");

      const formData = new FormData();

      formData.append("challenge", challenge);
      formData.append("consent_given", "1");
      formData.append("user_id", String(User.id));

      formData.append("selfie_image", {
        uri: selfieUri.startsWith('file://') ? selfieUri : `file://${selfieUri}`,
        name: "selfie.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("liveness_video", {
        uri: videoUri,
        name: Platform.OS === 'ios' ? 'liveness.mov' : 'liveness.mp4',
        type: Platform.OS === 'ios' ? 'video/quicktime' : 'video/mp4',
      } as any);

  


      
      const res = await API.kycLiveness(formData);
      console.log("Return response", res);
      Alert.alert("Success", res.message, [
        {
          
          text: "Continue",
          onPress: () => router.replace("/auth/idCardUpload"),
        },
      ]);
    } catch (error: any) {
      console.log(error?.response?.data || error.message);
      Alert.alert(
        "Liveness Failed",
        error?.response?.data?.message || "Could not verify liveness."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {!videoUri ? (
        <View style={{ flex: 1 }}>
         <CameraView
            ref={
              captureMode === "selfie"
         ? photoCameraRef
         : videoCameraRef
      }
            style={{ flex:1 }}
            facing="front"
            mode={
              captureMode === "selfie"
                ? "picture"
                : "video"
            }
          />
          <View style={styles.overlay}>
            <Text style={styles.challenge}>
              Move closer. Keep your face inside the frame. Then {recording ? challenge : "tap Start"}
            </Text>

            {recording ? (
              <TouchableOpacity onPress={stopRecording} style={styles.stopButton} />
            ) : (
              <TouchableOpacity 
                onPress={startLiveness} 
                style={styles.captureButton}
                disabled={recording}
              >
                <Text style={styles.captureText}>
                  {recording ? "Recording..." : "Start"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.review}>
          <Text style={styles.title}>Liveness recording complete</Text>
          <Text style={styles.text}>Challenge: {challenge}</Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setVideoUri(null);
              setSelfieUri(null);
              setChallenge("");
            }}
          >
            <Text>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={uploadLiveness}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadText}>Submit</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 30,
  },
  challenge: {
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.65)",
    padding: 14,
    borderRadius: 10,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 25,
    textAlign: "center",
  },
  captureButton: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 50,
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  captureText: { fontWeight: "700" },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "red",
    borderWidth: 4,
    borderColor: "#fff",
  },
  review: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
  },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 10 },
  text: { textAlign: "center", marginBottom: 20 },
  secondaryButton: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#ddd",
    marginBottom: 12,
  },
  uploadButton: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  uploadText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
});