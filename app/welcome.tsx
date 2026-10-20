import React, { useRef, useState } from "react";
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export const WELCOME_SEEN_KEY = "ohlam_welcome_seen_v1";
const WIDTH = Dimensions.get("window").width;
const slides = [
  { key: "market", icon: "home-city-outline" as const, title: "Find your next property", subtitle: "Discover homes and land to rent or buy across Nigeria." },
  { key: "verify", icon: "shield-check-outline" as const, title: "Investigate before you pay", subtitle: "Explore property visits, document checks and professional due diligence as these services become available." },
  { key: "inspect", icon: "calendar-check-outline" as const, title: "Connect and inspect", subtitle: "Contact listers and arrange property inspections through OHLAM." },
];

export default function WelcomeScreen() {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);

  const finish = async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    try {
      await AsyncStorage.setItem(WELCOME_SEEN_KEY, "1");
    } catch (error) {
      console.warn("Could not save OHLAM welcome preference", error);
    } finally {
      router.replace("/(tabs)/home");
    }
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActive(Math.max(0, Math.min(slides.length - 1, Math.round(event.nativeEvent.contentOffset.x / WIDTH))));
  };

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <MaterialCommunityIcons name="home-city" size={36} color="#ffffff" />
        <Text style={styles.brandTitle}>OHLAM</Text>
        <Text style={styles.brandSubtitle}>Property services by Oramex Globals Limited</Text>
      </View>
      <FlatList
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={item.icon} size={84} color="#0b5464" />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />
      <View style={styles.bottom}>
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View key={slide.key} style={[styles.dot, index === active && styles.activeDot]} />
          ))}
        </View>
        <Text style={styles.hint}>Swipe left to discover more services</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Explore properties" style={styles.button} onPress={() => void finish()} disabled={leaving}>
          <Text style={styles.buttonText}>{leaving ? "Opening..." : "Explore Properties"}</Text>
          <MaterialCommunityIcons name="arrow-right" size={21} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => void finish()} disabled={leaving} style={styles.skip}>
          <Text style={styles.skipText}>Skip introduction</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6faf9" },
  brand: { backgroundColor: "#0b5464", paddingTop: 30, paddingBottom: 22, paddingHorizontal: 24, alignItems: "center" },
  brandTitle: { color: "#ffffff", fontSize: 30, fontWeight: "800", letterSpacing: 3 },
  brandSubtitle: { color: "#e2f1f2", fontSize: 12, marginTop: 5, textAlign: "center" },
  slide: { width: WIDTH, paddingHorizontal: 34, alignItems: "center", justifyContent: "center" },
  iconCircle: { width: 192, height: 192, borderRadius: 96, backgroundColor: "#e3f3ed", alignItems: "center", justifyContent: "center", marginBottom: 30 },
  title: { fontSize: 25, fontWeight: "800", color: "#122b35", textAlign: "center", marginBottom: 16 },
  subtitle: { fontSize: 16, lineHeight: 24, color: "#52616b", textAlign: "center" },
  bottom: { paddingHorizontal: 24, paddingBottom: 24, alignItems: "center" },
  dots: { flexDirection: "row", gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#bdcece" },
  activeDot: { width: 24, backgroundColor: "#0b5464" },
  hint: { fontSize: 12, color: "#52616b", marginBottom: 16 },
  button: { width: "100%", borderRadius: 12, paddingVertical: 15, backgroundColor: "#0b5464", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12 },
  buttonText: { fontSize: 16, color: "#ffffff", fontWeight: "700" },
  skip: { padding: 12, marginTop: 7 },
  skipText: { fontSize: 13, color: "#52616b" },
});
