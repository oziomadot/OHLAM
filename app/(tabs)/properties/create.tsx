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




const CreateProperty = () => {


 const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  
 const handleMoneyChange = (text: string, fieldName: string) => {
  const cleanValue = text.replace(/,/g, "");

  if (isNaN(Number(cleanValue))) return;

  setValue(fieldName as any, cleanValue);

  if (fieldName === "amount") {
    const fee =
      selectedPropertyType === 1
        ? Number(cleanValue) * 0.11
        : Number(cleanValue) * 0.05;

    setValue("agent_fee", String(fee));
  }
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

  caution_fee: "",
  legal_fee: "",
  security_fee: "",
  cleaning_fee: "",
  additional_fee: "",
  additional_fee_description: "",

  address: "",
  meeting_place: "",
  fence_id: "",
  listing_role_id: "",
  latitude: "",
  longitude: "",
  virtual_tour_url: "",
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

              <Text style={styles.label}>Agent Fee</Text>
              <Controller
                control={control}
                name="agent_fee"
                render={({ field }) => (
                  <TextInput
                    placeholder="Agent Fee"
                    editable={false}
                    style={styles.input}
                    value={
                      field.value
                        ? String(field.value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        : ""
                    }
                  />
                )}
              />

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
      placeholder="Enter any additional fee"
      keyboardType="numeric"
      style={styles.input}
      value={field.value}
      onChangeText={(text) =>
        handleMoneyChange(text, "additional_fee")
      }
      onBlur={() => handleMoneyBlur("additional_fee")}
    />
  )}
/>

{!!watch("additional_fee") &&
  Number(
    String(watch("additional_fee")).replace(/,/g, "")
  ) > 0 && (
    <>
      <Text style={styles.label}>
        What is this additional fee for?
      </Text>

      <Controller
        control={control}
        name="additional_fee_description"
        rules={{
          validate: (value) => {
            const additionalFee = Number(
              String(watch("additional_fee") || "0").replace(/,/g, "")
            );

            if (additionalFee > 0 && !String(value || "").trim()) {
              return "Please explain what the additional fee is for";
            }

            return true;
          },
        }}
        render={({ field }) => (
          <>
            <TextInput
              placeholder="Example: Estate service charge for waste collection and security"
              style={[
                styles.input,
                {
                  minHeight: 90,
                  textAlignVertical: "top",
                },
                errors.additional_fee_description &&
                  styles.inputError,
              ]}
              multiline
              maxLength={500}
              value={field.value}
              onChangeText={field.onChange}
            />

            {errors.additional_fee_description && (
              <Text style={styles.error}>
                {errors.additional_fee_description.message}
              </Text>
            )}
          </>
        )}
      />

      <View style={styles.feeNotice}>
        <Text style={styles.feeNoticeTitle}>
          About additional charges
        </Text>

        <Text style={styles.feeNoticeText}>
          Additional charges are declared by the property
          lister and are not OHLAM fees. OHLAM has not
          independently determined that the charge is legally
          required. Renters should review the reason for the
          charge before agreeing to pay.
        </Text>
      </View>
    </>
  )}
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
});

export default CreateProperty;