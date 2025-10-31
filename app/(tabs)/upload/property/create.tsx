import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Platform,
  ImageBackground,
} from "react-native";
import { BlurView } from "expo-blur";
import { useForm, Controller } from "react-hook-form";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Navbar from "components/Navbar";
import Dashboard from "components/Dashboard";
import Protected from "components/Protected";
import CustomAlert from "components/CustomAlert";
import API from "@/config";
import { useAuth } from "@/context/AuthContext";
import { debounce } from 'lodash';




const CreateProperty = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const [dropdowns, setDropdowns] = useState<any>({});
  const [video, setVideo] = useState<any>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [images, setImages] = useState<any>({
    wholeBuilding: null,
    sittingRoom: null,
    kitchenImage: null,
    room: null,
    toiletImage: null,
  });
  const [buildingType, setBuildingType] = useState<any[]>([]);
  const [building, setBuilding] = useState<any[]>([]);
  const [fenced, setFenced] = useState<any[]>([]);
  const [userId, setUserId] = useState(user?.id);



  console.log("user 1", user?.id);
  console.log("User Id is ", userId);
  

  const { control, handleSubmit, watch, setValue, reset, trigger, formState: { errors } } = useForm({
    defaultValues: {
      user_id: userId,
      propertyTypes: "",
      state_id: "",
      area_id: "",
      amount: "",
      agent_fee: "",
      address: "",
      meeting_place: "",
      building_type_id: "",
      building_id: "", 
      proof_of_ownership: false,
      groundfloor: false,
      firstfloor: false,
      secondfloor: false,
      thirdfloor: false,
      fourthfloor: false,
      kitchen: false,
      kitchen_cabinet: false,
      fence_id: "",
      flatType_id: "",
      rentpaymentmethod_id: "",
      typeofmeter_id: "",
      overheadtank_id: "",
      well_id: "",
      security_id: "",
      pop_id:"",
      caution_fee: "",
      building_in_compound: "",
      status_id: "",
      number_of_units: "",
      c_of_o: false,
      cleaning_fee: "",
      secutrity_fee: "",
      toilet: "",
      dining: false,
      electricity: false,
      car_parking_space: false,
      suite: "",
      security: false,
      measurement: "",
      access_road: false,
      survey_plan: false,
      
    },
  });

  const selectedPropertyType = parseInt(watch("propertyTypes"), 10);
  const stateId = parseInt(watch("state_id"), 10);
  const amount = watch("amount");
  const selectedBuildingType = parseInt(watch("building_type_id"), 10);
  const selectedBuilding = parseInt(watch("building_id"), 10);

  

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  /** 🔹 Get auth token */
  const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
  };
useEffect(() => {
  if (user?.id) {
    reset({ user_id: user.id }); // ✅ updates the form value when user arrives
  }
}, [user, reset]);
  /** 🔹 Load dropdown data */
  useEffect(() => {
    (async () => {
      try {
        
        const header = await getAuthHeader();
        const res = await API.get("/property/dropdowns", header);
        if (res.data.success) {
          const data = res.data.data;
          setPropertyTypes(data.propertyTypes);
          setStates(data.states);
          setDropdowns({
            buildingTypes: data.buildingTypes,
            buildings: data.buildings,
            flatTypes: data.flatTypes,
            rentpaymentMethods: data.rentPaymentMethods,
            typeofMeters: data.typeOfMeters,
            overheadTanks: data.overheadTanks,
            wells: data.wells,
            securities: data.securities,
            fences: data.fences,
            pops: data.pops,
            status: data.statuses,
          });
        }
      } catch (error) {
        console.error(error);
        showAlert("Error", "Failed to load dropdown data");
      }
    })();
  }, []);

//   /** 🔹 Load areas based on state */
 const fetchAreas = debounce(async (stateId) => {
  try {
    if (!stateId) return;

    const header = await getAuthHeader();
    const res = await API.get(`/property/areas?state_id=${stateId}`, header);
    setAreas(res.data.data);
  } catch (error) {
    console.log(error);
    showAlert("Error", "Could not load areas for selected state");
  }
}, 400); // optional debounce delay (400ms)

// ✅ useEffect should be outside the function
useEffect(() => {
  if (stateId) fetchAreas(stateId);
}, [stateId]);




