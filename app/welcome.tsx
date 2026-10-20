import React, { useRef, useState } from "react";
import { Dimensions, FlatList, Image, ImageBackground, NativeScrollEvent, NativeSyntheticEvent, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export const WELCOME_SEEN_KEY = "ohlam_welcome_seen_v1";
const { width: WIDTH } = Dimensions.get("window");

// These are illustrative licensed Unsplash-hosted editorial images, not verified OHLAM listings.
// Replace with approved, locally bundled OHLAM campaign photography before production.
const slides = [
  { key: "market", eyebrow: "DISCOVER YOUR NEXT SPACE", title: "Find a place to call yours.", subtitle: "Explore houses and land for sale or rent across Nigeria.", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1100&q=85", icon: "home-city-outline" as const },
  { key: "verify", eyebrow: "VERIFY BEFORE YOU COMMIT", title: "Make more informed property decisions.", subtitle: "Physical checks, document investigations and professional verification services are being prepared.", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1100&q=85", icon: "shield-check-outline" as const },
  { key: "inspect", eyebrow: "CONNECT WITH CONFIDENCE", title: "From discovery to inspection.", subtitle: "Connect with listers and arrange property viewings through OHLAM.", image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1100&q=85", icon: "calendar-check-outline" as const },
];

export default function WelcomeScreen() {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);

  const finish = async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    try { await AsyncStorage.setItem(WELCOME_SEEN_KEY, "1"); }
    catch (error) { console.warn("Unable to save welcome preference", error); }
    finally { router.replace("/(tabs)/home"); }
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActive(Math.max(0, Math.min(slides.length - 1, Math.round(event.nativeEvent.contentOffset.x / WIDTH))));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102b35" />
      <FlatList
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <ImageBackground source={{ uri: item.image }} style={styles.hero} resizeMode="cover" imageStyle={styles.heroImage}>
              <View style={styles.heroShade}>
                <View style={styles.topBar}>
                  <View style={styles.brand}>
                    <Image source={require("../assets/images/adaptive-icon.png")} style={styles.brandLogo} resizeMode="contain" />
                    <Text style={styles.brandName}>OHLAM</Text>
                  </View>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Skip introduction" onPress={() => void finish()} style={styles.skipTop} disabled={leaving}>
                    <Text style={styles.skipTopText}>Skip  →</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.heroBottom}>
                  <View style={styles.pill}>
                    <MaterialCommunityIcons name={item.icon} size={16} color="#FFFFFF" />
                    <Text style={styles.pillText}>{item.eyebrow}</Text>
                  </View>
                  <Text style={styles.heroTitle}>{item.title}</Text>
                </View>
              </View>
            </ImageBackground>
            <View style={styles.details}>
              <Text style={styles.description}>{item.subtitle}</Text>
              <View style={styles.featureRow}>
                <MaterialCommunityIcons name="check-decagram-outline" size={20} color="#176A9C" />
                <Text style={styles.featureText}>Oramex House and Land Agency Management</Text>
              </View>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.indicators}>
          {slides.map((slide, index) => <View key={slide.key} style={[styles.dot, index === active && styles.activeDot]} />)}
        </View>
        <Text style={styles.swipeHint}>Swipe left to explore OHLAM services</Text>
        <TouchableOpacity style={styles.button} accessibilityRole="button" accessibilityLabel="Explore properties" onPress={() => void finish()} disabled={leaving}>
          <Text style={styles.buttonText}>{leaving ? "Opening..." : "Explore Properties"}</Text>
          <MaterialCommunityIcons name="arrow-right" color="#FFFFFF" size={22} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAF8" },
  page: { width: WIDTH, flex: 1, backgroundColor: "#F7FAF8" },
  hero: { height: "72%", minHeight: 340, backgroundColor: "#102B35" },
  heroImage: { width: "100%" },
  heroShade: { flex: 1, justifyContent: "space-between", backgroundColor: "rgba(3, 24, 32, 0.46)", paddingTop: 26, paddingBottom: 38, paddingHorizontal: 25 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandLogo: { width: 38, height: 38 },
  brandName: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", letterSpacing: 2 },
  skipTop: { backgroundColor: "rgba(0,0,0,0.27)", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 },
  skipTopText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  heroBottom: { gap: 16 },
  pill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#176A9C", paddingVertical: 9, paddingHorizontal: 13, borderRadius: 30 },
  pillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  heroTitle: { color: "#FFFFFF", fontSize: 36, lineHeight: 43, fontWeight: "900", maxWidth: 350 },
  details: { flex: 1, paddingHorizontal: 27, paddingTop: 19, justifyContent: "center", gap: 12 },
  description: { color: "#263E47", fontSize: 16, lineHeight: 23, fontWeight: "500" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 12, color: "#52646A", flexShrink: 1 },
  footer: { paddingHorizontal: 25, paddingBottom: 20, paddingTop: 6, backgroundColor: "#F7FAF8" },
  indicators: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 9 },
  dot: { height: 7, width: 7, borderRadius: 4, backgroundColor: "#BACCCA" },
  activeDot: { width: 25, backgroundColor: "#176A9C" },
  swipeHint: { textAlign: "center", color: "#6A7B80", fontSize: 12, marginBottom: 14 },
  button: { backgroundColor: "#176A9C", borderRadius: 14, paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 17 },
});
