import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

type Props = {
  label: string;
  buttonTitle: string;
  file?: any;
  onPress: () => void;
};

export default function FileUploadButton({ label, buttonTitle, file, onPress }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Button title={buttonTitle} onPress={onPress} />
     {file?.name ? (
  <Text style={styles.fileName}>{file.name}</Text>
) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  fileName: {
    marginTop: 6,
    fontSize: 13,
    color: "#333",
  },
});