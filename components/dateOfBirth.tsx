import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform, TextInput } from "react-native";
import { Controller } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";

const DOBPicker = ({ control, setValue }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateChange = (event, date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (date) {
      setSelectedDate(date);
      setValue("dob", date.toISOString().split("T")[0]);
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontWeight: "bold", marginBottom: 6 }}>Date of Birth</Text>

      <Controller
        control={control}
        name="dob"
        render={({ field: { value, onChange } }) => (
          <>
            {/* Web fallback */}
            {Platform.OS === "web" ? (
              <TextInput
                placeholder="Enter your date of birth (YYYY-MM-DD)"
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: "#f9f9f9",
                  color: "#333",
                }}
                value={value || ""}
                onChangeText={(text) => onChange(text)}
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowPicker(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    padding: 12,
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <Text style={{ color: value ? "#333" : "#999" }}>
                    {value ? value : "Select date"}
                  </Text>
                </TouchableOpacity>

                {showPicker && (
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, date) => {
                      handleDateChange(event, date);
                      if (date) onChange(date.toISOString().split("T")[0]);
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </>
            )}
          </>
        )}
      />
    </View>
  );
};

export default DOBPicker;
