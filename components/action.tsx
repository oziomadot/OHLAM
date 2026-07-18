import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import API from "@/src/services/api";

type PropertyStatus = "available" | "sold" | "rented" | "delete_requested" | string;

type Property = {
  id: number | string;
  address?: string;
  property_type?: string;
  category?: string;
  amount?: number | string;
  created_at?: string;
  status?: PropertyStatus | { name?: string };
};

type ActionType = "rented" | "sold" | "delete" | "edit" | "view";

type ActionProps = {
  property: Property;
  onStatusChanged?: () => void;
};

const actions: { label: string; value: ActionType }[] = [
  { label: "View Details", value: "view" },
  { label: "Edit Property", value: "edit" },
  { label: "Mark as Rented", value: "rented" },
  { label: "Mark as Sold", value: "sold" },
  { label: "Request Delete", value: "delete" },
];

export default function PropertyAction({ property, onStatusChanged }: ActionProps) {
  const router = useRouter();

  const [selectedAction, setSelectedAction] = useState<ActionType | "">("");
  const [loading, setLoading] = useState(false);
  const [deleteSubmitted, setDeleteSubmitted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const propertyId = property?.id;

  const status = useMemo(() => {
    if (typeof property?.status === "object") {
      return String(property.status?.name || "").toLowerCase();
    }

    return String(property?.status || "available").toLowerCase();
  }, [property]);

  const isSold = status === "sold";
  const isRented = status === "rented";
  const isDeleteRequested =
    status === "delete_requested" ||
    status === "delete requested" ||
    status === "pending_delete";

  const submitStatusChange = async (newStatus: "sold" | "rented") => {
    await API.propertyStatus(propertyId);

    Alert.alert(
      "Success",
      newStatus === "sold"
        ? "Property has been marked as sold."
        : "Property has been marked as rented."
    );

    onStatusChanged?.();
  };

  const submitDeleteRequest = async (reason: string) => {
    await API.deletePropertyRequest(propertyId, reason);

    setDeleteSubmitted(true);
    setShowDeleteModal(false);
    setDeleteReason("");
    onStatusChanged?.();
  };

  const handleSubmit = async () => {
    if (!propertyId) {
      Alert.alert("Error", "Property ID is missing.");
      return;
    }

    if (!selectedAction) {
      Alert.alert("Select an action", "Please choose an action first.");
      return;
    }

    if (selectedAction === "view") {
      router.push(`/(tabs)/properties/${propertyId}` as any);
      return;
    }

    if (selectedAction === "edit") {
      router.push(`/(tabs)/properties/update/${propertyId}` as any);
      return;
    }

    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${selectedAction.replace("_", " ")} this property?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: selectedAction === "delete" ? "destructive" : "default",
          onPress: async () => {
            try {
              setLoading(true);

              if (selectedAction === "sold") {
                await submitStatusChange("sold");
              }

              if (selectedAction === "rented") {
                await submitStatusChange("rented");
              }

              if (selectedAction === "delete") {
                setShowDeleteModal(true);
              }
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  error?.message ||
                  "Action failed."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isSold) {
    return (
      <View style={[styles.statusBox, styles.soldBox]}>
        <Text style={styles.statusTitle}>Sold</Text>
        <Text style={styles.statusText}>This property has already been sold.</Text>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => router.push(`/(tabs)/properties/${propertyId}` as any)}
        >
          <Text style={styles.smallButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isRented) {
    return (
      <View style={[styles.statusBox, styles.rentedBox]}>
        <Text style={styles.statusTitle}>Rented</Text>
        <Text style={styles.statusText}>This property has already been rented.</Text>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => router.push(`/(tabs)/properties/${propertyId}` as any)}
        >
          <Text style={styles.smallButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (deleteSubmitted || isDeleteRequested) {
    return (
      <View style={[styles.statusBox, styles.reviewBox]}>
        <Text style={styles.statusTitle}>Delete Request Submitted</Text>
        <Text style={styles.statusText}>
          Your request has been submitted and is under review.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <Text style={styles.label}>Property Action</Text> */}

      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedAction}
          onValueChange={(itemValue) =>
            setSelectedAction(itemValue as ActionType | "")
          }
        >
          <Picker.Item label="Select an action" value="" color="#999" />
          {actions.map((action) => (
            <Picker.Item
              key={action.value}
              label={action.label}
              value={action.value}
            />
          ))}
        </Picker>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit</Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Request Delete</Text>
            <Text style={styles.modalWarning}>
              Deleting properties will impact your trust scores.
            </Text>
            <Text style={styles.modalLabel}>Reason for deletion (required)</Text>
            <TextInput
              style={styles.modalInput}
              value={deleteReason}
              onChangeText={setDeleteReason}
              placeholder="Enter reason..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteReason("");
                }}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton, loading && styles.buttonDisabled]}
                onPress={async () => {
                  if (!deleteReason.trim()) {
                    Alert.alert("Required", "Please enter a reason for deletion.");
                    return;
                  }
                  setLoading(true);
                  try {
                    await submitDeleteRequest(deleteReason.trim());
                    Alert.alert("Success", "Delete request submitted for review.");
                  } catch (error: any) {
                    Alert.alert(
                      "Error",
                      error?.response?.data?.message ||
                        error?.message ||
                        "Delete request failed."
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    elevation: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 8,
    color: "#0f172a",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "900",
  },
  statusBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  soldBox: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
  },
  rentedBox: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  reviewBox: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 4,
  },
  statusText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
  },
  smallButton: {
    marginTop: 10,
    backgroundColor: "#0f172a",
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  smallButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
  },
  modalWarning: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 16,
    lineHeight: 19,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    minHeight: 80,
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 100,
  },
  modalCancelButton: {
    backgroundColor: "#e2e8f0",
  },
  modalSubmitButton: {
    backgroundColor: "#dc2626",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
});