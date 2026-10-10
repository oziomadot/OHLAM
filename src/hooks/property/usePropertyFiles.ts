import {
  useState,
} from "react";
import * as DocumentPicker from "expo-document-picker";

type ShowAlert = (
  title: string,
  message: string
) => void;

export function usePropertyFiles(
  showAlert?: ShowAlert
) {
  const [
    images,
    setImages,
  ] = useState<any>({
    wholeBuilding: null,
    sittingRoom: null,
    kitchenImage: null,
    room: null,
    toiletImage: null,
  });

  const [
    video,
    setVideo,
  ] = useState<any>(null);

  const [
    proofDocument,
    setProofDocument,
  ] = useState<any>(null);

  const [
    floorPlan,
    setFloorPlan,
  ] = useState<any>(null);

  const [
    threeSixtyVideo,
    setThreeSixtyVideo,
  ] = useState<any>(null);

  const normalizeAsset = (
    asset: any,
    fallbackName: string,
    fallbackType: string
  ) => {
    if (!asset?.uri) {
      return null;
    }

    return {
      uri: asset.uri,

      name:
        asset.name ||
        fallbackName,

      type:
        asset.mimeType ||
        fallbackType,
    };
  };

  const pickImage =
    async (
      field: string
    ) => {
      try {
        const result =
          await DocumentPicker
            .getDocumentAsync({
              type: "image/*",

              copyToCacheDirectory:
                true,

              multiple: false,
            });

        if (
          result.canceled
        ) {
          return;
        }

        const asset =
          result.assets?.[0];

        const file =
          normalizeAsset(
            asset,
            `${field}.jpg`,
            "image/jpeg"
          );

        if (!file) {
          showAlert?.(
            "Invalid Image",
            "Could not read the selected image."
          );

          return;
        }

        setImages(
          (prev: any) => ({
            ...prev,

            [field]:
              file,
          })
        );
      } catch (error) {
        console.error(
          "Image picker error:",
          error
        );

        showAlert?.(
          "Image Error",
          "Could not select this image. Please try a smaller image."
        );
      }
    };

  const pickVideo =
    async () => {
      try {
        const result =
          await DocumentPicker
            .getDocumentAsync({
              type: "video/*",

              copyToCacheDirectory:
                true,

              multiple: false,
            });

        if (
          result.canceled
        ) {
          return;
        }

        const asset =
          result.assets?.[0];

        const file =
          normalizeAsset(
            asset,
            "property-video.mp4",
            "video/mp4"
          );

        if (!file) {
          showAlert?.(
            "Invalid Video",
            "Could not read the selected video."
          );

          return;
        }

        setVideo(file);
      } catch (error) {
        console.error(
          "Video picker error:",
          error
        );

        showAlert?.(
          "Video Error",
          "Could not select this video. Please try a smaller file."
        );
      }
    };

  const pickProofDocument =
    async () => {
      try {
        const result =
          await DocumentPicker
            .getDocumentAsync({
              type: [
                "application/pdf",
                "image/*",
              ],

              copyToCacheDirectory:
                true,

              multiple: false,
            });

        if (
          result.canceled
        ) {
          return;
        }

        const asset =
          result.assets?.[0];

        const file =
          normalizeAsset(
            asset,
            "proof_document.pdf",
            "application/pdf"
          );

        if (!file) {
          showAlert?.(
            "Invalid Document",
            "Could not read the selected document."
          );

          return;
        }

        setProofDocument(
          file
        );
      } catch (error) {
        console.error(
          "Proof document picker error:",
          error
        );

        showAlert?.(
          "Document Error",
          "Could not select this document."
        );
      }
    };

  const pickFloorPlan =
    async () => {
      try {
        const result =
          await DocumentPicker
            .getDocumentAsync({
              type: [
                "application/pdf",
                "image/*",
              ],

              copyToCacheDirectory:
                true,

              multiple: false,
            });

        if (
          result.canceled
        ) {
          return;
        }

        const asset =
          result.assets?.[0];

        const file =
          normalizeAsset(
            asset,
            "floor_plan.pdf",
            "application/pdf"
          );

        if (!file) {
          showAlert?.(
            "Invalid Floor Plan",
            "Could not read the selected floor plan."
          );

          return;
        }

        setFloorPlan(
          file
        );
      } catch (error) {
        console.error(
          "Floor plan picker error:",
          error
        );

        showAlert?.(
          "Floor Plan Error",
          "Could not select this floor plan."
        );
      }
    };

  const pickThreeSixtyVideo =
    async () => {
      try {
        const result =
          await DocumentPicker
            .getDocumentAsync({
              type: "video/*",

              copyToCacheDirectory:
                true,

              multiple: false,
            });

        if (
          result.canceled
        ) {
          return;
        }

        const asset =
          result.assets?.[0];

        const file =
          normalizeAsset(
            asset,
            "360_video.mp4",
            "video/mp4"
          );

        if (!file) {
          showAlert?.(
            "Invalid Video",
            "Could not read the selected 360 video."
          );

          return;
        }

        setThreeSixtyVideo(
          file
        );
      } catch (error) {
        console.error(
          "360 video picker error:",
          error
        );

        showAlert?.(
          "360 Video Error",
          "Could not select this video. Please try a smaller file."
        );
      }
    };

  const resetFiles =
    () => {
      setImages({
        wholeBuilding:
          null,

        sittingRoom:
          null,

        kitchenImage:
          null,

        room:
          null,

        toiletImage:
          null,
      });

      setVideo(null);

      setProofDocument(
        null
      );

      setFloorPlan(null);

      setThreeSixtyVideo(
        null
      );
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