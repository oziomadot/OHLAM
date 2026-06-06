import React from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ViewStyle,
  StyleSheet,
} from "react-native";

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollStyle?: ViewStyle;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style, scrollStyle }) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, style]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.scroll, scrollStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
});

export default ScreenWrapper;
