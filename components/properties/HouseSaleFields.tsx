import React from "react";
import { Text, TextInput, View, Switch, StyleSheet } from "react-native";
import { Controller } from "react-hook-form";
import FormPicker from "./FormPicker";

export default function HouseSaleFields({ control, errors, dropdowns, watch, setValue }: any) {
  return (
    <>
      <Controller control={control} name="building_type_id" rules={{ required: "Building type is required" }} render={({ field }) => (
        <FormPicker label="Building Type" items={dropdowns.buildingTypes || []} value={field.value} onChange={field.onChange} error={errors.building_type_id?.message} />
      )} />

      <Controller control={control} name="building_id" rules={{ required: "Building is required" }} render={({ field }) => (
        <FormPicker label="Building" items={dropdowns.buildings || []} value={field.value} onChange={field.onChange} error={errors.building_id?.message} />
      )} />

      <Text style={styles.label}>Number of Units</Text>
      <Controller control={control} name="number_of_units" render={({ field }) => (
        <TextInput placeholder="How many units?" keyboardType="numeric" style={styles.input} value={field.value} onChangeText={field.onChange} />
      )} />

      <Controller control={control} name="buildingStatus_id" rules={{ required: "Status of the building is required" }} render={({ field }) => (
        <FormPicker label="Status of the Building" items={dropdowns.buildingStatus || []} value={field.value} onChange={field.onChange} error={errors.buildingStatus_id?.message} />
      )} />

      <Text style={styles.label}>Measurement</Text>
      <Controller control={control} name="measurement" render={({ field }) => (
        <TextInput placeholder="Measurement" style={styles.input} value={field.value} onChangeText={field.onChange} />
      )} />

      {[
        ["Proof of Ownership", "proof_of_ownership"],
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