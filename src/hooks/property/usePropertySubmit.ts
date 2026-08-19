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

type AdditionalFeeItem = {
  reason: string;
  amount: string | number;
};

type AdditionalExpenseItem = {
  description: string;
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

  const moneyToNumber = (
    value: string | number | null | undefined
  ) => {
    const cleaned = String(
      value ?? ""
    )
      .replace(/,/g, "")
      .trim();

    if (!cleaned) {
      return 0;
    }

    const parsed = Number(cleaned);

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  };

  const validateAdditionalCharges = (
    formData: any
  ) => {
    const declaredAdditionalFee =
      moneyToNumber(
        formData.additional_fee
      );

    const feeItems: AdditionalFeeItem[] =
      Array.isArray(
        formData.additional_fee_items
      )
        ? formData.additional_fee_items
        : [];

    const cleanedFeeItems =
      feeItems
        .map((item) => ({
          reason: String(
            item?.reason ?? ""
          ).trim(),

          amount:
            moneyToNumber(
              item?.amount
            ),
        }))
        .filter(
          (item) =>
            item.reason !== "" ||
            item.amount > 0
        );

    if (
      declaredAdditionalFee > 0
    ) {
      if (
        cleanedFeeItems.length === 0
      ) {
        showAlert(
          "Additional Fee Breakdown Required",
          "Please provide at least one reason and amount for the additional fee."
        );

        return false;
      }

      const invalidRow =
        cleanedFeeItems.some(
          (item) =>
            !item.reason ||
            item.amount <= 0
        );

      if (invalidRow) {
        showAlert(
          "Invalid Additional Fee Row",
          "Every additional fee row must contain a reason and an amount greater than zero."
        );

        return false;
      }

      const breakdownTotal =
        cleanedFeeItems.reduce(
          (
            total,
            item
          ) =>
            total +
            item.amount,
          0
        );

      if (
        Math.abs(
          breakdownTotal -
            declaredAdditionalFee
        ) > 0.009
      ) {
        showAlert(
          "Additional Fee Total Does Not Match",
          `The declared additional fee is ₦${declaredAdditionalFee.toLocaleString(
            "en-NG"
          )}, but the breakdown total is ₦${breakdownTotal.toLocaleString(
            "en-NG"
          )}.`
        );

        return false;
      }
    } else if (
      cleanedFeeItems.length > 0
    ) {
      showAlert(
        "Additional Fee Is Missing",
        "You entered additional fee rows, but the Additional Fee total is zero."
      );

      return false;
    }

    return true;
  };

  const validateMedia = () => {
    if (
      selectedPropertyType === 1
    ) {
      const required = [
        "wholeBuilding",
        "sittingRoom",
        "kitchenImage",
        "room",
        "toiletImage",
      ];

      for (
        const key of required
      ) {
        if (
          !hasFile(
            images?.[key]
          )
        ) {
          showAlert(
            "Missing Media",
            `Please upload ${key
              .replace(
                /([A-Z])/g,
                " $1"
              )
              .toLowerCase()}`
          );

          return false;
        }
      }
    }

    if (
      selectedPropertyType === 2
    ) {
      const hasImage =
        hasFile(
          images?.wholeBuilding
        );

      const hasVideo =
        hasFile(video);

      if (
        !hasImage &&
        !hasVideo
      ) {
        showAlert(
          "Missing Property Media",
          "Please upload at least one property image or one property video."
        );

        return false;
      }
    }

    if (
      selectedPropertyType === 3
    ) {
      const hasImage =
        hasFile(
          images?.wholeBuilding
        );

      const hasVideo =
        hasFile(video);

      if (
        !hasImage &&
        !hasVideo
      ) {
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

  const appendAdditionalFeeItems = (
    data: FormData,
    items: AdditionalFeeItem[]
  ) => {
    items
      .map((item) => ({
        reason: String(
          item?.reason ?? ""
        ).trim(),

        amount:
          moneyToNumber(
            item?.amount
          ),
      }))
      .filter(
        (item) =>
          item.reason !== "" ||
          item.amount > 0
      )
      .forEach(
        (
          item,
          index
        ) => {
          data.append(
            `additional_fee_items[${index}][reason]`,
            item.reason
          );

          data.append(
            `additional_fee_items[${index}][amount]`,
            String(
              item.amount
            )
          );
        }
      );
  };

  const appendAdditionalExpenses = (
    data: FormData,
    items: AdditionalExpenseItem[]
  ) => {
    items
      .map((item) => ({
        description:
          String(
            item?.description ??
              ""
          ).trim(),
      }))
      .filter(
        (item) =>
          item.description !== ""
      )
      .forEach(
        (
          item,
          index
        ) => {
          data.append(
            `additional_expenses[${index}][description]`,
            item.description
          );
        }
      );
  };

  const onSubmit = async (
    formData: any
  ) => {
    if (
      !validateMedia()
    ) {
      return;
    }

    if (
      !validateAdditionalCharges(
        formData
      )
    ) {
      return;
    }

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
       * Normal scalar fields only.
       *
       * Arrays are appended separately below.
       */
      Object.entries(
        formData
      ).forEach(
        ([key, val]) => {
          if (
            key ===
              "additional_fee_items" ||
            key ===
              "additional_expenses"
          ) {
            return;
          }

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

      appendAdditionalFeeItems(
        data,
        Array.isArray(
          formData.additional_fee_items
        )
          ? formData.additional_fee_items
          : []
      );

      appendAdditionalExpenses(
        data,
        Array.isArray(
          formData.additional_expenses
        )
          ? formData.additional_expenses
          : []
      );

      Object.entries(
        images || {}
      ).forEach(
        ([key, file]: any) => {
          if (
            !hasFile(file)
          ) {
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

      if (
        hasFile(video)
      ) {
        appendFile(
          data,
          "video",
          video,
          "property-video.mp4",
          "video/mp4"
        );
      }

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

      /*
       * Useful while wiring Laravel.
       * Remove later if you no longer need it.
       */
      if (__DEV__) {
        console.log(
          "PROPERTY ADDITIONAL FEES:",
          formData
            .additional_fee_items
        );

        console.log(
          "PROPERTY ADDITIONAL EXPENSES:",
          formData
            .additional_expenses
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
    } catch (
      err: any
    ) {
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