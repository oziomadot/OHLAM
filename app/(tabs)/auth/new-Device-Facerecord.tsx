import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { getItemSafe, setItemSafe, removeItemSafe } from "@/utils/storage";
import { useRouter } from "expo-router";
import API from "@/src/services/api";

const CHALLENGES = [
  "Blink twice",
  "Turn your head left",
  "Turn your head right",
  "Smile",
];

export default function NewDeviceFaceVerificationScreen() {
  const router = useRouter();
  const photoCameraRef = useRef<CameraView>(null);
  const videoCameraRef = useRef<CameraView>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [challenge, setChallenge] = useState("");
  const [recording, setRecording] = useState(false);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captureMode, setCaptureMode] = useState<"selfie" | "video">("selfie");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingDevice, setPendingDevice] = useState<Record<string, any> | null>(null);

  

  useEffect(() => {
    const loadPendingData = async () => {
      const userId = await getItemSafe("pending_user_id");
      const deviceJson = await getItemSafe("pending_device");

      if (!userId) {
        Alert.alert(
          "Error",
          "No pending user found. Please log in again.",
          [{ text: "OK", onPress: () => router.replace("/auth/LoginScreen") }]
        );
        return;
      }

      setPendingUserId(userId);

      try {
        const device = typeof deviceJson === "string" ? JSON.parse(deviceJson) : deviceJson;
        setPendingDevice(device);
      } catch (e) {
        console.log("Failed to parse pending device", e);
        setPendingDevice({});
      }
    };

    loadPendingData();
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
    if (!allowed) return;

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      setCaptureMode("selfie");
      await new Promise((r) => setTimeout(r, 1000));

      const photo = await photoCameraRef.current?.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      if (!photo?.uri) throw new Error("Selfie failed");
      setSelfieUri(photo.uri);

      setCaptureMode("video");
      await new Promise((r) => setTimeout(r, 1000));

      const selectedChallenge = pickChallenge();
      setChallenge(selectedChallenge);
      setRecording(true);

      const video = await videoCameraRef.current?.recordAsync({
        maxDuration: 6,
      });

      if (video?.uri) setVideoUri(video.uri);
    } catch (e) {
      console.log(e);
      Alert.alert("Recording failed", "Could not complete face recording. Please try again.");
    } finally {
      setRecording(false);
    }
  };

  const stopRecording = () => {
    videoCameraRef.current?.stopRecording();
  };

  const uploadVerification = async () => {
    if (!selfieUri || !videoUri || !challenge) {
      Alert.alert("Missing data", "Please complete face recording again.");
      return;
    }

    if (!pendingUserId) {
      Alert.alert("Error", "No pending user found. Please log in again.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("user_id", String(pendingUserId));
      formData.append("selfie_image", {
        uri: selfieUri.startsWith("file://") ? selfieUri : `file://${selfieUri}`,
        name: "selfie.jpg",
        type: "image/jpeg",
      } as any);
      formData.append("liveness_video", {
        uri: videoUri,
        name: Platform.OS === "ios" ? "liveness.mov" : "liveness.mp4",
        type: Platform.OS === "ios" ? "video/quicktime" : "video/mp4",
      } as any);

      if (pendingDevice) {
        Object.entries(pendingDevice).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            formData.append(key, String(value));
          }
        });
      }

      const res = await API.verifyFaceForNewDevice(formData);
      console.log("New device verification response", res);

      if (res.success) {
        await setItemSafe("auth_token", res.token);
        await setItemSafe("user", JSON.stringify(res.user));
        await setItemSafe("user_id", String(res.user_id));

        await removeItemSafe("pending_user_id");
        await removeItemSafe("pending_device");

        Alert.alert("Success", res.message, [
          {
            text: "Continue",
            onPress: () => router.replace("/(tabs)/dashboard"),
          },
        ]);
      } else {
        Alert.alert("Verification Failed", res.message || "Could not verify face.");
      }
    } catch (error: any) {
      console.log(error?.response?.data || error.message);
      Alert.alert(
        "Verification Failed",
        error?.response?.data?.message || "Could not verify face."
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
            ref={captureMode === "selfie" ? photoCameraRef : videoCameraRef}
            style={{ flex: 1 }}
            facing="front"
            mode={captureMode === "selfie" ? "picture" : "video"}
          />
          <View style={styles.overlay}>
            <Text style={styles.challenge}>
              Move closer. Keep your face inside the frame. Then{" "}
              {recording ? challenge : "tap Start"}
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
            onPress={uploadVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadText}>Submit</Text>
            )}
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
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
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