// const handleMoneyChange = (text: string, name: string) => {
//   // remove commas, allow typing freely
//   const typedAmount = text.replace(/,/g, "");
//   if (isNaN(Number(typedAmount))) return; // prevent invalid input
//   setValue(name, typedAmount); // keep raw numeric string while typing

//   if(name === "amount"){
//     const fee =
//     selectedPropertyType === 1
//       ? Number(typedAmount) * 0.20
//       : Number(typedAmount) * 0.05;
//   setValue("agent_fee", fee);
//   }
// };

// const handleMoneyChange = (text: string, name: string) => {
//   const typedAmount = text.replace(/,/g, "");
//   if (isNaN(Number(typedAmount))) return;

//   setValue(name, typedAmount, { shouldValidate: true, shouldDirty: true });

//   if (name === "amount") {
//     const fee =
//       selectedPropertyType === 1
//         ? Number(typedAmount) * 0.15
//         : Number(typedAmount) * 0.05;

//     setValue("agent_fee", fee.toString(), { shouldValidate: true, shouldDirty: true });
//   }

//   // 👇 Force re-render of dependent fields
//   trigger(["amount", "agent_fee"]);
// };


// const handleMoneyBlur = (name: string) => {
//   // get value safely from React Hook Form
//   const value = watch(name);

//   // if empty or undefined, skip formatting
//   if (!value) return;

//   // safely format with commas
//   const formatted = String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

//   setValue(name, formatted);
// };


const handleMoneyChange = (text: string, name: string) => {
  // remove commas and keep only digits
  const cleanValue = text.replace(/,/g, '');
  if (isNaN(Number(cleanValue))) return;

  // update form with raw value (no commas)
  setValue(name, cleanValue);

  // auto-calculate agent fee if this is "amount"
  if (name === "amount") {
    const fee =
      selectedPropertyType === 1
        ? Number(cleanValue) * 0.2
        : Number(cleanValue) * 0.05;
    setValue("agent_fee", fee.toString());
  }
};

const handleMoneyBlur = (name: string) => {
  const currentValue = watch(name);
  if (!currentValue) return;

  // format with commas
  const formatted = String(currentValue).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  setValue(name, formatted);
};




  /** 🔹 Image & Video Pickers */
  // const pickImage = async (field: string) => {
  //   const result = await ImagePicker.launchImageLibraryAsync({ 
  //     mediaTypes: 'images',
  //     allowsEditing: true,
  //     quality: 1, });
  //   if (!result.canceled){ 

  //      const newImages = ...images;
  //     newImagesname = result.assets0.uri;
  //     setImages(newImages);
  //     // setImages({ ...images, [field]: result.assets[0].uri });
  //   }
  // };


const pickImage = async (field: string) => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  console.log("📸 Picker result:", result);

  if (!result.canceled) {
    const asset = result.assets[0];
    const newImage = {
      uri: asset.uri,
      name: asset.fileName || `${field}.jpg`,
      type: asset.mimeType || "image/jpeg",
    };

    // ✅ Use the dynamic field name as the key
    setImages((prev) => ({
      ...prev,
      [field]: newImage,
    }));

    console.log("🖼️ Updated images:", { ...images, [field]: newImage });
  }
};






const pickVideo = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "video/*",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || result.type === "cancel") return;

    const asset = result.assets ? result.assets[0] : result;
    let file: any;

    if (Platform.OS === "web") {
      // ✅ Web: Convert to Blob -> File
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const mimeType = blob.type || "video/mp4";
      const ext = mimeType.split("/")[1] || "mp4";
      file = new File([blob], asset.name || `video.${ext}`, { type: mimeType });
      (file as any).uri = asset.uri; // for preview
    } else {
      // ✅ Mobile (Expo): Use URI directly
      file = {
        uri: asset.uri,
        name: asset.name || "video.mp4",
        type: asset.mimeType || "video/mp4",
      };
    }

    setVideo(file);
    console.log("🎬 Picked video:", file);
  } catch (error) {
    console.error("❌ Error picking video:", error);
  }
};

  /** 🔹 Validate media before submission */
  const validateMedia = (): boolean => {
    if (selectedPropertyType === 1) {
      const required = ["wholeBuilding", "sittingRoom", "kitchen", "room", "toilet"];
      for (let key of required) {
        if (!images[key]) {
          showAlert("Missing Media", `Please upload ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`);
          return false;
        }
      }
    } else if (selectedPropertyType === 2) {
      if (!images.wholeBuilding) {
        showAlert("Missing Image", "Please upload a photo of the whole building.");
        return false;
      }
      if (!video) {
        showAlert("Missing Video", "Please upload a property video.");
        return false;
      }
    } else if (selectedPropertyType === 3 && !video) {
      showAlert("Missing Video", "Please upload a video of the land.");
      return false;
    }
    return true;
  };

  /** 🔹 Submit Form */
