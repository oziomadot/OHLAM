import React, { useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type SelectOption<T extends string | number> = {
  label: string;
  value: T;
};

type AppSelectProps<T extends string | number> = {
  label: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  searchable?: boolean;
  testID?: string;
};

export default function AppSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  allowClear = false,
  clearLabel = "Clear selection",
  searchable = false,
  testID,
}: AppSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? options.filter((option) => option.label.toLowerCase().includes(query))
      : options;
  }, [options, search]);

  const close = () => {
    Keyboard.dismiss();
    setSearch("");
    setOpen(false);
  };

  const select = (nextValue: T | null) => {
    onChange(nextValue);
    close();
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label + ": " + (selectedOption?.label ?? placeholder)}
        accessibilityState={{ disabled }}
        activeOpacity={0.8}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, disabled && styles.disabled]}
      >
        <Text
          style={[styles.fieldText, !selectedOption && styles.placeholder]}
          numberOfLines={1}
        >
          {selectedOption?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#1d3555" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityLabel="Close selection"
            accessibilityRole="button"
            style={StyleSheet.absoluteFill}
            onPress={close}
          />
          <SafeAreaView style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={close}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={23} color="#1d3555" />
              </TouchableOpacity>
            </View>

            {searchable && (
              <TextInput
                autoCorrect={false}
                accessibilityLabel={"Search " + label}
                placeholder="Search options..."
                placeholderTextColor="#64748b"
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
            )}

            {allowClear && (
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.optionRow}
                onPress={() => select(null)}
              >
                <Text style={[styles.optionText, value === null && styles.selectedText]}>
                  {clearLabel}
                </Text>
                {value === null && <Ionicons name="checkmark" size={20} color="#1d59aa" />}
              </TouchableOpacity>
            )}

            <FlatList
              keyboardShouldPersistTaps="handled"
              data={filteredOptions}
              keyExtractor={(item) => String(item.value)}
              style={styles.optionsList}
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.optionRow, selected && styles.optionSelected]}
                    onPress={() => select(item.value)}
                  >
                    <Text style={[styles.optionText, selected && styles.selectedText]}>
                      {item.label}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={20} color="#1d59aa" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>No matching options found.</Text>}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { color: "#0f2747", fontSize: 15, fontWeight: "700", marginBottom: 7 },
  field: {
    minHeight: 50, backgroundColor: "#ffffff", borderColor: "#d3dce9",
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14,
    alignItems: "center", justifyContent: "space-between", flexDirection: "row",
  },
  fieldText: { color: "#0f2747", fontSize: 16, flexShrink: 1, flexGrow: 1 },
  placeholder: { color: "#64748b" },
  disabled: { opacity: 0.55 },
  overlay: {
    flex: 1, backgroundColor: "rgba(9, 23, 43, 0.60)",
    justifyContent: "center", paddingHorizontal: 18, paddingVertical: 32,
  },
  modalCard: {
    backgroundColor: "#ffffff", borderRadius: 16, maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0", flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f2747", flex: 1 },
  closeButton: { padding: 6 },
  searchInput: {
    color: "#0f2747", backgroundColor: "#ffffff", borderWidth: 1,
    borderColor: "#d3dce9", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, margin: 12, fontSize: 16,
  },
  optionsList: { flexGrow: 0 },
  optionRow: {
    minHeight: 50, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: "#ffffff", flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e2e8f0",
  },
  optionSelected: { backgroundColor: "#e8f2ff" },
  optionText: { flexShrink: 1, color: "#0f2747", fontSize: 16 },
  selectedText: { fontWeight: "700", color: "#1d59aa" },
  emptyText: { padding: 20, textAlign: "center", color: "#64748b" },
});
