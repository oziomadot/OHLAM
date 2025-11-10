import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function AppStart() {
  useEffect(() => {
    const getReferrer = async () => {
      try {
        const referrer = await Application.getInstallReferrerAsync();
        console.log("Install Referrer:", referrer);
if (Platform.OS === 'android') {
        // Example referrer: "utm_source=google-play&utm_medium=organic&referral_code=ABC123"
        if (referrer && referrer.includes("referral_code=")) {
          const code = referrer.split("referral_code=")[1].split("&")[0];
          await AsyncStorage.setItem("referral_code", code);
          console.log("Referral code saved:", code);
        }

        } else {
  console.log("Install referrer not supported on iOS");
}
      } catch (err) {
        console.log("Error getting referrer:", err);
      }
    };

    getReferrer();
  }, []);

  return null; // your normal screen component
}
