// app/(tabs)/games/test-svg.tsx
import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function TestSvg() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Svg height="100" width="100">
        <Circle cx="50" cy="50" r="45" stroke="blue" strokeWidth="2.5" fill="green" />
      </Svg>
    </View>
  );
}
