import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import { API } from "@/src/services/api";

type Asset = { uri: string; name: string; mimeType?: string; size?: number };
type CampaignPost = {
  id: number; title: string; message: string; campaign: string;
  media_type: "image" | "video"; public_url: string; status: string;
};
const MAX_BYTES = 50 * 1024 * 1024;
const sanitizeSlug = (value: string) => value.trim().toLowerCase()
  .replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

export default function CampaignMediaLibrary() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [campaign, setCampaign] = useState("agent-winner-announcement");
  const [asset, setAsset] = useState<Asset | null>(null);
  const [posts, setPosts] = useState<CampaignPost[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUrl, setLastUrl] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/management/campaign-media");
      setPosts(response.data?.data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.status === 403
        ? "You do not have campaign media permission. Ask an administrator."
        : err?.response?.data?.message ?? "Unable to load media library.");
    } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const chooseMedia = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/webp", "video/mp4"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets.length) return;
      const picked = result.assets[0];
      if (picked.size && picked.size > MAX_BYTES) {
        Alert.alert("Media too large", "Choose a file under 50 MB.");
        return;
      }
      setAsset({ uri: picked.uri, name: picked.name, mimeType: picked.mimeType, size: picked.size });
    } catch {
      Alert.alert("File picker", "Could not open your files. Please try again.");
    }
  };

  const upload = async () => {
    const slug = sanitizeSlug(campaign);
    if (busy || !asset) return;
    if (title.trim().length < 3 || message.trim().length < 10 || slug.length < 3 || slug.length > 80) {
      Alert.alert("Incomplete campaign", "Enter a title, a message of at least 10 characters, and a valid campaign name.");
      return;
    }
    if (asset.size && asset.size > MAX_BYTES) {
      Alert.alert("Media too large", "The maximum file size is 50 MB.");
      return;
    }

    const extension = asset.name.toLowerCase().split(".").pop();
    const mime = asset.mimeType ?? ({ jpg: "image/jpeg", jpeg: "image/jpeg",
      png: "image/png", webp: "image/webp", mp4: "video/mp4" } as Record<string, string>)[extension ?? ""];
    if (!["image/jpeg", "image/png", "image/webp", "video/mp4"].includes(mime ?? "")) {
      Alert.alert("Unsupported file", "Use JPG, PNG, WebP or MP4.");
      return;
    }
    const body = new FormData();
    body.append("title", title.trim());
    body.append("message", message.trim());
    body.append("campaign", slug);
    body.append("file", { uri: asset.uri, name: asset.name, type: mime } as any);
    setBusy(true); setError(""); setLastUrl("");
    try {
      const response = await API.post("/management/campaign-media", body, {
        timeout: 180000,
        headers: { "Content-Type": "multipart/form-data" },
      });
      const record = response.data?.data as CampaignPost;
      setLastUrl(record?.public_url ?? "");
      setTitle(""); setMessage(""); setAsset(null);
      await load();
      Alert.alert("Saved to Media Library", "Your campaign image/video and message are saved as a draft. This does not publish to social media.");
    } catch (err: any) {
      const status = err?.response?.status;
      setError(status === 413 ? "Upload rejected because the server's request-size limit was exceeded."
        : status === 403 ? "Your account does not have campaign media permission."
        : err?.response?.data?.message ?? "Upload failed. Please try again.");
    } finally { setBusy(false); }
  };

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Stack.Screen options={{ headerShown: true, title: "Marketing Media Library" }} />
    <Text style={styles.heading}>Upload campaign media</Text>
    <Text>Prepare a campaign message and save an image or video to OHLAM Campaign Storage.</Text>
    <Text style={styles.label}>Campaign title</Text>
    <TextInput style={styles.input} value={title} onChangeText={setTitle} maxLength={180}
      placeholder="e.g. Congratulations to our agent challenge winner" />
    <Text style={styles.label}>Campaign</Text>
    <TextInput style={styles.input} value={campaign} onChangeText={setCampaign}
      autoCapitalize="none" maxLength={80} placeholder="agent-winner-announcement" />
    <Text style={styles.label}>Campaign message</Text>
    <TextInput style={[styles.input, styles.multiline]} value={message} onChangeText={setMessage}
      multiline maxLength={5000} placeholder="Write the campaign post message..." />
    <Text style={styles.label}>Destination</Text>
    <View style={styles.panel}><Text>OHLAM Campaign Storage (public campaign URL)</Text></View>
    <TouchableOpacity disabled={busy} style={styles.secondary} onPress={() => void chooseMedia()}>
      <Text style={styles.blue}>{asset ? "Change image or video" : "Choose image or video"}</Text>
    </TouchableOpacity>
    {asset ? <Text selectable>Selected: {asset.name}{asset.size ? ` · ${Math.ceil(asset.size / 1024)} KB` : ""}</Text> : null}
    <Text style={styles.note}>JPG, PNG, WebP, MP4 · up to 50 MB. Only upload material approved for public marketing.</Text>
    <TouchableOpacity disabled={busy || !asset} style={[styles.primary, (busy || !asset) && styles.disabled]}
      onPress={() => void upload()}><Text style={styles.white}>{busy ? "Uploading..." : "Save campaign post and media"}</Text></TouchableOpacity>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {lastUrl ? <View style={styles.panel}>
      <Text style={styles.label}>Public URL generated</Text>
      <Text selectable>{lastUrl}</Text>
      <TouchableOpacity style={styles.secondary} onPress={() => void Clipboard.setStringAsync(lastUrl)}>
        <Text style={styles.blue}>Copy public URL</Text>
      </TouchableOpacity>
    </View> : null}
    <Text style={styles.heading}>Media Library</Text>
    {loading ? <ActivityIndicator /> : null}
    {!loading && posts.length === 0 ? <Text>No campaign media found.</Text> : null}
    {posts.map(post => <View key={post.id} style={styles.panel}>
      <Text style={styles.label}>{post.title}</Text>
      <Text>Campaign: {post.campaign}</Text><Text>Media: {post.media_type} · {post.status}</Text>
      <Text selectable>{post.message}</Text><Text selectable style={styles.note}>{post.public_url}</Text>
      <TouchableOpacity style={styles.secondary} onPress={() => void Linking.openURL(post.public_url)}>
        <Text style={styles.blue}>Open media</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={() => void Clipboard.setStringAsync(post.public_url)}>
        <Text style={styles.blue}>Copy URL</Text>
      </TouchableOpacity>
    </View>)}
    <Text style={styles.note}>Saving a draft does not automatically send it to Facebook, Instagram, TikTok or other platforms.</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, gap: 12, paddingBottom: 50, maxWidth: 800, width: "100%", alignSelf: "center" },
  heading: { fontWeight: "700", fontSize: 21 }, label: { fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#94a3b8", backgroundColor: "#fff", padding: 12, borderRadius: 8 },
  multiline: { minHeight: 120, textAlignVertical: "top" }, panel: { backgroundColor: "#fff", borderRadius: 8, padding: 12, gap: 8 },
  primary: { backgroundColor: "#2563eb", padding: 14, borderRadius: 8, alignItems: "center" },
  secondary: { borderWidth: 1, borderColor: "#bfdbfe", padding: 12, borderRadius: 8, alignItems: "center" },
  blue: { color: "#1d4ed8", fontWeight: "700" }, white: { color: "#fff", fontWeight: "700" },
  disabled: { opacity: .5 }, note: { fontSize: 12, color: "#475569" }, error: { color: "#b91c1c" },
});
