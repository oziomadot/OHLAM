import React from "react";
import { View, Text, Button, Image, StyleSheet } from "react-native";

type Props = {
  selectedPropertyType: number;
  images: any;
  video: any;
  pickImage: (field: string) => void;
  pickVideo: () => void;
};

export default function PropertyMediaUpload({
  selectedPropertyType,
  images,
  video,
  pickImage,
  pickVideo,
}: Props) {
  if (selectedPropertyType === 1) {
    const rentalImages = [
      ["Upload Whole Building Photo", "wholeBuilding"],
      ["Sitting Room Photo", "sittingRoom"],
      ["Kitchen Photo", "kitchenImage"],
      ["Room Photo", "room"],
      ["Toilet Photo", "toiletImage"],
    ];

    return (
      <>
        {rentalImages.map(([label, key]) => (
          <View key={key} style={styles.box}>
            <Text style={styles.label}>{label}</Text>
            <Button title="Pick Image" onPress={() => pickImage(key)} />
            {images[key] && (
              <Image source={{ uri: images[key].uri }} style={styles.img} />
            )}
          </View>
        ))}
      </>
    );
  }

  if (selectedPropertyType === 2) {
    return (
      <>
        <Text style={styles.label}>Upload Whole Building Photo</Text>
        <Button title="Pick Image" onPress={() => pickImage("wholeBuilding")} />
        {images.wholeBuilding && (
          <Image source={{ uri: images.wholeBuilding.uri }} style={styles.img} />
        )}

        <Text style={styles.label}>Upload Property Video</Text>
        <Button title="Pick Video" onPress={pickVideo} />
        {video && <Text>{video.name}</Text>}
      </>
    );
  }

  if (selectedPropertyType === 3) {
    return (
      <>
        <Text style={styles.label}>Upload Land Video</Text>
        <Button title="Pick Video" onPress={pickVideo} />
        {video && <Text>{video.name}</Text>}
      </>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  box: { marginBottom: 12 },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  img: { width: 100, height: 100, marginVertical: 10 },
});