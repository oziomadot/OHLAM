import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ImageBackground,
  Linking,
} from "react-native";
import { BlurView } from "expo-blur";
import { useForm, Controller } from "react-hook-form";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Navbar from "components/Navbar";
import CustomAlert from "components/CustomAlert";
import { useAuth } from "@/context/AuthContext";
import ScreenWrapper from "components/ScreenWrapper";
import Protected from "components/Protected";
import FormPicker from "components/properties/FormPicker";
import PropertyRoleVerification from "components/properties/PropertyRoleVerification";
import PropertyEnhancementUpload from "components/properties/PropertyEnhancementUpload";
import { usePropertyDropdowns } from "@/hooks/property/usePropertyDropdowns";
import { usePropertyFiles } from "@/hooks/property/usePropertyFiles";
import { usePropertyLocation } from "@/hooks/property/usePropertyLocations";
import { usePropertySubmit } from "@/hooks/property/usePropertySubmit";
import PropertyMediaUpload from "components/properties/PropertyMediaUpload";
import HouseSaleFields from "components/properties/HouseSaleFields";
import LandSaleFields from "components/properties/LandSaleFields";
import RentalFields from "components/properties/RentalFields";



type AdditionalFeeItem = {
  reason: string;
  amount: string;
};

type AdditionalExpenseItem = {
  description: string;
};

