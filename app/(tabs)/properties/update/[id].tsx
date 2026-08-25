import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Button,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { BlurView } from "expo-blur";

import {
  Controller,
  useForm,
} from "react-hook-form";

import Navbar from "components/Navbar";
import CustomAlert from "components/CustomAlert";
import ScreenWrapper from "components/ScreenWrapper";
import Protected from "components/Protected";

import FormPicker from "components/properties/FormPicker";
import PropertyRoleVerification from "components/properties/PropertyRoleVerification";
import PropertyEnhancementUpload from "components/properties/PropertyEnhancementUpload";
import PropertyMediaUpload from "components/properties/PropertyMediaUpload";
import HouseSaleFields from "components/properties/HouseSaleFields";
import LandSaleFields from "components/properties/LandSaleFields";
import RentalFields from "components/properties/RentalFields";

import {
  usePropertyDropdowns,
} from "@/hooks/property/usePropertyDropdowns";

import {
  usePropertyFiles,
} from "@/hooks/property/usePropertyFiles";

import {
  usePropertyLocation,
} from "@/hooks/property/usePropertyLocations";

import {
  useAuth,
} from "@/context/AuthContext";

import API from "@/src/services/api";

type AdditionalFeeItem = {
  reason: string;
  amount: string;
};

type AdditionalExpenseItem = {
  description: string;
};

type ExistingMedia = {
  wholeBuilding?: string | null;
  kitchen?: string | null;
  room?: string | null;
  toilet?: string | null;
  sittingRoom?: string | null;
  video?: string | null;
  floor_plan?: string | null;
  three_sixty_video?: string | null;
};

const EMPTY_FORM = {
  user_id: "",

  propertyTypes: "",
  state_id: "",
  area_id: "",

  amount: "",
  agent_fee: "",

  buyer_agent_fee_percentage: "",
  buyer_agent_fee: "",

  seller_agent_fee_percentage: "",
  seller_agent_fee: "",

  caution_fee: "",
  legal_fee: "",
  security_fee: "",
  cleaning_fee: "",
  additional_fee: "",

  additional_fee_items: [] as AdditionalFeeItem[],
  additional_expenses: [] as AdditionalExpenseItem[],

  address: "",
  meeting_place: "",

  fence_id: "",
  listing_role_id: "",

  latitude: "",
  longitude: "",

  virtual_tour_url: "",

  /*
   * Rental / sale fields
   */
  building_id: "",
  building_type_id: "",
  buildingStatus_id: "",
  flatType_id: "",

  building_in_compound: "",
  measurement: "",

  proof_of_ownership: false,

  access_road: false,
  survey_plan: false,
  c_of_o: false,

  /*
   * Rental fields
   */
  groundfloor: false,
  firstfloor: false,
  secondfloor: false,
  thirdfloor: false,
  fourthfloor: false,

  dining: false,
  electricity: false,
  car_parking_space: false,
  kitchen: false,
  kitchen_cabinet: false,
  wardrobe: false,
  wardrobe_cabinet: false,
  compound_cleaner: false,

  suite: "",

  pop_id: "",
  typeofmeter_id: "",
  overheadtank_id: "",
  well_id: "",
  security_id: "",

  toilet: "",

  rentpaymentmethod_id: "",
};

