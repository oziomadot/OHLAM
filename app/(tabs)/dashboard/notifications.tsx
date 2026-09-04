import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import Protected from "components/Protected";
import ScreenWrapper from "components/ScreenWrapper";

import API from "@/src/services/api";

type NotificationItem = {
  id: string;
  notifiable_type?: string;
  notification_class?: string;
  type?: string;
  title: string;
  message: string;
  read_at?: string | null;
  created_at: string;
  route?: string | null;
  property_id?: number | null;
  property_uuid?: string | null;
  appointment_id?: number | null;
  data?: Record<string, any>;
};

export default function NotificationScreen() {
  const router =
    useRouter();

  const [
    notifications,
    setNotifications,
  ] = useState<NotificationItem[]>(
    []
  );

  const [
    expandedIds,
    setExpandedIds,
  ] = useState<Set<string>>(
    new Set()
  );

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(
    false
  );

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(
    0
  );

  const [
    markingAll,
    setMarkingAll,
  ] = useState(
    false
  );

  const loadNotifications =
    useCallback(
      async (
        showLoading = true
      ) => {
        try {
          if (
            showLoading
          ) {
            setLoading(
              true
            );
          }

          const response =
            await API.getNotifications();

          setNotifications(
            response
              ?.notifications ||
              []
          );

          setUnreadCount(
            Number(
              response
                ?.unread_count ||
                0
            )
          );
        } catch (
          error: any
        ) {
          Alert.alert(
            "Unable to load notifications",
            error?.response
              ?.data
              ?.message ||
              error?.message ||
              "Please try again."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      []
    );

  useFocusEffect(
    useCallback(
      () => {
        loadNotifications();
      },
      [
        loadNotifications,
      ]
    )
  );

  const onRefresh =
    useCallback(
      async () => {
        setRefreshing(
          true
        );

        await loadNotifications(
          false
        );
      },
      [
        loadNotifications,
      ]
    );

  const markAsRead =
    async (
      notificationId: string
    ) => {
      const notification =
        notifications.find(
          (item) =>
            item.id ===
            notificationId
        );

      if (
        !notification ||
        notification.read_at
      ) {
        return;
      }

      /*
       * Optimistic update makes the UI feel immediate.
       */
      const now =
        new Date()
          .toISOString();

      setNotifications(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              notificationId
                ? {
                    ...item,
                    read_at:
                      now,
                  }
                : item
          )
      );

      setUnreadCount(
        (current) =>
          Math.max(
            0,
            current - 1
          )
      );

      try {
        const response =
          await API
            .markNotificationAsRead(
              notificationId
            );

        if (
          typeof response
            ?.unread_count ===
          "number"
        ) {
          setUnreadCount(
            response
              .unread_count
          );
        }
      } catch (
        error: any
      ) {
        /*
         * Restore the unread state when the API update fails.
         */
        setNotifications(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                notificationId
                  ? {
                      ...item,
                      read_at:
                        null,
                    }
                  : item
            )
        );

        setUnreadCount(
          (current) =>
            current + 1
        );

        Alert.alert(
          "Unable to update notification",
          error?.response
            ?.data
            ?.message ||
            "Please try again."
        );
      }
    };

  const toggleNotification =
    async (
      notification: NotificationItem
    ) => {
      const willExpand =
        !expandedIds.has(
          notification.id
        );

      setExpandedIds(
        (current) => {
          const next =
            new Set(
              current
            );

          if (
            next.has(
              notification.id
            )
          ) {
            next.delete(
              notification.id
            );
          } else {
            next.add(
              notification.id
            );
          }

          return next;
        }
      );

      /*
       * Opening an unread notification marks it as read.
       */
      if (
        willExpand &&
        !notification.read_at
      ) {
        await markAsRead(
          notification.id
        );
      }
    };

  const markAllAsRead =
    async () => {
      if (
        unreadCount === 0 ||
        markingAll
      ) {
        return;
      }

      try {
        setMarkingAll(
          true
        );

        await API
          .markAllNotificationsAsRead();

        const now =
          new Date()
            .toISOString();

        setNotifications(
          (current) =>
            current.map(
              (item) => ({
                ...item,
                read_at:
                  item.read_at ||
                  now,
              })
            )
        );

        setUnreadCount(
          0
        );
      } catch (
        error: any
      ) {
        Alert.alert(
          "Unable to update notifications",
          error?.response
            ?.data
            ?.message ||
            "Please try again."
        );
      } finally {
        setMarkingAll(
          false
        );
      }
    };

  const getGroupTitle =
    (
      dateValue: string
    ) => {
      const date =
        new Date(
          dateValue
        );

      const now =
        new Date();

      const today =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

      const notificationDate =
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );

      const difference =
        Math.floor(
          (
            today.getTime() -
            notificationDate.getTime()
          ) /
            (
              1000 *
              60 *
              60 *
              24
            )
        );

      if (
        difference === 0
      ) {
        return "Today";
      }

      if (
        difference === 1
      ) {
        return "Yesterday";
      }

      if (
        difference <= 7
      ) {
        return "This Week";
      }

      if (
        difference <= 30
      ) {
        return "This Month";
      }

      return "Older";
    };

  const groupedNotifications =
    useMemo(
      () => {
        const groups:
          Record<
            string,
            NotificationItem[]
          > = {};

        notifications.forEach(
          (notification) => {
            const group =
              getGroupTitle(
                notification
                  .created_at
              );

            if (
              !groups[
                group
              ]
            ) {
              groups[
                group
              ] = [];
            }

            groups[
              group
            ].push(
              notification
            );
          }
        );

        return groups;
      },
      [
        notifications,
      ]
    );

  const getIcon =
    (
      type?: string
    ) => {
      switch (
        type
      ) {
        case "appointment_availability_pending":
          return "calendar-alert";

        case "appointment_availability_needed":
          return "calendar-plus";

        case "appointment_requested":
        case "appointment":
          return "calendar-clock";

        case "appointment_confirmed":
          return "calendar-check";

        case "appointment_rejected":
        case "appointment_cancelled":
          return "calendar-remove";

        case "property_delete_request":
          return "home-alert";

        case "property_deleted":
          return "home-remove";

        case "wallet":
        case "wallet_credit":
        case "wallet_debit":
          return "wallet";

        case "chat":
        case "message":
          return "message-text";

        case "suspicious_property_delete_report":
          return "shield-alert";

        default:
          return "bell-ring";
      }
    };

  const formatTime =
    (
      dateValue: string
    ) => {
      return new Date(
        dateValue
      ).toLocaleString(
        "en-GB",
        {
          day:
            "numeric",

          month:
            "short",

          year:
            "numeric",

          hour:
            "2-digit",

          minute:
            "2-digit",
        }
      );
    };

  if (
    loading
  ) {
    return (
      <Protected>
        <ScreenWrapper>
          <View
            style={
              styles.center
            }
          >
            <ActivityIndicator
              size="large"
              color="#2563eb"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading notifications...
            </Text>
          </View>
        </ScreenWrapper>
      </Protected>
    );
  }

  return (
    <Protected>
      <ScreenWrapper>
        <View
          style={
            styles.screen
          }
        >
          <View
            style={
              styles.header
            }
          >
            <TouchableOpacity
              style={
                styles.backButton
              }
              onPress={() =>
                router.back()
              }
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={25}
                color="#0f172a"
              />
            </TouchableOpacity>

            <View
              style={
                styles.headerTextBox
              }
            >
              <Text
                style={
                  styles.title
                }
              >
                Notifications
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You are all caught up"}
              </Text>
            </View>

            {unreadCount >
              0 && (
              <TouchableOpacity
                style={
                  styles.markAllButton
                }
                onPress={
                  markAllAsRead
                }
                disabled={
                  markingAll
                }
              >
                {markingAll ? (
                  <ActivityIndicator
                    size="small"
                    color="#2563eb"
                  />
                ) : (
                  <Text
                    style={
                      styles.markAllText
                    }
                  >
                    Read all
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            contentContainerStyle={
              styles.content
            }
            showsVerticalScrollIndicator={
              false
            }
            refreshControl={
              <RefreshControl
                refreshing={
                  refreshing
                }
                onRefresh={
                  onRefresh
                }
              />
            }
          >
            {notifications.length ===
            0 ? (
              <View
                style={
                  styles.emptyBox
                }
              >
                <MaterialCommunityIcons
                  name="bell-off-outline"
                  size={48}
                  color="#94a3b8"
                />

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No notifications yet
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Appointment, property,
                  wallet, escrow and message
                  updates will appear here.
                </Text>
              </View>
            ) : (
              Object.entries(
                groupedNotifications
              ).map(
                ([
                  group,
                  items,
                ]) => (
                  <View
                    key={
                      group
                    }
                  >
                    <Text
                      style={
                        styles.groupTitle
                      }
                    >
                      {group}
                    </Text>

                    {items.map(
                      (
                        item
                      ) => {
                        const unread =
                          !item
                            .read_at;

                        const expanded =
                          expandedIds.has(
                            item.id
                          );

                        return (
                          <TouchableOpacity
                            key={
                              item.id
                            }
                            style={[
                              styles.card,
                              unread &&
                                styles.unreadCard,
                            ]}
                            activeOpacity={
                              0.85
                            }
                            onPress={() =>
                              toggleNotification(
                                item
                              )
                            }
                          >
                            <View
                              style={
                                styles.iconBox
                              }
                            >
                              <MaterialCommunityIcons
                                name={
                                  getIcon(
                                    item.type
                                  ) as any
                                }
                                size={
                                  24
                                }
                                color="#2563eb"
                              />
                            </View>

                            <View
                              style={
                                styles.cardBody
                              }
                            >
                              <View
                                style={
                                  styles.cardHeader
                                }
                              >
                                <Text
                                  style={
                                    styles.cardTitle
                                  }
                                >
                                  {
                                    item.title
                                  }
                                </Text>

                                {unread && (
                                  <View
                                    style={
                                      styles.unreadDot
                                    }
                                  />
                                )}

                                <MaterialCommunityIcons
                                  name={
                                    expanded
                                      ? "chevron-up"
                                      : "chevron-down"
                                  }
                                  size={
                                    22
                                  }
                                  color="#64748b"
                                />
                              </View>

                              <Text
                                style={
                                  styles.time
                                }
                              >
                                {formatTime(
                                  item.created_at
                                )}
                              </Text>

                              {expanded && (
                                <View
                                  style={
                                    styles.details
                                  }
                                >
                                  <Text
                                    style={
                                      styles.message
                                    }
                                  >
                                    {
                                      item.message
                                    }
                                  </Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </View>
                )
              )
            )}

            <View
              style={{
                height:
                  40,
              }}
            />
          </ScrollView>
        </View>
      </ScreenWrapper>
    </Protected>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    center: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f8fafc",
    },

    loadingText: {
      marginTop: 10,
      color:
        "#64748b",
      fontWeight:
        "700",
    },

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal:
        16,
      paddingVertical:
        14,
      backgroundColor:
        "#ffffff",
      borderBottomWidth:
        1,
      borderBottomColor:
        "#e2e8f0",
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f1f5f9",
      marginRight: 10,
    },

    headerTextBox: {
      flex: 1,
    },

    title: {
      fontSize: 22,
      fontWeight:
        "900",
      color:
        "#0f172a",
    },

    headerSubtitle: {
      marginTop: 2,
      color:
        "#64748b",
      fontSize: 12,
      fontWeight:
        "700",
    },

    markAllButton: {
      minWidth: 68,
      minHeight: 38,
      paddingHorizontal:
        10,
      borderRadius: 12,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#dbeafe",
    },

    markAllText: {
      color:
        "#2563eb",
      fontWeight:
        "900",
      fontSize: 12,
    },

    content: {
      padding: 16,
    },

    groupTitle: {
      fontSize: 14,
      fontWeight:
        "900",
      color:
        "#475569",
      marginTop: 12,
      marginBottom: 9,
    },

    card: {
      flexDirection:
        "row",
      gap: 12,
      backgroundColor:
        "#ffffff",
      padding: 14,
      borderRadius: 18,
      marginBottom: 11,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      elevation: 1,
    },

    unreadCard: {
      backgroundColor:
        "#eff6ff",
      borderColor:
        "#93c5fd",
    },

    iconBox: {
      width: 45,
      height: 45,
      borderRadius: 15,
      backgroundColor:
        "#dbeafe",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    cardBody: {
      flex: 1,
    },

    cardHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    cardTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight:
        "900",
      color:
        "#0f172a",
      paddingRight: 8,
    },

    unreadDot: {
      width: 9,
      height: 9,
      borderRadius: 9,
      backgroundColor:
        "#2563eb",
      marginRight: 7,
    },

    time: {
      color:
        "#94a3b8",
      marginTop: 5,
      fontSize: 12,
      fontWeight:
        "700",
    },

    details: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor:
        "#dbeafe",
    },

    message: {
      color:
        "#475569",
      lineHeight: 21,
      fontSize: 14,
    },

    emptyBox: {
      backgroundColor:
        "#ffffff",
      borderRadius: 22,
      padding: 30,
      alignItems:
        "center",
      marginTop: 45,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight:
        "900",
      color:
        "#0f172a",
      marginTop: 12,
    },

    emptyText: {
      color:
        "#64748b",
      textAlign:
        "center",
      marginTop: 8,
      lineHeight: 21,
    },
  });