import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "@/src/services/api";
import { WELCOME_SEEN_KEY } from "./welcome";

type Destination = "/welcome" | "/(tabs)/home" | "/(tabs)/properties/create";

export default function Index() {
  const [destination, setDestination] = useState<Destination | null>(null);

  useEffect(() => {
    let active = true;
    const determineDestination = async (): Promise<Destination> => {
      const [welcomeSeen, resumeUserId] = await Promise.all([
        AsyncStorage.getItem(WELCOME_SEEN_KEY),
        AsyncStorage.getItem("ohlam:resume-property-create:v1"),
      ]);

      if (welcomeSeen !== "1") return "/welcome";

      // Restore this one high-value workflow only after confirming that
      // an authenticated account matches the user that was editing it.
      if (resumeUserId) {
        try {
          const [token, savedUser] = await Promise.all([
            API.getToken(),
            AsyncStorage.getItem("user"),
          ]);
          const userId = savedUser ? String(JSON.parse(savedUser)?.id ?? "") : "";
          if (token && userId === resumeUserId) {
            return "/(tabs)/properties/create";
          }
        } catch {
          // Corrupt or stale recovery metadata must not block startup.
        }
        await AsyncStorage.removeItem("ohlam:resume-property-create:v1").catch(() => {});
      }
      return "/(tabs)/home";
    };
    determineDestination()
      .then(route => { if (active) setDestination(route); })
      .catch(() => { if (active) setDestination("/(tabs)/home"); });
    return () => { active = false; };
  }, []);

  if (!destination) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
