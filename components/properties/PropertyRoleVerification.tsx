import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { Controller } from "react-hook-form";
import FormPicker from "./FormPicker";

type Props = {
  control: any;
  errors: any;
  registrationStatuses: any[];
  selectedListingRoleName: string;
  proofDocument: any;
  pickProofDocument: () => void;
};

export default function PropertyRoleVerification({
  control,
  errors,
  registrationStatuses,
  selectedListingRoleName,
  proofDocument,
  pickProofDocument,
}: Props) {
  return (
    <>
      <Controller
        control={control}
        name="listing_role_id"
        rules={{ required: "Please select if you are Agent, Landlord or Developer" }}
        render={({ field }) => (
          <FormPicker
            label="Who are you listing as?"
            items={registrationStatuses}
            value={field.value}
            onChange={field.onChange}
            error={errors.listing_role_id?.message}
          />
        )}
      />

      {selectedListingRoleName === "landlord" && (
        <View style={styles.box}>
          <Text style={styles.label}>Proof of Ownership is Required</Text>
          <Button
            title="Upload C of O / Survey Plan / Deed"
            onPress={pickProofDocument}
          />
          {proofDocument && <Text>{proofDocument.name}</Text>}
        </View>
      )}

      {selectedListingRoleName === "agent" && (
        <View style={styles.box}>
          <Text style={styles.label}>
            Landlord Consent / Authority to Market Property
          </Text>
          <Button
            title="Upload Optional Consent Document"
            onPress={pickProofDocument}
          />
          {proofDocument && <Text>{proofDocument.name}</Text>}
        </View>
      )}

      {selectedListingRoleName === "developer" && (
        <View style={styles.box}>
          <Text style={styles.label}>Developer Proof is Required</Text>
          <Button title="Upload Developer Proof" onPress={pickProofDocument} />
          {proofDocument && <Text>{proofDocument.name}</Text>}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
});