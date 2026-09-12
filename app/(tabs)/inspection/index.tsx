import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";

import API from "@/src/services/api";
import Protected from "components/Protected";
import ScreenWrapper from "components/ScreenWrapper";

type Role = "customer" | "lister";
type Outcome =
  | "inspection_completed"
  | "inspection_not_completed";

type YesNo = "yes" | "no" | null;

type DiscrepancySeverity =
  | "minor"
  | "moderate"
  | "major"
  | "suspected_fraud"
  | null;

type Reason = {
  id: number;
  name: string;
  code: string;
};

type SelectedPhoto = {
  uri: string;
  name: string;
  type: string;
};

type InspectionAnswers = {
  arrived_on_time: YesNo;
  minutes_late: string;
  apologised: YesNo;
  late_reason: string;

  interaction_friendly: YesNo;
  unfriendly_explanation: string;

  property_matches_listing: YesNo;
  discrepancy_severity: DiscrepancySeverity;
  discrepancy_explanation: string;
};

type RatingProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

type YesNoQuestionProps = {
  label: string;
  value: YesNo;
  onChange: (value: Exclude<YesNo, null>) => void;
};

function Rating({
  label,
  value,
  onChange,
}: RatingProps) {
  return (
    <View style={styles.ratingBlock}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${star} stars`}
          >
            <MaterialCommunityIcons
              name={star <= value ? "star" : "star-outline"}
              size={34}
              color="#f59e0b"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function YesNoQuestion({
  label,
  value,
  onChange,
}: YesNoQuestionProps) {
  return (
    <View style={styles.questionBlock}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row}>
        {(["yes", "no"] as const).map((option) => {
          const selected = value === option;

          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.choice,
                selected && styles.choiceActive,
              ]}
              onPress={() => onChange(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text
                style={
                  selected
                    ? styles.choiceTextActive
                    : styles.choiceText
                }
              >
                {option === "yes" ? "Yes" : "No"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function getPhotoName(uri: string, index: number): string {
  const uriName = uri.split("/").pop();

  if (uriName && uriName.includes(".")) {
    return uriName;
  }

  return `inspection-evidence-${Date.now()}-${index}.jpg`;
}

function getPhotoMimeType(
  uri: string,
  mimeType?: string | null
): string {
  if (mimeType) {
    return mimeType;
  }

  const extension = uri.split(".").pop()?.toLowerCase();

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

export default function AppointmentInspectionScreen() {
  const router = useRouter();

  const rawAppointmentId =
    useLocalSearchParams<{
      appointmentId?: string | string[];
    }>().appointmentId;

  const appointmentId = Array.isArray(rawAppointmentId)
    ? rawAppointmentId[0]
    : rawAppointmentId;

  const [appointment, setAppointment] = useState<any>(null);
  const [role, setRole] = useState<Role>("customer");
  const [reasons, setReasons] = useState<Reason[]>([]);

  const [outcome, setOutcome] = useState<Outcome>(
    "inspection_completed"
  );

  const [reasonCode, setReasonCode] = useState("");
  const [explanation, setExplanation] = useState("");

  const [answers, setAnswers] =
    useState<InspectionAnswers>({
      arrived_on_time: null,
      minutes_late: "",
      apologised: null,
      late_reason: "",

      interaction_friendly: null,
      unfriendly_explanation: "",

      property_matches_listing: null,
      discrepancy_severity: null,
      discrepancy_explanation: "",
    });

  const [propertyRating, setPropertyRating] = useState(0);
  const [personRating, setPersonRating] = useState(0);

  const [
    inspectionExperienceRating,
    setInspectionExperienceRating,
  ] = useState(0);

  const [
    ohlamServiceRating,
    setOhlamServiceRating,
  ] = useState(0);

  const [evidencePhotos, setEvidencePhotos] = useState<
    SelectedPhoto[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const completed = outcome === "inspection_completed";
  const otherParty =
    role === "lister" ? "customer" : "lister";

  const load = useCallback(async () => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }

    try {
      const [detailResponse, inspectionResponse] =
        await Promise.all([
          API.getAppointment(appointmentId),
          API.getAppointmentInspection(appointmentId),
        ]);

      const detail =
        detailResponse?.data?.data ??
        detailResponse?.data ??
        detailResponse?.appointment ??
        null;

      const viewerRole =
        detailResponse?.data?.viewer_role ??
        detailResponse?.viewer_role;

      const inspectionData =
        inspectionResponse?.data?.data ??
        inspectionResponse?.data ??
        {};

      setAppointment(detail);

      setRole(
        viewerRole === "lister" ? "lister" : "customer"
      );

      setReasons(inspectionData?.reasons ?? []);
    } catch (error: any) {
      Alert.alert(
        "Unable to load inspection",
        error?.response?.data?.message ??
          error?.message ??
          "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const completedFormValid = useMemo(() => {
    if (!answers.arrived_on_time) {
      return false;
    }

    if (answers.arrived_on_time === "no") {
      const minutesLate = Number(answers.minutes_late);

      if (
        !answers.minutes_late ||
        !Number.isInteger(minutesLate) ||
        minutesLate < 1
      ) {
        return false;
      }

      if (!answers.apologised) {
        return false;
      }

      if (!answers.late_reason.trim()) {
        return false;
      }
    }

    if (!answers.interaction_friendly) {
      return false;
    }

    if (
      answers.interaction_friendly === "no" &&
      !answers.unfriendly_explanation.trim()
    ) {
      return false;
    }

    if (
      personRating < 1 ||
      inspectionExperienceRating < 1 ||
      ohlamServiceRating < 1
    ) {
      return false;
    }

    if (role === "customer") {
      if (!answers.property_matches_listing) {
        return false;
      }

      if (propertyRating < 1) {
        return false;
      }

      if (answers.property_matches_listing === "no") {
        if (!answers.discrepancy_severity) {
          return false;
        }

        if (!answers.discrepancy_explanation.trim()) {
          return false;
        }

        if (evidencePhotos.length < 1) {
          return false;
        }
      }
    }

    return true;
  }, [
    answers,
    evidencePhotos.length,
    inspectionExperienceRating,
    ohlamServiceRating,
    personRating,
    propertyRating,
    role,
  ]);

  const valid = completed
    ? completedFormValid
    : Boolean(reasonCode);

  const selectEvidencePhotos = async () => {
    if (evidencePhotos.length >= 5) {
      Alert.alert(
        "Maximum reached",
        "You can attach a maximum of 5 photos."
      );
      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Allow OHLAM to access your photos before attaching evidence."
      );
      return;
    }

    const remaining = 5 - evidencePhotos.length;

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });

    if (result.canceled) {
      return;
    }

    const selected = result.assets
      .slice(0, remaining)
      .map((asset, index) => ({
        uri: asset.uri,
        name:
          asset.fileName ??
          getPhotoName(asset.uri, index),
        type: getPhotoMimeType(
          asset.uri,
          asset.mimeType
        ),
      }));

    setEvidencePhotos((current) => [
      ...current,
      ...selected,
    ].slice(0, 5));
  };

  const takeEvidencePhoto = async () => {
    if (evidencePhotos.length >= 5) {
      Alert.alert(
        "Maximum reached",
        "You can attach a maximum of 5 photos."
      );
      return;
    }

    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Allow OHLAM to use the camera before taking evidence photos."
      );
      return;
    }

    const result =
      await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    setEvidencePhotos((current) => [
      ...current,
      {
        uri: asset.uri,
        name:
          asset.fileName ??
          getPhotoName(asset.uri, current.length),
        type: getPhotoMimeType(
          asset.uri,
          asset.mimeType
        ),
      },
    ].slice(0, 5));
  };

  const removeEvidencePhoto = (index: number) => {
    setEvidencePhotos((current) =>
      current.filter((_, photoIndex) => photoIndex !== index)
    );
  };

  const submit = async () => {
    if (
      !appointmentId ||
      !appointment ||
      !valid ||
      submitting
    ) {
      return;
    }

    try {
      setSubmitting(true);

      let latitude: number | null = null;
      let longitude: number | null = null;
      let accuracyMetres: number | null = null;
      let capturedAt: string | null = null;

      if (completed) {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          throw new Error(
            "Precise location permission is required to confirm a completed inspection."
          );
        }

        const position =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        accuracyMetres =
          position.coords.accuracy ?? 999;

        capturedAt = new Date(
          position.timestamp
        ).toISOString();
      }

      const reviews = completed
        ? [
            {
              subject_type: "user",
              subject_id:
                role === "customer"
                  ? appointment.lister_id
                  : appointment.customer_id,
              rating: personRating,
            },
            ...(role === "customer"
              ? [
                  {
                    subject_type: "property",
                    subject_id: appointment.property_id,
                    rating: propertyRating,
                  },
                ]
              : []),
          ]
        : [];

      const questionnaire = completed
        ? {
            arrived_on_time:
              answers.arrived_on_time,

            minutes_late:
              answers.arrived_on_time === "no"
                ? Number(answers.minutes_late)
                : null,

            apologised:
              answers.arrived_on_time === "no"
                ? answers.apologised
                : null,

            late_reason:
              answers.arrived_on_time === "no"
                ? answers.late_reason.trim()
                : null,

            interaction_friendly:
              answers.interaction_friendly,

            unfriendly_explanation:
              answers.interaction_friendly === "no"
                ? answers.unfriendly_explanation.trim()
                : null,

            property_matches_listing:
              role === "customer"
                ? answers.property_matches_listing
                : null,

            discrepancy_severity:
              role === "customer" &&
              answers.property_matches_listing === "no"
                ? answers.discrepancy_severity
                : null,

            discrepancy_explanation:
              role === "customer" &&
              answers.property_matches_listing === "no"
                ? answers.discrepancy_explanation.trim()
                : null,
          }
        : null;

      const formData = new FormData();

      formData.append("outcome_code", outcome);

      if (!completed) {
        formData.append("reason_code", reasonCode);
      }

      if (explanation.trim()) {
        formData.append(
          "explanation",
          explanation.trim()
        );
      }

      if (questionnaire) {
        formData.append(
          "questionnaire",
          JSON.stringify(questionnaire)
        );
      }

      formData.append(
        "reviews",
        JSON.stringify(reviews)
      );

      if (completed) {
        formData.append(
          "inspection_experience_rating",
          String(inspectionExperienceRating)
        );

        formData.append(
          "ohlam_service_rating",
          String(ohlamServiceRating)
        );

        formData.append("latitude", String(latitude));
        formData.append("longitude", String(longitude));

        formData.append(
          "accuracy_metres",
          String(accuracyMetres)
        );

        formData.append(
          "captured_at",
          String(capturedAt)
        );
      }

      evidencePhotos.forEach((photo) => {
        formData.append(
          "evidence_photos[]",
          {
            uri: photo.uri,
            name: photo.name,
            type: photo.type,
          } as any
        );
      });

      await API.submitAppointmentInspection(
        appointmentId,
        formData
      );

      Alert.alert(
        "Submitted",
        "Your inspection report has been recorded.",
        [
          {
            text: "OK",
            onPress: () =>
              router.replace(
                `/appointment/${appointmentId}` as never
              ),
          },
        ]
      );
    } catch (error: any) {
      const validationErrors =
        error?.response?.data?.errors;

      const message = validationErrors
        ? Object.values(validationErrors)
            .flat()
            .join("\n")
        : error?.response?.data?.message ??
          error?.message ??
          "An unexpected error occurred.";

      Alert.alert("Could not submit", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Protected>
        <ScreenWrapper>
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        </ScreenWrapper>
      </Protected>
    );
  }

  if (!appointmentId || !appointment) {
    return (
      <Protected>
        <ScreenWrapper>
          <View style={styles.center}>
            <Text style={styles.errorText}>
              The appointment could not be found.
            </Text>
          </View>
        </ScreenWrapper>
      </Protected>
    );
  }

  return (
    <Protected>
      <ScreenWrapper>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            Inspection outcome
          </Text>

          <Text style={styles.notice}>
            {role === "lister"
              ? "Submit an honest account of the inspection. The customer must also submit their own report."
              : "Submit this report at the property. OHLAM will check your current GPS location."}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Was the inspection completed?
            </Text>

            <View style={styles.row}>
              {[
                {
                  code: "inspection_completed",
                  label: "Yes",
                },
                {
                  code: "inspection_not_completed",
                  label: "No",
                },
              ].map((option) => {
                const selected =
                  outcome === option.code;

                return (
                  <TouchableOpacity
                    key={option.code}
                    style={[
                      styles.choice,
                      selected &&
                        styles.choiceActive,
                    ]}
                    onPress={() =>
                      setOutcome(
                        option.code as Outcome
                      )
                    }
                  >
                    <Text
                      style={
                        selected
                          ? styles.choiceTextActive
                          : styles.choiceText
                      }
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {!completed ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Why was it not completed?
              </Text>

              {reasons.length === 0 ? (
                <Text style={styles.helperText}>
                  No reasons are currently available.
                </Text>
              ) : (
                reasons.map((reason) => {
                  const selected =
                    reasonCode === reason.code;

                  return (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.reason,
                        selected &&
                          styles.reasonActive,
                      ]}
                      onPress={() =>
                        setReasonCode(reason.code)
                      }
                    >
                      <Text style={styles.reasonText}>
                        {reason.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Attendance and conduct
                </Text>

                <YesNoQuestion
                  label={`Did the ${otherParty} arrive at the meeting point on time?`}
                  value={answers.arrived_on_time}
                  onChange={(value) =>
                    setAnswers((current) => ({
                      ...current,
                      arrived_on_time: value,
                      minutes_late:
                        value === "yes"
                          ? ""
                          : current.minutes_late,
                      apologised:
                        value === "yes"
                          ? null
                          : current.apologised,
                      late_reason:
                        value === "yes"
                          ? ""
                          : current.late_reason,
                    }))
                  }
                />

                {answers.arrived_on_time ===
                  "no" && (
                  <>
                    <Text style={styles.label}>
                      How many minutes late?
                    </Text>

                    <TextInput
                      style={styles.shortInput}
                      keyboardType="number-pad"
                      maxLength={3}
                      value={answers.minutes_late}
                      onChangeText={(value) =>
                        setAnswers((current) => ({
                          ...current,
                          minutes_late:
                            value.replace(
                              /\D/g,
                              ""
                            ),
                        }))
                      }
                      placeholder="For example, 15"
                    />

                    <YesNoQuestion
                      label={`Did the ${otherParty} apologise?`}
                      value={answers.apologised}
                      onChange={(value) =>
                        setAnswers((current) => ({
                          ...current,
                          apologised: value,
                        }))
                      }
                    />

                    <Text style={styles.label}>
                      What reason did the{" "}
                      {otherParty} give?
                    </Text>

                    <TextInput
                      style={styles.input}
                      multiline
                      maxLength={1000}
                      value={answers.late_reason}
                      onChangeText={(value) =>
                        setAnswers((current) => ({
                          ...current,
                          late_reason: value,
                        }))
                      }
                      placeholder="Enter the reason, or state that no reason was given"
                    />
                  </>
                )}

                <YesNoQuestion
                  label="Was the inspection interaction friendly and respectful?"
                  value={
                    answers.interaction_friendly
                  }
                  onChange={(value) =>
                    setAnswers((current) => ({
                      ...current,
                      interaction_friendly: value,
                      unfriendly_explanation:
                        value === "yes"
                          ? ""
                          : current.unfriendly_explanation,
                    }))
                  }
                />

                {answers.interaction_friendly ===
                  "no" && (
                  <>
                    <Text style={styles.label}>
                      Please explain what happened
                    </Text>

                    <TextInput
                      style={styles.input}
                      multiline
                      maxLength={2000}
                      value={
                        answers.unfriendly_explanation
                      }
                      onChangeText={(value) =>
                        setAnswers((current) => ({
                          ...current,
                          unfriendly_explanation:
                            value,
                        }))
                      }
                      placeholder="Describe the behaviour or incident"
                    />
                  </>
                )}
              </View>

              {role === "customer" && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Property assessment
                  </Text>

                  <YesNoQuestion
                    label="Did the property match what was shown in the online listing?"
                    value={
                      answers.property_matches_listing
                    }
                    onChange={(value) =>
                      setAnswers((current) => ({
                        ...current,
                        property_matches_listing:
                          value,
                        discrepancy_severity:
                          value === "yes"
                            ? null
                            : current.discrepancy_severity,
                        discrepancy_explanation:
                          value === "yes"
                            ? ""
                            : current.discrepancy_explanation,
                      }))
                    }
                  />

                  {answers.property_matches_listing ===
                    "no" && (
                    <>
                      <Text style={styles.label}>
                        How serious was the
                        discrepancy?
                      </Text>

                      {[
                        ["minor", "Minor"],
                        ["moderate", "Moderate"],
                        ["major", "Major"],
                        [
                          "suspected_fraud",
                          "Suspected fraud",
                        ],
                      ].map(([code, label]) => {
                        const selected =
                          answers.discrepancy_severity ===
                          code;

                        return (
                          <TouchableOpacity
                            key={code}
                            style={[
                              styles.reason,
                              selected &&
                                styles.reasonActive,
                            ]}
                            onPress={() =>
                              setAnswers(
                                (current) => ({
                                  ...current,
                                  discrepancy_severity:
                                    code as DiscrepancySeverity,
                                })
                              )
                            }
                          >
                            <Text
                              style={
                                styles.reasonText
                              }
                            >
                              {label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}

                      <Text style={styles.label}>
                        Describe the difference
                      </Text>

                      <TextInput
                        style={styles.input}
                        multiline
                        maxLength={2000}
                        value={
                          answers.discrepancy_explanation
                        }
                        onChangeText={(value) =>
                          setAnswers((current) => ({
                            ...current,
                            discrepancy_explanation:
                              value,
                          }))
                        }
                        placeholder="Explain how the property differed from the listing"
                      />

                      <Text style={styles.label}>
                        Photo evidence
                      </Text>

                      <Text style={styles.helperText}>
                        At least one photo is required
                        when the property does not match
                        the listing. Maximum: 5 photos.
                      </Text>

                      <View style={styles.photoActions}>
                        <TouchableOpacity
                          style={styles.secondaryButton}
                          onPress={() =>
                            void takeEvidencePhoto()
                          }
                        >
                          <MaterialCommunityIcons
                            name="camera"
                            size={21}
                            color="#2563eb"
                          />
                          <Text
                            style={
                              styles.secondaryButtonText
                            }
                          >
                            Take photo
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.secondaryButton}
                          onPress={() =>
                            void selectEvidencePhotos()
                          }
                        >
                          <MaterialCommunityIcons
                            name="image-multiple"
                            size={21}
                            color="#2563eb"
                          />
                          <Text
                            style={
                              styles.secondaryButtonText
                            }
                          >
                            Choose photos
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={
                          false
                        }
                      >
                        <View
                          style={styles.photoPreviewRow}
                        >
                          {evidencePhotos.map(
                            (photo, index) => (
                              <View
                                key={`${photo.uri}-${index}`}
                                style={
                                  styles.photoContainer
                                }
                              >
                                <Image
                                  source={{
                                    uri: photo.uri,
                                  }}
                                  style={
                                    styles.photoPreview
                                  }
                                />

                                <TouchableOpacity
                                  style={
                                    styles.removePhoto
                                  }
                                  onPress={() =>
                                    removeEvidencePhoto(
                                      index
                                    )
                                  }
                                >
                                  <MaterialCommunityIcons
                                    name="close"
                                    size={18}
                                    color="#ffffff"
                                  />
                                </TouchableOpacity>
                              </View>
                            )
                          )}
                        </View>
                      </ScrollView>
                    </>
                  )}

                  <Rating
                    label="Property rating"
                    value={propertyRating}
                    onChange={setPropertyRating}
                  />
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Ratings
                </Text>

                <Rating
                  label={
                    role === "customer"
                      ? "Lister rating"
                      : "Customer rating"
                  }
                  value={personRating}
                  onChange={setPersonRating}
                />

                <Rating
                  label="Inspection experience rating"
                  value={
                    inspectionExperienceRating
                  }
                  onChange={
                    setInspectionExperienceRating
                  }
                />

                <Rating
                  label="OHLAM service rating"
                  value={ohlamServiceRating}
                  onChange={
                    setOhlamServiceRating
                  }
                />
              </View>
            </>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>
              Additional details (optional)
            </Text>

            <TextInput
              style={styles.input}
              multiline
              maxLength={2000}
              value={explanation}
              onChangeText={setExplanation}
              placeholder="Add any other useful details"
            />
          </View>

          {!valid && (
            <Text style={styles.validationNotice}>
              Complete all required questions before
              submitting.
            </Text>
          )}

          <TouchableOpacity
            disabled={!valid || submitting}
            style={[
              styles.submit,
              (!valid || submitting) &&
                styles.disabled,
            ]}
            onPress={() => void submit()}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>
                Submit inspection report
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </ScreenWrapper>
    </Protected>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
  },

  notice: {
    color: "#92400e",
    backgroundColor: "#fffbeb",
    padding: 14,
    borderRadius: 12,
    lineHeight: 21,
  },

  section: {
    gap: 14,
    padding: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0f172a",
  },

  questionBlock: {
    gap: 8,
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  choice: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    alignItems: "center",
  },

  choiceActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },

  choiceText: {
    color: "#334155",
    fontWeight: "700",
  },

  choiceTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },

  label: {
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },

  helperText: {
    color: "#64748b",
    lineHeight: 20,
  },

  reason: {
    padding: 13,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
  },

  reasonActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },

  reasonText: {
    color: "#1e293b",
    fontWeight: "600",
  },

  ratingBlock: {
    gap: 4,
  },

  stars: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 12,
    textAlignVertical: "top",
    color: "#0f172a",
  },

  shortInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#0f172a",
  },

  photoActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  secondaryButtonText: {
    color: "#2563eb",
    fontWeight: "700",
  },

  photoPreviewRow: {
    flexDirection: "row",
    gap: 10,
  },

  photoContainer: {
    position: "relative",
  },

  photoPreview: {
    width: 110,
    height: 110,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },

  removePhoto: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
  },

  validationNotice: {
    color: "#b45309",
    textAlign: "center",
    fontWeight: "600",
  },

  submit: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  disabled: {
    opacity: 0.45,
  },

  submitText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  errorText: {
    color: "#b91c1c",
    textAlign: "center",
  },
});