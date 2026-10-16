import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, View, ViewProps } from "react-native";

/** Account for the actual banner/header position instead of a fixed offset. */
export default function ChatKeyboardAvoidingView({ children, style, ...props }: ViewProps) {
  const frame = useRef<View>(null);
  const [top, setTop] = useState(0);
  const [visibleHeight, setVisibleHeight] = useState<number>();

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      setVisibleHeight(Math.max(0, viewport.height + viewport.offsetTop - top));
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [top]);

  return (
    <View
      {...props}
      ref={frame}
      collapsable={false}
      style={[{ flex: 1, minHeight: 0 }, style, visibleHeight !== undefined && { maxHeight: visibleHeight }]}
      onLayout={() => {
        frame.current?.measureInWindow((_x, y) => setTop(y));
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, minHeight: 0 }}
        enabled={Platform.OS !== "web"}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={top}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}