export default function EditProperty() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const propertyId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const {
    user,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [
    loadingProperty,
    setLoadingProperty,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    loadedProperty,
    setLoadedProperty,
  ] = useState<any>(null);

  const [
    existingMedia,
    setExistingMedia,
  ] = useState<ExistingMedia>({});

  const [
    alertVisible,
    setAlertVisible,
  ] = useState(false);

  const [
    alertTitle,
    setAlertTitle,
  ] = useState("");

  const [
    alertMessage,
    setAlertMessage,
  ] = useState("");

  const [
    additionalFeeItems,
    setAdditionalFeeItems,
  ] = useState<AdditionalFeeItem[]>([
    {
      reason: "",
      amount: "",
    },
  ]);

  const [
    additionalExpenses,
    setAdditionalExpenses,
  ] = useState<
    AdditionalExpenseItem[]
  >([
    {
      description: "",
    },
  ]);

  const showAlert = (
    title: string,
    message: string
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,

    formState: {
      errors,
    },
  } = useForm({
    defaultValues: EMPTY_FORM,
  });

  const selectedPropertyType =
    Number(
      watch("propertyTypes")
    ) || 0;

  const selectedListingRoleId =
    watch("listing_role_id");

  const {
    states,
    areas,
    propertyTypes,
    listingCapacities,
    dropdowns,
    selectedBuildingType,
    selectedBuilding,
  } = usePropertyDropdowns(
    isAuthenticated,
    showAlert,
    watch
  );

  const selectedListingRole =
    listingCapacities.find(
      (item: any) =>
        String(item.id) ===
        String(
          selectedListingRoleId
        )
    );

  const selectedListingRoleName =
    String(
      selectedListingRole?.name ??
        ""
    ).toLowerCase();

  const {
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
  } = usePropertyFiles(showAlert);

  const {
    getCurrentLocation,
  } = usePropertyLocation(
    setValue,
    showAlert
  );

  const moneyToNumber = (
    value:
      | string
      | number
      | null
      | undefined
  ) => {
    const cleaned = String(
      value ?? ""
    )
      .replace(/,/g, "")
      .trim();

    const amount = Number(
      cleaned
    );

    return Number.isFinite(amount)
      ? amount
      : 0;
  };

  const formatMoney = (
    value: string | number
  ) => {
    const cleaned = String(
      value ?? ""
    ).replace(/,/g, "");

    if (!cleaned) {
      return "";
    }

    const amount =
      Number(cleaned);

    if (
      !Number.isFinite(amount)
    ) {
      return "";
    }

    return amount.toLocaleString(
      "en-NG",
      {
        maximumFractionDigits: 2,
      }
    );
  };

  const calculateAgencyFees = (
    amountValue:
      | string
      | number,
    propertyType: number
  ) => {
    const amount =
      moneyToNumber(
        amountValue
      );

    if (amount <= 0) {
      setValue(
        "agent_fee",
        ""
      );

      setValue(
        "buyer_agent_fee_percentage",
        ""
      );

      setValue(
        "buyer_agent_fee",
        ""
      );

      setValue(
        "seller_agent_fee_percentage",
        ""
      );

      setValue(
        "seller_agent_fee",
        ""
      );

      return;
    }

    /*
     * Rental.
     */
    if (
      propertyType === 1
    ) {
      const percentage = 10;

      const buyerFee =
        amount *
        (percentage / 100);

      setValue(
        "buyer_agent_fee_percentage",
        String(percentage)
      );

      setValue(
        "buyer_agent_fee",
        String(buyerFee)
      );

      setValue(
        "seller_agent_fee_percentage",
        "0"
      );

      setValue(
        "seller_agent_fee",
        "0"
      );

      /*
       * Preserve legacy field.
       */
      setValue(
        "agent_fee",
        String(buyerFee)
      );

      return;
    }

    /*
     * House sale / Land sale.
     */
    if (
      propertyType === 2 ||
      propertyType === 3
    ) {
      const buyerPercentage =
        5;

      const sellerPercentage =
        5;

      const buyerFee =
        amount *
        (buyerPercentage /
          100);

      const sellerFee =
        amount *
        (sellerPercentage /
          100);

      setValue(
        "buyer_agent_fee_percentage",
        String(
          buyerPercentage
        )
      );

      setValue(
        "buyer_agent_fee",
        String(buyerFee)
      );

      setValue(
        "seller_agent_fee_percentage",
        String(
          sellerPercentage
        )
      );

      setValue(
        "seller_agent_fee",
        String(sellerFee)
      );

      setValue(
        "agent_fee",
        String(buyerFee)
      );
    }
  };

  const handleMoneyChange = (
    text: string,
    fieldName: string
  ) => {
    const cleanValue =
      text.replace(/,/g, "");

    if (
      cleanValue !== "" &&
      !/^\d*(\.\d{0,2})?$/.test(
        cleanValue
      )
    ) {
      return;
    }

    setValue(
      fieldName as any,
      cleanValue,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );

    if (
      fieldName === "amount"
    ) {
      calculateAgencyFees(
        cleanValue,
        selectedPropertyType
      );
    }
  };

  const handleMoneyBlur = (
    fieldName: string
  ) => {
    const currentValue =
      watch(
        fieldName as any
      );

    if (!currentValue) {
      return;
    }

    const number =
      moneyToNumber(
        currentValue
      );

    if (
      !Number.isFinite(number)
    ) {
      return;
    }

    setValue(
      fieldName as any,
      number.toLocaleString(
        "en-NG",
        {
          maximumFractionDigits:
            2,
        }
      )
    );
  };

  /*
   * Handles either:
   *
   * { data: {...} }
   *
   * or directly:
   *
   * {...}
   */
  const unwrapResponse = (
    response: any
  ) => {
    if (
      response?.data?.data
    ) {
      return response.data.data;
    }

    if (response?.data) {
      return response.data;
    }

    return response;
  };

  const getProperty = async (
    id: string
  ) => {
    const api =
      API as any;

    /*
     * Preferred OHLAM service methods.
     */
    if (
      typeof api.getProperty ===
      "function"
    ) {
      return unwrapResponse(
        await api.getProperty(id)
      );
    }

    if (
      typeof api.showProperty ===
      "function"
    ) {
      return unwrapResponse(
        await api.showProperty(id)
      );
    }

    /*
     * Axios-style fallback.
     */
    if (
      typeof api.get ===
      "function"
    ) {
      return unwrapResponse(
        await api.get(
          `/properties/${id}`
        )
      );
    }

    throw new Error(
      "No property GET method exists in API service."
    );
  };

  const updatePropertyApi =
    async (
      id: string,
      formData: FormData
    ) => {
      const api =
        API as any;

      /*
       * Preferred custom API function.
       */
      if (
        typeof api.updateProperty ===
        "function"
      ) {
        return api.updateProperty(
          id,
          formData
        );
      }

      /*
       * Generic Axios-style API.
       *
       * POST + _method=PUT is used because
       * multipart PUT requests can be
       * problematic in PHP.
       */
      if (
        typeof api.post ===
        "function"
      ) {
        return api.post(
          `/properties/${id}`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );
      }

      throw new Error(
        "No property update method exists in API service."
      );
    };

  const bool = (
    value: any
  ): boolean => {
    return (
      value === true ||
      value === 1 ||
      value === "1" ||
      value === "true"
    );
  };

  const idValue = (
    value: any
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value ===
        "object" &&
      value.id !== undefined
    ) {
      return String(value.id);
    }

    return String(value);
  };

  const populateProperty =
    useCallback(
      (property: any) => {
        const rental =
          property?.rentalDetail ??
          property?.rental_detail ??
          property?.rental ??
          {};

        const houseSale =
          property?.houseSale ??
          property?.house_sale ??
          {};

        const landSale =
          property?.landSale ??
          property?.land_sale ??
          {};

        const propertyTypeId =
          property
            ?.property_type_id ??
          property
            ?.propertyType?.id ??
          property
            ?.property_type?.id ??
          "";

        const commonDetail =
          Number(
            propertyTypeId
          ) === 1
            ? rental
            : Number(
                  propertyTypeId
                ) === 2
              ? houseSale
              : landSale;

        const additionalFees =
          property
            ?.additionalFees ??
          property
            ?.additional_fees ??
          [];

        const expenses =
          property
            ?.additionalExpenses ??
          property
            ?.additional_expenses ??
          [];

        const feeRows:
          AdditionalFeeItem[] =
          additionalFees.length
            ? additionalFees.map(
                (item: any) => ({
                  reason:
                    item.reason ??
                    "",
                  amount: String(
                    item.amount ??
                      ""
                  ),
                })
              )
            : [
                {
                  reason: "",
                  amount: "",
                },
              ];

        const expenseRows:
          AdditionalExpenseItem[] =
          expenses.length
            ? expenses.map(
                (item: any) => ({
                  description:
                    item.description ??
                    "",
                })
              )
            : [
                {
                  description:
                    "",
                },
              ];

        setAdditionalFeeItems(
          feeRows
        );

        setAdditionalExpenses(
          expenseRows
        );

        reset({
          ...EMPTY_FORM,

          user_id: String(
            property.user_id ??
              user?.id ??
              ""
          ),

          propertyTypes:
            String(
              propertyTypeId
            ),

          state_id:
            idValue(
              property.state_id ??
                property.state
            ),

          area_id:
            idValue(
              property.area_id ??
                property.area
            ),

          amount:
            String(
              property.amount ??
                ""
            ),

          agent_fee:
            String(
              property.agent_fee ??
                ""
            ),

          buyer_agent_fee_percentage:
            String(
              property
                .buyer_agent_fee_percentage ??
                ""
            ),

          buyer_agent_fee:
            String(
              property
                .buyer_agent_fee ??
                ""
            ),

          seller_agent_fee_percentage:
            String(
              property
                .seller_agent_fee_percentage ??
                ""
            ),

          seller_agent_fee:
            String(
              property
                .seller_agent_fee ??
                ""
            ),

          legal_fee:
            String(
              property.legal_fee ??
                rental.legal_fee ??
                ""
            ),

          caution_fee:
            String(
              rental.caution_fee ??
                property.caution_fee ??
                ""
            ),

          security_fee:
            String(
              commonDetail
                ?.security_fee ??
                property.security_fee ??
                ""
            ),

          cleaning_fee:
            String(
              rental.cleaning_fee ??
                property.cleaning_fee ??
                ""
            ),

          additional_fee:
            String(
              property.additional_fee ??
                ""
            ),

          address:
            property.address ??
            "",

          meeting_place:
            property.meeting_place ??
            "",

          fence_id:
            idValue(
              property.fence_id ??
                property.fence
            ),

          listing_role_id:
            idValue(
              property.listing_role_id ??
                property.listingRole ??
                property.listing_role
            ),

          latitude:
            String(
              property.latitude ??
                property.lat ??
                ""
            ),

          longitude:
            String(
              property.longitude ??
                property.lng ??
                ""
            ),

          virtual_tour_url:
            property.virtual_tour_url ??
            "",

          /*
           * Shared rental / house
           * fields.
           */
          building_id:
            idValue(
              commonDetail
                ?.building_id ??
                commonDetail
                  ?.building
            ),

          building_type_id:
            idValue(
              commonDetail
                ?.building_type_id ??
                commonDetail
                  ?.buildingType ??
                commonDetail
                  ?.building_type
            ),

          /*
           * Preserve your existing
           * camel-case form field.
           */
          buildingStatus_id:
            idValue(
              houseSale
                ?.buildingStatus_id ??
                houseSale
                  ?.building_status_id ??
                houseSale
                  ?.building_statuses_id ??
                houseSale
                  ?.buildingStatus
            ),

          flatType_id:
            idValue(
              rental.flatType_id ??
                rental.flat_type_id ??
                rental.flatType
            ),

          building_in_compound:
            String(
              houseSale
                .building_in_compound ??
                ""
            ),

          measurement:
            String(
              commonDetail
                ?.measurement ??
                ""
            ),

          proof_of_ownership:
            bool(
              houseSale
                .proof_of_ownership
            ),

          access_road:
            bool(
              landSale
                .access_road
            ),

          survey_plan:
            bool(
              landSale
                .survey_plan
            ),

          c_of_o:
            bool(
              houseSale.c_of_o ??
                houseSale.cofo ??
                landSale.c_of_o ??
                landSale.cofo
            ),

          /*
           * Rental floors.
           */
          groundfloor:
            bool(
              rental.groundfloor
            ),

          firstfloor:
            bool(
              rental.firstfloor
            ),

          secondfloor:
            bool(
              rental.secondfloor
            ),

          thirdfloor:
            bool(
              rental.thirdfloor
            ),

          fourthfloor:
            bool(
              rental.fourthfloor
            ),

          /*
           * Rental facilities.
           */
          dining:
            bool(rental.dining),

          electricity:
            bool(
              rental.electricity
            ),

          car_parking_space:
            bool(
              rental
                .car_parking_space
            ),

          kitchen:
            bool(rental.kitchen),

          kitchen_cabinet:
            bool(
              rental
                .kitchen_cabinet
            ),

          wardrobe:
            bool(
              rental.wardrobe
            ),

          wardrobe_cabinet:
            bool(
              rental
                .wardrobe_cabinet
            ),

          compound_cleaner:
            bool(
              rental
                .compound_cleaner
            ),

          suite:
            String(
              rental.suite ??
                ""
            ),

          pop_id:
            idValue(
              rental.pop_id ??
                rental.pop
            ),

          typeofmeter_id:
            idValue(
              rental
                .typeofmeter_id ??
                rental
                  .typeofMeter
            ),

          overheadtank_id:
            idValue(
              rental
                .overheadtank_id ??
                rental
                  .overheadTank
            ),

          well_id:
            idValue(
              rental.well_id ??
                rental.well
            ),

          security_id:
            idValue(
              commonDetail
                ?.security_id ??
                commonDetail
                  ?.security
            ),

          toilet:
            String(
              rental.toilet ??
                ""
            ),

          rentpaymentmethod_id:
            idValue(
              rental
                .rentpaymentmethod_id ??
                rental
                  .rentpaymentMethod
            ),

          additional_fee_items:
            feeRows,

          additional_expenses:
            expenseRows,
        });

        /*
         * Keep old media visible.
         * New media selected using
         * usePropertyFiles will replace
         * individual files.
         */
        const media =
          property.media ?? {};

        setExistingMedia({
          wholeBuilding:
            media.wholeBuilding ??
            media.whole_building ??
            null,

          kitchen:
            media.kitchen ??
            null,

          room:
            media.room ??
            null,

          toilet:
            media.toilet ??
            null,

          sittingRoom:
            media.sittingRoom ??
            media.sitting_room ??
            null,

          video:
            media.video ??
            null,

          floor_plan:
            media.floor_plan ??
            null,

          three_sixty_video:
            media
              .three_sixty_video ??
            null,
        });
      },
      [
        reset,
        user?.id,
      ]
    );

  const loadProperty =
    useCallback(
      async () => {
        if (
          !propertyId ||
          !isAuthenticated
        ) {
          return;
        }

        setLoadingProperty(
          true
        );

        try {
          const property =
            await getProperty(
              propertyId
            );

          if (!property) {
            throw new Error(
              "Property not found."
            );
          }

          /*
           * Client-side ownership
           * protection.
           *
           * Laravel policy must still
           * enforce this on update.
           */
          if (
            user?.id &&
            property.user_id &&
            Number(
              property.user_id
            ) !== Number(user.id)
          ) {
            showAlert(
              "Not Allowed",
              "You cannot edit this property."
            );

            return;
          }

          setLoadedProperty(
            property
          );

          populateProperty(
            property
          );
        } catch (error: any) {
          console.error(
            "Load property error:",
            error
          );

          showAlert(
            "Unable to Load Property",
            error?.response?.data
              ?.message ??
              error?.message ??
              "The property could not be loaded."
          );
        } finally {
          setLoadingProperty(
            false
          );
        }
      },
      [
        propertyId,
        isAuthenticated,
        user?.id,
        populateProperty,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      loadProperty();
    }, [loadProperty])
  );

  useEffect(() => {
    if (
      loadedProperty
    ) {
      return;
    }

    if (user?.id) {
      setValue(
        "user_id",
        String(user.id)
      );
    }
  }, [
    user?.id,
    loadedProperty,
    setValue,
  ]);

  const updateAdditionalFeeItem =
    (
      index: number,
      field:
        keyof AdditionalFeeItem,
      value: string
    ) => {
      setAdditionalFeeItems(
        (current) => {
          const next =
            [...current];

          if (
            field === "amount"
          ) {
            const cleaned =
              value.replace(
                /,/g,
                ""
              );

            if (
              cleaned !== "" &&
              !/^\d*(\.\d{0,2})?$/.test(
                cleaned
              )
            ) {
              return current;
            }

            next[index] = {
              ...next[index],
              amount: cleaned,
            };
          } else {
            next[index] = {
              ...next[index],
              reason: value,
            };
          }

          return next;
        }
      );
    };

  const addAdditionalFeeRow =
    () => {
      setAdditionalFeeItems(
        (current) => [
          ...current,
          {
            reason: "",
            amount: "",
          },
        ]
      );
    };

  const removeAdditionalFeeRow =
    (index: number) => {
      setAdditionalFeeItems(
        (current) => {
          if (
            current.length === 1
          ) {
            return [
              {
                reason: "",
                amount: "",
              },
            ];
          }

          return current.filter(
            (_, itemIndex) =>
              itemIndex !==
              index
          );
        }
      );
    };

  const updateAdditionalExpense =
    (
      index: number,
      description: string
    ) => {
      setAdditionalExpenses(
        (current) => {
          const next =
            [...current];

          next[index] = {
            description,
          };

          return next;
        }
      );
    };

  const addAdditionalExpenseRow =
    () => {
      setAdditionalExpenses(
        (current) => [
          ...current,
          {
            description: "",
          },
        ]
      );
    };

  const removeAdditionalExpenseRow =
    (index: number) => {
      setAdditionalExpenses(
        (current) => {
          if (
            current.length === 1
          ) {
            return [
              {
                description: "",
              },
            ];
          }

          return current.filter(
            (_, itemIndex) =>
              itemIndex !==
              index
          );
        }
      );
    };

  const declaredAdditionalFee =
    moneyToNumber(
      watch(
        "additional_fee"
      )
    );

  const additionalFeeTotal =
    additionalFeeItems.reduce(
      (total, item) =>
        total +
        moneyToNumber(
          item.amount
        ),
      0
    );

  const additionalFeeMatches =
    Math.abs(
      declaredAdditionalFee -
        additionalFeeTotal
    ) < 0.01;

  /*
   * Append normal scalar value.
   */
  const appendValue = (
    formData: FormData,
    key: string,
    value: any
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return;
    }

    if (
      typeof value ===
      "boolean"
    ) {
      formData.append(
        key,
        value ? "1" : "0"
      );

      return;
    }

    formData.append(
      key,
      String(value)
    );
  };

  const appendFile = (
    formData: FormData,
    key: string,
    file: any
  ) => {
    if (!file?.uri) {
      return;
    }

    formData.append(
      key,
      {
        uri: file.uri,

        name:
          file.name ??
          `${key}-${Date.now()}`,

        type:
          file.mimeType ??
          file.type ??
          "application/octet-stream",
      } as any
    );
  };

  const submitUpdate =
    handleSubmit(
      async (data: any) => {
        if (!propertyId) {
          showAlert(
            "Invalid Property",
            "The property ID is missing."
          );

          return;
        }

        const feeRows =
          additionalFeeItems
            .map((item) => ({
              reason:
                item.reason.trim(),

              amount:
                moneyToNumber(
                  item.amount
                ),
            }))
            .filter(
              (item) =>
                item.reason !==
                  "" ||
                item.amount > 0
            );

        if (
          declaredAdditionalFee >
          0
        ) {
          if (
            feeRows.length === 0
          ) {
            showAlert(
              "Additional Fee Breakdown Required",
              "Please add the reason and amount for the additional fee."
            );

            return;
          }

          const incomplete =
            feeRows.some(
              (item) =>
                !item.reason ||
                item.amount <= 0
            );

          if (incomplete) {
            showAlert(
              "Complete Additional Fee Rows",
              "Every additional fee row must contain both a reason and an amount greater than zero."
            );

            return;
          }

          const total =
            feeRows.reduce(
              (
                sum,
                item
              ) =>
                sum +
                item.amount,
              0
            );

          if (
            Math.abs(
              total -
                declaredAdditionalFee
            ) > 0.009
          ) {
            showAlert(
              "Additional Fee Total Does Not Match",
              `The declared additional fee is ₦${formatMoney(
                declaredAdditionalFee
              )}, while the breakdown totals ₦${formatMoney(
                total
              )}.`
            );

            return;
          }
        }

        const expenseRows =
          additionalExpenses
            .map((item) => ({
              description:
                item.description.trim(),
            }))
            .filter(
              (item) =>
                item.description
                  .length > 0
            );

        setSubmitting(true);

        try {
          const formData =
            new FormData();

          /*
           * Laravel method spoofing.
           */
          formData.append(
            "_method",
            "PUT"
          );

          /*
           * General fields.
           */
          [
            "propertyTypes",
            "state_id",
            "area_id",
            "amount",
            "agent_fee",

            "buyer_agent_fee_percentage",
            "buyer_agent_fee",

            "seller_agent_fee_percentage",
            "seller_agent_fee",

            "legal_fee",
            "additional_fee",

            "address",
            "meeting_place",

            "fence_id",
            "listing_role_id",

            "latitude",
            "longitude",

            "virtual_tour_url",

            /*
             * Property-specific.
             */
            "building_id",
            "building_type_id",
            "buildingStatus_id",
            "flatType_id",

            "building_in_compound",
            "measurement",

            "suite",

            "pop_id",
            "typeofmeter_id",
            "overheadtank_id",
            "well_id",
            "security_id",

            "toilet",

            "caution_fee",
            "security_fee",
            "cleaning_fee",

            "rentpaymentmethod_id",
          ].forEach(
            (key) => {
              appendValue(
                formData,
                key,
                data[key]
              );
            }
          );

          /*
           * Boolean property fields.
           */
          [
            "proof_of_ownership",

            "access_road",
            "survey_plan",
            "c_of_o",

            "groundfloor",
            "firstfloor",
            "secondfloor",
            "thirdfloor",
            "fourthfloor",

            "dining",
            "electricity",
            "car_parking_space",
            "kitchen",
            "kitchen_cabinet",
            "wardrobe",
            "wardrobe_cabinet",
            "compound_cleaner",
          ].forEach(
            (key) => {
              appendValue(
                formData,
                key,
                Boolean(
                  data[key]
                )
              );
            }
          );

          /*
           * Additional fees.
           */
          feeRows.forEach(
            (item, index) => {
              formData.append(
                `additional_fee_items[${index}][reason]`,
                item.reason
              );

              formData.append(
                `additional_fee_items[${index}][amount]`,
                String(
                  item.amount
                )
              );
            }
          );

          /*
           * Required/customary items.
           */
          expenseRows.forEach(
            (item, index) => {
              formData.append(
                `additional_expenses[${index}][description]`,
                item.description
              );
            }
          );

          /*
           * Only append NEW files.
           *
           * If no replacement was chosen,
           * Laravel should leave the old
           * stored file untouched.
           */
          appendFile(
            formData,
            "wholeBuilding",
            images?.wholeBuilding
          );

          appendFile(
            formData,
            "sittingRoom",
            images?.sittingRoom
          );

          appendFile(
            formData,
            "kitchenImage",
            images?.kitchenImage
          );

          appendFile(
            formData,
            "room",
            images?.room
          );

          appendFile(
            formData,
            "toiletImage",
            images?.toiletImage
          );

          appendFile(
            formData,
            "video",
            video
          );

          appendFile(
            formData,
            "proof_document",
            proofDocument
          );

          appendFile(
            formData,
            "floor_plan",
            floorPlan
          );

          appendFile(
            formData,
            "three_sixty_video",
            threeSixtyVideo
          );

          const response =
            await updatePropertyApi(
              propertyId,
              formData
            );

          const responseData =
            unwrapResponse(
              response
            );

          showAlert(
            "Property Updated",
            responseData
              ?.message ??
              "Your property has been updated successfully."
          );

          /*
           * Reload to make sure
           * server state is shown.
           */
          await loadProperty();
        } catch (error: any) {
          console.error(
            "Property update error:",
            error?.response
              ?.data ??
              error
          );

          const validationErrors =
            error?.response
              ?.data?.errors;

          if (
            validationErrors &&
            typeof validationErrors ===
              "object"
          ) {
            const firstError =
              Object.values(
                validationErrors
              )
                .flat()
                .find(Boolean);

            showAlert(
              "Update Failed",
              String(
                firstError ??
                  "Please check the property information."
              )
            );
          } else {
            showAlert(
              "Update Failed",
              error?.response
                ?.data?.message ??
                error?.message ??
                "The property could not be updated."
            );
          }
        } finally {
          setSubmitting(false);
        }
      }
    );

  if (
    authLoading ||
    loadingProperty
  ) {
    return (
      <View
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="large"
        />

        <Text>
          Loading property...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Text>
          You must be logged in
          to edit this property.
        </Text>
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <Protected>
        <Navbar />

        <ImageBackground
          source={require(
            "../../../../assets/images/propertyregistration.jpg"
          )}
          resizeMode="cover"
          style={
            styles.imageBackground
          }
        >
          <BlurView
            intensity={50}
            tint="light"
            style={
              styles.blurContainer
            }
          >
            <ScrollView
              style={{
                width: "100%",
              }}
              contentContainerStyle={{
                alignItems:
                  "center",
              }}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={
                  styles.formContainer
                }
              >
                <Text
                  style={
                    styles.title
                  }
                >
                  Edit Property
                </Text>

                <Text
                  style={
                    styles.propertyReference
                  }
                >
                  Property #
                  {propertyId}
                </Text>

                <Controller
                  control={
                    control
                  }
                  name="propertyTypes"
                  rules={{
                    required:
                      "Property type is required",
                  }}
                  render={({
                    field,
                  }) => (
                    <FormPicker
                      label="Property Type"
                      items={
                        propertyTypes
                      }
                      value={
                        field.value
                      }
                      onChange={
                        field.onChange
                      }
                      error={
                        errors
                          .propertyTypes
                          ?.message
                      }
                    />
                  )}
                />

                {selectedPropertyType ===
                  1 && (
                  <RentalFields
                    control={
                      control
                    }
                    errors={
                      errors
                    }
                    dropdowns={
                      dropdowns
                    }
                    watch={
                      watch
                    }
                    setValue={
                      setValue
                    }
                    selectedBuildingType={
                      selectedBuildingType
                    }
                    selectedBuilding={
                      selectedBuilding
                    }
                    handleMoneyChange={
                      handleMoneyChange
                    }
                    handleMoneyBlur={
                      handleMoneyBlur
                    }
                  />
                )}

                {selectedPropertyType ===
                  2 && (
                  <HouseSaleFields
                    control={
                      control
                    }
                    errors={
                      errors
                    }
                    dropdowns={
                      dropdowns
                    }
                    watch={
                      watch
                    }
                    setValue={
                      setValue
                    }
                  />
                )}

                {selectedPropertyType ===
                  3 && (
                  <LandSaleFields
                    control={
                      control
                    }
                    errors={
                      errors
                    }
                    dropdowns={
                      dropdowns
                    }
                    watch={
                      watch
                    }
                    setValue={
                      setValue
                    }
                    handleMoneyChange={
                      handleMoneyChange
                    }
                    handleMoneyBlur={
                      handleMoneyBlur
                    }
                  />
                )}

                <ExistingMediaSection
                  media={
                    existingMedia
                  }
                />

                <PropertyMediaUpload
                  selectedPropertyType={
                    selectedPropertyType
                  }
                  images={
                    images
                  }
                  video={
                    video
                  }
                  pickImage={
                    pickImage
                  }
                  pickVideo={
                    pickVideo
                  }
                />

                <Controller
                  control={
                    control
                  }
                  name="state_id"
                  rules={{
                    required:
                      "State is required",
                  }}
                  render={({
                    field,
                  }) => (
                    <FormPicker
                      label="State"
                      items={
                        states ||
                        []
                      }
                      value={
                        field.value
                      }
                      onChange={
                        field.onChange
                      }
                      error={
                        errors
                          .state_id
                          ?.message
                      }
                    />
                  )}
                />

                <Controller
                  control={
                    control
                  }
                  name="area_id"
                  render={({
                    field,
                  }) => (
                    <FormPicker
                      label="Area"
                      items={
                        areas ||
                        []
                      }
                      value={
                        field.value
                      }
                      onChange={
                        field.onChange
                      }
                      error={
                        errors
                          .area_id
                          ?.message
                      }
                    />
                  )}
                />

                <Text
                  style={
                    styles.label
                  }
                >
                  Amount
                </Text>

                <Controller
                  control={
                    control
                  }
                  name="amount"
                  rules={{
                    required:
                      "Amount is required",
                  }}
                  render={({
                    field,
                  }) => (
                    <>
                      <TextInput
                        style={[
                          styles.input,
                          errors.amount &&
                            styles.inputError,
                        ]}
                        keyboardType="numeric"
                        value={String(
                          field.value ||
                            ""
                        )}
                        onChangeText={(
                          text
                        ) =>
                          handleMoneyChange(
                            text,
                            "amount"
                          )
                        }
                        onBlur={() =>
                          handleMoneyBlur(
                            "amount"
                          )
                        }
                        placeholder="Enter rental/selling amount"
                      />

                      {errors.amount && (
                        <Text
                          style={
                            styles.error
                          }
                        >
                          {
                            errors
                              .amount
                              .message as string
                          }
                        </Text>
                      )}
                    </>
                  )}
                />

                {selectedPropertyType ===
                  1 && (
                  <AgencyFeeCard
                    type="rental"
                    buyerPercentage={
                      watch(
                        "buyer_agent_fee_percentage"
                      ) ||
                      "0"
                    }
                    buyerFee={
                      watch(
                        "buyer_agent_fee"
                      ) ||
                      "0"
                    }
                    sellerPercentage="0"
                    sellerFee="0"
                    formatMoney={
                      formatMoney
                    }
                  />
                )}

                {(selectedPropertyType ===
                  2 ||
                  selectedPropertyType ===
                    3) && (
                  <AgencyFeeCard
                    type="sale"
                    buyerPercentage={
                      watch(
                        "buyer_agent_fee_percentage"
                      ) ||
                      "0"
                    }
                    buyerFee={
                      watch(
                        "buyer_agent_fee"
                      ) ||
                      "0"
                    }
                    sellerPercentage={
                      watch(
                        "seller_agent_fee_percentage"
                      ) ||
                      "0"
                    }
                    sellerFee={
                      watch(
                        "seller_agent_fee"
                      ) ||
                      "0"
                    }
                    formatMoney={
                      formatMoney
                    }
                  />
                )}

                <Text
                  style={
                    styles.label
                  }
                >
                  Legal / Tenancy
                  Agreement Fee
                </Text>

                <Controller
                  control={
                    control
                  }
                  name="legal_fee"
                  render={({
                    field,
                  }) => (
                    <TextInput
                      style={
                        styles.input
                      }
                      keyboardType="numeric"
                      placeholder="Legal / Tenancy Agreement fee"
                      value={String(
                        field.value ??
                          ""
                      )}
                      onChangeText={(
                        text
                      ) =>
                        handleMoneyChange(
                          text,
                          "legal_fee"
                        )
                      }
                      onBlur={() =>
                        handleMoneyBlur(
                          "legal_fee"
                        )
                      }
                    />
                  )}
                />

                <Text
                  style={
                    styles.subTitle
                  }
                >
                  Other Charges
                </Text>

                <Text
                  style={
                    styles.label
                  }
                >
                  Additional Fee
                </Text>

                <Controller
                  control={
                    control
                  }
                  name="additional_fee"
                  render={({
                    field,
                  }) => (
                    <TextInput
                      placeholder="Enter total additional monetary fee"
                      keyboardType="numeric"
                      style={
                        styles.input
                      }
                      value={String(
                        field.value ||
                          ""
                      )}
                      onChangeText={(
                        text
                      ) =>
                        handleMoneyChange(
                          text,
                          "additional_fee"
                        )
                      }
                      onBlur={() =>
                        handleMoneyBlur(
                          "additional_fee"
                        )
                      }
                    />
                  )}
                />

                {declaredAdditionalFee >
                  0 && (
                  <View
                    style={
                      styles.breakdownCard
                    }
                  >
                    <Text
                      style={
                        styles.breakdownTitle
                      }
                    >
                      Additional Fee
                      Breakdown
                    </Text>

                    <Text
                      style={
                        styles.helperText
                      }
                    >
                      The breakdown
                      must equal the
                      Additional Fee.
                    </Text>

                    {additionalFeeItems.map(
                      (
                        item,
                        index
                      ) => (
                        <View
                          key={`fee-${index}`}
                          style={
                            styles.feeRow
                          }
                        >
                          <TextInput
                            style={[
                              styles.input,
                              styles.feeReasonInput,
                            ]}
                            placeholder="Reason"
                            value={
                              item.reason
                            }
                            onChangeText={(
                              value
                            ) =>
                              updateAdditionalFeeItem(
                                index,
                                "reason",
                                value
                              )
                            }
                          />

                          <TextInput
                            style={[
                              styles.input,
                              styles.feeAmountInput,
                            ]}
                            placeholder="Amount"
                            keyboardType="numeric"
                            value={
                              item.amount
                            }
                            onChangeText={(
                              value
                            ) =>
                              updateAdditionalFeeItem(
                                index,
                                "amount",
                                value
                              )
                            }
                          />

                          <Button
                            title="−"
                            onPress={() =>
                              removeAdditionalFeeRow(
                                index
                              )
                            }
                          />
                        </View>
                      )
                    )}

                    <Button
                      title="+ Add Fee Row"
                      onPress={
                        addAdditionalFeeRow
                      }
                    />

                    <View
                      style={
                        styles.totalBox
                      }
                    >
                      <Text>
                        Declared:
                        {" ₦"}
                        {formatMoney(
                          declaredAdditionalFee
                        )}
                      </Text>

                      <Text>
                        Breakdown:
                        {" ₦"}
                        {formatMoney(
                          additionalFeeTotal
                        )}
                      </Text>

                      <Text
                        style={
                          additionalFeeMatches
                            ? styles.matchText
                            : styles.mismatchText
                        }
                      >
                        {additionalFeeMatches
                          ? "✓ Totals match"
                          : "Totals do not match"}
                      </Text>
                    </View>
                  </View>
                )}

                <Text
                  style={
                    styles.label
                  }
                >
                  Additional
                  Expenses / Required
                  Items
                </Text>

                <Text
                  style={
                    styles.helperText
                  }
                >
                  Add customary or
                  non-monetary
                  requirements such as
                  drinks, food,
                  materials or
                  community items.
                </Text>

                <View
                  style={
                    styles.breakdownCard
                  }
                >
                  {additionalExpenses.map(
                    (
                      item,
                      index
                    ) => (
                      <View
                        key={`expense-${index}`}
                        style={{
                          marginBottom:
                            12,
                        }}
                      >
                        <TextInput
                          style={[
                            styles.input,
                            {
                              minHeight:
                                70,
                              textAlignVertical:
                                "top",
                            },
                          ]}
                          multiline
                          value={
                            item.description
                          }
                          placeholder="Required item"
                          onChangeText={(
                            value
                          ) =>
                            updateAdditionalExpense(
                              index,
                              value
                            )
                          }
                        />

                        <Button
                          title="Remove"
                          onPress={() =>
                            removeAdditionalExpenseRow(
                              index
                            )
                          }
                        />
                      </View>
                    )
                  )}

                  <Button
                    title="+ Add Expense / Required Item"
                    onPress={
                      addAdditionalExpenseRow
                    }
                  />
                </View>

                <Text
                  style={
                    styles.label
                  }
                >
                  Address
                </Text>

                <Controller
                  control={
                    control
                  }
                  name="address"
                  rules={{
                    required:
                      "Address is required",
                  }}
                  render={({
                    field,
                  }) => (
                    <TextInput
                      style={[
                        styles.input,
                        errors.address &&
                          styles.inputError,
                      ]}
                      placeholder="Address"
                      value={
                        field.value
                      }
                      onChangeText={
                        field.onChange
                      }
                    />
                  )}
                />

                <PropertyRoleVerification
                  control={
                    control
                  }
                  errors={
                    errors
                  }
                  listingCapacity={
                    listingCapacities
                  }
                  selectedListingRoleName={
                    selectedListingRoleName
                  }
                  proofDocument={
                    proofDocument
                  }
                  pickProofDocument={
                    pickProofDocument
                  }
                />

                <PropertyEnhancementUpload
                  control={
                    control
                  }
                  floorPlan={
                    floorPlan
                  }
                  threeSixtyVideo={
                    threeSixtyVideo
                  }
                  pickFloorPlan={
                    pickFloorPlan
                  }
                  pickThreeSixtyVideo={
                    pickThreeSixtyVideo
                  }
                />

                <View
                  style={{
                    height: 20,
                  }}
                />

                <Button
                  title="Update Property GPS Location"
                  onPress={
                    getCurrentLocation
                  }
                />

                <View
                  style={{
                    height: 15,
                  }}
                />

                <Text
                  style={
                    styles.label
                  }
                >
                  Meeting Place
                </Text>

                <Controller
                  control={
                    control
                  }
                  name="meeting_place"
                  rules={{
                    required:
                      "Meeting place is required",
                  }}
                  render={({
                    field,
                  }) => (
                    <TextInput
                      placeholder="Meeting Place"
                      style={[
                        styles.input,
                        errors.meeting_place &&
                          styles.inputError,
                      ]}
                      value={
                        field.value
                      }
                      onChangeText={
                        field.onChange
                      }
                    />
                  )}
                />

                <Controller
                  control={
                    control
                  }
                  name="fence_id"
                  rules={{
                    required:
                      "Fenced is required",
                  }}
                  render={({
                    field,
                  }) => (
                    <FormPicker
                      label="Fenced"
                      items={
                        dropdowns.fences ||
                        []
                      }
                      value={
                        field.value
                      }
                      onChange={
                        field.onChange
                      }
                      error={
                        errors
                          .fence_id
                          ?.message
                      }
                    />
                  )}
                />

                <View
                  style={{
                    marginTop: 25,
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator
                      size="large"
                    />
                  ) : (
                    <Button
                      title="Save Property Changes"
                      onPress={
                        submitUpdate
                      }
                    />
                  )}
                </View>

                <View
                  style={{
                    marginTop: 12,
                  }}
                >
                  <Button
                    title="Cancel"
                    onPress={() =>
                      router.back()
                    }
                  />
                </View>
              </View>
            </ScrollView>
          </BlurView>
        </ImageBackground>

        <CustomAlert
          visible={
            alertVisible
          }
          title={
            alertTitle
          }
          message={
            alertMessage
          }
          onClose={() =>
            setAlertVisible(
              false
            )
          }
        />
      </Protected>
    </ScreenWrapper>
  );
}

