import API from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useRouter,
} from "expo-router";
import React, {
  useCallback,
  useMemo,
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
  code?: string | null;
  name?: string | null;
};

type Message = {
  id: number;
  message?: string | null;
  created_at?: string | null;
  sender_id?: number | null;
  sender?: UserSummary | null;
};

type UserRole = {
  id?: number;
  code?: string | null;
  name?: string | null;
};

type AuthUser = {
  id: number;
  firstname?: string | null;
  lastname?: string | null;

  is_staff?: boolean;
  is_admin?: boolean;

  role?: UserRole | null;
  roles?: UserRole[];

  permissions?: string[];
};

type ConversationParticipant = {
  id?: number;
  user_id?: number;
  user?: UserSummary | null;
  role?: ReferenceValue | null;
  status?: ReferenceValue | null;
  joined_at?: string | null;
  left_at?: string | null;
};

type Conversation = {
  id: number;

  title?: string | null;
  display_title?: string | null;
  system_key?: string | null;

  type?: ReferenceValue | string | null;
  purpose?: ReferenceValue | string | null;
  status?: ReferenceValue | string | null;

  support_status?:
    | ReferenceValue
    | string
    | null;

  supportStatus?:
    | ReferenceValue
    | string
    | null;

  assigned_staff_id?: number | null;

  assigned_staff?: UserSummary | null;
  assignedStaff?: UserSummary | null;

  participants?: ConversationParticipant[];
  messages?: Message[];

  latest_message?: Message | null;
  last_message?: Message | null;

  unread_count?: number;

  is_escalated?: boolean;
  staff_can_join?: boolean;

  updated_at?: string | null;
  created_at?: string | null;
};

type ChatSection =
  | "chats"
  | "support"
  | "staff";

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
    .filter(
      (
        value
      ): value is string =>
        typeof value === "string" &&
        value.trim().length > 0
    )
    .join(" ")
    .trim();

  return fullName || "User";
}

