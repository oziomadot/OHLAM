// components/CustomAlert.tsx
import React from "react";
import { Modal, View, Text, TouchableOpacity, Platform } from "react-native";

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
};

export default function CustomAlert({ visible, title, message, onClose }: Props) {
  if (!visible) return null;

  const content = (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        width: "80%",
        maxWidth: 480,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 16, color: "#444", marginBottom: 20 }}>
        {message}
      </Text>

      <TouchableOpacity
        onPress={onClose}
        style={{
          backgroundColor: "#007bff",
          borderRadius: 10,
          padding: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>OK</Text>
      </TouchableOpacity>
    </View>
  );

  if (Platform.OS === "web") {
    // Render as a portal-like overlay without Modal for web reliability
    return (
      <View
        style={{
          position: "fixed" as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: visible ? "flex" : "none",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 9999,
          pointerEvents: "auto",
        }}
      >
        {content}
      </View>
    );
  }

  // Native platforms: use Modal
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        {content}
      </View>
    </Modal>
  );
}
