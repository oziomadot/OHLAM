import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, AppState, Linking, Modal, Platform,
  Pressable, StyleSheet, Text, View,
} from "react-native";
import * as Application from "expo-application";
import { API } from "@/src/services/api";
import { ENV } from "@/src/config/env";

type ReleaseStatus = {
  update_available: boolean;
  update_required: boolean;
  latest_version: string | null;
  latest_build: number;
  minimum_build: number;
  release_notes: string | null;
  store_url: string;
};

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.oramexglobals.ohlam";

export function AppUpdateGate() {
  const [release, setRelease] = useState<ReleaseStatus | null>(null);
  const [dismissedBuild, setDismissedBuild] = useState<number | null>(null);
  const [openingStore, setOpeningStore] = useState(false);
  const mounted = useRef(true);
  const running = useRef(false);

  const check = useCallback(async () => {
    if (Platform.OS !== "android" || ENV.APP_ENV !== "production" || __DEV__ || running.current) return;
    // Native build number is authoritative; EAS OTA JS version is not.
    const build = Number(Application.nativeBuildVersion);
    if (!Number.isSafeInteger(build) || build < 1) return;

    running.current = true;
    try {
      const { data } = await API.get<ReleaseStatus>("/app/release", {
        params: { platform: "android", build },
        timeout: 8000,
      });
      if (mounted.current && typeof data?.latest_build === "number"
          && typeof data?.minimum_build === "number"
          && typeof data?.update_available === "boolean"
          && typeof data?.update_required === "boolean") {
        setRelease(data);
      }
    } catch {
      // Fail open if backend or network is temporarily unavailable.
      // Do not strand users on a blank screen when offline.
    } finally {
      running.current = false;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void check();
    const sub = AppState.addEventListener("change", state => {
      if (state === "active") void check();
    });
    return () => {
      mounted.current = false;
      sub.remove();
    };
  }, [check]);

  const required = Boolean(release?.update_required);
  const visible = Boolean(release && (required ||
    (release.update_available && dismissedBuild !== release.latest_build)));

  const openStore = async () => {
    if (openingStore) return;
    setOpeningStore(true);
    try {
      // Do not open an arbitrary URL returned by a compromised API.
      await Linking.openURL(PLAY_STORE_URL);
    } catch {
      // Keep the dialog visible so users can retry if no store/browser app exists.
    } finally {
      setOpeningStore(false);
    }
  };

  if (Platform.OS !== "android" || ENV.APP_ENV !== "production") return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!required && release) setDismissedBuild(release.latest_build);
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.panel} accessibilityViewIsModal>
          <Text style={styles.heading}>
            {required ? "OHLAM update required" : "A new OHLAM version is available"}
          </Text>
          <Text style={styles.description}>
            {required
              ? "To protect your account and keep OHLAM working correctly, please install the latest version from Google Play."
              : "A newer version is available on Google Play."}
          </Text>
          {!!release?.latest_version && (
            <Text style={styles.version}>Latest version: {release.latest_version}</Text>
          )}
          {!!release?.release_notes && (
            <Text style={styles.notes}>{release.release_notes}</Text>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={openingStore}
            onPress={() => void openStore()}
            style={styles.button}
          >
            {openingStore ? <ActivityIndicator color="#ffffff" /> : (
              <Text style={styles.buttonText}>Update Now</Text>
            )}
          </Pressable>
          {!required && release && (
            <Pressable accessibilityRole="button" style={styles.later}
              onPress={() => setDismissedBuild(release.latest_build)}>
              <Text style={styles.laterText}>Later</Text>
            </Pressable>
          )}
          {required && (
            <Text style={styles.help}>After updating, reopen OHLAM to continue.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0, 0, 0, 0.65)", padding: 20 },
  panel: { borderRadius: 18, padding: 24, backgroundColor: "#ffffff", gap: 12 },
  heading: { fontSize: 21, fontWeight: "800", color: "#15365a", textAlign: "center" },
  description: { fontSize: 15, lineHeight: 22, textAlign: "center", color: "#334155" },
  version: { color: "#334155", fontWeight: "700", textAlign: "center" },
  notes: { color: "#475569", lineHeight: 20, textAlign: "center" },
  button: { minHeight: 48, borderRadius: 10, backgroundColor: "#1556a6", justifyContent: "center", alignItems: "center" },
  buttonText: { color: "#ffffff", fontWeight: "800", fontSize: 16 },
  later: { alignItems: "center", padding: 12 },
  laterText: { color: "#1556a6", fontWeight: "700" },
  help: { fontSize: 12, color: "#64748b", textAlign: "center" },
});
