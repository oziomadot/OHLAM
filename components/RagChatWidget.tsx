import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import API from "@/src/services/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
};

const suggestions = [
  "Can I get my escrow refunded?",
  "What happens if a lister cancels?",
  "Can I deal outside OHLAM?",
];

export default function RagChatWidget() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello, I am your OHLAM Specialist Assistant. Ask me about escrow, refunds, appointments, listing rules, anti-scam protection, or how OHLAM works.",
    },
  ]);

  const scrollRef = useRef<ScrollView>(null);

  const askQuestion = async (preset?: string) => {
    const userQuestion = (preset || question).trim();
    if (!userQuestion || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: userQuestion }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await API.post("/rag/ask", { question: userQuestion });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data?.answer || "I could not find a policy answer for that.",
          sources: res.data?.sources || [],
        },
      ]);
    } catch (error: any) {
      console.log("RAG error:", error?.response?.data || error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not reach the OHLAM assistant right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="shield-search" size={25} color="#fff" />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>OHLAM Specialist Assistant</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              Ask about escrow, refunds, appointments, listings and anti-scam rules.
            </Text>
          </View>

          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>AI</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introCard}>
            <MaterialCommunityIcons name="shield-home" size={30} color="#2563eb" />
            <Text style={styles.introTitle}>How can I help you?</Text>
            <Text style={styles.introText}>
              I answer from OHLAM policies and platform rules to help you make safer
              property decisions.
            </Text>

            <View style={styles.suggestionWrap}>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.suggestionChip}
                  onPress={() => askQuestion(item)}
                  disabled={loading}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {messages.map((msg, index) => {
            const isUser = msg.role === "user";

            return (
              <View
                key={index}
                style={[
                  styles.messageRow,
                  isUser ? styles.userRow : styles.assistantRow,
                ]}
              >
                {!isUser && (
                  <View style={styles.smallAvatar}>
                    <MaterialCommunityIcons name="robot-outline" size={17} color="#2563eb" />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isUser ? styles.userText : styles.assistantText,
                    ]}
                  >
                    {msg.content}
                  </Text>

                  {!isUser && msg.sources?.length ? (
                    <View style={styles.sourcesBox}>
                      <Text style={styles.sourcesTitle}>Policy sources</Text>

                      {msg.sources.slice(0, 3).map((source, i) => (
                        <View key={i} style={styles.sourcePill}>
                          <MaterialCommunityIcons
                            name="file-document-check"
                            size={13}
                            color="#2563eb"
                          />
                          <Text style={styles.sourceItem} numberOfLines={1}>
                            {source.policy || source.slug || "OHLAM Policy"}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={[styles.messageRow, styles.assistantRow]}>
              <View style={styles.smallAvatar}>
                <MaterialCommunityIcons name="robot-outline" size={17} color="#2563eb" />
              </View>

              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <ActivityIndicator color="#2563eb" />
                <Text style={styles.typingText}>Checking OHLAM knowledge base...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            onFocus={() =>
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
            }
            placeholder="Ask OHLAM assistant..."
            placeholderTextColor="#94a3b8"
            style={styles.input}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!question.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={() => askQuestion()}
            disabled={!question.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <MaterialCommunityIcons name="send" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  wrapper: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 3,
    fontWeight: "600",
    lineHeight: 17,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: "#16a34a",
  },
  onlineText: {
    color: "#047857",
    fontWeight: "900",
    fontSize: 11,
  },
  chat: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  introCard: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  introTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 10,
  },
  introText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    fontWeight: "600",
  },
  suggestionWrap: {
    gap: 8,
    marginTop: 14,
  },
  suggestionChip: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  suggestionText: {
    color: "#1d4ed8",
    fontWeight: "800",
    fontSize: 13,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 13,
    alignItems: "flex-end",
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  smallAvatar: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  messageBubble: {
    maxWidth: "82%",
    padding: 13,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: "#2563eb",
    borderBottomRightRadius: 5,
  },
  assistantBubble: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  userText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  assistantText: {
    color: "#0f172a",
    fontWeight: "600",
  },
  typingText: {
    marginTop: 8,
    color: "#64748b",
    fontWeight: "600",
    fontSize: 13,
  },
  sourcesBox: {
    marginTop: 12,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 6,
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#334155",
  },
  sourcePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#eff6ff",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  sourceItem: {
    flex: 1,
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "800",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: "#f1f5f9",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
});