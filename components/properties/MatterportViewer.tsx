import React from "react";

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { WebView } from "react-native-webview";

type Props = {
  modelId?: string | null;
};

export default function MatterportViewer({
  modelId,
}: Props) {
  if (!modelId) {
    return null;
  }

  const tourUrl =
    `https://my.matterport.com/show/?m=${encodeURIComponent(
      modelId
    )}&play=1`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        3D Virtual Tour
      </Text>

      <Text style={styles.subtitle}>
        Walk through this property virtually.
      </Text>

      <View style={styles.viewer}>
        <WebView
          source={{
            uri: tourUrl,
          }}
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" />
            </View>
          )}
          onError={(event) => {
            console.error(
              "Matterport viewer error:",
              event.nativeEvent
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },

  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111",
  },

  subtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    marginBottom: 12,
  },

  viewer: {
    height: 450,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EEE",
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});