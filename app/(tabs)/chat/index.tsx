import API from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Navbar from "components/Navbar";
import Protected from "components/Protected";
import ScreenWrapper from "components/ScreenWrapper";

type ReferenceValue = {
  id: number;
  code: string;
  name: string;
};

type UserSummary = {
  id: number;
  name?: string | null;
  firstname?: string | null;
  lastname?: string | null;
};

type Participant = {
  id: number;
  user_id?: number;
  user?: UserSummary | null;
  role?: ReferenceValue | string | null;
};

type Message = {
  id: number;
  message: string;
  created_at: string;
  sender_id?: number;
  sender?: UserSummary | null;
};

type Conversation = {
  id: number;

  type:
    | ReferenceValue
    | "private"
    | "group";

  purpose?:
    | ReferenceValue
    | string
    | null;

  status?:
    | ReferenceValue
    | string
    | null;

  support_status?:
    | ReferenceValue
    | string
    | null;

  title?: string | null;
  display_title?: string | null;

  participants?: Participant[];
  messages?: Message[];

  unread_count?: number;
  last_message_at?: string | null;
  updated_at: string;
};

type Tab = "private" | "group";

const COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#db2777",
  "#0891b2",
];

function getReferenceCode(
  value:
    | ReferenceValue
    | string
    | null
    | undefined
): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string"
    ? value
    : value.code;
}

function getUserName(
  user?: UserSummary | null
): string {
  if (!user) {
    return "";
  }

  if (user.name?.trim()) {
    return user.name.trim();
  }

  return [
    user.firstname,
    user.lastname,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function getConversationType(
  conversation: Conversation
): Tab {
  return getReferenceCode(
    conversation.type
  ) === "group"
    ? "group"
    : "private";
}

function colorFor(id: number): string {
  return COLORS[
    Math.abs(id) % COLORS.length
  ];
}

function timeAgo(
  value?: string | null
): string {
  if (!value) {
    return "";
  }

  const timestamp =
    new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const difference =
    Date.now() - timestamp;

  if (difference < 0) {
    return "now";
  }

  const minutes = Math.floor(
    difference / 60_000
  );

  if (minutes < 1) {
    return "now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `${days}d`;
  }

  return new Date(value).toLocaleDateString(
    [],
    {
      day: "2-digit",
      month: "short",
    }
  );
}

function conversationTitle(
  conversation: Conversation,
  currentUserId: number | null
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
    getConversationType(conversation) ===
    "private"
  ) {
    const otherParticipant =
      conversation.participants?.find(
        (participant) =>
          participant.user?.id !==
          currentUserId
      );

    const otherName = getUserName(
      otherParticipant?.user
    );

    return otherName || "Private Chat";
  }

  return "Group Chat";
}

function conversationInitials(
  title: string
): string {
  const initials = title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (word) =>
        word[0]?.toUpperCase() ?? ""
    )
    .join("");

  return initials || "CH";
}

