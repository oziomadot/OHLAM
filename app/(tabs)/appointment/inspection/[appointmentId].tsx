import React from "react";
import { ScrollView, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Protected from "components/Protected";
import InspectionFlowCard from "components/inspection/InspectionFlowCard";

export default function InspectionScreen() {
  const params = useLocalSearchParams<{ appointmentId?: string | string[] }>();
  const id = Array.isArray(params.appointmentId)
    ? params.appointmentId[0]
    : params.appointmentId;
  return (
    <Protected>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>
          Appointment inspection
        </Text>
        {id ? (
          <InspectionFlowCard appointmentId={id} />
        ) : (
          <Text>Open an accepted appointment to begin its inspection.</Text>
        )}
      </ScrollView>
    </Protected>
  );
}