const onSubmit = async (formData: any) => {
  setLoading(true);

  try {
    const token = await AsyncStorage.getItem("token");
    const data = new FormData();


    Object.entries(formData).forEach(([key, val]) => {
  if (typeof val === "boolean") {
    data.append(key, val ? "1" : "0");
  } else if (val !== undefined && val !== null && typeof val !== "object") {
    data.append(key, String(val).replace(/,/g, ""));
  }
});


    // 🧾 Append text fields (ignore objects)
    Object.entries(formData).forEach(([key, val]) => {
      if (val !== undefined && val !== null && typeof val !== "object") {
        data.append(key, String(val).replace(/,/g, ""));
      }
    });

    

    // 🖼️ Append image files depending on property type
   if (selectedPropertyType === 1) {
  for (const [key, file] of Object.entries(images) as [string, any][]) {
    if (!file) continue;

    console.log(`📦 Appending ${key}:`, file);

    if (Platform.OS === "web") {
      // 🖥️ Web (convert URI to Blob before appending)
      const response = await fetch(file.uri);
      const blob = await response.blob();
      data.append(key, blob, file.name || `${key}.jpg`);
    } else {
      // 📱 Mobile (React Native)
      data.append(key, {
        uri: file.uri,
        name: file.name || `${key}.jpg`,
        type: file.type || "image/jpeg",
      } as any);
    }
  }
}

    else if (selectedPropertyType === 2) {
     
  const file = images.wholeBuilding;
  
  if (file) {
    console.log("🏠 Appending wholeBuilding:", file);

    if (Platform.OS === "web") {
      // 🖥️ fetch the blob first
      const response = await fetch(file.uri);
      const blob = await response.blob();



      data.append("wholeBuilding", blob, file.name || "wholeBuilding.jpg");
    } else {
      // 📱 normal React Native FormData append
      data.append("wholeBuilding", {
        uri: file.uri,
        name: file.name || "wholeBuilding.jpg",
        type: file.type || "image/jpeg",
      } as any);
    }
  }

  
    
  
}

    

    // ✅ Add video if exists
  // ✅ Add video if exists
if (video) {
  console.log("🎥 Appending video:", video);

  if (Platform.OS === "web") {
    // 🖥️ Web – Convert to Blob and set correct type
    const response = await fetch(video.uri || video.url || video.file?.uri);
    const blob = await response.blob();

    // Ensure proper mime type
    const mimeType = blob.type || "video/mp4";
    const fileName = video.name || "video.mp4";

    data.append("video", blob, fileName);
    console.log("📦 Web video blob appended:", fileName, mimeType);
  } else {
    // 📱 Mobile (React Native)
    let fileType = video.type;
    if (!fileType || !fileType.startsWith("video/")) {
      fileType = "video/mp4"; // default fallback
    }

    data.append("video", {
      uri: video.uri,
      name: video.name || "video.mp4",
      type: fileType,
    } as any);
    console.log("📦 Mobile video appended:", video.name || "video.mp4", fileType);
  }
}


    // 🧾 Debug output for FormData
    if ((data as any)._parts) {
      console.log("🧾 FormData entries:");
      (data as any)._parts.forEach(([key, val]: any) => {
        if (typeof val === "object" && val?.uri) {
          console.log(`📸 ${key}: ${val.name} (${val.type})`);
        } else {
          console.log(`📝 ${key}: ${val}`);
        }
      });
    }

    // 📨 Send request
    const res = await API.post("/property", data, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.status === 200) {
      reset();}

    console.log("✅ Upload success:", res.data);
    showAlert("Success", res.data.message || "Property saved successfully");
  } catch (err: any) {
    console.error("❌ Upload error:", err.response?.data || err.message);
    showAlert("Error", err.response?.data?.message || "Something went wrong while saving property");
  } finally {
    setLoading(false);
  }
};


  /** 🔹 Reusable Picker */
  const renderPicker = (label: string, items: any[] = [], field: any, error?: string) => (
    <>
      <Text style={styles.label}>{label}</Text>
      
      <Picker selectedValue={field.value} onValueChange={field.onChange} style={[styles.input, error && styles.inputError]}>
       
        <Picker.Item label={`Select ${label}`} value="" color="#999" />
        {items && items.map((item) => (
          <Picker.Item key={item.id} label={item.display_name ? item.display_name : item.name} value={item.id} />
        ))}
        
      </Picker>
      
      {error && <Text style={styles.error}>{error}</Text>}
    </>
  );

  /** 🔹 Conditional fields based on property_type */
