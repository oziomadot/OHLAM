import React from "react";
import { Text, TextInput, View, Switch, StyleSheet } from "react-native";
import { Controller } from "react-hook-form";
import FormPicker from "./FormPicker";

type Props = {
  control: any;
  errors: any;
  dropdowns: any;
  watch: any;
  setValue: any;
  selectedBuildingType: number;
  selectedBuilding: number;
  handleMoneyChange: (text: string, name: any) => void;
  handleMoneyBlur: (name: any) => void;
};

export default function RentalFields({
  control,
  errors,
  dropdowns,
  watch,
  setValue,
  selectedBuildingType,
  selectedBuilding,
  handleMoneyChange,
  handleMoneyBlur,
}: Props) {
  return (
    <>
      <Controller
        control={control}
        name="building_id"
        rules={{ required: "Building is required" }}
        render={({ field }) => (
          <FormPicker label="Building" items={dropdowns.buildings || []} value={field.value} onChange={field.onChange} error={errors.building_id?.message} />
        )}
      />

      <Controller
        control={control}
        name="building_type_id"
        rules={{ required: "Building type is required" }}
        render={({ field }) => (
          <FormPicker label="Building Type" items={dropdowns.buildingTypes || []} value={field.value} onChange={field.onChange} error={errors.building_type_id?.message} />
        )}
      />

      {selectedBuildingType === 3 && (
        <Controller
          control={control}
          name="flatType_id"
          render={({ field }) => (
            <FormPicker label="Flat Type" items={dropdowns.flatTypes || []} value={field.value} onChange={field.onChange} error={errors.flatType_id?.message} />
          )}
        />
      )}

      {selectedBuilding === 2 && (
        <>
          <Text style={styles.subTitle}>Available Floor</Text>
          {[
            ["Ground Floor", "groundfloor"],
            ["First Floor", "firstfloor"],
            ["Second Floor", "secondfloor"],
            ["Third Floor", "thirdfloor"],
            ["Fourth Floor", "fourthfloor"],
          ].map(([label, name]) => (
            <View style={styles.switch} key={name}>
              <Text style={styles.label}>{label}</Text>
              <Switch value={!!watch(name)} onValueChange={(v) => setValue(name, v)} />
            </View>
          ))}
        </>
      )}

      <Text style={styles.subTitle}>Facilities in the house</Text>

      {[
        ["Dining", "dining"],
        ["Electricity", "electricity"],
        ["Car Parking Space", "car_parking_space"],
        ["Kitchen", "kitchen"],
        ["Kitchen Cabinet", "kitchen_cabinet"],
        ["Wardrobe", "wardrobe"],
        ["Wardrobe Cabinet", "wardrobe_cabinet"],
        ["Compound Cleaner", "compound_cleaner"],
      ].map(([label, name]) => (
        <View style={styles.switch} key={name}>
          <Text style={styles.label}>{label}</Text>
          <Switch value={!!watch(name)} onValueChange={(v) => setValue(name, v)} />
        </View>
      ))}

      <Text style={styles.label}>Number of rooms in suite</Text>
      <Controller
        control={control}
        name="suite"
        render={({ field }) => (
          <TextInput
            placeholder="Number of rooms that are suite"
            keyboardType="numeric"
            style={styles.input}
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />

      <Controller control={control} name="pop_id" render={({ field }) => (
        <FormPicker label="Is there POP in the house?" items={dropdowns.pops || []} value={field.value} onChange={field.onChange} error={errors.pop_id?.message} />
      )} />

      <Controller control={control} name="typeofmeter_id" rules={{ required: "Type of meter is required" }} render={({ field }) => (
        <FormPicker label="Type of Meter" items={dropdowns.typeofMeters || []} value={field.value} onChange={field.onChange} error={errors.typeofmeter_id?.message} />
      )} />

      <Controller control={control} name="overheadtank_id" rules={{ required: "Overhead tank is required" }} render={({ field }) => (
        <FormPicker label="Overhead Tank" items={dropdowns.overheadTanks || []} value={field.value} onChange={field.onChange} error={errors.overheadtank_id?.message} />
      )} />

      <Controller control={control} name="well_id" rules={{ required: "Well is required" }} render={({ field }) => (
        <FormPicker label="Well Type" items={dropdowns.wells || []} value={field.value} onChange={field.onChange} error={errors.well_id?.message} />
      )} />

      <Controller control={control} name="security_id" rules={{ required: "Security is required" }} render={({ field }) => (
        <FormPicker label="Security Type" items={dropdowns.securities || []} value={field.value} onChange={field.onChange} error={errors.security_id?.message} />
      )} />

      <Text style={styles.label}>Number of Toilet</Text>
      <Controller
        control={control}
        name="toilet"
        render={({ field }) => (
          <TextInput
            placeholder="Toilet Count"
            keyboardType="numeric"
            style={styles.input}
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />

      {["caution_fee", "security_fee", "cleaning_fee"].map((name) => (
        <View key={name}>
          <Text style={styles.label}>{name.replace("_", " ").toUpperCase()}</Text>
          <Controller
            control={control}
            name={name}
            render={({ field }) => (
              <TextInput
                placeholder={name.replace("_", " ")}
                keyboardType="numeric"
                style={styles.input}
                value={field.value}
                onChangeText={(text) => handleMoneyChange(text, name)}
                onBlur={() => handleMoneyBlur(name)}
              />
            )}
          />
        </View>
      ))}

      <Controller control={control} name="rentpaymentmethod_id" rules={{ required: "Rent payment method is required" }} render={({ field }) => (
        <FormPicker label="Rent Payment Method" items={dropdowns.rentpaymentMethods || []} value={field.value} onChange={field.onChange} error={errors.rentpaymentmethod_id?.message} />
      )} />
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  subTitle: { fontSize: 16, fontWeight: "bold", textAlign: "center", margin: 5 },
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