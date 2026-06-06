import { useState } from "react";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

export function usePropertyFiles() {
  const [images, setImages] = useState<any>({
    wholeBuilding: null,
    sittingRoom: null,
    kitchenImage: null,
    room: null,
    toiletImage: null,
  });

  const [video, setVideo] = useState<any>(null);
  const [proofDocument, setProofDocument] = useState<any>(null);
  const [floorPlan, setFloorPlan] = useState<any>(null);
  const [threeSixtyVideo, setThreeSixtyVideo] = useState<any>(null);

  const pickImage = async (field: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      setImages((prev: any) => ({
        ...prev,
        [field]: {
          uri: asset.uri,
          name: asset.fileName || `${field}.jpg`,
          type: asset.mimeType || "image/jpeg",
        },
      }));
    }
  };

  const pickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "video/*",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (Platform.OS === "web") {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const mimeType = blob.type || "video/mp4";

      const file: any = new File([blob], asset.name || "video.mp4", {
        type: mimeType,
      });

      file.uri = asset.uri;
      setVideo(file);
    } else {
      setVideo({
        uri: asset.uri,
        name: asset.name || "video.mp4",
        type: asset.mimeType || "video/mp4",
      });
    }
  };

  const pickProofDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    setProofDocument({
      uri: asset.uri,
      name: asset.name || "proof_document.pdf",
      type: asset.mimeType || "application/pdf",
    });
  };

  const pickFloorPlan = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    setFloorPlan({
      uri: asset.uri,
      name: asset.name || "floor_plan.pdf",
      type: asset.mimeType || "application/pdf",
    });
  };

  const pickThreeSixtyVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "video/*",
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    setThreeSixtyVideo({
      uri: asset.uri,
      name: asset.name || "360_video.mp4",
      type: asset.mimeType || "video/mp4",
    });
  };

  const resetFiles = () => {
    setImages({
      wholeBuilding: null,
      sittingRoom: null,
      kitchenImage: null,
      room: null,
      toiletImage: null,
    });
    setVideo(null);
    setProofDocument(null);
    setFloorPlan(null);
    setThreeSixtyVideo(null);
  };

  return {
    images,
    video,
    proofDocument,
    floorPlan,
    threeSixtyVideo,
    pickImage,
    pickVideo,
    pickProofDocument,
    pickFloorPlan,
    pickThreeSixtyVideo,
    resetFiles,
  };
}