const renderPropertySpecificFields = () => {
  switch (selectedPropertyType) {
    /** 🏠 House Rent */
    case 1:
      return (
        <>
             
      <Controller
            control={control}
            name="building_id"
            rules={{ required: "Building is required" }}
            render={({ field }) =>
              renderPicker("Building", dropdowns.buildings || [], field, errors.building_id?.message)
            }
          />
          
          <Controller
            control={control}
            name="building_type_id"
            rules={{ required: "Building type is required" }}
            render={({ field }) =>
              renderPicker("Building Type", dropdowns.buildingTypes || [], field, errors.building_type_id?.message)
            }
          />

          {/* Number of building in the compound  */}
                <Text style={styles.label}>Number of buildings in the compound</Text> 
                <Controller
                  control={control}
                  name="building_in_compound"
                 
                  render={({ field }) => (
                    <>
                      <TextInput
                        placeholder="Number of buildings in the compound"
                        keyboardType="numeric"
                        style={[styles.input, errors.building_in_compound && styles.inputError]}
                        value={field.value}
                        onChangeText={field.onChange}
                      />
                      {errors.building_in_compound && <Text style={styles.error}>{errors.building_in_compound.message}</Text>}
                    </>
                  )}
                />

         

          {selectedBuildingType === 3 &&(
            <>
            
          <Controller
            control={control}
            name="flatType_id"
           
            render={({ field }) =>
              renderPicker("Flat Type", dropdowns.flatTypes || [], field, errors.flatType_id?.message)
            }
          />
          </>
          )}

          {selectedBuilding === 2 &&(
            <>
          <View>
            <Text style={styles.subTitle}>Available Floor</Text>

            <View style={styles.switchContainer}>
              < View>
            <View style={styles.switch}>
              <Text style={styles.label}>Ground Floor</Text>
              <Switch
              value={!!watch("groundfloor")}
              onValueChange={(v) => setValue("groundfloor", v)}
              />
               
            </View>

            <View style={styles.switch}>
              <Text style={styles.label}>First Floor</Text>
              <Switch
              value={!!watch("firstfloor")}
              onValueChange={(v) => setValue("firstfloor", v)}
              />
               
            </View>

             <View style={styles.switch}>
              <Text style={styles.label}>Second Floor</Text>
              <Switch
              value={!!watch("secondfloor")}
              onValueChange={(v) => setValue("secondfloor", v)}
              />
               
            </View>

            <View style={styles.switch}>
              <Text style={styles.label}>Third Floor</Text>
              <Switch
              value={!!watch("thirdfloor")}
              onValueChange={(v) => setValue("thirdfloor", v)}
              />
               
            </View>

             <View style={styles.switch}>
              <Text style={styles.label}>Fourth Floor</Text>
              <Switch
              value={!!watch("fourthfloor")}
              onValueChange={(v) => setValue("fourthfloor", v)}
              />
               
            </View>

            
            </View>
          </View>
</View>
          
          </>
          )}


           <View>
            <Text style={styles.subTitle}>Facilities in the house</Text>

            <View style={styles.switchContainer}>
<View>
             <View style={styles.switch}>
              <Text style={styles.label}>Dining</Text>
              <Switch
              value={!!watch("dining")}
              onValueChange={(v) => setValue("dining", v)}
              />
               
            </View>

            <View style={styles.switch}>
              <Text style={styles.label}>Electricity</Text>
              <Switch
              value={!!watch("electricity")}
              onValueChange={(v) => setValue("electricity", v)}
              />
              </View>
               
               <View style={styles.switch}>
              <Text style={styles.label}>Car Parking Space</Text>
              <Switch
              value={!!watch("car_parking_space")}
              onValueChange={(v) => setValue("car_parking_space", v)}
              />
               
            </View>

            <View style={styles.switch}>
              <Text style={styles.label}>Kitchen</Text>
              <Switch
              value={!!watch("kitchen")}
              onValueChange={(v) => setValue("kitchen", v)}
              />
               
            </View>

            <View style={styles.switch}>
              <Text style={styles.label}>Kitchen Cabinet</Text>
              <Switch
              value={!!watch("kitchen_cabinet")}
              onValueChange={(v) => setValue("kitchen_cabinet", v)}
              />
               
            </View>
            
          
            </View>
            </View>

             {/* Rooms that is suite */}

             <Text style={styles.label}>Number of rooms in suite</Text>
                <Controller
                  control={control}
                  name="suite"
                 
                  render={({ field }) => (
                    <>
                      <TextInput
                        placeholder="Number of rooms that is suite"
                        keyboardType="numeric"
                        style={[styles.input, errors.suite && styles.inputError]}
                        value={field.value}
                        onChangeText={field.onChange}
                      />
                      {errors.suite && <Text style={styles.error}>{errors.suite.message}</Text>}
                    </>
                  )}
                />

                
          <Controller
            control={control}
            name="pop_id"
            
            render={({ field }) =>
              renderPicker("Is there POP in the house", dropdowns.pops || [], field, errors.pop_id?.message)
            }
          />

           <Controller
            control={control}
            name="typeofmeter_id"
            rules={{ required: "Type of meter is required" }}
            render={({ field }) =>
              renderPicker("Type of Meter", dropdowns.typeofMeters || [], field, errors.typeofmeter_id?.message)
            }
          />

          <Controller
            control={control}
            name="overheadtank_id"
            rules={{ required: "Overhead tank is required" }}
            render={({ field }) =>
              renderPicker("Overhead Tank", dropdowns.overheadTanks || [], field, errors.overheadtank_id?.message)
            }
          />
 
          <Controller
            control={control}
            name="well_id"
            rules={{ required: "Well is required" }}
            render={({ field }) =>
              renderPicker("Well Type", dropdowns.wells || [], field, errors.well_id?.message)
            }
          />

            <Controller
            control={control}
            name="security_id"
            rules={{ required: "Security is required" }}
            render={({ field }) =>
              renderPicker("Security Type", dropdowns.securities || [], field, errors.security_id?.message)
            }
          />

          <Text style={styles.label}>Number of Toilet</Text>
          <TextInput
            placeholder="Toilet Count"
            keyboardType="numeric"
            style={styles.input}
            onChangeText={(t) => setValue("toilet", t)}
          />
           </View>
            
            
<Text style={styles.label}>Caution fee</Text>
                <Controller
  control={control}
  name="caution_fee"
  render={({ field }) => (
    <>
      <TextInput
        placeholder="Caution fee"
        keyboardType="numeric"
        style={[styles.input, errors.caution_fee && styles.inputError]}
        value={
          field.value
            ? String(field.value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            : ""
        }
        onChangeText={(text) => handleMoneyChange(text, "caution_fee")}
        onBlur={() => handleMoneyBlur("caution_fee")}
      />
      {errors.cleaning_fee && (
        <Text style={styles.error}>{errors.cleaning_fee.message}</Text>
      )}
    </>
  )}
/>


                  <Text style={styles.label}>Security fee</Text>
                  <Controller
                  control={control}
                  name="security_fee"
                  render={({ field }) => (
                    <>
                      <TextInput
                        placeholder="Security Fee"
                        keyboardType="numeric"
                        style={[styles.input, errors.security_fee && styles.inputError]}
                        value={field.value}
                        onChangeText={(text) => handleMoneyChange(text, "security_fee")}
                          onBlur={() => handleMoneyBlur( "security_fee")}
                      />
                      {errors.security_fee && <Text style={styles.error}>{errors.security_fee.message}</Text>}
                    </>
                  )}
                />

                <Text style={styles.label}>Cleaning fee</Text>
                  <Controller
                  control={control}
                  name="cleaning_fee"                 
                  render={({ field }) => (
                    <>
                      <TextInput
                        placeholder="Cleaning fee"
                        keyboardType="numeric"
                        style={[styles.input, errors.cleaning_fee && styles.inputError]}
                        value={field.value}
                         onChangeText={(text) => handleMoneyChange(text, "cleaning_fee")}
                          onBlur={() => handleMoneyBlur("cleaning_fee")}
                      />
                      {errors.cleaning_fee && <Text style={styles.error}>{errors.cleaning_fee.message}</Text>}
                    </>
                  )}
                />
            
            
            

 
          <Controller
            control={control}
            name="rentpaymentmethod_id"
            rules={{ required: "Rent payment method is required" }}
            render={({ field }) =>
              renderPicker("Rent Payment Method", dropdowns.rentpaymentMethods || [], field, errors.rentpaymentmethod_id?.message)
            }
          />

          <Text style={styles.label}>Upload Whole Building Photo</Text>
          <Button title="Pick Image" onPress={() => pickImage("wholeBuilding")} />
            {images.wholeBuilding && (
  <Image
    source={{ uri: Platform.OS === "web" ? images.wholeBuilding.uri : images.wholeBuilding.uri }}
    style={styles.img}
  />
)}

     
        

          <Text style={styles.label}>Sitting Room Photo</Text>
          <Button title="Pick Image" onPress={() => pickImage("sittingRoom")} />
             {images.sittingRoom && (
                  <Image
                    source={{ uri: images.sittingRoom.uri }}
                    style={{ width: 100, height: 100, marginTop: 10 }}
                  />
                )}
          

          <Text style={styles.label}>Kitchen Photo</Text>
          <Button title="Pick Image" onPress={() => pickImage("kitchenImage")} />
             {images.kitchenImage && (
                  <Image
                    source={{ uri: images.kitchenImage.uri}}
                    style={{ width: 100, height: 100, marginTop: 10 }}
                  />
                )}
          
         

          <Text style={styles.label}>Room Photo</Text>
          <Button title="Pick Image" onPress={() => pickImage("room")} />
             {images.room && (
                  <Image
                    source={{ uri: images.room.uri }}
                    style={{ width: 100, height: 100, marginTop: 10 }}
                  />
                )}
         

          <Text style={styles.label}>Toilet Photo</Text>
          <Button title="Pick Image" onPress={() => pickImage("toiletImage")} />
             {images.toiletImage && (
                  <Image
                    source={{ uri: images.toiletImage.uri}}
                    style={{ width: 100, height: 100, marginTop: 10 }}
                  />
                )}
          
        </>
      );
      break;

    /** 🏘 House Sale */
    case 2:
      return (
        <>
          <Controller
            control={control}
            name="building_type_id"
            rules={{ required: "Building type is required" }}
            render={({ field }) =>
              renderPicker("Building Type", dropdowns.buildingTypes || [], field, errors.building_type_id?.message)
            }
          />

          <Controller
            control={control}
            name="building_id"
            rules={{ required: "Building is required" }}
            render={({ field }) =>
              renderPicker("Building", dropdowns.buildings || [], field, errors.building_id?.message)
            }
          />

         
              <Text style={styles.label}>How many unite(Flats: how many flats/Rooms: how many rooms)</Text>
                <Controller
                  control={control}
                  name="number_of_units"
                 
                  render={({ field }) => (
                    <>
                      <TextInput
                        placeholder="How many unity"
                        keyboardType="numeric"
                        style={[styles.input, errors.number_of_units && styles.inputError]}
                        value={field.value}
                        onChangeText={field.onChange}
                      />
                      {errors.number_of_units && <Text style={styles.error}>{errors.number_of_units.message}</Text>}
                    </>
                  )}
                />

          <Controller
            control={control}
            name="status_id"
            rules={{ required: "Status of the building" }}
            render={({ field }) =>
              renderPicker("Status of the Building", dropdowns.status || [], field, errors.status_id?.message)
            }
          />

            <Text style={styles.label}>Measurement</Text>
          <TextInput
            placeholder="Measurement"
            style={styles.input}
            onChangeText={(t) => setValue("measurement", t)}
          />

          <View style={styles.switchContainer}>
            <View>
      <View style={styles.switch}>
          <Text style={styles.label}>Proof of Ownership</Text>
          <Switch
            value={!!watch("proof_of_ownership")}
            onValueChange={(v) => setValue("proof_of_ownership", v)}
          />
        </View>
         <View style={styles.switch}>
          <Text style={styles.label}>C of O</Text>
          <Switch
            value={!!watch("c_of_o")}
            onValueChange={(v) => setValue("c_of_o", v)}
          />
        </View>
        </View>
        </View>

         {/* Number of building in the compound  */}

            <Text style={styles.label}>Number of buildings in the compound</Text>
                <Controller
                  control={control}
                  name="building_in_compound"
                 
                  render={({ field }) => (
                    <>
                      <TextInput
                        placeholder="Number of buildings in the compound"
                        keyboardType="numeric"
                        style={[styles.input, errors.building_in_compound && styles.inputError]}
                        value={field.value}
                        onChangeText={field.onChange}
                      />
                      {errors.building_in_compound && <Text style={styles.error}>{errors.building_in_compound.message}</Text>}
                    </>
                  )}
                />


         <Text style={styles.label}>Upload Whole Building Photo</Text>
          <Button title="Pick Image" onPress={() => pickImage("wholeBuilding")} />

           {images.wholeBuilding && (
                  <Image
                    source={{ uri: images.wholeBuilding.uri }}
                    style={{ width: 100, height: 100, marginTop: 10 }}
                  />
                )}
                


          <Text style={styles.label}>Upload Property Video</Text>
          <Button title="Pick Video" onPress={pickVideo} />
          {video && <Text>{video.name}</Text>}
        </>
      );
      break;

    /** 🌾 Land Sale */
    case 3:
      return (
        <>
        <Text style={styles.label}>Measurement</Text>
          <TextInput
            placeholder="Measurement"
            style={styles.input}
            onChangeText={(t) => setValue("measurement", t)}
          />


            <Controller
            control={control}
            name="security_id"
            rules={{ required: "Security is required" }}
            render={({ field }) =>
              renderPicker("Security Type", dropdowns.securities || [], field, errors.security_id?.message)
            }
          />

   <Text style={styles.label}>Security fee</Text>
                  <Controller
                  control={control}
                  name="security_fee"
                 
                  render={({ field }) => (
                    <>
                      <TextInput
                        placeholder="Security Fee"
                        keyboardType="security_fee"
                        style={[styles.input, errors.security_fee && styles.inputError]}
                        value={field.value}
                        onChangeText={(text) => handleMoneyChange(text, "security_fee")}
                          onBlur={() => handleMoneyBlur(field.value, "security_fee")}
                      />
                      {errors.security_fee && <Text style={styles.error}>{errors.security_fee.message}</Text>}
                    </>
                  )}
                />

          <View style={styles.switchContainer}>
            <View>
              <View style={styles.switch}>
          <Text style={styles.label}>Access Road</Text>
          <Switch
            value={!!watch("access_road")}
            onValueChange={(v) => setValue("access_road", v)}
          />
        </View>
        <View style={styles.switch}>
          <Text style={styles.label}>Survey Plan</Text>
          <Switch
            value={!!watch("survey_plan")}
            onValueChange={(v) => setValue("survey_plan", v)}
          />

          </View>

           <View style={styles.switch}>
          <Text style={styles.label}>C of O</Text>
          <Switch
            value={!!watch("c_of_o")}
            onValueChange={(v) => setValue("c_of_o", v)}
          />
          </View>
          </View>
          </View>
          <Text style={styles.label}>Upload Land Video</Text>
          <Button title="Pick Video" onPress={pickVideo} />
          {video && <Text>{video.name}</Text>}
        </>
      );
      break;

    default:
      return null;
  }
};


  /** 🔹 UI */
  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <Protected>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 10 }}>
          <Navbar />
          <Dashboard />
          <ImageBackground source={require("../../../../assets/images/propertyregistration.jpg")} resizeMode="cover" style={styles.image}>
            <BlurView intensity={50} tint="light" style={styles.blurContainer}>
              <View style={styles.formContainer}>
                <Text style={styles.title}>Add New Property</Text>

                {/* Property Type */}
                
                <Controller
                  control={control}
                  name="propertyTypes"
                  rules={{ required: "Property type is required" }}
                  render={({ field }) => renderPicker("Property Type", propertyTypes || [], field, errors.property_type?.message)}
                />

                {/* State */}
                <Controller
                  control={control}
                  name="state_id"
                  rules={{ required: "State is required" }}
                  render={({ field }) => renderPicker("State", states || [], field, errors.state_id?.message)}
                />

                {/* Area */}
                <Controller
                  control={control}
                  name="area_id"
                  // rules={{ required: "Area is required" }}
                  render={({ field }) => renderPicker("Area", areas || [], field, errors.area_id?.message)}
                />

                {/* Amount */}

                <Text style={styles.label}>Amount</Text>

