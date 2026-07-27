import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";

import API from "@/src/services/api";
import {
  getItemSafe,
  removeItemSafe,
  setItemSafe,
} from "@/utils/storage";
import {
  appendDeviceDetails,
  getDeviceDetails,
} from "@/src/utils/device";

import Navbar from "components/Navbar";
import ScreenWrapper from "components/ScreenWrapper";
import CustomAlert from "components/CustomAlert";

type User = {
  id: number | string;
  name?: string;
  firstname?: string;
  surname?: string;
  email?: string;
};

type SelectedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
};

type IdCardType = {
  id: number;
  name: string;
  code?: string | null;
  provider_code?: string | null;
  requires_back?: boolean;
};

type VerifyIdCardResponse = {
  success: boolean;
  message?: string;
  token?: string;
  access_token?: string;
  user?: User;
  code?: string;
  next_step?: string;
};

const IdCardUpload = () => {
  const router = useRouter();

  const [frontImage, setFrontImage] =
    useState<SelectedImage | null>(null);

  const [backImage, setBackImage] =
    useState<SelectedImage | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [idCardTypes, setIdCardTypes] =
    useState<IdCardType[]>([]);

  const [idType, setIdType] =
    useState<number | "">("");

  const [requiresBack, setRequiresBack] =
    useState(false);

  const [loadingTypes, setLoadingTypes] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [alertVisible, setAlertVisible] =
    useState(false);

  const [alertTitle, setAlertTitle] =
    useState("");

  const [alertMessage, setAlertMessage] =
    useState("");

  const showAlert = (
    title: string,
    message: string
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  /**
   * Load the locally stored authenticated/pre-auth user.
   */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser =
          await getItemSafe("user");

        if (!storedUser) {
          setUser(null);
          return;
        }

        const parsedUser =
          JSON.parse(storedUser) as User;

        setUser(parsedUser);
      } catch (loadError) {
        console.error(
          "[ID KYC] Failed to load user:",
          loadError
        );

        setUser(null);
      }
    };

    void loadUser();
  }, []);

  /**
   * Load ID types from Laravel.
   */
  useEffect(() => {
    const loadIdCardTypes = async () => {
      setLoadingTypes(true);
      setError("");

      try {
        const response =
          await API.getIdCardTypes();

        console.log(
          "[ID KYC] ID card type response:",
          response
        );

        /*
         * Supports both:
         *
         * [
         *   { id: 1, name: "Passport" }
         * ]
         *
         * and:
         *
         * {
         *   data: [
         *     { id: 1, name: "Passport" }
         *   ]
         * }
         */
        const types = Array.isArray(response)
          ? response
          : Array.isArray(
              (response as any)?.data
            )
          ? (response as any).data
          : [];

        setIdCardTypes(
          types.map((item: any) => ({
            id: Number(item.id),
            name:
              item.name ??
              item.label ??
              item.code ??
              `ID Type ${item.id}`,
            code: item.code ?? null,
            provider_code:
              item.provider_code ?? null,
            requires_back:
              Boolean(item.requires_back),
          }))
        );
      } catch (loadError: any) {
        console.error(
          "[ID KYC] Failed to load ID types:",
          {
            message: loadError?.message,
            status:
              loadError?.status ??
              loadError?.response?.status,
            data:
              loadError?.data ??
              loadError?.response?.data,
          }
        );

        setError(
          loadError?.data?.message ??
            loadError?.response?.data?.message ??
            loadError?.message ??
            "Failed to load ID card types."
        );
      } finally {
        setLoadingTypes(false);
      }
    };

    void loadIdCardTypes();
  }, []);

  /**
   * Determine whether the selected ID requires
   * both front and back images.
   */
  useEffect(() => {
    if (idType === "") {
      setRequiresBack(false);
      setBackImage(null);
      return;
    }

    const selectedType =
      idCardTypes.find(
        (item) => item.id === idType
      );

    if (!selectedType) {
      setRequiresBack(false);
      setBackImage(null);
      return;
    }

    /*
     * Prefer a requires_back value from Laravel.
     */
    if (
      typeof selectedType.requires_back ===
      "boolean"
    ) {
      setRequiresBack(
        selectedType.requires_back
      );

      if (!selectedType.requires_back) {
        setBackImage(null);
      }

      return;
    }

    /*
     * Fallback based on the ID type code/name.
     */
    const identifier = [
      selectedType.code,
      selectedType.provider_code,
      selectedType.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const needsBack =
      identifier.includes("driver") ||
      identifier.includes("licence") ||
      identifier.includes("license") ||
      identifier.includes("voter") ||
      identifier.includes("pvc");

    setRequiresBack(needsBack);

    if (!needsBack) {
      setBackImage(null);
    }
  }, [idType, idCardTypes]);

  const requestGalleryPermission =
    async (): Promise<boolean> => {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Gallery permission is required to select your ID image."
        );

        return false;
      }

      return true;
    };

  const createSelectedImage = (
    asset: ImagePicker.ImagePickerAsset,
    side: "front" | "back"
  ): SelectedImage => {
    let mimeType =
      asset.mimeType ?? "image/jpeg";

    let extension = "jpg";

    if (
      mimeType === "image/png" ||
      asset.uri.toLowerCase().endsWith(".png")
    ) {
      mimeType = "image/png";
      extension = "png";
    }

    return {
      uri: asset.uri,
      mimeType,
      fileName:
        asset.fileName ??
        `${side}_${Date.now()}.${extension}`,
    };
  };

  const saveSelectedImage = (
    side: "front" | "back",
    image: SelectedImage
  ) => {
    if (side === "front") {
      setFrontImage(image);
    } else {
      setBackImage(image);
    }
  };

  const pickImage = async (
    side: "front" | "back"
  ) => {
    const granted =
      await requestGalleryPermission();

    if (!granted) {
      return;
    }

    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 2],
          quality: 0.8,
        });

      if (
        result.canceled ||
        !result.assets?.[0]
      ) {
        return;
      }

      const selectedImage =
        createSelectedImage(
          result.assets[0],
          side
        );

      saveSelectedImage(
        side,
        selectedImage
      );
    } catch (pickerError) {
      console.error(
        "[ID KYC] Gallery error:",
        pickerError
      );

      Alert.alert(
        "Image error",
        "Failed to select the image. Please try again."
      );
    }
  };

  const takePhoto = async (
    side: "front" | "back"
  ) => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Camera permission is required to photograph your ID."
      );

      return;
    }

    try {
      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 2],
          quality: 0.8,
        });

      if (
        result.canceled ||
        !result.assets?.[0]
      ) {
        return;
      }

      const selectedImage =
        createSelectedImage(
          result.assets[0],
          side
        );

      saveSelectedImage(
        side,
        selectedImage
      );
    } catch (cameraError) {
      console.error(
        "[ID KYC] Camera error:",
        cameraError
      );

      Alert.alert(
        "Camera error",
        "Failed to take the photo. Please try again."
      );
    }
  };

  const handleSubmit = async () => {
    if (uploading) {
      return;
    }

    const userId = user?.id;

    console.log(
      "[ID KYC] Submission started:",
      {
        userId,
        idType,
        frontImage,
        backImage,
        requiresBack,
      }
    );

    if (idType === "") {
      Alert.alert(
        "ID type required",
        "Please select the type of ID you are uploading."
      );

      return;
    }

    if (!frontImage) {
      Alert.alert(
        "Front image required",
        "Please upload the front of your ID."
      );

      return;
    }

    if (
      requiresBack &&
      !backImage
    ) {
      Alert.alert(
        "Back image required",
        "Please upload the back of your ID."
      );

      return;
    }

    if (!userId) {
      Alert.alert(
        "Session error",
        "User information was not found. Please log in again."
      );

      return;
    }

    setUploading(true);

    try {
      const device =
        await getDeviceDetails();

      const formData =
        new FormData();

      formData.append(
        "user_id",
        String(userId)
      );

      formData.append(
        "id_type_id",
        String(idType)
      );

      appendDeviceDetails(
        formData,
        device
      );

      formData.append(
        "front_image",
        {
          uri: frontImage.uri,
          name: frontImage.fileName,
          type: frontImage.mimeType,
        } as any
      );

      if (
        requiresBack &&
        backImage
      ) {
        formData.append(
          "back_image",
          {
            uri: backImage.uri,
            name: backImage.fileName,
            type: backImage.mimeType,
          } as any
        );
      }

      console.log(
        "[ID KYC] Sending verification request"
      );

      const response =
        (await API.verifyIdCard(
          formData
        )) as VerifyIdCardResponse;

      console.log(
        "[ID KYC] Verification response:",
        response
      );

      const token =
        response?.token ??
        response?.access_token;

      if (
        response?.success === true &&
        token
      ) {
        await API.setToken(token);

        await setItemSafe(
          "auth_token",
          token
        );

        if (response.user) {
          await setItemSafe(
            "user",
            JSON.stringify(
              response.user
            )
          );
        }

        await setItemSafe(
          "registrationCompleted",
          "true"
        );

        await removeItemSafe(
          "pre_auth_token"
        );

        Alert.alert(
          "Verification successful",
          response.message ??
            "Your identity has been verified successfully.",
          [
            {
              text: "Continue",
              onPress: () => {
                router.replace(
                  "/(tabs)/dashboard"
                );
              },
            },
          ]
        );

        return;
      }

      Alert.alert(
        "Verification failed",
        response?.message ??
          "Your ID could not be verified."
      );
    } catch (submitError: any) {
      const serverData =
        submitError?.data ??
        submitError?.response?.data;

      console.error(
        "[ID KYC] Upload error:",
        {
          name: submitError?.name,
          message:
            submitError?.message,
          status:
            submitError?.status ??
            submitError?.response?.status,
          data: serverData,
        }
      );

      Alert.alert(
        "ID verification failed",
        serverData?.message ??
          submitError?.message ??
          "Failed to upload your ID. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const ImagePickerButton = ({
    side,
    title,
  }: {
    side: "front" | "back";
    title: string;
  }) => {
    const selectedImage =
      side === "front"
        ? frontImage
        : backImage;

    return (
      <View style={styles.imagePicker}>
        <Text style={styles.imageLabel}>
          {title}
        </Text>

        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: selectedImage.uri,
              }}
              style={styles.previewImage}
              resizeMode="cover"
            />

            <View
              style={
                styles.imageActionContainer
              }
            >
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() =>
                  pickImage(side)
                }
                disabled={uploading}
              >
                <Text
                  style={
                    styles.changeButtonText
                  }
                >
                  Choose another
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changeButton}
                onPress={() =>
                  takePhoto(side)
                }
                disabled={uploading}
              >
                <Text
                  style={
                    styles.changeButtonText
                  }
                >
                  Retake photo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View
            style={styles.buttonContainer}
          >
            <TouchableOpacity
              style={styles.pickButton}
              onPress={() =>
                pickImage(side)
              }
              disabled={uploading}
            >
              <Text
                style={
                  styles.pickButtonText
                }
              >
                Choose from gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickButton}
              onPress={() =>
                takePhoto(side)
              }
              disabled={uploading}
            >
              <Text
                style={
                  styles.pickButtonText
                }
              >
                Take photo
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loadingTypes) {
    return (
      <ScreenWrapper>
        <Navbar />

        <View style={styles.center}>
          <ActivityIndicator
            size="large"
          />

          <Text style={styles.loadingText}>
            Loading ID types...
          </Text>
        </View>

        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          onClose={() =>
            setAlertVisible(false)
          }
        />
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper>
        <Navbar />

        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              router.back()
            }
          >
            <Text style={styles.buttonText}>
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Navbar />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>
            ID Card Upload
          </Text>

          <Text style={styles.subtitle}>
            Upload a clear image of your
            government-issued identity
            document.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              Accepted ID documents
            </Text>

            <Text style={styles.infoText}>
              • National ID card{"\n"}
              • Driver&apos;s licence{"\n"}
              • Voter&apos;s card{"\n"}
              • International passport
            </Text>
          </View>

          <View style={styles.pickerBox}>
            <Text style={styles.label}>
              Select ID type
            </Text>

            <View
              style={styles.pickerWrapper}
            >
              <Picker
                selectedValue={idType}
                enabled={!uploading}
                onValueChange={(
                  value: number | string
                ) => {
                  if (
                    value === "" ||
                    value === null
                  ) {
                    setIdType("");
                    return;
                  }

                  setIdType(
                    Number(value)
                  );
                }}
              >
                <Picker.Item
                  label="Select ID type"
                  value=""
                />

                {idCardTypes.map(
                  (item) => (
                    <Picker.Item
                      key={String(
                        item.id
                      )}
                      label={item.name}
                      value={item.id}
                      color="#333"
                    />
                  )
                )}
              </Picker>
            </View>
          </View>

          <View style={styles.form}>
            <ImagePickerButton
              side="front"
              title="Front of ID"
            />

            {requiresBack && (
              <ImagePickerButton
                side="back"
                title="Back of ID"
              />
            )}

            <View style={styles.tipsBox}>
              <Text
                style={styles.tipsTitle}
              >
                Tips for best results
              </Text>

              <Text
                style={styles.tipsText}
              >
                • Ensure all text is clearly
                visible{"\n"}
                • Avoid glare and shadows
                {"\n"}
                • Use a plain, contrasting
                background{"\n"}
                • Make sure all corners are
                visible
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                uploading &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <View
                  style={
                    styles.uploadingContainer
                  }
                >
                  <ActivityIndicator
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.uploadingText
                    }
                  >
                    Verifying...
                  </Text>
                </View>
              ) : (
                <Text
                  style={styles.buttonText}
                >
                  Continue
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View
            style={styles.securityNote}
          >
            <Text
              style={styles.securityTitle}
            >
              Your data is protected
            </Text>

            <Text
              style={styles.securityText}
            >
              Your identity document is used
              only for identity verification
              and is stored in private
              application storage.
            </Text>
          </View>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() =>
          setAlertVisible(false)
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666666",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666666",
    marginBottom: 20,
    lineHeight: 22,
  },

  infoBox: {
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333333",
  },

  infoText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 21,
  },

  pickerBox: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333333",
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },

  form: {
    marginBottom: 20,
  },

  imagePicker: {
    marginBottom: 20,
  },

  imageLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333333",
  },

  imageContainer: {
    alignItems: "center",
  },

  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#eeeeee",
  },

  imageActionContainer: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },

  changeButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },

  changeButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },

  buttonContainer: {
    gap: 10,
  },

  pickButton: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dddddd",
  },

  pickButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },

  tipsBox: {
    backgroundColor: "#fff3cd",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },

  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#856404",
  },

  tipsText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 21,
  },

  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    minHeight: 52,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  uploadingText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  securityNote: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },

  securityTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333333",
    textAlign: "center",
  },

  securityText: {
    fontSize: 12,
    color: "#666666",
    lineHeight: 18,
    textAlign: "center",
  },

  errorText: {
    color: "#cc0000",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
});

export default IdCardUpload;