/*
 * Show the currently stored media.
 * A newly selected file replaces it
 * only when the update request sends
 * that field.
 */
function ExistingMediaSection({
  media,
}: {
  media: ExistingMedia;
}) {
  const imageEntries = [
    [
      "Main Property Image",
      media.wholeBuilding,
    ],
    [
      "Sitting Room",
      media.sittingRoom,
    ],
    [
      "Kitchen",
      media.kitchen,
    ],
    [
      "Room",
      media.room,
    ],
    [
      "Toilet",
      media.toilet,
    ],
  ];

  const hasAnything =
    imageEntries.some(
      ([, uri]) => !!uri
    ) ||
    !!media.video ||
    !!media.floor_plan ||
    !!media.three_sixty_video;

  if (!hasAnything) {
    return null;
  }

  return (
    <View
      style={
        styles.existingMediaCard
      }
    >
      <Text
        style={
          styles.breakdownTitle
        }
      >
        Existing Property Media
      </Text>

      <Text
        style={
          styles.helperText
        }
      >
        Existing files are kept
        unless you select a new file
        to replace them.
      </Text>

      <View
        style={
          styles.mediaGrid
        }
      >
        {imageEntries.map(
          ([label, uri]) =>
            uri ? (
              <View
                key={label}
                style={
                  styles.mediaItem
                }
              >
                <Text
                  style={
                    styles.mediaLabel
                  }
                >
                  {label}
                </Text>

                <Image
                  source={{
                    uri,
                  }}
                  style={
                    styles.existingImage
                  }
                />
              </View>
            ) : null
        )}
      </View>

      {media.video && (
        <Text
          style={
            styles.existingFile
          }
        >
          ✓ Property video already
          uploaded
        </Text>
      )}

      {media.floor_plan && (
        <Text
          style={
            styles.existingFile
          }
        >
          ✓ Floor plan already
          uploaded
        </Text>
      )}

      {media.three_sixty_video && (
        <Text
          style={
            styles.existingFile
          }
        >
          ✓ 360° video already
          uploaded
        </Text>
      )}
    </View>
  );
}