function extractCurrentUserId(
  responseData: any
): number | null {
  const value =
    responseData?.id ??
    responseData?.data?.id ??
    null;

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

export default function ChatIndex() {
  const router = useRouter();

  const requestRunningRef = useRef(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [tab, setTab] = useState<Tab>("private");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (
      options: {
        showLoader?: boolean;
        showRefresh?: boolean;
      } = {}
    ): Promise<void> => {
      if (requestRunningRef.current) {
        return;
      }

      requestRunningRef.current = true;

      if (options.showLoader) {
        setLoading(true);
      }

      if (options.showRefresh) {
        setRefreshing(true);
      }

      try {
        const [conversationResponse, meResponse] =
          await Promise.all([
            API.get<{ data: Conversation[] }>("/conversations"),

            API.get("/me").catch(() => ({
              data: null,
            })),
          ]);

        const loadedConversations = conversationResponse.data?.data;

        setConversations(
          Array.isArray(loadedConversations)
            ? loadedConversations
            : []
        );

        const loadedUserId = extractCurrentUserId(meResponse.data);

        if (loadedUserId) {
          setCurrentUserId(loadedUserId);
        }

        setErrorMessage(null);
      } catch (error: any) {
        const status = error?.response?.status;

        const serverMessage = error?.response?.data?.message;

        if (status === 401) {
          setErrorMessage(
            "Your session has expired. Please sign in again."
          );
        } else {
          setErrorMessage(
            serverMessage ??
              "We could not load your conversations."
          );
        }
      } finally {
        requestRunningRef.current =
          false;

        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      load({
        showLoader:
          conversations.length === 0,
      });

      const interval = setInterval(
        () => {
          load();
        },
        15_000
      );

      return () => {
        clearInterval(interval);
      };
    }, [
      conversations.length,
      load,
    ])
  );

  const filteredConversations =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return conversations
        .filter(
          (conversation) =>
            getConversationType(
              conversation
            ) === tab
        )
        .filter((conversation) => {
          if (!normalizedSearch) {
            return true;
          }

          const title =
            conversationTitle(
              conversation,
              currentUserId
            ).toLowerCase();

          const lastMessage =
            (
              conversation.messages?.[0]
                ?.message ?? ""
            ).toLowerCase();

          return (
            title.includes(
              normalizedSearch
            ) ||
            lastMessage.includes(
              normalizedSearch
            )
          );
        });
    }, [
      conversations,
      currentUserId,
      search,
      tab,
    ]);

  const openConversation = useCallback(
    (conversationId: number) => {
      router.push({
        pathname:
          "/(tabs)/chat/[conversationId]",
        params: {
          conversationId:
            String(conversationId),
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
    const title = conversationTitle(
      item,
      currentUserId
    );

    const type =
      getConversationType(item);

    const lastMessage =
      item.messages?.[0];

    const timestamp =
      lastMessage?.created_at ??
      item.last_message_at ??
      item.updated_at;

    const unreadCount =
      Number(item.unread_count ?? 0);

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          openConversation(item.id)
        }
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`Open ${title}`}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor:
                colorFor(item.id),
            },
          ]}
        >
          {type === "group" ? (
            <Ionicons
              name="people"
              size={21}
              color="#ffffff"
            />
          ) : (
            <Text
              style={styles.avatarText}
            >
              {conversationInitials(
                title
              )}
            </Text>
          )}
        </View>

        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text
              style={[
                styles.rowTitle,
                unreadCount > 0 &&
                  styles.rowTitleUnread,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>

            <Text
              style={[
                styles.rowTime,
                unreadCount > 0 &&
                  styles.rowTimeUnread,
              ]}
            >
              {timeAgo(timestamp)}
            </Text>
          </View>

          <View
            style={styles.previewRow}
          >
            <Text
              style={[
                styles.rowPreview,
                unreadCount > 0 &&
                  styles.rowPreviewUnread,
              ]}
              numberOfLines={1}
            >
              {lastMessage?.message ??
                "No messages yet"}
            </Text>

            {unreadCount > 0 && (
              <View
                style={
                  styles.unreadBadge
                }
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
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <Navbar />

      <Protected>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text
                style={styles.headerTitle}
              >
                Chats
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                Secure OHLAM conversations
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() =>
                load({
                  showRefresh: true,
                })
              }
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator
                  size="small"
                  color="#2563eb"
                />
              ) : (
                <Ionicons
                  name="refresh"
                  size={20}
                  color="#2563eb"
                />
              )}
            </TouchableOpacity>
          </View>

          <View
            style={styles.searchWrap}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color="#94a3b8"
            />

            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              autoCorrect={false}
            />

            {search.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  setSearch("")
                }
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tabs}>
            {(
              [
                "private",
                "group",
              ] as Tab[]
            ).map((itemTab) => {
              const isActive =
                tab === itemTab;

              return (
                <TouchableOpacity
                  key={itemTab}
                  style={[
                    styles.tab,
                    isActive &&
                      styles.tabActive,
                  ]}
                  onPress={() =>
                    setTab(itemTab)
                  }
                >
                  <Ionicons
                    name={
                      itemTab ===
                      "private"
                        ? "person-outline"
                        : "people-outline"
                    }
                    size={16}
                    color={
                      isActive
                        ? "#2563eb"
                        : "#94a3b8"
                    }
                  />

                  <Text
                    style={[
                      styles.tabText,
                      isActive &&
                        styles.tabTextActive,
                    ]}
                  >
                    {itemTab === "private"
                      ? "Direct"
                      : "Groups"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {errorMessage && (
            <View
              style={styles.errorBanner}
            >
              <Ionicons
                name="warning-outline"
                size={19}
                color="#b91c1c"
              />

              <Text
                style={styles.errorText}
              >
                {errorMessage}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  load({
                    showLoader: true,
                  })
                }
              >
                <Text
                  style={
                    styles.retryText
                  }
                >
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator
                size="large"
                color="#2563eb"
              />

              <Text
                style={styles.loadingText}
              >
                Loading conversations...
              </Text>
            </View>
          ) : (
            <FlatList
              data={
                filteredConversations
              }
              keyExtractor={(item) =>
                String(item.id)
              }
              renderItem={
                renderConversation
              }
              contentContainerStyle={
                filteredConversations.length ===
                0
                  ? styles.emptyList
                  : styles.list
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() =>
                    load({
                      showRefresh: true,
                    })
                  }
                  tintColor="#2563eb"
                />
              }
              ListEmptyComponent={
                <View
                  style={styles.empty}
                >
                  <Ionicons
                    name={
                      tab === "private"
                        ? "chatbubble-ellipses-outline"
                        : "people-outline"
                    }
                    size={58}
                    color="#cbd5e1"
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    {search
                      ? "No results found"
                      : tab ===
                          "private"
                        ? "No direct chats"
                        : "No group chats"}
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    {search
                      ? "Try another search term."
                      : tab ===
                          "private"
                        ? "OHLAM Support and appointment conversations will appear here."
                        : "Verified and approved groups will appear here."}
                  </Text>
                </View>
              }
              ItemSeparatorComponent={() => (
                <View
                  style={
                    styles.separator
                  }
                />
              )}
            />
          )}
        </View>
      </Protected>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },

  headerTitle: {
    fontSize: 27,
    fontWeight: "900",
    color: "#0f172a",
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },

  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },

  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 4,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },

  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },

  tabActive: {
    backgroundColor: "#ffffff",
    elevation: 1,
  },

  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94a3b8",
  },

  tabTextActive: {
    color: "#2563eb",
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },

  errorText: {
    flex: 1,
    color: "#991b1b",
    fontSize: 12,
    fontWeight: "600",
  },

  retryText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "900",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontWeight: "600",
  },

  list: {
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 40,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },

  emptyText: {
    maxWidth: 300,
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: "#ffffff",
  },

  avatar: {
    width: 51,
    height: 51,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  rowBody: {
    flex: 1,
  },

  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  rowTitle: {
    flex: 1,
    marginRight: 8,
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
  },

  rowTitleUnread: {
    fontWeight: "900",
  },

  rowTime: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },

  rowTimeUnread: {
    color: "#2563eb",
    fontWeight: "800",
  },

  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  rowPreview: {
    flex: 1,
    color: "#64748b",
    fontSize: 13,
    fontWeight: "500",
  },

  rowPreviewUnread: {
    color: "#334155",
    fontWeight: "700",
  },

  unreadBadge: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
  },

  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },

  separator: {
    height: 1,
    marginLeft: 79,
    backgroundColor: "#f1f5f9",
  },
});