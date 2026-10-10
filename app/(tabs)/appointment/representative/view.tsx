import React, { useCallback, useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import Protected from "components/Protected";
import InspectionFlowCard, {
  ActionButton,
} from "components/inspection/InspectionFlowCard";
import API from "@/src/services/api";
import { errorText } from "@/src/services/inspectionFlow";

export default function RepresentativeInspectionScreen() {
  const params = useLocalSearchParams<{ appointmentId?: string | string[] }>();
  const id = Array.isArray(params.appointmentId)
    ? params.appointmentId[0]
    : params.appointmentId;
  const router = useRouter();
  const [invitations, setInvitations] = useState<
    { appointment_id: number; status: string }[]
  >([]);
  useFocusEffect(
    useCallback(() => {
      if (id) return;
      let active = true;
      void API.get<{ data: { appointment_id: number; status: string }[] }>(
        "/inspection-invitations",
      )
        .then((r) => {
          if (active) setInvitations(r.data.data);
        })
        .catch((e) => {
          if (active) Alert.alert("Unable to load invitations", errorText(e));
        });
      return () => {
        active = false;
      };
    }, [id]),
  );
  return (
    <Protected>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>
          Inspection on behalf of a customer
        </Text>
        {id ? (
          <InspectionFlowCard
            appointmentId={id}
            expectedRole="representative"
          />
        ) : invitations.length ? (
          invitations.map((invite) => (
            <ActionButton
              key={invite.appointment_id}
              title={`Appointment #${invite.appointment_id} · ${invite.status}`}
              onPress={() =>
                router.push(
                  `/appointment/representative/view?appointmentId=${invite.appointment_id}` as never,
                )
              }
            />
          ))
        ) : (
          <Text>No active inspection invitations.</Text>
        )}
      </ScrollView>
    </Protected>
  );
}