function AgencyFeeCard({
  type,
  buyerPercentage,
  buyerFee,
  sellerPercentage,
  sellerFee,
  formatMoney,
}: any) {
  return (
    <View
      style={
        styles.feePolicyCard
      }
    >
      <Text
        style={
          styles.feePolicyTitle
        }
      >
        {type === "rental"
          ? "Agency Fee"
          : "Agency Fee Arrangement"}
      </Text>

      <View
        style={
          styles.feePolicyRow
        }
      >
        <Text>
          {type === "rental"
            ? "Tenant Rate"
            : "Buyer Rate"}
        </Text>

        <Text
          style={
            styles.feePolicyValue
          }
        >
          {buyerPercentage}%
        </Text>
      </View>

      <View
        style={
          styles.feePolicyRow
        }
      >
        <Text>
          {type === "rental"
            ? "Agency Fee"
            : "Buyer Agency Fee"}
        </Text>

        <Text
          style={
            styles.feePolicyValue
          }
        >
          ₦
          {formatMoney(
            buyerFee
          )}
        </Text>
      </View>

      {type === "sale" && (
        <>
          <View
            style={
              styles.feeDivider
            }
          />

          <View
            style={
              styles.feePolicyRow
            }
          >
            <Text>
              Seller Rate
            </Text>

            <Text
              style={
                styles.feePolicyValue
              }
            >
              {sellerPercentage}%
            </Text>
          </View>

          <View
            style={
              styles.feePolicyRow
            }
          >
            <Text>
              Seller Agency Fee
            </Text>

            <Text
              style={
                styles.feePolicyValue
              }
            >
              ₦
              {formatMoney(
                sellerFee
              )}
            </Text>
          </View>
        </>
      )}

      <Text
        style={
          styles.feePolicyNotice
        }
      >
        These are
        transaction-related agency
        fees and are not OHLAM
        service fees.
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    center: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
    },

    imageBackground: {
      flex: 1,
      width: "100%",
      minHeight: 900,
    },

    blurContainer: {
      width:
        Platform.OS === "web"
          ? "70%"
          : "94%",
      alignSelf: "center",
      borderRadius: 20,
      overflow: "hidden",
      marginVertical: 20,
    },

    formContainer: {
      width:
        Platform.OS === "web"
          ? "85%"
          : "100%",
      alignSelf: "center",
      padding: 20,
      backgroundColor:
        "rgba(15,201,65,0.15)",
      borderRadius: 10,
    },

    title: {
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 5,
    },

    propertyReference: {
      textAlign: "center",
      color: "#555",
      marginBottom: 18,
    },

    label: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
    },

    subTitle: {
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 12,
    },

    input: {
      borderWidth: 1,
      borderColor: "#E8E8E8",
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      color: "#000",
      fontSize: 16,
      backgroundColor:
        "rgba(255,255,255,0.65)",
    },

    inputError: {
      borderColor:
        "#D32F2F",
    },

    error: {
      color: "#D32F2F",
      fontSize: 13,
      marginBottom: 10,
    },

    breakdownCard: {
      borderWidth: 1,
      borderColor: "#D6D6D6",
      borderRadius: 10,
      padding: 12,
      marginBottom: 15,
      backgroundColor:
        "rgba(255,255,255,0.55)",
    },

    breakdownTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 6,
    },

    helperText: {
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 10,
      color: "#555",
    },

    feeRow: {
      marginBottom: 10,
    },

    feeReasonInput: {
      marginBottom: 5,
    },

    feeAmountInput: {
      marginBottom: 5,
    },

    totalBox: {
      marginTop: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: "#DDD",
      borderRadius: 8,
    },

    matchText: {
      color: "green",
      fontWeight: "bold",
      marginTop: 5,
    },

    mismatchText: {
      color: "red",
      fontWeight: "bold",
      marginTop: 5,
    },

    feePolicyCard: {
      borderWidth: 1,
      borderColor: "#bbf7d0",
      borderRadius: 12,
      padding: 14,
      marginBottom: 15,
      backgroundColor:
        "rgba(240,253,244,0.85)",
    },

    feePolicyTitle: {
      fontSize: 17,
      fontWeight: "900",
      color: "#166534",
      marginBottom: 10,
    },

    feePolicyRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      paddingVertical: 6,
    },

    feePolicyValue: {
      fontWeight: "900",
    },

    feeDivider: {
      borderTopWidth: 1,
      borderTopColor:
        "#d1fae5",
      marginVertical: 10,
    },

    feePolicyNotice: {
      fontSize: 12,
      lineHeight: 18,
      color: "#475569",
      marginTop: 10,
    },

    existingMediaCard: {
      borderWidth: 1,
      borderColor: "#D6D6D6",
      borderRadius: 10,
      padding: 12,
      marginVertical: 15,
      backgroundColor:
        "rgba(255,255,255,0.65)",
    },

    mediaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },

    mediaItem: {
      width: 140,
    },

    mediaLabel: {
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 4,
    },

    existingImage: {
      width: 130,
      height: 100,
      borderRadius: 8,
      marginBottom: 10,
    },

    existingFile: {
      marginTop: 7,
      fontWeight: "600",
    },
  });