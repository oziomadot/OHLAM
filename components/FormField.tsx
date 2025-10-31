// components/FormField.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const FormField = ({ label, children }) => {
  return (
    <View style={styles.fieldContainer}>
      {label && <Text style={styles.label}>{label}</Text>}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
});

export default FormField;
