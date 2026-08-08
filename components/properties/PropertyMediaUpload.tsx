import React from "react";
import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
} from "react-native";

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
  /*
   * RENTAL
   *
   * Keep your existing rental behaviour for now.
   */
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
        <Text style={styles.sectionTitle}>
          Property Photos
        </Text>

        {rentalImages.map(([label, key]) => {
          const img = images?.[key];

          return (
            <View key={key} style={styles.box}>
              <Text style={styles.label}>
                {label}
              </Text>

              <Button
                title="Pick Image"
                onPress={() => pickImage(key)}
              />

              {img?.uri ? (
                <Image
                  source={{ uri: img.uri }}
                  style={styles.img}
                />
              ) : null}
            </View>
          );
        })}
      </>
    );
  }

  /*
   * HOUSE FOR SALE
   *
   * User may provide:
   * image only
   * video only
   * both
   */
  if (selectedPropertyType === 2) {
    const mainImage = images?.wholeBuilding;

    return (
      <View style={styles.saleContainer}>
        <Text style={styles.sectionTitle}>
          Property Media
        </Text>

        <Text style={styles.helpText}>
          Upload at least one property image or one property
          video. You may upload both.
        </Text>

        <View style={styles.box}>
          <Text style={styles.label}>
            Property Image (Optional if video is provided)
          </Text>

          <Button
            title={
              mainImage?.uri
                ? "Change Property Image"
                : "Pick Property Image"
            }
            onPress={() => pickImage("wholeBuilding")}
          />

          {mainImage?.uri ? (
            <>
              <Image
                source={{ uri: mainImage.uri }}
                style={styles.img}
              />

              <Text style={styles.selectedText}>
                ✓ Property image selected
              </Text>
            </>
          ) : null}
        </View>

        <View style={styles.orContainer}>
          <Text style={styles.orText}>OR / AND</Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.label}>
            Property Video (Optional if image is provided)
          </Text>

          <Button
            title={
              video
                ? "Change Property Video"
                : "Pick Property Video"
            }
            onPress={pickVideo}
          />

          {video ? (
            <Text style={styles.selectedText}>
              ✓ {video.name || "Property video selected"}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  /*
   * LAND FOR SALE
   *
   * User may provide:
   * image only
   * video only
   * both
   */
  if (selectedPropertyType === 3) {
    const landImage = images?.wholeBuilding;

    return (
      <View style={styles.saleContainer}>
        <Text style={styles.sectionTitle}>
          Land Media
        </Text>

        <Text style={styles.helpText}>
          Upload at least one image of the land or one video.
          You may upload both.
        </Text>

        <View style={styles.box}>
          <Text style={styles.label}>
            Land Image (Optional if video is provided)
          </Text>

          <Button
            title={
              landImage?.uri
                ? "Change Land Image"
                : "Pick Land Image"
            }
            onPress={() => pickImage("wholeBuilding")}
          />

          {landImage?.uri ? (
            <>
              <Image
                source={{ uri: landImage.uri }}
                style={styles.img}
              />

              <Text style={styles.selectedText}>
                ✓ Land image selected
              </Text>
            </>
          ) : null}
        </View>

        <View style={styles.orContainer}>
          <Text style={styles.orText}>OR / AND</Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.label}>
            Land Video (Optional if image is provided)
          </Text>

          <Button
            title={
              video
                ? "Change Land Video"
                : "Pick Land Video"
            }
            onPress={pickVideo}
          />

          {video ? (
            <Text style={styles.selectedText}>
              ✓ {video.name || "Land video selected"}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  saleContainer: {
    marginVertical: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  helpText: {
    fontSize: 14,
    marginBottom: 16,
    color: "#333",
  },

  box: {
    marginBottom: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },

  img: {
    width: 150,
    height: 150,
    marginVertical: 10,
    borderRadius: 8,
  },

  selectedText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
  },

  orContainer: {
    alignItems: "center",
    marginVertical: 8,
  },

  orText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});