<Controller
  control={control}
  rules={{ required: "Amount is required" }}
  name="amount"
  render={({ field: { onChange, onBlur, value } }) => (
    <>
    <TextInput
      style={[styles.input, errors.amount && styles.inputError]}
      keyboardType="numeric"
      value={String(value || "")}
      onChangeText={(text) => handleMoneyChange(text, "amount")}
      onBlur={() => handleMoneyBlur("amount")}
      placeholder="Enter amount"
    />
    {errors.amount && <Text style={styles.error}>{errors.amount.message}</Text>}
    </>
  )}
/>



                {/* Agent Fee */}
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


                {/* Address */}

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
                        onChangeText={field.onChange}
                      />
                      {errors.address && <Text style={styles.error}>{errors.address.message}</Text>}
                    </>
                  )}
                />

                {/* Meeting Place */}
                <Text style={styles.label}>Meeting place</Text>
                <Controller
                  control={control}
                  name="meeting_place"
                  rules={{ required: "Meeting place is required" }}
                  render={({ field }) => (
                    <>
                      <TextInput
                        placeholder="Meeting Place"
                        style={[styles.input, errors.meeting_place && styles.inputError]}
                        onChangeText={field.onChange}
                      />
                      {errors.meeting_place && <Text style={styles.error}>{errors.meeting_place.message}</Text>}
                    </>
                  )}
                />


                  {/* Fenced */}
                 
                <Controller
                  control={control}
                  name="fence_id"
                  rules={{ required: "Fenced  is required" }}
                  render={({ field }) => renderPicker("Fenced", dropdowns.fences || [], field, errors.fence_id?.message)}
                />
                

                {/* Conditional Fields */}
                {renderPropertySpecificFields()}
              <View style={{ marginTop: 20 }}>
                <Button title="Submit Property" onPress={handleSubmit(onSubmit)} disabled={loading} />
              </View>
              </View>
            </BlurView>
          </ImageBackground>
        </ScrollView>

        {/* Alert Modal */}
        <CustomAlert visible={alertVisible} title={alertTitle} message={alertMessage} onClose={() => setAlertVisible(false)} />
      </KeyboardAvoidingView>
    </Protected>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: Platform.OS === "web" ? "60%" : "100%",
    padding: 20,
    backgroundColor: "rgb(15, 201, 65, 0.15)",
    borderRadius: 10,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    shadowColor: "#000", 
    shadowOffset: 
      { width: 0, 
        height: 2, }, 
    
  },
  input: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: "#000",
    fontSize: 16,
    backgroundColor: "rgb(255, 255, 255, 0.4)",
  },
  inputError: {
    borderColor: "red",
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },
  image: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  blurContainer: {
    width: Platform.OS === "web" ? "70%" : "90%",
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
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
  subTitleContainer: {
    backgroundColor: "rgb(233, 208, 19, 0.5)"
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  img: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  switch:{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
     
  },
  switchContainer:{
    marginHorizontal: Platform.OS === "web" ? 80 : undefined,
    
    
  }

});

export default CreateProperty;
