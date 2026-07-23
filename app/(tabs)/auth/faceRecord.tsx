import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { appendDeviceDetails, getDeviceDetails } from "@/src/utils/device";
import { getItemSafe, setItemSafe } from "@/utils/storage";
import API, { BASE_URL, verifyNewDeviceFace } from "@/src/services/api";
import ScreenWrapper from "components/ScreenWrapper";

type ScreenMode =
  | "kyc"
  | "device-verification";

export default function FaceLivenessScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    mode?: string;
  }>();

  const cameraRef =
    useRef<CameraView>(null);

  const [
    cameraPermission,
    requestCameraPermission,
  ] = useCameraPermissions();

  const [cameraReady, setCameraReady] =
    useState(false);

  const [selfieUri, setSelfieUri] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const mode: ScreenMode =
    params.mode ===
    "device-verification"
      ? "device-verification"
      : "kyc";

  useEffect(() => {
    void ensurePermission();
  }, []);

  async function ensurePermission():
    Promise<void> {
    if (cameraPermission?.granted) {
      return;
    }

    const result =
      await requestCameraPermission();

    if (!result.granted) {
      Alert.alert(
        "Camera permission required",
        "OHLAM needs camera access to verify your live face."
      );
    }
  }

  async function captureSelfie():
    Promise<void> {
    if (
      !cameraPermission?.granted
      || !cameraReady
      || loading
    ) {
      return;
    }

    try {
      setLoading(true);

      const photo =
        await cameraRef.current
          ?.takePictureAsync({
            quality: 0.85,
            skipProcessing: false,
          });

      if (!photo?.uri) {
        throw new Error(
          "The camera did not return an image."
        );
      }

      setSelfieUri(photo.uri);
    } catch (error) {
      console.error(
        "Selfie capture failed",
        error
      );

      Alert.alert(
        "Capture failed",
        "Could not capture your selfie. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitSelfie():
    Promise<void> {
    if (!selfieUri || loading) {
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("consent_given", "1");

      formData.append("selfie_image", {
        uri: selfieUri,
        name: "selfie.jpg",
        type: "image/jpeg",
      } as any);

      if (mode ==="device-verification") {
        const device =
          await getDeviceDetails();

        appendDeviceDetails(
          formData,
          device
        );

        const response =
         await verifyNewDeviceFace(
          formData
        );

        if (!response.success) {  
          throw new Error(
            response.message
              ?? "Device verification failed."
          );
        }

        await setItemSafe("auth_token", response.token);
        await setItemSafe("user", JSON.stringify(response.user));
        await setItemSafe("user_id", String(response.user.id));

        /*
         * Clear restricted token.
         */
        await setItemSafe("pre_auth_token", "");

        Alert.alert("Device verified", response.message, [
            {
              text: "Continue",
              onPress: () =>
                router.replace(
                  "/(tabs)/dashboard"
                ),
            },
          ]
        );

        return;
      }



      console.log("[KYC] Uploading...");
console.log("[KYC] URL:", BASE_URL + "/kyc-liveness");
// console.log("[KYC] Token:", preAuthToken?.substring(0,20));
      /*
       * Normal authenticated KYC.
       */
      const response = await API.kycLiveness(
        formData
      );

      if (!response.success) {
        throw new Error(
          response.message
            ?? "Face verification failed."
        );
      }

      Alert.alert(
        "Liveness confirmed",
        response.message,
        [
          {
            text: "Continue",
            onPress: () =>
              router.replace(
                "/auth/idCardUpload"
              ),
          },
        ]
      );
    } catch (error: any) {
      console.error(
        "Face verification failed",
        error?.response?.data
          ?? error?.message
      );

      Alert.alert(
        "Verification failed",
        error?.response?.data
          ?.message
          ?? error?.message
          ?? "Could not verify your face."
      );
    } finally {
      setLoading(false);
    }
  }

  function retake(): void {
    if (loading) {
      return;
    }

    setSelfieUri(null);
  }

  if (
    !cameraPermission
    || !cameraPermission.granted
  ) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>
          Camera permission required
        </Text>

        <Text style={styles.instructions}>
          Allow camera access so OHLAM
          can confirm that a live person
          is present.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            void ensurePermission()
          }
        >
          <Text
            style={styles.primaryText}
          >
            Allow camera
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (selfieUri) {
    return (
      <View style={styles.review}>
        <Text style={styles.title}>
          Review your selfie
        </Text>

        <Image
          source={{ uri: selfieUri }}
          style={styles.preview}
          resizeMode="cover"
        />

        <Text style={styles.instructions}>
          Make sure your face is clear,
          uncovered and well lit.
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={retake}
          disabled={loading}
        >
          <Text
            style={styles.secondaryText}
          >
            Retake
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading
              ? styles.disabled
              : undefined,
          ]}
          onPress={() =>
            void submitSelfie()
          }
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              color="#ffffff"
            />
          ) : (
            <Text
              style={styles.primaryText}
            >
              Verify face
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (

    <ScreenWrapper>
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mode="picture"
        onCameraReady={() =>
          setCameraReady(true)
        }
      />

      <View style={styles.overlay}>
        <View style={styles.faceGuide} />

        <Text style={styles.cameraText}>
          Keep your face inside the
          frame. Remove hats, masks and
          dark glasses.
        </Text>

        <TouchableOpacity
          style={[
            styles.captureButton,
            !cameraReady || loading
              ? styles.disabled
              : undefined,
          ]}
          onPress={() =>
            void captureSelfie()
          }
          disabled={
            !cameraReady || loading
          }
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <View
              style={
                styles.captureInner
              }
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
    </ScreenWrapper>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000000",
    },

    centered: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
    },

    overlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "flex-end",
      paddingHorizontal: 24,
      paddingBottom: 45,
    },

    faceGuide: {
      position: "absolute",
      top: "20%",
      width: 240,
      height: 320,
      borderWidth: 3,
      borderColor: "#ffffff",
      borderRadius: 120,
    },

    cameraText: {
      color: "#ffffff",
      backgroundColor:
        "rgba(0,0,0,0.65)",
      padding: 14,
      borderRadius: 10,
      fontSize: 17,
      fontWeight: "600",
      textAlign: "center",
      marginBottom: 24,
    },

    captureButton: {
      width: 86,
      height: 86,
      borderRadius: 43,
      borderWidth: 5,
      borderColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
    },

    captureInner: {
      width: 65,
      height: 65,
      borderRadius: 33,
      backgroundColor: "#ffffff",
    },

    review: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
      backgroundColor: "#ffffff",
    },

    preview: {
      width: "100%",
      height: 420,
      borderRadius: 18,
      marginVertical: 20,
    },

    title: {
      fontSize: 23,
      fontWeight: "700",
      textAlign: "center",
    },

    instructions: {
      fontSize: 16,
      lineHeight: 23,
      textAlign: "center",
      marginBottom: 20,
    },

    primaryButton: {
      minHeight: 52,
      backgroundColor: "#007AFF",
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      marginTop: 10,
    },

    primaryText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "700",
    },

    secondaryButton: {
      minHeight: 52,
      backgroundColor: "#e5e7eb",
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },

    secondaryText: {
      color: "#111827",
      fontSize: 16,
      fontWeight: "600",
    },

    disabled: {
      opacity: 0.55,
    },
  });