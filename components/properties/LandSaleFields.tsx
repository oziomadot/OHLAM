import React from "react";
import { Text, TextInput, View, Switch, StyleSheet } from "react-native";
import { Controller } from "react-hook-form";
import FormPicker from "./FormPicker";

export default function LandSaleFields({
  control,
  errors,
  dropdowns,
  watch,
  setValue,
  handleMoneyChange,
  handleMoneyBlur,
}: any) {
  return (
    <>
      <Text style={styles.label}>Measurement</Text>
      <Controller control={control} name="measurement" render={({ field }) => (
        <TextInput placeholder="Measurement" style={styles.input} value={field.value} onChangeText={field.onChange} />
      )} />

      <Controller control={control} name="security_id" rules={{ required: "Security is required" }} render={({ field }) => (
        <FormPicker label="Security Type" items={dropdowns.securities || []} value={field.value} onChange={field.onChange} error={errors.security_id?.message} />
      )} />

      <Text style={styles.label}>Security Fee</Text>
      <Controller control={control} name="security_fee" render={({ field }) => (
        <TextInput
          placeholder="Security Fee"
          keyboardType="numeric"
          style={styles.input}
          value={field.value}
          onChangeText={(text) => handleMoneyChange(text, "security_fee")}
          onBlur={() => handleMoneyBlur("security_fee")}
        />
      )} />

      {[
        ["Access Road", "access_road"],
        ["Survey Plan", "survey_plan"],
        ["C of O", "c_of_o"],
      ].map(([label, name]) => (
        <View style={styles.switch} key={name}>
          <Text style={styles.label}>{label}</Text>
          <Switch value={!!watch(name)} onValueChange={(v) => setValue(name, v)} />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  switch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
});