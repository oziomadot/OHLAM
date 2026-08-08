import API from "@/src/services/api";
import { router } from "expo-router";

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
  const hasFile = (file: any) => {
    if (!file) return false;

    return Boolean(
      file.uri ||
      file.name
    );
  };

  const validateMedia = () => {
    /*
     * RENTAL
     *
     * Keep your existing rule:
     * all required rental images must exist.
     */
    if (selectedPropertyType === 1) {
      const required = [
        "wholeBuilding",
        "sittingRoom",
        "kitchenImage",
        "room",
        "toiletImage",
      ];

      for (const key of required) {
        if (!hasFile(images?.[key])) {
          showAlert(
            "Missing Media",
            `Please upload ${key
              .replace(/([A-Z])/g, " $1")
              .toLowerCase()}`
          );

          return false;
        }
      }
    }

    /*
     * HOUSE FOR SALE
     *
     * Image OR video is required.
     * Both are allowed.
     */
    if (selectedPropertyType === 2) {
      const hasImage =
        hasFile(images?.wholeBuilding);

      const hasVideo =
        hasFile(video);

      if (!hasImage && !hasVideo) {
        showAlert(
          "Missing Property Media",
          "Please upload at least one property image or one property video."
        );

        return false;
      }
    }

    /*
     * LAND FOR SALE
     *
     * Image OR video is required.
     * Both are allowed.
     */
    if (selectedPropertyType === 3) {
      const hasImage =
        hasFile(images?.wholeBuilding);

      const hasVideo =
        hasFile(video);

      if (!hasImage && !hasVideo) {
        showAlert(
          "Missing Land Media",
          "Please upload at least one image of the land or one land video."
        );

        return false;
      }
    }

    return true;
  };

  const appendFile = (
    data: FormData,
    fieldName: string,
    file: any,
    defaultName: string,
    defaultType: string
  ) => {
    if (!file) return;

    /*
     * Web:
     * if this is an actual File object,
     * append it directly.
     */
    if (
      typeof File !== "undefined" &&
      file instanceof File
    ) {
      data.append(
        fieldName,
        file
      );

      return;
    }

    /*
     * Android / iOS / Expo:
     * React Native FormData expects:
     * uri, name, type
     */
    if (!file.uri) {
      return;
    }

    data.append(
      fieldName,
      {
        uri: file.uri,
        name:
          file.name ||
          defaultName,

        type:
          file.type ||
          defaultType,
      } as any
    );
  };

  const onSubmit = async (formData: any) => {
    if (!validateMedia()) {
      return;
    }

    /*
     * Landlords and developers still require
     * their supporting proof document.
     */
    if (
      [
        "landlord",
        "developer",
      ].includes(
        selectedListingRoleName
      ) &&
      !proofDocument
    ) {
      showAlert(
        "Missing Document",
        "Please upload the required proof document."
      );

      return;
    }

    if (
      !formData.latitude ||
      !formData.longitude
    ) {
      showAlert(
        "Missing Location",
        "Please capture the GPS location of the property."
      );

      return;
    }

    setLoading(true);

    try {
      const data =
        new FormData();

      /*
       * Append normal form fields.
       */
      Object.entries(
        formData
      ).forEach(
        ([key, val]) => {
          if (
            typeof val ===
            "boolean"
          ) {
            data.append(
              key,
              val ? "1" : "0"
            );

            return;
          }

          if (
            val === undefined ||
            val === null ||
            typeof val ===
              "object"
          ) {
            return;
          }

          data.append(
            key,
            String(val)
              .replace(
                /,/g,
                ""
              )
          );
        }
      );

      /*
       * Append all selected images.
       *
       * No else-if here:
       * image and video may both exist.
       */
      Object.entries(
        images || {}
      ).forEach(
        ([key, file]: any) => {
          if (!hasFile(file)) {
            return;
          }

          appendFile(
            data,
            key,
            file,
            `${key}.jpg`,
            "image/jpeg"
          );
        }
      );

      /*
       * Append main property video independently.
       *
       * Therefore:
       * image only  -> image uploaded
       * video only  -> video uploaded
       * both        -> both uploaded
       */
      if (hasFile(video)) {
        appendFile(
          data,
          "video",
          video,
          "property-video.mp4",
          "video/mp4"
        );
      }

      /*
       * Private proof document.
       */
      if (
        hasFile(
          proofDocument
        )
      ) {
        appendFile(
          data,
          "proof_document",
          proofDocument,
          "proof_document.pdf",
          proofDocument?.type ||
            "application/pdf"
        );
      }

      /*
       * Optional floor plan.
       */
      if (
        hasFile(
          floorPlan
        )
      ) {
        appendFile(
          data,
          "floor_plan",
          floorPlan,
          "floor_plan.pdf",
          floorPlan?.type ||
            "application/pdf"
        );
      }

      /*
       * Optional 360 video.
       */
      if (
        hasFile(
          threeSixtyVideo
        )
      ) {
        appendFile(
          data,
          "three_sixty_video",
          threeSixtyVideo,
          "360_video.mp4",
          "video/mp4"
        );
      }

      const res =
        await API.createProperty(
          data
        );

      reset();
      resetFiles();

      if (
        res.flagged ||
        res.under_investigation
      ) {
        showAlert(
          "Under Review",
          res.message ||
            "This property requires review."
        );

        router.replace(
          "/(tabs)/dashboard"
        );

        return;
      }

      showAlert(
        "Success",
        res.message ||
          "Property saved successfully"
      );

      router.replace(
        "/(tabs)/dashboard"
      );
    } catch (err: any) {
      const responseData =
        err.response?.data;

      console.error(
        "Upload error:",
        responseData ||
          err.message ||
          err
      );

      const validationErrors =
        responseData?.errors;

      const firstErrorMessage =
        validationErrors
          ? Object.values(
              validationErrors
            ).flat()[0]
          : null;

      showAlert(
        "Error",
        String(
          firstErrorMessage ||
            responseData?.message ||
            err.message ||
            "Something went wrong while saving property"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    onSubmit,
  };
}