const CreateProperty = () => {


 const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [additionalFeeItems, setAdditionalFeeItems] = useState<AdditionalFeeItem[]>([
    { reason: "", amount: "" },
  ]);

  const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpenseItem[]>([
    { description: "" },
  ]);

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  
 const handleMoneyChange = (text: string, fieldName: string) => {
  const cleanValue = text.replace(/,/g, "");

  if (isNaN(Number(cleanValue))) return;

  setValue(fieldName as any, cleanValue);

 const calculateAgencyFees = (
  amountValue: string | number,
  propertyType: number
) => {
  const amount = Number(
    String(amountValue || "").replace(/,/g, "")
  );

  if (!Number.isFinite(amount) || amount <= 0) {
    setValue("agent_fee", "");
    setValue("buyer_agent_fee_percentage", "");
    setValue("buyer_agent_fee", "");
    setValue("seller_agent_fee_percentage", "");
    setValue("seller_agent_fee", "");
    return;
  }

  /*
   * Property types:
   *
   * 1 = Rental
   * 2 = House Sale
   * 3 = Land Sale
   */

  if (propertyType === 1) {
    const tenantPercentage = 10;
    const tenantFee =
      amount * (tenantPercentage / 100);

    setValue(
      "buyer_agent_fee_percentage",
      String(tenantPercentage)
    );

    setValue(
      "buyer_agent_fee",
      String(tenantFee)
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
     * Keep legacy field for now.
     */
    setValue(
      "agent_fee",
      String(tenantFee)
    );

    return;
  }

  if (
    propertyType === 2 || propertyType === 3
  ) {
    const buyerPercentage = 5;
    const sellerPercentage = 5;

    const buyerFee = amount * (buyerPercentage / 100);

    const sellerFee = amount * (sellerPercentage / 100);

    setValue("buyer_agent_fee_percentage", String(buyerPercentage));

    setValue("buyer_agent_fee", String(buyerFee));

    setValue("seller_agent_fee_percentage", String(sellerPercentage));

    setValue("seller_agent_fee", String(sellerFee));

    /*
     * Legacy field:
     * customer-facing side for compatibility.
     */
    setValue("agent_fee", String(buyerFee));
  }
};
};

  const handleMoneyBlur = (fieldName: string) => {
  const currentValue = watch(fieldName as any);
  if (!currentValue) return;

  const formatted = String(currentValue).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  setValue(fieldName as any, formatted);
};

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
  user_id: user?.id || "",
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

  access_road: false,
  survey_plan: false,
  c_of_o: false,
},
  });

  const selectedPropertyType = parseInt(watch("propertyTypes"), 10);
  const selectedListingRoleId = watch("listing_role_id");

  const {
    states,
    areas,
    propertyTypes,
    listingCapacities,
    dropdowns,
    selectedBuildingType,
    selectedBuilding,
  } = usePropertyDropdowns(isAuthenticated, showAlert, watch);

  const selectedListingRole = listingCapacities.find(
    (s) => String(s.id) === String(selectedListingRoleId)
  );


  

  const selectedListingRoleName = String(selectedListingRole?.name || "").toLowerCase();

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
    resetFiles,
  } = usePropertyFiles(showAlert);

  const { getCurrentLocation } = usePropertyLocation(setValue, showAlert);


  const moneyToNumber = (value: string | number | null | undefined) => {
    const cleaned = String(value ?? "").replace(/,/g, "").trim();
    const amount = Number(cleaned);
    return Number.isFinite(amount) ? amount : 0;
  };

  const formatMoney = (value: string | number) => {
    const cleaned = String(value ?? "").replace(/,/g, "");
    if (!cleaned) return "";

    const amount = Number(cleaned);
    if (!Number.isFinite(amount)) return "";

    return amount.toLocaleString("en-NG", {
      maximumFractionDigits: 2,
    });
  };

  const additionalFeeTotal = additionalFeeItems.reduce(
    (total, item) => total + moneyToNumber(item.amount),
    0
  );

  const declaredAdditionalFee = moneyToNumber(watch("additional_fee"));

  const additionalFeeMatches =
    declaredAdditionalFee === 0
      ? additionalFeeTotal === 0
      : additionalFeeTotal === declaredAdditionalFee;

  const updateAdditionalFeeItem = (
    index: number,
    field: keyof AdditionalFeeItem,
    value: string
  ) => {
    setAdditionalFeeItems((current) => {
      const next = [...current];

      if (field === "amount") {
        const cleaned = value.replace(/,/g, "");

        if (cleaned !== "" && !/^\d*(\.\d{0,2})?$/.test(cleaned)) {
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
    });
  };

  const addAdditionalFeeRow = () => {
    setAdditionalFeeItems((current) => [
      ...current,
      { reason: "", amount: "" },
    ]);
  };

  const removeAdditionalFeeRow = (index: number) => {
    setAdditionalFeeItems((current) => {
      if (current.length === 1) {
        return [{ reason: "", amount: "" }];
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const updateAdditionalExpense = (index: number, description: string) => {
    setAdditionalExpenses((current) => {
      const next = [...current];
      next[index] = { description };
      return next;
    });
  };

  const addAdditionalExpenseRow = () => {
    setAdditionalExpenses((current) => [
      ...current,
      { description: "" },
    ]);
  };

  const removeAdditionalExpenseRow = (index: number) => {
    setAdditionalExpenses((current) => {
      if (current.length === 1) {
        return [{ description: "" }];
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  useEffect(() => {
    setValue(
      "additional_fee_items",
      additionalFeeItems
        .map((item) => ({
          reason: item.reason.trim(),
          amount: String(moneyToNumber(item.amount)),
        }))
        .filter(
          (item) =>
            item.reason.length > 0 ||
            moneyToNumber(item.amount) > 0
        )
    );
  }, [additionalFeeItems, setValue]);

  useEffect(() => {
    setValue(
      "additional_expenses",
      additionalExpenses
        .map((item) => ({
          description: item.description.trim(),
        }))
        .filter((item) => item.description.length > 0)
    );
  }, [additionalExpenses, setValue]);

  const { onSubmit } = usePropertySubmit({



    
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
  });

  
const submitProperty = handleSubmit(async (data) => {
  const additionalFee = moneyToNumber(data.additional_fee);

  const feeRows = additionalFeeItems
    .map((item) => ({
      reason: item.reason.trim(),
      amount: moneyToNumber(item.amount),
    }))
    .filter((item) => item.reason.length > 0 || item.amount > 0);

  if (additionalFee > 0) {
    if (feeRows.length === 0) {
      showAlert(
        "Additional Fee Breakdown Required",
        "Please add at least one reason and amount for the additional fee."
      );
      return;
    }

    const incompleteRow = feeRows.some(
      (item) => !item.reason || item.amount <= 0
    );

    if (incompleteRow) {
      showAlert(
        "Complete Additional Fee Rows",
        "Every additional fee row must have both a reason and an amount greater than zero."
      );
      return;
    }

    const rowTotal = feeRows.reduce(
      (total, item) => total + item.amount,
      0
    );

    if (Math.abs(rowTotal - additionalFee) > 0.009) {
      showAlert(
        "Additional Fee Total Does Not Match",
        `The additional fee is ₦${formatMoney(additionalFee)}, but the breakdown totals ₦${formatMoney(rowTotal)}. Please correct the amounts before submitting.`
      );
      return;
    }
  } else {
    const hasFeeRowValue = feeRows.some(
      (item) => item.reason || item.amount > 0
    );

    if (hasFeeRowValue) {
      showAlert(
        "Additional Fee Is Missing",
        "You entered an additional fee breakdown, but the Additional Fee total is zero. Enter the total additional fee or remove the breakdown rows."
      );
      return;
    }
  }

  const expenseRows = additionalExpenses
    .map((item) => ({
      description: item.description.trim(),
    }))
    .filter((item) => item.description.length > 0);

  data.additional_fee_items = feeRows.map((item) => ({
    reason: item.reason,
    amount: String(item.amount),
  }));

  data.additional_expenses = expenseRows;

  if (
    selectedPropertyType === 2 ||
    selectedPropertyType === 3
  ) {
    const hasImage =
      !!images?.wholeBuilding?.uri;

    const hasVideo =
      !!video &&
      (
        !!video.uri ||
        !!video.name
      );

    if (!hasImage && !hasVideo) {
      showAlert(
        "Property Media Required",
        selectedPropertyType === 3
          ? "Please upload at least one image of the land or one land video."
          : "Please upload at least one property image or one property video."
      );

      return;
    }
  }

  await onSubmit(data);
});

  useEffect(() => {
  const checkAccess = async () => {
    if (authLoading) return;

    if (isAuthenticated) {
      setCheckingAccess(false);
      return;
    }

    const hasRegisteredBefore = await AsyncStorage.getItem("has_registered_before");

    if (hasRegisteredBefore === "yes") {
      router.replace("/auth/LoginScreen");
    } else {
      router.replace("/auth/RegisterScreen");
    }

    setCheckingAccess(false);
  };

  checkAccess();
}, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (user?.id) {
      setValue("user_id", user.id);
      console.log("User ID set:", user.id);
    }
  }, [user?.id]);

  if (authLoading || checkingAccess || !isAuthenticated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Checking authentication...</Text>
      </View>
    );
  }
  return (
    <ScreenWrapper>
      <Protected>
        <Navbar />

        <ImageBackground
          source={require("../../../assets/images/propertyregistration.jpg")}
          resizeMode="cover"
          style={styles.imageBackground}
        >
          <BlurView intensity={50} tint="light" style={styles.blurContainer}>
            <View style={styles.formContainer}>
              <Text style={styles.title}>Add New Property</Text>

             <Controller
  control={control}
  name="propertyTypes"
  rules={{ required: "Property type is required" }}
  render={({ field }) => (
    <FormPicker
      label="Property Type"
      items={propertyTypes}
      value={field.value}
      onChange={field.onChange}
      error={errors.propertyTypes?.message}
    />
  )}
/>


 {/* Property-specific fields can be added here based on selectedPropertyType */}

{selectedPropertyType === 1 && (
  <RentalFields
    control={control}
    errors={errors}
    dropdowns={dropdowns}
    watch={watch}
    setValue={setValue}
    selectedBuildingType={selectedBuildingType}
    selectedBuilding={selectedBuilding}
    handleMoneyChange={handleMoneyChange}
    handleMoneyBlur={handleMoneyBlur}
  />
)}

{selectedPropertyType === 2 && (
  <HouseSaleFields
    control={control}
    errors={errors}
    dropdowns={dropdowns}
    watch={watch}
    setValue={setValue}
  />
)}

{selectedPropertyType === 3 && (
  <LandSaleFields
    control={control}
    errors={errors}
    dropdowns={dropdowns}
    watch={watch}
    setValue={setValue}
    handleMoneyChange={handleMoneyChange}
    handleMoneyBlur={handleMoneyBlur}
  />
)}

<PropertyMediaUpload
  selectedPropertyType={selectedPropertyType}
  images={images}
  video={video}
  pickImage={pickImage}
  pickVideo={pickVideo}
/>

              <Controller
                control={control}
                name="state_id"
                rules={{ required: "State is required" }}
                render={({ field }) => (
                  <FormPicker
                    label="State"
                    items={states || []}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.state_id?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="area_id"
                render={({ field }) => (
                  <FormPicker
                    label="Area"
                    items={areas || []}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.area_id?.message}
                  />
                )}
              />

              <Text style={styles.label}>Amount</Text>
              <Controller
                control={control}
                rules={{ required: "Amount is required" }}
                name="amount"
                render={({ field }) => (
                  <>
                    <TextInput
                      style={[styles.input, errors.amount && styles.inputError]}
                      keyboardType="numeric"
                      value={String(field.value || "")}
                      onChangeText={(text) => handleMoneyChange(text, "amount")}
                      onBlur={() => handleMoneyBlur("amount")}
                      placeholder="Enter the Rental/Selling amount"
                    />
                    {errors.amount && (
                      <Text style={styles.error}>{errors.amount.message}</Text>
                    )}
                  </>
                )}
              />

              {selectedPropertyType === 1 && (
  <View style={styles.feePolicyCard}>
    <Text style={styles.feePolicyTitle}>
      Agency Fee
    </Text>

    <Text style={styles.feePolicyText}>
      Tenant / Renter
    </Text>

    <View style={styles.feePolicyRow}>
      <Text style={styles.feePolicyLabel}>
        Percentage
      </Text>

      <Text style={styles.feePolicyValue}>
        {watch("buyer_agent_fee_percentage") || "0"}%
      </Text>
    </View>

    <View style={styles.feePolicyRow}>
      <Text style={styles.feePolicyLabel}>
        Estimated Agency Fee
      </Text>

      <Text style={styles.feePolicyValue}>
        ₦{formatMoney(
          watch("buyer_agent_fee") || 0
        )}
      </Text>
    </View>

    <Text style={styles.feePolicyNotice}>
      The agency fee is shown separately from rent
      and is not an OHLAM fee.
    </Text>
  </View>
)}


{(
  selectedPropertyType === 2 ||
  selectedPropertyType === 3
) && (
  <View style={styles.feePolicyCard}>
    <Text style={styles.feePolicyTitle}>
      Agency Fee Arrangement
    </Text>

    <Text style={styles.feePolicySection}>
      Buyer
    </Text>

    <View style={styles.feePolicyRow}>
      <Text style={styles.feePolicyLabel}>
        Buyer Rate
      </Text>

      <Text style={styles.feePolicyValue}>
        {watch("buyer_agent_fee_percentage") || "0"}%
      </Text>
    </View>

    <View style={styles.feePolicyRow}>
      <Text style={styles.feePolicyLabel}>
        Buyer Agency Fee
      </Text>

      <Text style={styles.feePolicyValue}>
        ₦{formatMoney(
          watch("buyer_agent_fee") || 0
        )}
      </Text>
    </View>

    <View style={styles.feeDivider} />

    <Text style={styles.feePolicySection}>
      Seller
    </Text>

    <View style={styles.feePolicyRow}>
      <Text style={styles.feePolicyLabel}>
        Seller Rate
      </Text>

      <Text style={styles.feePolicyValue}>
        {watch("seller_agent_fee_percentage") || "0"}%
      </Text>
    </View>

    <View style={styles.feePolicyRow}>
      <Text style={styles.feePolicyLabel}>
        Seller Agency Fee
      </Text>

      <Text style={styles.feePolicyValue}>
        ₦{formatMoney(
          watch("seller_agent_fee") || 0
        )}
      </Text>
    </View>

    <Text style={styles.feePolicyNotice}>
      Buyer and seller agency fees are displayed
      separately. These are transaction-related
      agency fees and are not OHLAM service fees.
    </Text>
  </View>
)}


              <Text style={styles.label}>Legal / Tenancy Agreement fee</Text>
              <Controller
                control={control}
                name="legal_fee"
                render={({ field }) => (
                  <TextInput
                    placeholder="Legal / Tenancy Agreement fee"
                    keyboardType="numeric"
                      style={styles.input}
                      value={field.value}
                      onChangeText={(text) =>
                        handleMoneyChange(text, "legal_fee")
                      }
                      onBlur={() => handleMoneyBlur("legal_fee")}
                    />
                  )}
                
              />

              <Text style={styles.subTitle}>Other Charges</Text>

<Text style={styles.label}>Additional Fee</Text>

<Controller
  control={control}
  name="additional_fee"
  render={({ field }) => (
    <TextInput
      placeholder="Enter total additional monetary fee"
      keyboardType="numeric"
      style={styles.input}
      value={String(field.value || "")}
      onChangeText={(text) =>
        handleMoneyChange(text, "additional_fee")
      }
      onBlur={() => handleMoneyBlur("additional_fee")}
    />
  )}
/>

{declaredAdditionalFee > 0 && (
  <View style={styles.breakdownCard}>
    <Text style={styles.breakdownTitle}>
      Additional Fee Breakdown
    </Text>

    <Text style={styles.helperText}>
      Explain every monetary charge. The total below must equal the
      Additional Fee above.
    </Text>

    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.reasonColumn]}>
        Reason
      </Text>
      <Text style={[styles.tableHeaderText, styles.amountColumn]}>
        Amount (₦)
      </Text>
      <View style={styles.actionColumn} />
    </View>

    {additionalFeeItems.map((item, index) => (
      <View key={`fee-${index}`} style={styles.tableRow}>
        <TextInput
          style={[styles.tableInput, styles.reasonColumn]}
          placeholder="e.g. Estate development levy"
          value={item.reason}
          onChangeText={(value) =>
            updateAdditionalFeeItem(index, "reason", value)
          }
          maxLength={255}
        />

        <TextInput
          style={[styles.tableInput, styles.amountColumn]}
          placeholder="0"
          keyboardType="numeric"
          value={item.amount ? formatMoney(item.amount) : ""}
          onChangeText={(value) =>
            updateAdditionalFeeItem(index, "amount", value)
          }
        />

        <View style={styles.actionColumn}>
          <Button
            title="−"
            onPress={() => removeAdditionalFeeRow(index)}
          />
        </View>
      </View>
    ))}

    <View style={styles.rowButton}>
      <Button
        title="+ Add Fee Row"
        onPress={addAdditionalFeeRow}
      />
    </View>

    <View style={styles.totalBox}>
      <Text style={styles.totalText}>
        Declared Additional Fee: ₦{formatMoney(declaredAdditionalFee)}
      </Text>
      <Text style={styles.totalText}>
        Breakdown Total: ₦{formatMoney(additionalFeeTotal)}
      </Text>

      <Text
        style={
          additionalFeeMatches
            ? styles.matchText
            : styles.mismatchText
        }
      >
        {additionalFeeMatches
          ? "✓ The fee breakdown matches the declared additional fee."
          : `Difference: ₦${formatMoney(
              Math.abs(declaredAdditionalFee - additionalFeeTotal)
            )}`}
      </Text>
    </View>

    <View style={styles.feeNotice}>
      <Text style={styles.feeNoticeTitle}>
        About additional monetary charges
      </Text>

      <Text style={styles.feeNoticeText}>
        Additional charges are declared by the property lister and are
        not OHLAM fees. OHLAM has not independently determined that a
        charge is legally required. Buyers and renters should review each
        charge before agreeing to pay.
      </Text>
    </View>
  </View>
)}

<Text style={styles.label}>Additional Expenses / Required Items</Text>

<Text style={styles.helperText}>
  Add non-monetary or customary items the buyer or renter is expected
  to provide. Examples: drinks, food items, materials, Nri Ala,
  community/customary requirements, or similar obligations. Do not put
  a guessed money value here when the requirement is normally provided
  as an item.
</Text>

<View style={styles.breakdownCard}>
  {additionalExpenses.map((item, index) => (
    <View key={`expense-${index}`} style={styles.expenseRow}>
      <TextInput
        style={[styles.input, styles.expenseInput]}
        placeholder="e.g. 2 cartons of drinks for customary land process"
        value={item.description}
        onChangeText={(value) =>
          updateAdditionalExpense(index, value)
        }
        multiline
        maxLength={500}
      />

      <View style={styles.expenseRemoveButton}>
        <Button
          title="Remove"
          onPress={() => removeAdditionalExpenseRow(index)}
        />
      </View>
    </View>
  ))}

  <Button
    title="+ Add Expense / Required Item"
    onPress={addAdditionalExpenseRow}
  />
</View>

              <Text style={styles.label}>Address</Text>
              <Controller
                control={control}
                name="address"
                rules={{ required: "Address is required" }}
                render={({ field }) => (
                  <>
                    <TextInput
                      placeholder="Address"
                      style={[styles.input, errors.address && styles.inputError]}
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                    {errors.address && (
                      <Text style={styles.error}>{errors.address.message}</Text>
                    )}
                  </>
                )}
              />


<PropertyRoleVerification
  control={control}
  errors={errors}
  listingCapacity={listingCapacities}
  selectedListingRoleName={selectedListingRoleName}
  proofDocument={proofDocument}
  pickProofDocument={pickProofDocument}
/>


<PropertyEnhancementUpload
  control={control}
  floorPlan={floorPlan}
  threeSixtyVideo={threeSixtyVideo}
  pickFloorPlan={pickFloorPlan}
  pickThreeSixtyVideo={pickThreeSixtyVideo}
/>

<View style={{ height: 20 }} />

<Button title="Capture Property GPS Location" onPress={getCurrentLocation} />
              <Text style={styles.label}>Meeting Place</Text>
              <Controller
                control={control}
                name="meeting_place"
                rules={{ required: "Meeting place is required" }}
                render={({ field }) => (
                  <>
                    <TextInput
                      placeholder="Meeting Place"
                      style={[
                        styles.input,
                        errors.meeting_place && styles.inputError,
                      ]}
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                    {errors.meeting_place && (
                      <Text style={styles.error}>
                        {errors.meeting_place.message}
                      </Text>
                    )}
                  </>
                )}
              />

              <Controller
                control={control}
                name="fence_id"
                rules={{ required: "Fenced is required" }}
                render={({ field }) => (
                  <FormPicker
                    label="Fenced"
                    items={dropdowns.fences || []}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.fence_id?.message}
                  />
                )}
              />

             
              <View style={{ marginTop: 20 }}>
                <Button
                  title="Submit Property"
                  onPress={submitProperty}
                  disabled={loading}
                />
              </View>
              </View>
          </BlurView>
        </ImageBackground>
      

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
      </Protected>
  </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  formContainer: {
    width: Platform.OS === "web" ? "60%" : "100%",
    padding: 20,
    backgroundColor: "rgba(15, 201, 65, 0.15)",
    borderRadius: 10,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
  },

  input: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: "#000",
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },

  inputError: {
    borderColor: "red",
  },

  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },

  imageBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    minHeight: 900,
  },

  blurContainer: {
    width: Platform.OS === "web" ? "70%" : "90%",
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    marginVertical: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  subTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    margin: 5,
  },

  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },

  img: {
    width: 100,
    height: 100,
    marginVertical: 10,
  },

  switch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  


breakdownCard: {
  borderWidth: 1,
  borderColor: "#D6D6D6",
  borderRadius: 10,
  padding: 12,
  marginBottom: 15,
  backgroundColor: "rgba(255, 255, 255, 0.40)",
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
},

tableHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 5,
},

tableHeaderText: {
  fontSize: 13,
  fontWeight: "bold",
},

tableRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8,
},

tableInput: {
  borderWidth: 1,
  borderColor: "#E8E8E8",
  borderRadius: 8,
  padding: 9,
  marginRight: 6,
  color: "#000",
  backgroundColor: "rgba(255, 255, 255, 0.65)",
},

reasonColumn: {
  flex: 1.6,
},

amountColumn: {
  flex: 1,
},

actionColumn: {
  width: 42,
},

rowButton: {
  marginTop: 4,
  marginBottom: 12,
},

totalBox: {
  padding: 10,
  borderWidth: 1,
  borderColor: "#D6D6D6",
  borderRadius: 8,
  marginBottom: 12,
},

totalText: {
  fontSize: 14,
  fontWeight: "600",
  marginBottom: 4,
},

matchText: {
  fontSize: 13,
  fontWeight: "bold",
  marginTop: 4,
  color: "green",
},

mismatchText: {
  fontSize: 13,
  fontWeight: "bold",
  marginTop: 4,
  color: "red",
},

expenseRow: {
  marginBottom: 12,
},

expenseInput: {
  minHeight: 72,
  textAlignVertical: "top",
  marginBottom: 6,
},

expenseRemoveButton: {
  alignSelf: "flex-end",
},

feeNotice: {
  padding: 12,
  borderWidth: 1,
  borderColor: "#D6D6D6",
  borderRadius: 8,
  marginBottom: 15,
  backgroundColor: "rgba(255, 255, 255, 0.55)",
},

feeNoticeTitle: {
  fontSize: 15,
  fontWeight: "bold",
  marginBottom: 5,
},

feeNoticeText: {
  fontSize: 13,
  lineHeight: 19,
},


feePolicyCard: {
  borderWidth: 1,
  borderColor: "#bbf7d0",
  borderRadius: 12,
  padding: 14,
  marginBottom: 15,
  backgroundColor: "rgba(240, 253, 244, 0.85)",
},

feePolicyTitle: {
  fontSize: 17,
  fontWeight: "900",
  marginBottom: 10,
  color: "#166534",
},

feePolicySection: {
  fontSize: 14,
  fontWeight: "900",
  marginBottom: 7,
  color: "#0f172a",
},

feePolicyRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingVertical: 6,
},

feePolicyLabel: {
  color: "#475569",
  fontSize: 14,
},

feePolicyValue: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 14,
},

feePolicyText: {
  fontWeight: "800",
  marginBottom: 7,
},

feeDivider: {
  borderTopWidth: 1,
  borderTopColor: "#d1fae5",
  marginVertical: 10,
},

feePolicyNotice: {
  fontSize: 12,
  lineHeight: 18,
  color: "#475569",
  marginTop: 10,
},
});

export default CreateProperty;