import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import { useAuth } from "@/context/AuthContext";
import API from "@/services/api";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type AppointmentRole =
  | "customer"
  | "lister";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "declined"
  | "reschedule_requested"
  | "rescheduled"
  | "expired"
  | string;

type PropertySummary = {
  id: number | string;

  uuid?: string | null;

  title?: string | null;

  address?: string | null;

  city?: string | null;

  state?: string | null;
};

type Appointment = {
  id: number | string;

  uuid?: string | null;

  customer_id: number | string;

  lister_id: number | string;

  scheduled_at?: string | null;

  starts_at?: string | null;

  appointment_date?: string | null;

  status?: AppointmentStatus | null;

  status_code?: string | null;

  status_data?: {
    id?: number | string;

    code?: string | null;

    name?: string | null;
  } | null;

  property?: PropertySummary | null;

  property_id?: number | string | null;

  meeting_place?: string | null;

  can_review?: boolean;
};

type Availability = {
  id?: number | string;

  day_of_week?: string | null;

  day_name?: string | null;

  start_time?: string | null;

  end_time?: string | null;

  is_active?: boolean;
};

type AppointmentDashboardResponse = {
  success?: boolean;

  message?: string;

  appointments?: Appointment[];

  upcoming?: Appointment[];

  availability?: Availability[];

  can_create_availability?: boolean;

  has_listed_property?: boolean;

  counts?: {
    booked?: number;

    requests?: number;

    upcoming?: number;

    availability?: number;
  };
};

/*
|--------------------------------------------------------------------------
| Axios/API error type
|--------------------------------------------------------------------------
*/

