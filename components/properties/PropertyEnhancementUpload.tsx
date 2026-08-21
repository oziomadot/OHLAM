import React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  View,
} from "react-native";

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
    try {
      const url = "https://matterport.com/3d-camera-app";

      await Linking.openURL(url);
    } catch (error) {
      console.error(
        "Failed to open Matterport:",
        error
      );

      Alert.alert(
        "Unable to open Matterport",
        "Please open Matterport Capture manually and return to OHLAM after your tour has been processed."
      );
    }
  };

  return (
    <>
      <Text style={styles.sectionTitle}>
        Property Enhancements
      </Text>

      {/* MATTERPORT */}

      <View style={styles.card}>
        <Text style={styles.label}>
          3D Virtual Tour
        </Text>

        <Text style={styles.helpText}>
          Create an interactive 3D walkthrough using
          Matterport. After Matterport processes the
          property, copy the tour link and paste it below.
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={openMatterport}
        >
          <Text style={styles.secondaryButtonText}>
            Open Matterport Capture
          </Text>
        </TouchableOpacity>

        <Controller
          control={control}
          name="virtual_tour_url"
          render={({ field }) => (
            <TextInput
              placeholder="https://my.matterport.com/show/?m=..."
              placeholderTextColor="#888"
              style={styles.input}
              value={field.value ?? ""}
              onChangeText={field.onChange}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          )}
        />
      </View>

      {/* FLOOR PLAN */}

      <View style={styles.card}>
        <Text style={styles.label}>
          Floor Plan
        </Text>

        <Text style={styles.helpText}>
          Upload a floor plan for this property.
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={pickFloorPlan}
        >
          <Text style={styles.secondaryButtonText}>
            Upload Floor Plan
          </Text>
        </TouchableOpacity>

        {floorPlan && (
          <Text style={styles.fileName}>
            {floorPlan.name ?? "Floor plan selected"}
          </Text>
        )}
      </View>

      {/* 360 VIDEO FILE */}

      <View style={styles.card}>
        <Text style={styles.label}>
          360° Property Video
        </Text>

        <Text style={styles.helpText}>
          Upload a 360° video file captured with a
          compatible camera. This is separate from a
          Matterport interactive tour.
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={pickThreeSixtyVideo}
        >
          <Text style={styles.secondaryButtonText}>
            Upload 360° Video
          </Text>
        </TouchableOpacity>

        {threeSixtyVideo && (
          <Text style={styles.fileName}>
            {threeSixtyVideo.name ??
              "360° video selected"}
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 14,
    color: "#111",
  },

  card: {
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111",
  },

  helpText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#666",
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 12,
    color: "#000",
    fontSize: 15,
    backgroundColor: "#FFF",
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  fileName: {
    marginTop: 8,
    color: "#333",
    fontSize: 13,
  },
});