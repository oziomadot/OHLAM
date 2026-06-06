import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "@/src/services/api";

type Args = {
  selectedPropertyType: number;
  selectedListingRoleName: string;
  images: any;
  video: any;
  proofDocument: any;
  floorPlan: any;
  threeSixtyVideo: any;
  reset: any;
  resetFiles: () => void;
  showAlert: (title: string, message: string) => void;
  setLoading: (value: boolean) => void;
};

export function usePropertySubmit({
  selectedPropertyType,
  selectedListingRoleName,
  images,
  video,
  proofDocument,
  floorPlan,
  threeSixtyVideo,
  reset,
  resetFiles,
  showAlert,
  setLoading,
}: Args) {
  const validateMedia = () => {
    if (selectedPropertyType === 1) {
      const required = [
        "wholeBuilding",
        "sittingRoom",
        "kitchenImage",
        "room",
        "toiletImage",
      ];

      for (const key of required) {
        if (!images[key]) {
          showAlert(
            "Missing Media",
            `Please upload ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`
          );
          return false;
        }
      }
    }

    if (selectedPropertyType === 2) {
      if (!images.wholeBuilding) {
        showAlert("Missing Image", "Please upload whole building photo.");
        return false;
      }

      if (!video) {
        showAlert("Missing Video", "Please upload property video.");
        return false;
      }
    }

    if (selectedPropertyType === 3 && !video) {
      showAlert("Missing Video", "Please upload land video.");
      return false;
    }

    return true;
  };

  const onSubmit = async (formData: any) => {
    if (!validateMedia()) return;

    if (
      ["landlord", "developer"].includes(selectedListingRoleName) &&
      !proofDocument
    ) {
      showAlert("Missing Document", "Please upload the required proof document.");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      showAlert(
        "Missing Location",
        "Please capture the GPS location of the property."
      );
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();

      Object.entries(formData).forEach(([key, val]) => {
        if (typeof val === "boolean") {
          data.append(key, val ? "1" : "0");
        } else if (val !== undefined && val !== null && typeof val !== "object") {
          data.append(key, String(val).replace(/,/g, ""));
        }
      });

      Object.entries(images).forEach(([key, file]: any) => {
        if (!file) return;

        data.append(key, {
          uri: file.uri,
          name: file.name || `${key}.jpg`,
          type: file.type || "image/jpeg",
        } as any);
      });

      if (video) {
        data.append("video", {
          uri: video.uri,
          name: video.name || "video.mp4",
          type: video.type || "video/mp4",
        } as any);
      }

      if (proofDocument) {
        data.append("proof_document", {
          uri: proofDocument.uri,
          name: proofDocument.name,
          type: proofDocument.type,
        } as any);
      }

      if (floorPlan) {
        data.append("floor_plan", {
          uri: floorPlan.uri,
          name: floorPlan.name,
          type: floorPlan.type,
        } as any);
      }

      if (threeSixtyVideo) {
        data.append("three_sixty_video", {
          uri: threeSixtyVideo.uri,
          name: threeSixtyVideo.name,
          type: threeSixtyVideo.type,
        } as any);
      }

      const res = await API.createProperty(data);

      reset();
      resetFiles();

      if (res.data.flagged) {
        showAlert(
          "Under Review",
          "This property has been flagged. Please contact management."
        );
      } else {
        showAlert("Success", res.data.message || "Property saved successfully");
      }
    } catch (err: any) {
      console.error("Upload error:", err.response?.data || err.message);

      showAlert(
        "Error",
        err.response?.data?.message ||
          "Something went wrong while saving property"
      );
    } finally {
      setLoading(false);
    }
  };

  return { onSubmit };
}