type ApiError = {
  message?: string;

  response?: {
    status?: number;

    data?: {
      message?: string;

      errors?: Record<
        string,
        string[] | string
      >;
    };
  };
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeId(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

/*
|--------------------------------------------------------------------------
| Determine role in appointment
|--------------------------------------------------------------------------
|
| We DO NOT ask the user:
|
| "Are you a customer or lister?"
|
| OHLAM determines the role from the appointment itself.
|
*/

function determineRole(
  appointment: Appointment,

  currentUserId:
    | number
    | string
    | undefined
): AppointmentRole | null {
  if (
    currentUserId === undefined ||
    currentUserId === null
  ) {
    return null;
  }

  const userId =
    normalizeId(currentUserId);

  if (
    normalizeId(
      appointment.customer_id
    ) === userId
  ) {
    return "customer";
  }

  if (
    normalizeId(
      appointment.lister_id
    ) === userId
  ) {
    return "lister";
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Appointment status
|--------------------------------------------------------------------------
*/

function getStatusCode(
  appointment: Appointment
): string {
  return (
    appointment.status_data?.code ||
    appointment.status_code ||
    appointment.status ||
    "unknown"
  )
    .toString()
    .trim()
    .toLowerCase();
}

function getStatusLabel(
  appointment: Appointment
): string {
  if (
    appointment.status_data?.name
  ) {
    return appointment.status_data.name;
  }

  const code =
    getStatusCode(appointment);

  switch (code) {
    case "appointment_pending":
    case "pending":
      return "Pending request";

    case "appointment_confirmed":
    case "confirmed":
      return "Confirmed";

    case "appointment_cancelled":
    case "cancelled":
      return "Cancelled";

    case "appointment_completed":
    case "completed":
      return "Completed";

    case "appointment_declined":
    case "declined":
      return "Declined";

    case "appointment_reschedule_requested":
    case "reschedule_requested":
      return "Reschedule requested";

    case "appointment_rescheduled":
    case "rescheduled":
      return "Rescheduled";

    case "appointment_expired":
    case "expired":
      return "Expired";

    default:
      return code
        .replace(
          /^appointment_/,
          ""
        )
        .replace(/_/g, " ")
        .replace(
          /\b\w/g,
          (character) =>
            character.toUpperCase()
        );
  }
}

/*
|--------------------------------------------------------------------------
| Appointment date
|--------------------------------------------------------------------------
*/

function getAppointmentDate(
  appointment: Appointment
): Date | null {
  const rawDate =
    appointment.scheduled_at ||
    appointment.starts_at ||
    appointment.appointment_date;

  if (!rawDate) {
    return null;
  }

  const parsed =
    new Date(rawDate);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return parsed;
}

function formatAppointmentDate(
  appointment: Appointment
): string {
  const date =
    getAppointmentDate(
      appointment
    );

  if (!date) {
    return "Date to be confirmed";
  }

  const now = new Date();

  const todayStart =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  const appointmentStart =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

  const differenceInDays =
    Math.round(
      (
        appointmentStart.getTime() -
        todayStart.getTime()
      ) /
        (
          1000 *
          60 *
          60 *
          24
        )
    );

  const time =
    date.toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );

  if (
    differenceInDays === 0
  ) {
    return `Today · ${time}`;
  }

  if (
    differenceInDays === 1
  ) {
    return `Tomorrow · ${time}`;
  }

  const day =
    date.toLocaleDateString(
      [],
      {
        weekday: "long",
      }
    );

  const dateText =
    date.toLocaleDateString(
      [],
      {
        day: "numeric",
        month: "short",
      }
    );

  return `${day}, ${dateText} · ${time}`;
}

/*
|--------------------------------------------------------------------------
| Property helpers
|--------------------------------------------------------------------------
*/

function getPropertyTitle(
  appointment: Appointment
): string {
  if (
    appointment.property?.title
  ) {
    return appointment.property.title;
  }

  return "Property viewing";
}

function getPropertyLocation(
  appointment: Appointment
): string | null {
  if (
    appointment.property?.address
  ) {
    return appointment.property.address;
  }

  const location = [
    appointment.property?.city,

    appointment.property?.state,
  ]
    .filter(Boolean)
    .join(", ");

  return location || null;
}

/*
|--------------------------------------------------------------------------
| Availability helpers
|--------------------------------------------------------------------------
*/

function formatTime(
  time?: string | null
): string {
  if (!time) {
    return "--:--";
  }

  /*
   * Supports:
   *
   * 10:00
   * 10:00:00
   */

  const parts =
    time.split(":");

  if (
    parts.length < 2
  ) {
    return time;
  }

  const hour =
    Number(parts[0]);

  const minute =
    Number(parts[1]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return time;
  }

  const temporaryDate =
    new Date();

  temporaryDate.setHours(
    hour
  );

  temporaryDate.setMinutes(
    minute
  );

  temporaryDate.setSeconds(
    0
  );

  return temporaryDate.toLocaleTimeString(
    [],
    {
      hour: "numeric",

      minute: "2-digit",
    }
  );
}

function getAvailabilityDay(
  availability: Availability
): string {
  return (
    availability.day_name ||
    availability.day_of_week ||
    "Viewing day"
  );
}

/*
|--------------------------------------------------------------------------
| Upcoming appointment check
|--------------------------------------------------------------------------
*/

function isUpcomingAppointment(
  appointment: Appointment
): boolean {
  const status =
    getStatusCode(
      appointment
    );

  const closedStatuses = [
    "cancelled",

    "appointment_cancelled",

    "completed",

    "appointment_completed",

    "declined",

    "appointment_declined",

    "expired",

    "appointment_expired",
  ];

  if (
    closedStatuses.includes(
      status
    )
  ) {
    return false;
  }

  const date =
    getAppointmentDate(
      appointment
    );

  /*
   * Appointment without a date should
   * remain visible until backend resolves it.
   */

  if (!date) {
    return true;
  }

  return (
    date.getTime() >=
    new Date().getTime()
  );
}

/*
|--------------------------------------------------------------------------
| API error message helper
|--------------------------------------------------------------------------
*/

function getApiErrorMessage(
  error: unknown
): string {
  const apiError =
    error as ApiError;

  return (
    apiError?.response?.data
      ?.message ||
    apiError?.message ||
    "Something went wrong while loading your appointments."
  );
}

/*
|--------------------------------------------------------------------------
| Main Screen
|--------------------------------------------------------------------------
*/

export default function AppointmentIndexScreen() {
  const router =
    useRouter();

  const {
    user,
    isAuthenticated,
  } = useAuth();

  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [
    appointments,
    setAppointments,
  ] = useState<
    Appointment[]
  >([]);

  const [
    availability,
    setAvailability,
  ] = useState<
    Availability[]
  >([]);

  const [
    canCreateAvailability,
    setCanCreateAvailability,
  ] =
    useState<boolean>(
      false
    );

  const [
    hasListedProperty,
    setHasListedProperty,
  ] =
    useState<boolean>(
      false
    );

  const [
    loading,
    setLoading,
  ] =
    useState<boolean>(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState<boolean>(
      false
    );

  /*
  |--------------------------------------------------------------------------
  | Load appointment dashboard
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Authentication/token handling is now done by services/api.tsx.
  |
  | This screen does NOT:
  |
  | - read SecureStore
  | - construct API URLs
  | - set Authorization headers
  | - call fetch()
  |
  */

  const loadDashboard =
    useCallback(
      async (
        showLoader = true
      ) => {
        /*
         * If AuthContext is still resolving,
         * don't call the protected endpoint.
         */

        if (
          !isAuthenticated
        ) {
          setLoading(false);

          setRefreshing(
            false
          );

          return;
        }

        try {
          if (
            showLoader
          ) {
            setLoading(
              true
            );
          }

          /*
           * Central API method.
           */

          const response =
            await API.getAppointmentDashboard();

          const data: AppointmentDashboardResponse =
            response.data;

          /*
           * Defensive validation.
           */

          if (
            data?.success === false
          ) {
            throw new Error(
              data.message ||
                "Unable to load your appointment dashboard."
            );
          }

          /*
           * API may return:
           *
           * upcoming: [...]
           *
           * OR
           *
           * appointments: [...]
           */

          const loadedAppointments =
            Array.isArray(
              data.upcoming
            )
              ? data.upcoming
              : Array.isArray(
                    data.appointments
                  )
                ? data.appointments
                : [];

          /*
           * Keep only current/future
           * appointments in dashboard.
           *
           * Backend should also perform
           * this filtering.
           */

          setAppointments(
            loadedAppointments.filter(
              isUpcomingAppointment
            )
          );

          /*
           * Only active availability
           * should appear.
           */

          setAvailability(
            Array.isArray(
              data.availability
            )
              ? data.availability.filter(
                  (
                    item
                  ) =>
                    item.is_active !==
                    false
                )
              : []
          );

          /*
           * These values MUST ultimately
           * come from Laravel.
           *
           * Frontend alone must never
           * authorize availability creation.
           */

          setCanCreateAvailability(
            Boolean(
              data.can_create_availability
            )
          );

          setHasListedProperty(
            Boolean(
              data.has_listed_property
            )
          );
        } catch (
          error: unknown
        ) {
          console.error(
            "Failed to load appointment dashboard:",
            error
          );

          const apiError =
            error as ApiError;

          /*
           * If authentication has expired,
           * send user back to login.
           *
           * Your global Axios interceptor
           * can eventually handle this globally.
           */

          if (
            apiError?.response
              ?.status === 401
          ) {
            router.replace(
              "/login" as never
            );

            return;
          }

          /*
           * 403 means authenticated,
           * but not permitted.
           */

          if (
            apiError?.response
              ?.status === 403
          ) {
            Alert.alert(
              "Access denied",
              getApiErrorMessage(
                error
              )
            );

            return;
          }

          Alert.alert(
            "Unable to load appointments",

            getApiErrorMessage(
              error
            )
          );
        } finally {
          setLoading(false);

          setRefreshing(
            false
          );
        }
      },
      [
        isAuthenticated,
        router,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Refresh whenever screen receives focus
  |--------------------------------------------------------------------------
  |
  | This is useful after:
  |
  | - appointment creation
  | - confirmation
  | - cancellation
  | - rescheduling
  | - availability changes
  |
  */

  useFocusEffect(
    useCallback(
      () => {
        loadDashboard(
          true
        );
      },
      [
        loadDashboard,
      ]
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Sort appointments
  |--------------------------------------------------------------------------
  */

  const sortedAppointments =
    useMemo(() => {
      return [
        ...appointments,
      ].sort(
        (
          a,
          b
        ) => {
          const aDate =
            getAppointmentDate(
              a
            );

          const bDate =
            getAppointmentDate(
              b
            );

          if (
            !aDate &&
            !bDate
          ) {
            return 0;
          }

          if (!aDate) {
            return 1;
          }

          if (!bDate) {
            return -1;
          }

          return (
            aDate.getTime() -
            bDate.getTime()
          );
        }
      );
    }, [
      appointments,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Customer appointment count
  |--------------------------------------------------------------------------
  */

  const bookedCount =
    useMemo(() => {
      if (!user?.id) {
        return 0;
      }

      return appointments.filter(
        (
          appointment
        ) =>
          normalizeId(
            appointment.customer_id
          ) ===
          normalizeId(
            user.id
          )
      ).length;
    }, [
      appointments,
      user?.id,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Lister request count
  |--------------------------------------------------------------------------
  */

  const receivedRequestCount =
    useMemo(() => {
      if (!user?.id) {
        return 0;
      }

      return appointments.filter(
        (
          appointment
        ) =>
          normalizeId(
            appointment.lister_id
          ) ===
          normalizeId(
            user.id
          )
      ).length;
    }, [
      appointments,
      user?.id,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const createAppointment =
    () => {
      router.push(
        "/appointment/customer/create" as never
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Open appointment
  |--------------------------------------------------------------------------
  */

  const openAppointment =
    (
      appointment: Appointment
    ) => {
      const role =
        determineRole(
          appointment,
          user?.id
        );

      /*
       * Security:
       *
       * If the returned appointment does not
       * belong to this user as customer OR
       * lister, do not navigate.
       *
       * Laravel policy must enforce this too.
       */

      if (!role) {
        Alert.alert(
          "Appointment unavailable",

          "You are not a participant in this appointment."
        );

        return;
      }

      const appointmentId =
        String(
          appointment.uuid ||
            appointment.id
        );

      /*
       * Existing OHLAM structure:
       *
       * lister/view.tsx
       */

      if (
        role === "lister"
      ) {
        router.push({
          pathname:
            "/appointment/lister/view" as never,

          params: {
            appointmentId,
          },
        });

        return;
      }

      /*
       * Existing customer screen.
       *
       * Later we can replace both customer
       * and lister detail routes with:
       *
       * /appointment/[appointmentId]
       */

      router.push({
        pathname:
          "/appointment/customer/index" as never,

        params: {
          appointmentId,
        },
      });
    };

  /*
  |--------------------------------------------------------------------------
  | Availability
  |--------------------------------------------------------------------------
  */

  const manageAvailability =
    () => {
      /*
       * This UI check improves UX.
       *
       * IMPORTANT:
       *
       * Laravel MUST independently enforce
       * property ownership/listing eligibility.
       *
       * Never trust only this frontend check.
       */

      if (
        !hasListedProperty &&
        !canCreateAvailability
      ) {
        Alert.alert(
          "Property listing required",

          "You need at least one eligible property listing before you can create viewing availability."
        );

        return;
      }

      router.push(
        "/appointment/lister/create" as never
      );
    };

  const openBookedAppointments =
    () => {
      router.push(
        "/appointment/customer/index" as never
      );
    };

  const openListerRequests =
    () => {
      router.push(
        "/appointment/lister/request" as never
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Not authenticated
  |--------------------------------------------------------------------------
  */

  if (
    !isAuthenticated
  ) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <View
          style={
            styles.authContainer
          }
        >
          <View
            style={
              styles.authIcon
            }
          >
            <Ionicons
              name="calendar-outline"
              size={38}
              color="#147D64"
            />
          </View>

          <Text
            style={
              styles.authTitle
            }
          >
            Your appointments
          </Text>

          <Text
            style={
              styles.authDescription
            }
          >
            Sign in to book
            property viewings,
            manage appointment
            requests and control
            your viewing
            availability.
          </Text>

          <TouchableOpacity
            style={
              styles.primaryButton
            }
            onPress={() =>
              router.push(
                "/login" as never
              )
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#147D64"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading
            appointments...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Screen
  |--------------------------------------------------------------------------
  */

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <ScrollView
        style={
          styles.container
        }
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            tintColor="#147D64"
            onRefresh={() => {
              setRefreshing(
                true
              );

              loadDashboard(
                false
              );
            }}
          />
        }
      >
        {/*
        |--------------------------------------------------------------------------
        | HEADER
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerTextContainer
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Appointments
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Property viewings,
              requests and
              availability.
            </Text>
          </View>
        </View>

        {/*
        |--------------------------------------------------------------------------
        | CREATE APPOINTMENT
        |--------------------------------------------------------------------------
        */}

        <TouchableOpacity
          style={
            styles.createAppointmentButton
          }
          activeOpacity={
            0.85
          }
          onPress={
            createAppointment
          }
        >
          <View
            style={
              styles.createIcon
            }
          >
            <Ionicons
              name="add"
              size={24}
              color="#FFFFFF"
            />
          </View>

          <View
            style={
              styles.createButtonContent
            }
          >
            <Text
              style={
                styles.createButtonTitle
              }
            >
              Create
              Appointment
            </Text>

            <Text
              style={
                styles.createButtonSubtitle
              }
            >
              Book a viewing
              for a property
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/*
        |--------------------------------------------------------------------------
        | UPCOMING
        |--------------------------------------------------------------------------
        */}

        <SectionHeader
          title="Upcoming"
          count={
            sortedAppointments.length
          }
        />

        {sortedAppointments.length ===
        0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="calendar-clear-outline"
                size={30}
                color="#147D64"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No upcoming
              appointments
            </Text>

            <Text
              style={
                styles.emptyDescription
              }
            >
              Appointments you
              book or requests
              for your
              properties will
              appear here.
            </Text>

            <TouchableOpacity
              style={
                styles.emptyAction
              }
              onPress={
                createAppointment
              }
            >
              <Text
                style={
                  styles.emptyActionText
                }
              >
                Book a Viewing
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={
              styles.appointmentList
            }
          >
            {sortedAppointments.map(
              (
                appointment
              ) => (
                <AppointmentCard
                  key={String(
                    appointment.uuid ||
                      appointment.id
                  )}
                  appointment={
                    appointment
                  }
                  currentUserId={
                    user?.id
                  }
                  onPress={() =>
                    openAppointment(
                      appointment
                    )
                  }
                />
              )
            )}
          </View>
        )}

        {/*
        |--------------------------------------------------------------------------
        | AVAILABILITY
        |--------------------------------------------------------------------------
        */}

        <SectionHeader
          title="My Viewing Availability"
        />

        <View
          style={
            styles.availabilityCard
          }
        >
          {availability.length >
          0 ? (
            <>
              {availability
                .slice(
                  0,
                  4
                )
                .map(
                  (
                    item,
                    index
                  ) => (
                    <View
                      key={
                        item.id
                          ? String(
                              item.id
                            )
                          : `${getAvailabilityDay(
                              item
                            )}-${index}`
                      }
                      style={[
                        styles.availabilityRow,

                        index !==
                          Math.min(
                            availability.length,
                            4
                          ) -
                            1 &&
                          styles.availabilityRowBorder,
                      ]}
                    >
                      <View
                        style={
                          styles.availabilityDayContainer
                        }
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={
                            18
                          }
                          color="#147D64"
                        />

                        <Text
                          style={
                            styles.availabilityDay
                          }
                        >
                          {getAvailabilityDay(
                            item
                          )}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.availabilityTime
                        }
                      >
                        {formatTime(
                          item.start_time
                        )}
                        {
                          "  –  "
                        }
                        {formatTime(
                          item.end_time
                        )}
                      </Text>
                    </View>
                  )
                )}

              {availability.length >
                4 && (
                <Text
                  style={
                    styles.moreAvailabilityText
                  }
                >
                  +
                  {availability.length -
                    4}{" "}
                  more
                  availability{" "}
                  {availability.length -
                    4 ===
                  1
                    ? "period"
                    : "periods"}
                </Text>
              )}
            </>
          ) : (
            <View
              style={
                styles.noAvailability
              }
            >
              <Ionicons
                name="time-outline"
                size={26}
                color="#777777"
              />

              <View
                style={
                  styles.noAvailabilityTextContainer
                }
              >
                <Text
                  style={
                    styles.noAvailabilityTitle
                  }
                >
                  No viewing
                  availability
                </Text>

                <Text
                  style={
                    styles.noAvailabilityDescription
                  }
                >
                  {hasListedProperty ||
                  canCreateAvailability
                    ? "Set the days and times customers may request property viewings."
                    : "Viewing availability becomes available after you list a property."}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.manageAvailabilityButton,

              !hasListedProperty &&
                !canCreateAvailability &&
                styles.manageAvailabilityButtonDisabled,
            ]}
            activeOpacity={
              0.8
            }
            onPress={
              manageAvailability
            }
          >
            <Ionicons
              name={
                availability.length >
                0
                  ? "settings-outline"
                  : "add-circle-outline"
              }
              size={19}
              color={
                !hasListedProperty &&
                !canCreateAvailability
                  ? "#8B8B8B"
                  : "#147D64"
              }
            />

            <Text
              style={[
                styles.manageAvailabilityText,

                !hasListedProperty &&
                  !canCreateAvailability &&
                  styles.manageAvailabilityTextDisabled,
              ]}
            >
              {availability.length >
              0
                ? "Manage Availability"
                : "Create Availability"}
            </Text>
          </TouchableOpacity>

          {!hasListedProperty &&
            !canCreateAvailability && (
              <View
                style={
                  styles.propertyRequirement
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={17}
                  color="#8A6D1D"
                />

                <Text
                  style={
                    styles.propertyRequirementText
                  }
                >
                  Only users
                  with an
                  eligible
                  property
                  listing can
                  create
                  viewing
                  availability.
                </Text>
              </View>
            )}
        </View>

        {/*
        |--------------------------------------------------------------------------
        | QUICK LINKS
        |--------------------------------------------------------------------------
        */}

        <SectionHeader
          title="Quick Links"
        />

        <View
          style={
            styles.quickLinksCard
          }
        >
          <QuickLink
            icon="calendar-outline"
            title="Appointments I Booked"
            subtitle="View property appointments where you are the customer"
            badge={
              bookedCount
            }
            onPress={
              openBookedAppointments
            }
          />

          <View
            style={
              styles.quickLinkDivider
            }
          />

          <QuickLink
            icon="home-outline"
            title="Requests For My Properties"
            subtitle="Review viewing requests where you are the lister"
            badge={
              receivedRequestCount
            }
            onPress={
              openListerRequests
            }
          />

          <View
            style={
              styles.quickLinkDivider
            }
          />

          <QuickLink
            icon="time-outline"
            title="My Availability"
            subtitle="Set when customers can request viewings"
            badge={
              availability.length
            }
            onPress={
              manageAvailability
            }
          />
        </View>

        {/*
        |--------------------------------------------------------------------------
        | OHLAM SAFETY NOTICE
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.safetyCard
          }
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color="#147D64"
          />

          <View
            style={
              styles.safetyTextContainer
            }
          >
            <Text
              style={
                styles.safetyTitle
              }
            >
              Keep your
              viewing on
              OHLAM
            </Text>

            <Text
              style={
                styles.safetyDescription
              }
            >
              Appointment
              requests,
              changes,
              cancellations
              and payments
              should remain
              inside OHLAM so
              there is a
              reliable record
              for both
              parties.
            </Text>
          </View>
        </View>

        <View
          style={
            styles.bottomSpacer
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/*
|--------------------------------------------------------------------------
| Appointment Card
|--------------------------------------------------------------------------
*/

type AppointmentCardProps = {
  appointment: Appointment;

  currentUserId?:
    | number
    | string;

  onPress: () => void;
};

function AppointmentCard({
  appointment,

  currentUserId,

  onPress,
}: AppointmentCardProps) {
  const role =
    determineRole(
      appointment,
      currentUserId
    );

  const statusCode =
    getStatusCode(
      appointment
    );

  const propertyLocation =
    getPropertyLocation(
      appointment
    );

  const requiresListerReview =
    role === "lister" &&
    [
      "pending",

      "appointment_pending",

      "reschedule_requested",

      "appointment_reschedule_requested",
    ].includes(
      statusCode
    );

  /*
   * This should normally never happen
   * because backend dashboard must only
   * return appointments involving user.
   */

  if (!role) {
    return null;
  }

  return (
    <View
      style={
        styles.appointmentCard
      }
    >
      <View
        style={
          styles.appointmentTopRow
        }
      >
        <View
          style={
            styles.dateContainer
          }
        >
          <Ionicons
            name="calendar"
            size={17}
            color="#147D64"
          />

          <Text
            style={
              styles.appointmentDate
            }
          >
            {formatAppointmentDate(
              appointment
            )}
          </Text>
        </View>

        <StatusBadge
          appointment={
            appointment
          }
        />
      </View>

      <Text
        style={
          styles.propertyTitle
        }
      >
        {getPropertyTitle(
          appointment
        )}
      </Text>

      {propertyLocation && (
        <View
          style={
            styles.locationRow
          }
        >
          <Ionicons
            name="location-outline"
            size={16}
            color="#666666"
          />

          <Text
            style={
              styles.locationText
            }
            numberOfLines={
              2
            }
          >
            {
              propertyLocation
            }
          </Text>
        </View>
      )}

      <View
        style={
          styles.roleRow
        }
      >
        <View
          style={[
            styles.roleBadge,

            role ===
            "customer"
              ? styles.customerRoleBadge
              : styles.listerRoleBadge,
          ]}
        >
          <Ionicons
            name={
              role ===
              "customer"
                ? "person-outline"
                : "home-outline"
            }
            size={14}
            color={
              role ===
              "customer"
                ? "#345C9C"
                : "#7A4E11"
            }
          />

          <Text
            style={[
              styles.roleText,

              role ===
              "customer"
                ? styles.customerRoleText
                : styles.listerRoleText,
            ]}
          >
            YOU ARE:{" "}
            {role ===
            "lister"
              ? "LISTER"
              : "CUSTOMER"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.appointmentAction,

          requiresListerReview &&
            styles.reviewAction,
        ]}
        activeOpacity={
          0.8
        }
        onPress={
          onPress
        }
      >
        <Text
          style={[
            styles.appointmentActionText,

            requiresListerReview &&
              styles.reviewActionText,
          ]}
        >
          {requiresListerReview
            ? "Review Request"
            : "View Appointment"}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={
            requiresListerReview
              ? "#FFFFFF"
              : "#147D64"
          }
        />
      </TouchableOpacity>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

function StatusBadge({
  appointment,
}: {
  appointment: Appointment;
}) {
  const code =
    getStatusCode(
      appointment
    );

  let style =
    styles.statusDefault;

  let textStyle =
    styles.statusDefaultText;

  if (
    [
      "confirmed",

      "appointment_confirmed",

      "completed",

      "appointment_completed",
    ].includes(code)
  ) {
    style =
      styles.statusSuccess;

    textStyle =
      styles.statusSuccessText;
  } else if (
    [
      "pending",

      "appointment_pending",

      "reschedule_requested",

      "appointment_reschedule_requested",
    ].includes(code)
  ) {
    style =
      styles.statusWarning;

    textStyle =
      styles.statusWarningText;
  } else if (
    [
      "cancelled",

      "appointment_cancelled",

      "declined",

      "appointment_declined",

      "expired",

      "appointment_expired",
    ].includes(code)
  ) {
    style =
      styles.statusDanger;

    textStyle =
      styles.statusDangerText;
  }

  return (
    <View
      style={[
        styles.statusBadge,
        style,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          textStyle,
        ]}
      >
        {getStatusLabel(
          appointment
        )}
      </Text>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Section Header
|--------------------------------------------------------------------------
*/

function SectionHeader({
  title,

  count,
}: {
  title: string;

  count?: number;
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      {typeof count ===
        "number" &&
        count > 0 && (
          <View
            style={
              styles.sectionCount
            }
          >
            <Text
              style={
                styles.sectionCountText
              }
            >
              {count}
            </Text>
          </View>
        )}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Quick Link
|--------------------------------------------------------------------------
*/

type QuickLinkProps = {
  icon: keyof typeof Ionicons.glyphMap;

  title: string;

  subtitle: string;

  badge?: number;

  onPress: () => void;
};

function QuickLink({
  icon,

  title,

  subtitle,

  badge,

  onPress,
}: QuickLinkProps) {
  return (
    <Pressable
      style={({
        pressed,
      }) => [
        styles.quickLink,

        pressed &&
          styles.quickLinkPressed,
      ]}
      onPress={
        onPress
      }
    >
      <View
        style={
          styles.quickLinkIcon
        }
      >
        <Ionicons
          name={
            icon
          }
          size={22}
          color="#147D64"
        />
      </View>

      <View
        style={
          styles.quickLinkContent
        }
      >
        <Text
          style={
            styles.quickLinkTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.quickLinkSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>

      {typeof badge ===
        "number" &&
        badge > 0 && (
          <View
            style={
              styles.quickLinkBadge
            }
          >
            <Text
              style={
                styles.quickLinkBadgeText
              }
            >
              {badge > 99
                ? "99+"
                : badge}
            </Text>
          </View>
        )}

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#9A9A9A"
      />
    </Pressable>
  );
}

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,

      backgroundColor:
        "#F7F8FA",
    },

    container: {
      flex: 1,

      backgroundColor:
        "#F7F8FA",
    },

    contentContainer: {
      paddingHorizontal:
        18,

      paddingTop: 16,
    },

    /*
    |--------------------------------------------------------------------------
    | Loading / Auth
    |--------------------------------------------------------------------------
    */

    loadingContainer: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      padding: 24,
    },

    loadingText: {
      marginTop: 12,

      color: "#666666",

      fontSize: 14,
    },

    authContainer: {
      flex: 1,

      padding: 28,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    authIcon: {
      width: 76,

      height: 76,

      borderRadius: 38,

      backgroundColor:
        "#E6F3EF",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginBottom: 20,
    },

    authTitle: {
      fontSize: 23,

      fontWeight: "700",

      color: "#171717",

      textAlign:
        "center",
    },

    authDescription: {
      marginTop: 10,

      fontSize: 15,

      lineHeight: 22,

      color: "#666666",

      textAlign:
        "center",

      maxWidth: 380,
    },

    primaryButton: {
      marginTop: 24,

      minWidth: 180,

      backgroundColor:
        "#147D64",

      paddingHorizontal:
        24,

      paddingVertical:
        14,

      borderRadius: 12,

      alignItems:
        "center",
    },

    primaryButtonText: {
      color: "#FFFFFF",

      fontSize: 15,

      fontWeight: "700",
    },

    /*
    |--------------------------------------------------------------------------
    | Header
    |--------------------------------------------------------------------------
    */

    header: {
      marginBottom: 20,
    },

    headerTextContainer: {
      flex: 1,
    },

    title: {
      fontSize: 29,

      fontWeight: "800",

      color: "#171717",

      letterSpacing:
        -0.5,
    },

    subtitle: {
      marginTop: 5,

      color: "#686868",

      fontSize: 14,

      lineHeight: 20,
    },

    /*
    |--------------------------------------------------------------------------
    | Create Appointment
    |--------------------------------------------------------------------------
    */

    createAppointmentButton:
      {
        minHeight: 82,

        backgroundColor:
          "#147D64",

        borderRadius: 18,

        paddingHorizontal:
          16,

        paddingVertical:
          15,

        flexDirection:
          "row",

        alignItems:
          "center",

        marginBottom: 28,

        shadowColor:
          "#000",

        shadowOpacity:
          0.08,

        shadowRadius: 10,

        shadowOffset: {
          width: 0,

          height: 4,
        },

        elevation: 3,
      },

    createIcon: {
      width: 44,

      height: 44,

      borderRadius: 14,

      backgroundColor:
        "rgba(255,255,255,0.16)",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight: 13,
    },

    createButtonContent:
      {
        flex: 1,
      },

    createButtonTitle: {
      color: "#FFFFFF",

      fontSize: 16,

      fontWeight: "700",
    },

    createButtonSubtitle:
      {
        color:
          "rgba(255,255,255,0.78)",

        fontSize: 12.5,

        marginTop: 4,
      },

    /*
    |--------------------------------------------------------------------------
    | Sections
    |--------------------------------------------------------------------------
    */

    sectionHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      marginBottom: 12,

      marginTop: 3,
    },

    sectionTitle: {
      fontSize: 18,

      fontWeight: "700",

      color: "#222222",
    },

    sectionCount: {
      marginLeft: 8,

      minWidth: 24,

      height: 24,

      paddingHorizontal:
        7,

      borderRadius: 12,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#E3F1ED",
    },

    sectionCountText: {
      color: "#147D64",

      fontSize: 12,

      fontWeight: "700",
    },

    /*
    |--------------------------------------------------------------------------
    | Appointment
    |--------------------------------------------------------------------------
    */

    appointmentList: {
      marginBottom: 28,
    },

    appointmentCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius: 17,

      padding: 16,

      marginBottom: 13,

      borderWidth: 1,

      borderColor:
        "#EAECEF",

      shadowColor:
        "#000",

      shadowOpacity:
        0.025,

      shadowRadius: 6,

      shadowOffset: {
        width: 0,

        height: 2,
      },

      elevation: 1,
    },

    appointmentTopRow: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",

      gap: 10,
    },

    dateContainer: {
      flex: 1,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 7,
    },

    appointmentDate: {
      color: "#333333",

      fontSize: 13,

      fontWeight: "600",
    },

    propertyTitle: {
      color: "#151515",

      fontSize: 17,

      lineHeight: 23,

      fontWeight: "700",

      marginTop: 14,
    },

    locationRow: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      marginTop: 7,

      gap: 5,
    },

    locationText: {
      flex: 1,

      color: "#666666",

      fontSize: 13,

      lineHeight: 18,
    },

    roleRow: {
      flexDirection:
        "row",

      marginTop: 14,
    },

    roleBadge: {
      flexDirection:
        "row",

      alignItems:
        "center",

      borderRadius: 8,

      paddingHorizontal:
        9,

      paddingVertical:
        6,

      gap: 5,
    },

    customerRoleBadge: {
      backgroundColor:
        "#EEF4FD",
    },

    listerRoleBadge: {
      backgroundColor:
        "#FFF4DF",
    },

    roleText: {
      fontSize: 10.5,

      fontWeight: "800",

      letterSpacing:
        0.3,
    },

    customerRoleText: {
      color: "#345C9C",
    },

    listerRoleText: {
      color: "#7A4E11",
    },

    appointmentAction: {
      marginTop: 15,

      minHeight: 43,

      borderRadius: 11,

      borderWidth: 1,

      borderColor:
        "#147D64",

      paddingHorizontal:
        14,

      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",
    },

    appointmentActionText:
      {
        color: "#147D64",

        fontWeight: "700",

        fontSize: 13.5,
      },

    reviewAction: {
      borderColor:
        "#147D64",

      backgroundColor:
        "#147D64",
    },

    reviewActionText: {
      color: "#FFFFFF",
    },

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    statusBadge: {
      borderRadius: 20,

      paddingHorizontal:
        9,

      paddingVertical:
        5,
    },

    statusText: {
      fontSize: 10.5,

      fontWeight: "700",
    },

    statusSuccess: {
      backgroundColor:
        "#E5F4EC",
    },

    statusSuccessText: {
      color: "#217A48",
    },

    statusWarning: {
      backgroundColor:
        "#FFF2D7",
    },

    statusWarningText: {
      color: "#885E00",
    },

    statusDanger: {
      backgroundColor:
        "#FDE7E7",
    },

    statusDangerText: {
      color: "#AA3434",
    },

    statusDefault: {
      backgroundColor:
        "#ECEEF1",
    },

    statusDefaultText: {
      color: "#525860",
    },

    /*
    |--------------------------------------------------------------------------
    | Empty appointments
    |--------------------------------------------------------------------------
    */

    emptyCard: {
      alignItems:
        "center",

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,

      borderColor:
        "#E9EAEC",

      borderRadius: 17,

      paddingHorizontal:
        24,

      paddingVertical:
        28,

      marginBottom: 28,
    },

    emptyIcon: {
      width: 58,

      height: 58,

      borderRadius: 29,

      backgroundColor:
        "#E8F4F1",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    emptyTitle: {
      marginTop: 14,

      color: "#222222",

      fontSize: 16,

      fontWeight: "700",
    },

    emptyDescription: {
      marginTop: 6,

      maxWidth: 320,

      textAlign:
        "center",

      color: "#707070",

      fontSize: 13,

      lineHeight: 19,
    },

    emptyAction: {
      marginTop: 16,

      paddingHorizontal:
        15,

      paddingVertical:
        10,
    },

    emptyActionText: {
      color: "#147D64",

      fontSize: 13,

      fontWeight: "700",
    },

    /*
    |--------------------------------------------------------------------------
    | Availability
    |--------------------------------------------------------------------------
    */

    availabilityCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius: 17,

      padding: 16,

      marginBottom: 28,

      borderWidth: 1,

      borderColor:
        "#EAECEF",
    },

    availabilityRow: {
      minHeight: 53,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap: 12,
    },

    availabilityRowBorder:
      {
        borderBottomWidth:
          1,

        borderBottomColor:
          "#EEEEEE",
      },

    availabilityDayContainer:
      {
        flex: 1,

        flexDirection:
          "row",

        alignItems:
          "center",

        gap: 8,
      },

    availabilityDay: {
      color: "#333333",

      fontSize: 14,

      fontWeight: "600",

      textTransform:
        "capitalize",
    },

    availabilityTime: {
      color: "#555555",

      fontSize: 13,

      fontWeight: "500",
    },

    moreAvailabilityText:
      {
        marginTop: 12,

        color: "#666666",

        fontSize: 12,

        textAlign:
          "center",
      },

    noAvailability: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap: 12,

      paddingVertical:
        7,
    },

    noAvailabilityTextContainer:
      {
        flex: 1,
      },

    noAvailabilityTitle: {
      color: "#333333",

      fontSize: 14,

      fontWeight: "600",
    },

    noAvailabilityDescription:
      {
        marginTop: 4,

        color: "#747474",

        fontSize: 12.5,

        lineHeight: 18,
      },

    manageAvailabilityButton:
      {
        marginTop: 14,

        minHeight: 45,

        borderRadius: 11,

        backgroundColor:
          "#EDF6F3",

        flexDirection:
          "row",

        alignItems:
          "center",

        justifyContent:
          "center",

        gap: 7,
      },

    manageAvailabilityButtonDisabled:
      {
        backgroundColor:
          "#EFEFEF",
      },

    manageAvailabilityText:
      {
        color: "#147D64",

        fontSize: 13.5,

        fontWeight: "700",
      },

    manageAvailabilityTextDisabled:
      {
        color: "#8B8B8B",
      },

    propertyRequirement:
      {
        marginTop: 11,

        flexDirection:
          "row",

        alignItems:
          "flex-start",

        backgroundColor:
          "#FFF8E5",

        borderRadius: 9,

        padding: 10,

        gap: 6,
      },

    propertyRequirementText:
      {
        flex: 1,

        color: "#715A1C",

        fontSize: 11.5,

        lineHeight: 17,
      },

    /*
    |--------------------------------------------------------------------------
    | Quick Links
    |--------------------------------------------------------------------------
    */

    quickLinksCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius: 17,

      borderWidth: 1,

      borderColor:
        "#EAECEF",

      overflow: "hidden",

      marginBottom: 28,
    },

    quickLink: {
      minHeight: 79,

      flexDirection:
        "row",

      alignItems:
        "center",

      paddingHorizontal:
        14,

      paddingVertical:
        12,
    },

    quickLinkPressed: {
      backgroundColor:
        "#F7FAF9",
    },

    quickLinkIcon: {
      width: 42,

      height: 42,

      borderRadius: 13,

      backgroundColor:
        "#EAF4F1",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight: 12,
    },

    quickLinkContent: {
      flex: 1,

      paddingRight: 8,
    },

    quickLinkTitle: {
      color: "#252525",

      fontSize: 14,

      fontWeight: "700",
    },

    quickLinkSubtitle: {
      marginTop: 3,

      color: "#737373",

      fontSize: 11.5,

      lineHeight: 16,
    },

    quickLinkBadge: {
      minWidth: 24,

      height: 24,

      borderRadius: 12,

      paddingHorizontal:
        6,

      backgroundColor:
        "#147D64",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight: 8,
    },

    quickLinkBadgeText: {
      color: "#FFFFFF",

      fontSize: 10,

      fontWeight: "700",
    },

    quickLinkDivider: {
      height: 1,

      backgroundColor:
        "#EEEEEE",

      marginLeft: 68,
    },

    /*
    |--------------------------------------------------------------------------
    | Safety
    |--------------------------------------------------------------------------
    */

    safetyCard: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      backgroundColor:
        "#ECF6F3",

      borderRadius: 15,

      padding: 15,

      gap: 10,
    },

    safetyTextContainer: {
      flex: 1,
    },

    safetyTitle: {
      color: "#195F50",

      fontSize: 13,

      fontWeight: "700",
    },

    safetyDescription: {
      marginTop: 4,

      color: "#49756B",

      fontSize: 11.5,

      lineHeight: 17,
    },

    bottomSpacer: {
      height: 36,
    },
  });