function getReferenceCode(
  value?:
    | ReferenceValue
    | string
    | null
): string | null {
  if (typeof value === "string") {
    return value;
  }

  return value?.code ?? null;
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

  const participantNames =
    conversation.participants
      ?.map((participant) =>
        getUserName(participant.user)
      )
      .filter(
        (name) =>
          name.trim().length > 0 &&
          name !== "User"
      ) ?? [];

  if (participantNames.length > 0) {
    return participantNames.join(", ");
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
    Array.isArray(
      conversation.messages
    ) &&
    conversation.messages.length > 0
  ) {
    /*
     * Your Laravel endpoint returns messages
     * ordered newest first with limit(1).
     */
    return conversation.messages[0];
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
    date.getMonth() ===
      today.getMonth() &&
    date.getDate() ===
      today.getDate();

  if (isToday) {
    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  return date.toLocaleDateString(
    [],
    {
      day: "2-digit",
      month: "short",
    }
  );
}

function extractConversations(
  responseData: unknown
): Conversation[] {
  const data = responseData as any;

  const possibleValues = [
    data?.data,
    data?.data?.data,
    data?.conversations,
    data?.data?.conversations,
    data,
  ];

  for (const value of possibleValues) {
    if (Array.isArray(value)) {
      return value as Conversation[];
    }
  }

  return [];
}

function extractUser(
  responseData: unknown
): AuthUser | null {
  const data = responseData as any;

  const possibleUser =
    data?.data?.user ??
    data?.data ??
    data?.user ??
    null;

  if (
    !possibleUser ||
    typeof possibleUser !== "object" ||
    typeof possibleUser.id !== "number"
  ) {
    return null;
  }

  return possibleUser as AuthUser;
}

function hasRole(
  user: AuthUser | null,
  roleCode: string
): boolean {
  if (!user) {
    return false;
  }

  if (user.role?.code === roleCode) {
    return true;
  }

  return Boolean(
    user.roles?.some(
      (role) =>
        role.code === roleCode
    )
  );
}

function isStaffOrAdmin(
  user: AuthUser | null
): boolean {
  return Boolean(
    user?.is_staff ||
      user?.is_admin ||
      hasRole(user, "staff") ||
      hasRole(user, "admin") ||
      hasRole(user, "super_admin")
  );
}

function getErrorMessage(
  error: any
): string {
  const status =
    error?.response?.status;

  const serverMessage =
    error?.response?.data?.message;

  if (status === 401) {
    return (
      serverMessage ??
      "Your session has expired. Please sign in again."
    );
  }

  if (status === 403) {
    return (
      serverMessage ??
      "You are not allowed to view these conversations."
    );
  }

  if (status === 404) {
    return (
      serverMessage ??
      "The requested chat resource was not found."
    );
  }

  if (status === 422) {
    return (
      serverMessage ??
      "The request could not be completed."
    );
  }

  return (
    serverMessage ??
    "We could not load your conversations."
  );
}

export default function ChatIndexScreen() {
  const router = useRouter();

  const [
    conversations,
    setConversations,
  ] = useState<Conversation[]>([]);

  const [
    supportQueue,
    setSupportQueue,
  ] = useState<Conversation[]>([]);

  const [
    currentUser,
    setCurrentUser,
  ] = useState<AuthUser | null>(
    null
  );

  const [
    activeSection,
    setActiveSection,
  ] = useState<ChatSection>(
    "chats"
  );

  const [
    joiningConversationId,
    setJoiningConversationId,
  ] = useState<number | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  const userIsStaff =
    isStaffOrAdmin(currentUser);

  const loadChatData = useCallback(
    async (
      showFullLoader = false
    ): Promise<void> => {
      if (showFullLoader) {
        setLoading(true);
      }

      try {
        /*
         * Load the authenticated user first.
         * The staff queue must only be called
         * when the user is staff or admin.
         */
        const meResponse =
          await API.get("/me");

        const user = extractUser(
          meResponse.data
        );

        if (!user) {
          throw new Error(
            "The authenticated user response is invalid."
          );
        }

        setCurrentUser(user);

        const conversationsResponse =
          await API.get(
            "/conversations"
          );

        const loadedConversations =
          extractConversations(
            conversationsResponse.data
          );

        setConversations(
          loadedConversations
        );

        if (isStaffOrAdmin(user)) {
          try {
            const queueResponse =
              await API.get(
                "/support-conversations/queue"
              );

            setSupportQueue(
              extractConversations(
                queueResponse.data
              )
            );
          } catch (
            queueError: any
          ) {
            /*
             * A support queue failure should
             * not prevent staff from viewing
             * their existing conversations.
             */
            console.log(
              "Support queue error:",
              {
                status:
                  queueError?.response
                    ?.status,
                response:
                  queueError?.response
                    ?.data,
                message:
                  queueError?.message,
              }
            );

            setSupportQueue([]);

            if (
              queueError?.response
                ?.status !== 404
            ) {
              setErrorMessage(
                getErrorMessage(
                  queueError
                )
              );
              return;
            }
          }
        } else {
          setSupportQueue([]);
          setActiveSection(
            "chats"
          );
        }

        setErrorMessage(null);
      } catch (error: any) {
        console.log(
          "Load chat data error:",
          {
            url:
              `${
                error?.config
                  ?.baseURL ?? ""
              }${
                error?.config?.url ??
                ""
              }`,
            status:
              error?.response?.status,
            response:
              error?.response?.data,
            message:
              error?.message,
          }
        );

        setErrorMessage(
          getErrorMessage(error)
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      void loadChatData(true);
    }, [loadChatData])
  );

  const refreshConversations =
    useCallback(() => {
      setRefreshing(true);
      void loadChatData(false);
    }, [loadChatData]);

  const openConversation =
    useCallback(
      (
        conversation: Conversation
      ): void => {
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

  const joinSupportConversation =
    useCallback(
      async (
        conversation: Conversation
      ): Promise<void> => {
        if (
          !isStaffOrAdmin(
            currentUser
          )
        ) {
          setErrorMessage(
            "Only authorized staff can join support conversations."
          );
          return;
        }

        setJoiningConversationId(
          conversation.id
        );

        try {
          const response =
            await API.post(
              `/support-conversations/${conversation.id}/join`
            );

          const responseData =
            response?.data as any;
          const joinedConversation:
            | Conversation
            | undefined =
            responseData?.data
              ?.conversation ??
            responseData?.data ??
            responseData?.conversation;

          const joinedId =
            joinedConversation?.id ??
            conversation.id;

          setSupportQueue(
            (current) =>
              current.filter(
                (item) =>
                  item.id !==
                  conversation.id
              )
          );

          await loadChatData(false);

          router.push({
            pathname:
              "/(tabs)/chat/[conversationId]",
            params: {
              conversationId:
                String(joinedId),
            },
          });
        } catch (error: any) {
          console.log(
            "Join support conversation error:",
            {
              conversationId:
                conversation.id,
              status:
                error?.response
                  ?.status,
              response:
                error?.response
                  ?.data,
              message:
                error?.message,
            }
          );

          setErrorMessage(
            error?.response?.data
              ?.message ??
              "You could not join this support conversation."
          );
        } finally {
          setJoiningConversationId(
            null
          );
        }
      },
      [
        currentUser,
        loadChatData,
        router,
      ]
    );

  const staffConversations =
    useMemo(() => {
      return conversations.filter(
        (conversation) => {
          const purposeCode =
            getReferenceCode(
              conversation.purpose
            );

          return (
            purposeCode === "staff" ||
            purposeCode ===
              "staff_management" ||
            conversation.system_key ===
              "staff-management-group"
          );
        }
      );
    }, [conversations]);

  const normalConversations =
    useMemo(() => {
      return conversations.filter(
        (conversation) => {
          const purposeCode =
            getReferenceCode(
              conversation.purpose
            );

          return !(
            purposeCode === "staff" ||
            purposeCode ===
              "staff_management" ||
            conversation.system_key ===
              "staff-management-group"
          );
        }
      );
    }, [conversations]);

  const visibleConversations =
    useMemo(() => {
      if (
        activeSection === "support"
      ) {
        return supportQueue;
      }

      if (
        activeSection === "staff"
      ) {
        return staffConversations;
      }

      return normalConversations;
    }, [
      activeSection,
      normalConversations,
      staffConversations,
      supportQueue,
    ]);

  const getEmptyTitle = (): string => {
    if (
      activeSection === "support"
    ) {
      return "No support requests";
    }

    if (
      activeSection === "staff"
    ) {
      return "No staff conversations";
    }

    return "No conversations yet";
  };

  const getEmptyMessage =
    (): string => {
      if (
        activeSection === "support"
      ) {
        return "There are currently no open or escalated support conversations waiting for staff.";
      }

      if (
        activeSection === "staff"
      ) {
        return "Your staff and management conversations will appear here.";
      }

      return "Your property, appointment and support conversations will appear here.";
    };

  const renderConversation =
    useCallback(
      ({
        item,
      }: {
        item: Conversation;
      }) => {
        const latestMessage =
          getLatestMessage(item);

        const unreadCount =
          Number(
            item.unread_count ?? 0
          );

        const isSupportQueue =
          activeSection ===
          "support";

        const isJoining =
          joiningConversationId ===
          item.id;

        const purposeCode =
          getReferenceCode(
            item.purpose
          );

        const isGroup =
          getReferenceCode(
            item.type
          ) === "group";

        const isSupport =
          purposeCode ===
          "support";

        const avatarIcon:
          | "people-outline"
          | "headset-outline"
          | "person-outline" =
          isGroup
            ? "people-outline"
            : isSupport
              ? "headset-outline"
              : "person-outline";

        return (
          <TouchableOpacity
            style={
              styles.conversationCard
            }
            activeOpacity={0.75}
            disabled={
              isSupportQueue
            }
            onPress={() => {
              if (
                !isSupportQueue
              ) {
                openConversation(
                  item
                );
              }
            }}
          >
            <View
              style={
                styles.avatarContainer
              }
            >
              <Ionicons
                name={avatarIcon}
                size={24}
                color="#2563eb"
              />
            </View>

            <View
              style={
                styles.conversationContent
              }
            >
              <View
                style={
                  styles.titleRow
                }
              >
                <Text
                  style={
                    styles.conversationTitle
                  }
                  numberOfLines={1}
                >
                  {getConversationTitle(
                    item
                  )}
                </Text>

                <Text
                  style={
                    styles.timeText
                  }
                >
                  {formatConversationTime(
                    latestMessage
                      ?.created_at ??
                      item.updated_at ??
                      item.created_at
                  )}
                </Text>
              </View>

              <View
                style={
                  styles.messageRow
                }
              >
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

                {unreadCount >
                  0 && (
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
                      {unreadCount >
                      99
                        ? "99+"
                        : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {isSupportQueue ? (
              <TouchableOpacity
                style={[
                  styles.joinButton,
                  isJoining &&
                    styles.joinButtonDisabled,
                ]}
                disabled={isJoining}
                onPress={() => {
                  void joinSupportConversation(
                    item
                  );
                }}
              >
                {isJoining ? (
                  <ActivityIndicator
                    size="small"
                    color="#ffffff"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="enter-outline"
                      size={16}
                      color="#ffffff"
                    />

                    <Text
                      style={
                        styles.joinButtonText
                      }
                    >
                      Join
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#94a3b8"
              />
            )}
          </TouchableOpacity>
        );
      },
      [
        activeSection,
        joiningConversationId,
        joinSupportConversation,
        openConversation,
      ]
    );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.center}
      >
        <Stack.Screen
          options={{
            title: "SecureChat",
          }}
        />

        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading conversations...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <Stack.Screen
        options={{
          title: "SecureChat",
        }}
      />

      <View
        style={
          styles.securityNotice
        }
      >
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
          Keep all property
          communication inside OHLAM
          SecureChat.
        </Text>
      </View>

      {errorMessage ? (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={58}
            color="#94a3b8"
          />

          <Text
            style={
              styles.errorTitle
            }
          >
            Conversations unavailable
          </Text>

          <Text
            style={
              styles.errorMessage
            }
          >
            {errorMessage}
          </Text>

          <TouchableOpacity
            style={
              styles.retryButton
            }
            onPress={() => {
              void loadChatData(
                true
              );
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
        <View
          style={
            styles.contentContainer
          }
        >
          {userIsStaff && (
            <View
              style={
                styles.sectionTabs
              }
            >
              <TouchableOpacity
                style={[
                  styles.sectionTab,
                  activeSection ===
                    "chats" &&
                    styles.sectionTabActive,
                ]}
                onPress={() =>
                  setActiveSection(
                    "chats"
                  )
                }
              >
                <Ionicons
                  name="chatbubbles-outline"
                  size={17}
                  color={
                    activeSection ===
                    "chats"
                      ? "#ffffff"
                      : "#475569"
                  }
                />

                <Text
                  style={[
                    styles.sectionTabText,
                    activeSection ===
                      "chats" &&
                      styles.sectionTabTextActive,
                  ]}
                >
                  Chats
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sectionTab,
                  activeSection ===
                    "support" &&
                    styles.sectionTabActive,
                ]}
                onPress={() =>
                  setActiveSection(
                    "support"
                  )
                }
              >
                <Ionicons
                  name="headset-outline"
                  size={17}
                  color={
                    activeSection ===
                    "support"
                      ? "#ffffff"
                      : "#475569"
                  }
                />

                <Text
                  style={[
                    styles.sectionTabText,
                    activeSection ===
                      "support" &&
                      styles.sectionTabTextActive,
                  ]}
                >
                  Support
                </Text>

                {supportQueue.length >
                  0 && (
                  <View
                    style={
                      styles.queueBadge
                    }
                  >
                    <Text
                      style={
                        styles.queueBadgeText
                      }
                    >
                      {supportQueue.length >
                      99
                        ? "99+"
                        : supportQueue.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sectionTab,
                  activeSection ===
                    "staff" &&
                    styles.sectionTabActive,
                ]}
                onPress={() =>
                  setActiveSection(
                    "staff"
                  )
                }
              >
                <Ionicons
                  name="people-outline"
                  size={17}
                  color={
                    activeSection ===
                    "staff"
                      ? "#ffffff"
                      : "#475569"
                  }
                />

                <Text
                  style={[
                    styles.sectionTabText,
                    activeSection ===
                      "staff" &&
                      styles.sectionTabTextActive,
                  ]}
                >
                  Staff
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={
              visibleConversations
            }
            keyExtractor={(item) =>
              String(item.id)
            }
            renderItem={
              renderConversation
            }
            refreshControl={
              <RefreshControl
                refreshing={
                  refreshing
                }
                onRefresh={
                  refreshConversations
                }
              />
            }
            contentContainerStyle={[
              styles.listContent,
              visibleConversations.length ===
                0 &&
                styles.emptyListContent,
            ]}
            showsVerticalScrollIndicator={
              false
            }
            ListEmptyComponent={
              <View
                style={
                  styles.emptyContainer
                }
              >
                <Ionicons
                  name={
                    activeSection ===
                    "support"
                      ? "headset-outline"
                      : activeSection ===
                          "staff"
                        ? "people-outline"
                        : "chatbubbles-outline"
                  }
                  size={64}
                  color="#cbd5e1"
                />

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  {getEmptyTitle()}
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  {getEmptyMessage()}
                </Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    contentContainer: {
      flex: 1,
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor:
        "#f8fafc",
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
      borderBottomColor:
        "#bae6fd",
      backgroundColor:
        "#f0f9ff",
    },

    securityNoticeText: {
      flex: 1,
      color: "#075985",
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 17,
    },

    sectionTabs: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
      backgroundColor:
        "#ffffff",
    },

    sectionTab: {
      flex: 1,
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
      paddingHorizontal: 8,
      borderRadius: 10,
      backgroundColor:
        "#f1f5f9",
    },

    sectionTabActive: {
      backgroundColor:
        "#2563eb",
    },

    sectionTabText: {
      color: "#475569",
      fontSize: 12,
      fontWeight: "800",
    },

    sectionTabTextActive: {
      color: "#ffffff",
    },

    queueBadge: {
      minWidth: 18,
      height: 18,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 4,
      borderRadius: 9,
      backgroundColor:
        "#dc2626",
    },

    queueBadgeText: {
      color: "#ffffff",
      fontSize: 9,
      fontWeight: "900",
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
      borderBottomColor:
        "#e2e8f0",
      backgroundColor:
        "#ffffff",
    },

    avatarContainer: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 24,
      backgroundColor:
        "#dbeafe",
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
      justifyContent:
        "center",
      paddingHorizontal: 6,
      borderRadius: 11,
      backgroundColor:
        "#2563eb",
    },

    unreadBadgeText: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "800",
    },

    joinButton: {
      minWidth: 68,
      height: 36,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
      paddingHorizontal: 10,
      borderRadius: 9,
      backgroundColor:
        "#2563eb",
    },

    joinButtonDisabled: {
      opacity: 0.65,
    },

    joinButtonText: {
      color: "#ffffff",
      fontSize: 12,
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
      backgroundColor:
        "#2563eb",
    },

    retryButtonText: {
      color: "#ffffff",
      fontWeight: "800",
    },

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
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