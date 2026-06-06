import React from "react";
import { Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

type Props = {
  label: string;
  items: any[];
  value: any;
  onChange: (value: any) => void;
  error?: any;
};

export default function FormPicker({ label, items, value, onChange, error }: Props) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <Picker
        selectedValue={value}
        onValueChange={onChange}
        style={[styles.input, error && styles.inputError]}
      >
        <Picker.Item label={`Select ${label}`} value="" color="#999" />

        {items.map((item) => (
          <Picker.Item
            key={item.id}
            label={item.display_name || item.name}
            value={item.id}
          />
        ))}
      </Picker>

      {error && <Text style={styles.error}>{error}</Text>}
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
  inputError: {
    borderColor: "red",
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },
});