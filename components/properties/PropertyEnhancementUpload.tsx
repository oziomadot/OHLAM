import React from "react";
import { Text, TextInput, Button, StyleSheet, Linking, Platform } from "react-native";
import { Controller } from "react-hook-form";

type Props = {
  control: any;
  floorPlan: any;
  threeSixtyVideo: any;
  pickFloorPlan: () => void;
  pickThreeSixtyVideo: () => void;
};

export default function PropertyEnhancementUpload({
  control,
  floorPlan,
  threeSixtyVideo,
  pickFloorPlan,
  pickThreeSixtyVideo,
}: Props) {

  const openMatterport = async () => {
  const appUrl = 'matterport://';
  const storeUrl =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/matterport/id986054296'
      : 'https://play.google.com/store/apps/details?id=com.matterport.capture';

  const supported = await Linking.canOpenURL(appUrl);

  if (supported) {
    await Linking.openURL(appUrl);
  } else {
    await Linking.openURL(storeUrl);
  }
};

  return (
    <>
      
      <Text style={styles.label}>Matterport / 3D Virtual Tour Link</Text>

<Button title="Open Matterport App" onPress={openMatterport} />

<Controller
  control={control}
  name="virtual_tour_url"
  render={({ field }) => (
    <TextInput
      placeholder="Paste Matterport 3D tour link here"
      style={styles.input}
      value={field.value}
      onChangeText={field.onChange}
    />
  )}
/>

      <Text style={styles.label}>Floor Plan</Text>
      <Button title="Upload Floor Plan" onPress={pickFloorPlan} />
      {floorPlan && <Text style={styles.fileName}>{floorPlan.name}</Text>}

      <Text style={styles.label}>360° Property Video</Text>
      <Button title="Upload 360° Video" onPress={pickThreeSixtyVideo} />
      {threeSixtyVideo && (
        <Text style={styles.fileName}>{threeSixtyVideo.name}</Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
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
  fileName: {
    marginVertical: 8,
    color: "#333",
  },
});