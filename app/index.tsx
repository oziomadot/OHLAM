import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WELCOME_SEEN_KEY } from "./welcome";

export default function Index() {
  const [destination, setDestination] = useState<"/welcome" | "/(tabs)/home" | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(WELCOME_SEEN_KEY)
      .then((value) => {
        if (active) setDestination(value === "1" ? "/(tabs)/home" : "/welcome");
      })
      .catch(() => {
        // A storage failure should never prevent access to property listings.
        if (active) setDestination("/(tabs)/home");
      });
    return () => { active = false; };
  }, []);

  if (!destination) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator /></View>;
  }

  return <Redirect href={destination} />;
}
