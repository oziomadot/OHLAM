import API from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ReferenceValue = {
  id?: number;
  code?: string | null;
  name?: string | null;
};

type UserSummary = {
  id: number;
  name?: string | null;
  firstname?: string | null;
  lastname?: string | null;
};

type UserRole = {
  id?: number;
  code?: string | null;
  name?: string | null;
};

type AuthUser = {
  id: number;
  name?: string | null;
  firstname?: string | null;
  lastname?: string | null;

  is_staff?: boolean;
  is_admin?: boolean;

  role?: UserRole | null;
  roles?: UserRole[];
  permissions?: string[];
};

type Message = {
  id: number;
  message: string;
  created_at: string;
  updated_at?: string | null;

  sender_id?: number | null;
  sender?: UserSummary | null;

  status?: ReferenceValue | string | null;
  message_type?: ReferenceValue | string | null;

  client_message_id?: string | null;
};

type Conversation = {
  id: number;

  title?: string | null;
  display_title?: string | null;

  type?: ReferenceValue | string | null;
  purpose?: ReferenceValue | string | null;
  status?: ReferenceValue | string | null;

  support_status?: ReferenceValue | string | null;
  supportStatus?: ReferenceValue | string | null;

  assigned_staff_id?: number | null;
  assigned_staff?: UserSummary | null;
  assignedStaff?: UserSummary | null;

  messages?: Message[];
};

function getReferenceCode(
  value?: ReferenceValue | string | null
): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value.code ?? null;
}

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
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0
    )
    .join(" ")
    .trim();

  return fullName || "User";
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
      (role) => role.code === roleCode
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

function formatMessageTime(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractCurrentUser(
  responseData: unknown
): AuthUser | null {
  const data = responseData as any;

  const value =
    data?.data?.user ??
    data?.data ??
    data?.user ??
    data ??
    null;

  if (
    !value ||
    typeof value !== "object" ||
    Number(value.id) <= 0
  ) {
    return null;
  }

  return value as AuthUser;
}

function extractConversation(
  responseData: unknown
): Conversation | null {
  const data = responseData as any;

  const possibleValues = [
    data?.data?.conversation,
    data?.data,
    data?.conversation,
    data,
  ];

  for (const value of possibleValues) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Number(value.id) > 0
    ) {
      return value as Conversation;
    }
  }

  return null;
}

function extractMessages(
  responseData: unknown
): Message[] {
  const data = responseData as any;

  const possibleValues = [
    data?.data?.messages,
    data?.data?.data,
    data?.data,
    data?.messages,
    data,
  ];

  for (const value of possibleValues) {
    if (Array.isArray(value)) {
      return value as Message[];
    }
  }

  return [];
}

function extractSavedMessage(
  responseData: unknown
): Message | null {
  const data = responseData as any;

  const possibleValues = [
    data?.data?.message,
    data?.data,
    data?.message,
  ];

  for (const value of possibleValues) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Number(value.id) !== 0 &&
      typeof value.message === "string"
    ) {
      return value as Message;
    }
  }

  return null;
}

function mergeMessages(
  existingMessages: Message[],
  incomingMessages: Message[]
): Message[] {
  const map = new Map<string, Message>();

  for (const item of existingMessages) {
    const key = item.client_message_id
      ? `client:${item.client_message_id}`
      : `id:${item.id}`;

    map.set(key, item);
  }

  for (const item of incomingMessages) {
    if (item.client_message_id) {
      map.delete(
        `client:${item.client_message_id}`
      );
    }

    map.set(`id:${item.id}`, item);
  }

  return Array.from(map.values()).sort(
    (first, second) =>
      new Date(first.created_at).getTime() -
      new Date(second.created_at).getTime()
  );
}

function getRequestErrorMessage(
  error: any,
  fallback: string
): string {
  return (
    error?.response?.data?.message ??
    error?.message ??
    fallback
  );
}

