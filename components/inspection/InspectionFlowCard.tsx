import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import {
  ActionResult,
  Id,
  InspectionFlow,
  Outcome,
  Report,
  errorText,
  loadInspectionFlow,
  mutateInspectionFlow,
  prepareInspectionSettlement,
} from "@/src/services/inspectionFlow";

export function ActionButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.button, disabled && s.disabled]}
    >
      <Text style={s.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}
export function Rating({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${n} of 5`}
            accessibilityState={{ selected: value === n, disabled }}
            onPress={() => onChange(n)}
            style={s.rating}
          >
            <Text>
              {value >= n ? "★" : "☆"} {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
function ReportView({
  title,
  report,
}: {
  title: string;
  report: Report | null;
}) {
  if (!report) return null;
  return (
    <View style={s.panel}>
      <Text style={s.subtitle}>{title}</Text>
      <Text>Submitted by {report.inspector_name}</Text>
      <Text>
        {report.outcome === "completed"
          ? "Inspection completed"
          : "Inspection not completed"}
      </Text>
      {report.explanation ? <Text>{report.explanation}</Text> : null}
      {Object.entries(report.ratings).map(([key, r]) => (
        <Text key={key}>
          {key}: {r.rating}/5{r.review ? ` — ${r.review}` : ""}
        </Text>
      ))}
    </View>
  );
}
export default function InspectionFlowCard({
  appointmentId,
  expectedRole,
}: {
  appointmentId: Id;
  expectedRole?: "customer" | "lister" | "representative";
}) {
  const router = useRouter();
  const [flow, setFlow] = useState<InspectionFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const [delegateType, setDelegateType] = useState<"registered" | "guest">(
    "guest",
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");
  const [permission, setPermission] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState("");
  const [outcome, setOutcome] = useState<Outcome>("completed");
  const [reason, setReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [propertyRating, setPropertyRating] = useState(0);
  const [listerRating, setListerRating] = useState(0);
  const [attendeeRating, setAttendeeRating] = useState(0);
  const [propertyReview, setPropertyReview] = useState("");
  const [listerReview, setListerReview] = useState("");
  const [attendeeReview, setAttendeeReview] = useState("");
  const [punctuality, setPunctuality] = useState("");
  const [conduct, setConduct] = useState("");
  const [listingAccuracy, setListingAccuracy] = useState("");
  const reload = useCallback(async () => {
    const g = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const result = await loadInspectionFlow(appointmentId);
      if (
        String(result.appointment_id) !== String(appointmentId) ||
        (expectedRole && result.viewer_role !== expectedRole)
      )
        throw new Error("You do not have access to this appointment view.");
      if (g === generation.current) setFlow(result);
    } catch (e) {
      if (g === generation.current) setError(errorText(e));
    } finally {
      if (g === generation.current) setLoading(false);
    }
  }, [appointmentId, expectedRole]);
  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        generation.current++;
      };
    }, [reload]),
  );
  async function run(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await work();
    } catch (e) {
      Alert.alert("Unable to continue", errorText(e));
    } finally {
      await reload();
      lock.current = false;
      setBusy(false);
    }
  }
  async function send(
    kind: string,
    payload: Record<string, unknown> = {},
  ): Promise<ActionResult> {
    const result = await mutateInspectionFlow(appointmentId, kind, {
      ...payload,
      revision: flow!.revision,
    });
    setFlow(result.flow);
    return result;
  }
  if (loading && !flow)
    return (
      <View style={s.card}>
        <ActivityIndicator />
        <Text>Loading inspection…</Text>
      </View>
    );
  if (error || !flow)
    return (
      <View style={s.card}>
        <Text style={s.error}>{error || "Inspection unavailable."}</Text>
        <ActionButton
          title="Reload"
          disabled={busy}
          onPress={() => {
            void reload();
          }}
        />
      </View>
    );
  const f = flow;
  const c = f.capabilities;
  const disabled = busy || loading;
  const input = {
    editable: !disabled,
    style: s.input,
    placeholderTextColor: "#64748b",
    maxLength: 2000,
  };
  const beneficiary = () =>
    router.push(
      `/property-payment/lister/add-beneficiary?appointmentId=${appointmentId}` as never,
    );
  async function arrival() {
    await run(async () => {
      const grant = await Location.requestForegroundPermissionsAsync();
      if (grant.status !== "granted")
        throw new Error(
          "Allow precise location access to record arrival at the property.",
        );
      const p = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (
        p.mocked ||
        p.coords.accuracy === null ||
        p.coords.accuracy > 150 ||
        Date.now() - p.timestamp > 120000
      )
        throw new Error(
          "A fresh, precise location at the property is required. Try again outside.",
        );
      await send("arrival", {
        captured_latitude: p.coords.latitude,
        captured_longitude: p.coords.longitude,
        accuracy_metres: p.coords.accuracy,
        captured_at: new Date(p.timestamp).toISOString(),
        mocked: p.mocked ?? false,
      });
    });
  }
  async function submitReport() {
    await run(async () => {
      const result = await send("report", {
        outcome,
        reason_code: outcome === "not_completed" ? reason : null,
        explanation,
        property_rating: propertyRating || null,
        property_review: propertyReview,
        lister_rating: listerRating || null,
        lister_review: listerReview,
        attendee_rating: attendeeRating || null,
        attendee_review: attendeeReview,
        questionnaire: {
          punctuality,
          conduct,
          listing_accuracy: listingAccuracy,
        },
      });
      if (result.redirect && f.viewer_role === "lister") beneficiary();
    });
  }
  async function payment(decide: boolean) {
    await run(async () => {
      const current = decide
        ? (
            await send("decision", {
              report_id: f.report!.id,
              decision: "proceed",
              note: null,
            })
          ).flow
        : f;
      const settlement = await prepareInspectionSettlement(
        appointmentId,
        current.revision,
      );
      router.push(`/property-payment/${settlement.settlement_id}` as never);
    });
  }
  return (
    <View style={s.card}>
      <Text style={s.title}>Inspection and payment</Text>
      <Text style={s.text}>{f.message}</Text>
      {f.inspection_method ? (
        <Text style={s.label}>
          Inspector: {f.attendee_name}
          {f.delegation ? ` (${f.delegation.status})` : ""}
        </Text>
      ) : null}
      {c.can_manage_delegation && (
        <View style={s.panel}>
          <Text style={s.subtitle}>Who will attend the inspection?</Text>
          <ActionButton
            title="I will attend personally"
            disabled={disabled}
            onPress={() => {
              void run(async () => {
                await send("personal");
                setInvitationUrl("");
              });
            }}
          />
          <Text style={s.label}>Or authorise a representative</Text>
          <View style={s.row}>
            <ActionButton
              title={`${delegateType === "guest" ? "✓ " : ""}Relative / guest`}
              disabled={disabled}
              onPress={() => setDelegateType("guest")}
            />
            <ActionButton
              title={`${delegateType === "registered" ? "✓ " : ""}OHLAM user`}
              disabled={disabled}
              onPress={() => setDelegateType("registered")}
            />
          </View>
          <TextInput
            {...input}
            placeholder="Representative name"
            value={name}
            onChangeText={setName}
            maxLength={255}
          />
          <TextInput
            {...input}
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={40}
          />
          {delegateType === "registered" && (
            <TextInput
              {...input}
              placeholder="OHLAM user ID"
              value={userId}
              onChangeText={setUserId}
              keyboardType="number-pad"
              maxLength={20}
            />
          )}
          <ActionButton
            title={`${permission ? "✓ " : ""}I have permission to share their contact details`}
            disabled={disabled}
            onPress={() => setPermission(!permission)}
          />
          <ActionButton
            title={
              f.delegation
                ? "Replace representative and send new invitation"
                : "Authorise representative"
            }
            disabled={
              disabled ||
              !name.trim() ||
              !phone.trim() ||
              !permission ||
              (delegateType === "registered" && !/^\d+$/.test(userId))
            }
            onPress={() => {
              void run(async () => {
                const r = await send("delegation", {
                  representative_type: delegateType,
                  representative_name: name.trim(),
                  representative_phone: phone.trim(),
                  representative_user_id:
                    delegateType === "registered" ? Number(userId) : null,
                  contact_permission_confirmed: true,
                });
                setInvitationUrl(r.guest_invitation_url ?? "");
                if (!r.guest_invitation_url)
                  Alert.alert(
                    "Invitation sent",
                    "The OHLAM user has been notified. They must accept before submitting the inspection report.",
                  );
              });
            }}
          />
          {invitationUrl ? (
            <>
              <Text>
                Share this private invitation with your representative.
                Replacing the representative revokes the previous link.
              </Text>
              <ActionButton
                title="Share guest invitation"
                disabled={disabled}
                onPress={() => {
                  void Share.share({
                    message: `You are invited to inspect ${f.property_label} on my behalf: ${invitationUrl}`,
                  });
                }}
              />
            </>
          ) : null}
        </View>
      )}
      {c.can_accept_delegation && (
        <ActionButton
          title="Accept inspection invitation"
          disabled={disabled}
          onPress={() => {
            void run(async () => {
              await send("accept-delegation");
            });
          }}
        />
      )}
      {c.can_decline_delegation && (
        <ActionButton
          title="Decline inspection invitation"
          disabled={disabled}
          onPress={() => {
            void run(async () => {
              await send("decline-delegation");
            });
          }}
        />
      )}
      {c.can_record_arrival && (
        <ActionButton
          title="Record arrival at the property"
          disabled={disabled}
          onPress={() => {
            void arrival();
          }}
        />
      )}
      {f.attendance && <Text style={s.label}>✓ {f.attendance.message}</Text>}
      {c.can_submit_report && (
        <View style={s.panel}>
          <Text style={s.subtitle}>
            {f.viewer_role === "lister"
              ? `Report about ${f.attendee_name}`
              : "Your inspection report"}
          </Text>
          <View style={s.row}>
            <ActionButton
              title={`${outcome === "completed" ? "✓ " : ""}Completed`}
              disabled={disabled}
              onPress={() => setOutcome("completed")}
            />
            <ActionButton
              title={`${outcome === "not_completed" ? "✓ " : ""}Not completed`}
              disabled={disabled}
              onPress={() => setOutcome("not_completed")}
            />
          </View>
          {outcome === "not_completed" && (
            <>
              <Text style={s.label}>Choose a reason</Text>
              {f.reasons.map((r) => (
                <ActionButton
                  key={r.code}
                  title={`${reason === r.code ? "✓ " : ""}${r.name}`}
                  disabled={disabled}
                  onPress={() => setReason(r.code)}
                />
              ))}
            </>
          )}
          <TextInput
            {...input}
            multiline
            placeholder="Explain the inspection outcome"
            value={explanation}
            onChangeText={setExplanation}
          />
          {outcome === "completed" &&
            (f.viewer_role === "lister" ? (
              <>
                <Rating
                  label={`Attendee: ${f.attendee_name}`}
                  value={attendeeRating}
                  onChange={setAttendeeRating}
                  disabled={disabled}
                />
                <TextInput
                  {...input}
                  multiline
                  placeholder="Review the attendee's conduct"
                  value={attendeeReview}
                  onChangeText={setAttendeeReview}
                />
              </>
            ) : (
              <>
                <Rating
                  label="Property rating"
                  value={propertyRating}
                  onChange={setPropertyRating}
                  disabled={disabled}
                />
                <TextInput
                  {...input}
                  multiline
                  placeholder="Property review"
                  value={propertyReview}
                  onChangeText={setPropertyReview}
                />
                <Rating
                  label="Lister rating"
                  value={listerRating}
                  onChange={setListerRating}
                  disabled={disabled}
                />
                <TextInput
                  {...input}
                  multiline
                  placeholder="Lister review"
                  value={listerReview}
                  onChangeText={setListerReview}
                />
              </>
            ))}
          <TextInput
            {...input}
            placeholder="Was the other person punctual?"
            value={punctuality}
            onChangeText={setPunctuality}
            maxLength={200}
          />
          <TextInput
            {...input}
            multiline
            placeholder="Conduct during the inspection"
            value={conduct}
            onChangeText={setConduct}
          />
          {f.viewer_role !== "lister" && (
            <TextInput
              {...input}
              multiline
              placeholder="Did the property match its listing?"
              value={listingAccuracy}
              onChangeText={setListingAccuracy}
            />
          )}
          <ActionButton
            title="Submit inspection report"
            disabled={
              disabled ||
              (outcome === "completed" && !f.attendance) ||
              (outcome === "not_completed" && (!reason || !explanation.trim()))
            }
            onPress={() =>
              Alert.alert(
                "Submit report?",
                "Check your report before submitting. Submitted reports are retained for review.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Submit",
                    onPress: () => {
                      void submitReport();
                    },
                  },
                ],
              )
            }
          />
        </View>
      )}
      <ReportView title="Inspector report" report={f.report} />
      <ReportView
        title="Lister report about the attendee"
        report={f.lister_report}
      />
      {c.can_make_decision && (
        <View style={s.panel}>
          <Text style={s.subtitle}>Your decision as the customer</Text>
          {c.can_proceed && (
            <ActionButton
              title="Proceed to payment"
              disabled={disabled}
              onPress={() => {
                void payment(true);
              }}
            />
          )}
          {!c.can_proceed && (
            <Text>
              Payment is unavailable because the inspection was not completed or
              the reports conflict.
            </Text>
          )}
          <ActionButton
            title="I don't want the property"
            disabled={disabled}
            onPress={() =>
              Alert.alert(
                "Decline this property?",
                "This records your decision not to proceed with payment.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Decline",
                    onPress: () => {
                      void run(async () => {
                        await send("decision", {
                          report_id: f.report!.id,
                          decision: "decline",
                          note: null,
                        });
                      });
                    },
                  },
                ],
              )
            }
          />
        </View>
      )}
      {f.customer_decision && (
        <Text style={s.label}>
          Customer decision:{" "}
          {f.customer_decision.decision === "proceed"
            ? "Proceed with payment"
            : "Not proceeding with this property"}
        </Text>
      )}
      {f.can_proceed_to_payment && (
        <ActionButton
          title={
            f.payment_status === "property_payment_secured"
              ? "View payment receipt"
              : "Open payment review"
          }
          disabled={disabled}
          onPress={() => {
            void payment(false);
          }}
        />
      )}
      {c.can_manage_beneficiary && (
        <ActionButton
          title={
            f.beneficiary_confirmed
              ? "View confirmed beneficiary"
              : "Provide or confirm beneficiary details"
          }
          disabled={disabled}
          onPress={beneficiary}
        />
      )}
      {f.payment_status === "property_payment_secured" && (
        <Text style={s.label}>Payment received and secured.</Text>
      )}
      <ActionButton
        title="Refresh inspection status"
        disabled={disabled}
        onPress={() => {
          void reload();
        }}
      />
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginVertical: 12,
    gap: 10,
  },
  panel: { padding: 14, backgroundColor: "#f1f5f9", borderRadius: 10, gap: 8 },
  title: { fontSize: 21, fontWeight: "700", color: "#14532d" },
  subtitle: { fontSize: 17, fontWeight: "600" },
  text: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 15, fontWeight: "600", marginVertical: 6 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: {
    backgroundColor: "#fff",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    color: "#0f172a",
  },
  button: {
    backgroundColor: "#166534",
    padding: 13,
    borderRadius: 8,
    marginVertical: 4,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  disabled: { opacity: 0.45 },
  rating: { padding: 10, backgroundColor: "#fef3c7", borderRadius: 6 },
  error: { color: "#b91c1c" },
});
