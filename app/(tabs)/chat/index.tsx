import API from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useRouter,
} from "expo-router";
import React, {
  useCallback,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type UserSummary = {
  id: number;
  name?: string | null;
  firstname?: string | null;
  lastname?: string | null;
};

type ReferenceValue = {
  id?: number;
  code?: string;
  name?: string;
};

type Message = {
  id: number;
  message?: string | null;
  created_at?: string | null;
  sender_id?: number | null;
  sender?: UserSummary | null;
};

type Conversation = {
  id: number;
  title?: string | null;
  display_title?: string | null;

  type?:
    | ReferenceValue
    | string
    | null;

  status?:
    | ReferenceValue
    | string
    | null;

  participants?: UserSummary[];
  messages?: Message[];

  latest_message?: Message | null;
  last_message?: Message | null;

  unread_count?: number;
  updated_at?: string | null;
  created_at?: string | null;
};

function getUserName(
  user?: UserSummary | null
): string {
  if (!user) {
    return "User";
  }

  if (user.name?.trim()) {
    return user.name.trim();
  }

  const fullName = [
    user.firstname,
    user.lastname,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "User";
}

function getConversationTitle(
  conversation: Conversation
): string {
  if (
    conversation.display_title?.trim()
  ) {
    return conversation.display_title.trim();
  }

  if (conversation.title?.trim()) {
    return conversation.title.trim();
  }

  if (
    Array.isArray(
      conversation.participants
    ) &&
    conversation.participants.length > 0
  ) {
    return conversation.participants
      .map(getUserName)
      .join(", ");
  }

  return `Conversation ${conversation.id}`;
}

function getLatestMessage(
  conversation: Conversation
): Message | null {
  if (conversation.latest_message) {
    return conversation.latest_message;
  }

  if (conversation.last_message) {
    return conversation.last_message;
  }

  if (
    Array.isArray(conversation.messages) &&
    conversation.messages.length > 0
  ) {
    return conversation.messages[
      conversation.messages.length - 1
    ];
  }

  return null;
}

function formatConversationTime(
  value?: string | null
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();

  const isToday =
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  });
}

function extractConversations(
  responseData: any
): Conversation[] {
  const possibleValues = [
    responseData?.data,
    responseData?.data?.data,
    responseData?.conversations,
    responseData?.data?.conversations,
    responseData,
  ];

  for (const value of possibleValues) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

export default function ChatIndexScreen() {
  const router = useRouter();

  const [
    conversations,
    setConversations,
  ] = useState<Conversation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  const loadConversations = useCallback(
    async (
      showFullLoader = false
    ): Promise<void> => {
      if (showFullLoader) {
        setLoading(true);
      }

      try {
        const response =
          await API.get("/conversations");

        console.log(
          "Conversation list response:",
          response.data
        );

        const loadedConversations =
          extractConversations(
            response.data
          );

        setConversations(
          loadedConversations
        );

        setErrorMessage(null);
      } catch (error: any) {
        console.log(
          "Load conversations error:",
          {
            url:
              error?.config?.baseURL +
              error?.config?.url,
            status:
              error?.response?.status,
            response:
              error?.response?.data,
            message: error?.message,
          }
        );

        const status =
          error?.response?.status;

        const serverMessage =
          error?.response?.data?.message;

        if (status === 401) {
          setErrorMessage(
            "Your session has expired. Please sign in again."
          );
        } else if (status === 403) {
          setErrorMessage(
            serverMessage ??
              "You are not allowed to view conversations."
          );
        } else {
          setErrorMessage(
            serverMessage ??
              "We could not load your conversations."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      void loadConversations(true);
    }, [loadConversations])
  );

  const refreshConversations =
    useCallback(() => {
      setRefreshing(true);
      void loadConversations(false);
    }, [loadConversations]);

  const openConversation = useCallback(
    (conversation: Conversation) => {
      router.push({
        pathname:
          "/(tabs)/chat/[conversationId]",
        params: {
          conversationId: String(
            conversation.id
          ),
        },
      });
    },
    [router]
  );

  const renderConversation = ({
    item,
  }: {
    item: Conversation;
  }) => {
    const latestMessage =
      getLatestMessage(item);

    const unreadCount = Number(
      item.unread_count ?? 0
    );

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        activeOpacity={0.75}
        onPress={() =>
          openConversation(item)
        }
      >
        <View
          style={styles.avatarContainer}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color="#2563eb"
          />
        </View>

        <View
          style={styles.conversationContent}
        >
          <View style={styles.titleRow}>
            <Text
              style={
                styles.conversationTitle
              }
              numberOfLines={1}
            >
              {getConversationTitle(item)}
            </Text>

            <Text style={styles.timeText}>
              {formatConversationTime(
                latestMessage?.created_at ??
                  item.updated_at ??
                  item.created_at
              )}
            </Text>
          </View>

          <View style={styles.messageRow}>
            <Text
              style={[
                styles.latestMessage,
                unreadCount > 0 &&
                  styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {latestMessage?.message?.trim() ||
                "No messages yet"}
            </Text>

            {unreadCount > 0 && (
              <View
                style={styles.unreadBadge}
              >
                <Text
                  style={
                    styles.unreadBadgeText
                  }
                >
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color="#94a3b8"
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <Stack.Screen
          options={{
            title: "SecureChat",
          }}
        />

        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text style={styles.loadingText}>
          Loading conversations...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "SecureChat",
        }}
      />

      <View style={styles.securityNotice}>
        <Ionicons
          name="shield-checkmark-outline"
          size={18}
          color="#0369a1"
        />

        <Text
          style={
            styles.securityNoticeText
          }
        >
          Keep all property communication
          inside OHLAM SecureChat.
        </Text>
      </View>

      {errorMessage ? (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={58}
            color="#94a3b8"
          />

          <Text style={styles.errorTitle}>
            Conversations unavailable
          </Text>

          <Text
            style={styles.errorMessage}
          >
            {errorMessage}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              void loadConversations(true);
            }}
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={renderConversation}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={
                refreshConversations
              }
            />
          }
          contentContainerStyle={[
            styles.listContent,
            conversations.length === 0 &&
              styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={
            false
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubbles-outline"
                size={64}
                color="#cbd5e1"
              />

              <Text style={styles.emptyTitle}>
                No conversations yet
              </Text>

              <Text style={styles.emptyText}>
                Your property, appointment
                and support conversations
                will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },

  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#bae6fd",
    backgroundColor: "#f0f9ff",
  },

  securityNoticeText: {
    flex: 1,
    color: "#075985",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },

  listContent: {
    paddingVertical: 8,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },

  avatarContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#dbeafe",
  },

  conversationContent: {
    flex: 1,
    gap: 7,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  conversationTitle: {
    flex: 1,
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },

  timeText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  latestMessage: {
    flex: 1,
    color: "#64748b",
    fontSize: 13,
  },

  unreadMessage: {
    color: "#0f172a",
    fontWeight: "700",
  },

  unreadBadge: {
    minWidth: 21,
    height: 21,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "#2563eb",
  },

  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  errorTitle: {
    marginTop: 15,
    color: "#0f172a",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
  },

  errorMessage: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2563eb",
  },

  retryButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 36,
  },

  emptyTitle: {
    marginTop: 14,
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 7,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});