export default function ConversationScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    conversationId?: string | string[];
  }>();

  const rawConversationId =
    Array.isArray(params.conversationId)
      ? params.conversationId[0]
      : params.conversationId;

  const parsedConversationId = Number(
    rawConversationId
  );

  const conversationId =
    Number.isInteger(parsedConversationId) &&
    parsedConversationId > 0
      ? parsedConversationId
      : null;

  const flatListRef =
    useRef<FlatList<Message>>(null);

  const loadingRequestRef =
    useRef(false);

  const [
    conversation,
    setConversation,
  ] = useState<Conversation | null>(
    null
  );

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [
    currentUser,
    setCurrentUser,
  ] = useState<AuthUser | null>(
    null
  );

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [
    escalating,
    setEscalating,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  const currentUserId =
    currentUser?.id ?? null;

  const conversationPurposeCode =
    getReferenceCode(
      conversation?.purpose
    );

  const supportStatusCode =
    getReferenceCode(
      conversation?.support_status ??
        conversation?.supportStatus
    );

  const canEscalate =
    isStaffOrAdmin(currentUser) &&
    conversationPurposeCode ===
      "support" &&
    ![
      "conversation_support_escalated",
      "conversation_support_resolved",
      "conversation_support_closed",
      "escalated",
      "resolved",
      "closed",
    ].includes(
      supportStatusCode ?? ""
    );

  const loadConversation =
    useCallback(
      async (
        showLoader = false
      ): Promise<void> => {
        if (!conversationId) {
          setErrorMessage(
            "The conversation link is invalid."
          );
          setLoading(false);
          return;
        }

        if (
          loadingRequestRef.current
        ) {
          return;
        }

        loadingRequestRef.current =
          true;

        if (showLoader) {
          setLoading(true);
        }

        try {
          const [
            conversationResponse,
            messagesResponse,
            meResponse,
          ] = await Promise.all([
            API.get(
              `/conversations/${conversationId}`
            ),

            API.get(
              `/conversations/${conversationId}/messages`
            ),

            API.get("/me"),
          ]);

          const loadedConversation =
            extractConversation(
              conversationResponse.data
            );

          if (!loadedConversation) {
            throw new Error(
              "The API returned an invalid conversation."
            );
          }

          const loadedMessages =
            extractMessages(
              messagesResponse.data
            );

          const loadedUser =
            extractCurrentUser(
              meResponse.data
            );

          if (!loadedUser) {
            throw new Error(
              "The authenticated user could not be loaded."
            );
          }

          setConversation(
            loadedConversation
          );

          setCurrentUser(loadedUser);

          setMessages((previous) =>
            mergeMessages(
              previous,
              loadedMessages
            )
          );

          setErrorMessage(null);
        } catch (error: any) {
          console.log(
            "Load conversation error:",
            {
              url: `${
                error?.config?.baseURL ??
                ""
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

          const status =
            error?.response?.status;

          if (status === 401) {
            setErrorMessage(
              "Your session has expired. Please sign in again."
            );
          } else if (
            status === 403
          ) {
            setErrorMessage(
              getRequestErrorMessage(
                error,
                "You are not allowed to view this conversation."
              )
            );
          } else if (
            status === 404
          ) {
            setErrorMessage(
              getRequestErrorMessage(
                error,
                "This conversation could not be found."
              )
            );
          } else {
            setErrorMessage(
              getRequestErrorMessage(
                error,
                "We could not load this conversation."
              )
            );
          }
        } finally {
          loadingRequestRef.current =
            false;

          setLoading(false);
        }
      },
      [conversationId]
    );

  const escalateConversation =
    useCallback(
      async (): Promise<void> => {
        if (
          !conversationId ||
          !canEscalate ||
          escalating
        ) {
          return;
        }

        Alert.alert(
          "Escalate support case",
          "This will make the conversation available for additional staff members to join.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Escalate",
              style: "destructive",
              onPress: async () => {
                setEscalating(true);

                try {
                  await API.post(
                    `/support-conversations/${conversationId}/escalate`,
                    {
                      reason:
                        "Additional staff assistance required.",
                    }
                  );

                  Alert.alert(
                    "Conversation escalated",
                    "Other authorized staff members can now join this support conversation."
                  );

                  await loadConversation(
                    false
                  );
                } catch (
                  error: any
                ) {
                  Alert.alert(
                    "Escalation failed",
                    getRequestErrorMessage(
                      error,
                      "The conversation could not be escalated."
                    )
                  );
                } finally {
                  setEscalating(false);
                }
              },
            },
          ]
        );
      },
      [
        canEscalate,
        conversationId,
        escalating,
        loadConversation,
      ]
    );

  useEffect(() => {
    void loadConversation(true);

    const interval =
      setInterval(() => {
        void loadConversation(false);
      }, 5_000);

    return () => {
      clearInterval(interval);
    };
  }, [loadConversation]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd(
        {
          animated: false,
        }
      );
    });
  }, [messages.length]);

  const conversationTitle =
    conversation?.display_title ??
    conversation?.title ??
    "Conversation";

  const conversationStatus =
    getReferenceCode(
      conversation?.status
    );

  const isReadOnly = useMemo(
    () =>
      [
        "conversation_closed",
        "conversation_read_only",
        "conversation_archived",
        "closed",
        "archived",
      ].includes(
        conversationStatus ?? ""
      ),
    [conversationStatus]
  );

  const sendMessage = useCallback(
    async (): Promise<void> => {
      const trimmedMessage =
        message.trim();

      if (
        !trimmedMessage ||
        !conversationId ||
        sending ||
        isReadOnly
      ) {
        return;
      }

      const clientMessageId =
        `mobile-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`;

      const temporaryMessage: Message =
        {
          id: -Date.now(),
          message: trimmedMessage,
          created_at:
            new Date().toISOString(),
          sender_id:
            currentUserId ??
            undefined,
          sender:
            currentUserId !== null
              ? {
                  id: currentUserId,
                  name: "You",
                }
              : null,
          message_type: "text",
          client_message_id:
            clientMessageId,
        };

      setMessage("");

      setMessages((previous) =>
        mergeMessages(previous, [
          temporaryMessage,
        ])
      );

      setSending(true);

      try {
        const response =
          await API.post(
            `/conversations/${conversationId}/messages`,
            {
              message:
                trimmedMessage,
              message_type: "text",
              client_message_id:
                clientMessageId,
            }
          );

        const savedMessage =
          extractSavedMessage(
            response.data
          );

        if (savedMessage) {
          setMessages(
            (previous) => {
              const withoutTemporary =
                previous.filter(
                  (item) =>
                    item.client_message_id !==
                    clientMessageId
                );

              return mergeMessages(
                withoutTemporary,
                [savedMessage]
              );
            }
          );
        } else {
          await loadConversation(
            false
          );
        }
      } catch (error: any) {
        console.log(
          "Send message error:",
          {
            url: `${
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

        setMessages(
          (previous) =>
            previous.filter(
              (item) =>
                item.client_message_id !==
                clientMessageId
            )
        );

        setMessage(trimmedMessage);

        Alert.alert(
          "Message not sent",
          getRequestErrorMessage(
            error,
            "We could not send your message. Please try again."
          )
        );
      } finally {
        setSending(false);
      }
    },
    [
      conversationId,
      currentUserId,
      isReadOnly,
      loadConversation,
      message,
      sending,
    ]
  );

  const renderMessage =
    useCallback(
      ({
        item,
      }: {
        item: Message;
      }) => {
        const senderId =
          item.sender?.id ??
          item.sender_id ??
          null;

        const isMine =
          currentUserId !== null &&
          Number(senderId) ===
            Number(currentUserId);

        const statusCode =
          getReferenceCode(
            item.status
          );

        const isFlagged = [
          "message_flagged",
          "flagged",
        ].includes(
          statusCode ?? ""
        );

        return (
          <View
            style={[
              styles.messageRow,
              isMine
                ? styles.messageRowMine
                : styles.messageRowOther,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                isMine
                  ? styles.messageBubbleMine
                  : styles.messageBubbleOther,
              ]}
            >
              {!isMine && (
                <Text
                  style={
                    styles.senderName
                  }
                >
                  {getUserName(
                    item.sender
                  )}
                </Text>
              )}

              <Text
                style={[
                  styles.messageText,
                  isMine &&
                    styles.messageTextMine,
                ]}
              >
                {item.message}
              </Text>

              <Text
                style={[
                  styles.messageTime,
                  isMine &&
                    styles.messageTimeMine,
                ]}
              >
                {formatMessageTime(
                  item.created_at
                )}
              </Text>

              {isFlagged && (
                <View
                  style={
                    styles.flaggedContainer
                  }
                >
                  <Ionicons
                    name="warning-outline"
                    size={14}
                    color="#b91c1c"
                  />

                  <Text
                    style={
                      styles.flaggedText
                    }
                  >
                    Flagged for review
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      },
      [currentUserId]
    );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text
          style={styles.loadingText}
        >
          Loading conversation...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView
        style={styles.center}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={60}
          color="#94a3b8"
        />

        <Text
          style={styles.errorTitle}
        >
          Conversation unavailable
        </Text>

        <Text
          style={
            styles.errorMessage
          }
        >
          {errorMessage}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            void loadConversation(
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

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            Go back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <Stack.Screen
        options={{
          title: conversationTitle,
          headerBackTitle: "Chats",
          headerRight: canEscalate
            ? () => (
                <TouchableOpacity
                  onPress={() => {
                    void escalateConversation();
                  }}
                  disabled={
                    escalating
                  }
                  style={
                    styles.headerAction
                  }
                >
                  {escalating ? (
                    <ActivityIndicator
                      size="small"
                      color="#dc2626"
                    />
                  ) : (
                    <Ionicons
                      name="arrow-up-circle-outline"
                      size={25}
                      color="#dc2626"
                    />
                  )}
                </TouchableOpacity>
              )
            : undefined,
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
        keyboardVerticalOffset={
          Platform.OS === "ios"
            ? 90
            : 0
        }
      >
        <View
          style={
            styles.securityNotice
          }
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={17}
            color="#0369a1"
          />

          <Text
            style={
              styles.securityNoticeText
            }
          >
            Never share your password,
            OTP, PIN, card details or
            identity documents in chat.
          </Text>
        </View>

        {supportStatusCode ===
          "conversation_support_escalated" ||
        supportStatusCode ===
          "escalated" ? (
          <View
            style={
              styles.escalatedNotice
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={17}
              color="#b45309"
            />

            <Text
              style={
                styles.escalatedNoticeText
              }
            >
              This support conversation
              has been escalated. Other
              authorized staff can join.
            </Text>
          </View>
        ) : null}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) =>
            item.client_message_id ??
            String(item.id)
          }
          renderItem={renderMessage}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 &&
              styles.emptyMessagesList,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
          onContentSizeChange={() => {
            if (
              messages.length > 0
            ) {
              flatListRef.current?.scrollToEnd(
                {
                  animated: false,
                }
              );
            }
          }}
          ListEmptyComponent={
            <View
              style={
                styles.emptyContainer
              }
            >
              <Ionicons
                name="chatbubbles-outline"
                size={58}
                color="#cbd5e1"
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Start the conversation
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Send a message to begin
                this secure chat.
              </Text>
            </View>
          }
        />

        {isReadOnly ? (
          <View
            style={
              styles.readOnlyContainer
            }
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#64748b"
            />

            <Text
              style={
                styles.readOnlyText
              }
            >
              This conversation is
              currently read-only.
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.composerContainer
            }
          >
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#94a3b8"
              style={
                styles.messageInput
              }
              multiline
              maxLength={5000}
              editable={!sending}
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={() => {
                void sendMessage();
              }}
              disabled={
                sending ||
                !message.trim()
              }
              style={[
                styles.sendButton,
                (sending ||
                  !message.trim()) &&
                  styles.sendButtonDisabled,
              ]}
            >
              {sending ? (
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color="#ffffff"
                />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  container: {
    flex: 1,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },

  headerAction: {
    minWidth: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },

  errorTitle: {
    marginTop: 16,
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },

  errorMessage: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
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

  backButton: {
    marginTop: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  backButtonText: {
    color: "#2563eb",
    fontWeight: "800",
  },

  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#bae6fd",
    backgroundColor: "#f0f9ff",
  },

  securityNoticeText: {
    flex: 1,
    color: "#075985",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },

  escalatedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
    backgroundColor: "#fffbeb",
  },

  escalatedNoticeText: {
    flex: 1,
    color: "#92400e",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
  },

  messagesList: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 20,
  },

  emptyMessagesList: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },

  emptyTitle: {
    marginTop: 14,
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 6,
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },

  messageRow: {
    width: "100%",
    marginVertical: 4,
  },

  messageRowMine: {
    alignItems: "flex-end",
  },

  messageRowOther: {
    alignItems: "flex-start",
  },

  messageBubble: {
    maxWidth: "82%",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
  },

  messageBubbleMine: {
    borderBottomRightRadius: 4,
    backgroundColor: "#2563eb",
  },

  messageBubbleOther: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderBottomLeftRadius: 4,
    backgroundColor: "#ffffff",
  },

  senderName: {
    marginBottom: 4,
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "800",
  },

  messageText: {
    color: "#0f172a",
    fontSize: 15,
    lineHeight: 21,
  },

  messageTextMine: {
    color: "#ffffff",
  },

  messageTime: {
    alignSelf: "flex-end",
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "600",
  },

  messageTimeMine: {
    color: "#dbeafe",
  },

  flaggedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#fecaca",
  },

  flaggedText: {
    color: "#b91c1c",
    fontSize: 11,
    fontWeight: "700",
  },

  composerContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },

  messageInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 22,
    color: "#0f172a",
    fontSize: 15,
    backgroundColor: "#f1f5f9",
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },

  readOnlyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#f1f5f9",
  },

  readOnlyText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },
});