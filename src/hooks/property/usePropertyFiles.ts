import { useState } from "react";
import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";

export function usePropertyFiles(showAlert?: (title: string, message: string) => void) {
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
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      if (!asset?.uri) {
        showAlert?.("Invalid Image", "Could not read the selected image.");
        return;
      }

      setImages((prev: any) => ({
        ...prev,
        [field]: {
          uri: asset.uri,
          name: asset.name || `${field}.jpg`,
          type: asset.mimeType || "image/jpeg",
        },
      }));
    } catch (error) {
      console.error("Image picker error:", error);
      showAlert?.("Image Error", "Could not select this image. Please try a smaller image.");
    }
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      if (!asset?.uri) {
        showAlert?.("Invalid Video", "Could not read the selected video.");
        return;
      }

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
    } catch (error) {
      console.error("Video picker error:", error);
      showAlert?.("Video Error", "Could not select this video. Please try a smaller file.");
    }
  };

  const pickProofDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      if (!asset?.uri) {
        showAlert?.("Invalid Document", "Could not read the selected document.");
        return;
      }

      setProofDocument({
        uri: asset.uri,
        name: asset.name || "proof_document.pdf",
        type: asset.mimeType || "application/pdf",
      });
    } catch (error) {
      console.error("Proof document picker error:", error);
      showAlert?.("Document Error", "Could not select this document.");
    }
  };

  const pickFloorPlan = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      if (!asset?.uri) {
        showAlert?.("Invalid Floor Plan", "Could not read the selected floor plan.");
        return;
      }

      setFloorPlan({
        uri: asset.uri,
        name: asset.name || "floor_plan.pdf",
        type: asset.mimeType || "application/pdf",
      });
    } catch (error) {
      console.error("Floor plan picker error:", error);
      showAlert?.("Floor Plan Error", "Could not select this floor plan.");
    }
  };

  const pickThreeSixtyVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      if (!asset?.uri) {
        showAlert?.("Invalid Video", "Could not read the selected 360 video.");
        return;
      }

      setThreeSixtyVideo({
        uri: asset.uri,
        name: asset.name || "360_video.mp4",
        type: asset.mimeType || "video/mp4",
      });
    } catch (error) {
      console.error("360 video picker error:", error);
      showAlert?.("360 Video Error", "Could not select this video. Please try a smaller file.");
    }
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