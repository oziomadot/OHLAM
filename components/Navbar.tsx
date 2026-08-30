import React, {
  useState,
} from "react";

import {
  
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  useRouter,
} from "expo-router";

import {
  useAuth,
} from "@/context/AuthContext";

type MenuChild = {
  label: string;
  path: string;
};

type MenuItem = {
  label: string;
  path?: string;
  children?: MenuChild[];
};

export default function Navbar() {
  const router =
    useRouter();

  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  const [
    menuVisible,
    setMenuVisible,
  ] = useState(false);

  const [
    expandedMenu,
    setExpandedMenu,
  ] = useState<
    string | null
  >(null);

  const isWeb =
    Platform.OS === "web";

  const role =
    user?.registration_status
      ?.name || "";

  /*
   * Protected application routes.
   */
  const protectedRoutes = [
    "/upload",

    "/(tabs)/appointment",
    "/(tabs)/profile",
    "/(tabs)/dashboard",
    "/(tabs)/chat",
    "/(tabs)/wallet",
    "/(tabs)/games",
  ];

  const isProtectedRoute = (
    path: string
  ): boolean => {
    return protectedRoutes.some(
      (protectedPath) =>
        path === protectedPath ||
        path.startsWith(
          `${protectedPath}/`
        )
    );
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setExpandedMenu(null);
  };

  const goTo = (
    path: string
  ) => {
    if (!path) {
      return;
    }

    closeMenu();

    const basePath =
      path.split("?")[0];

    if (
      isProtectedRoute(
        basePath
      ) &&
      !isAuthenticated
    ) {
      router.push(
        "/auth/LoginScreen"
      );

      return;
    }

    router.push(
      path as any
    );
  };

  const PUBLIC_MENU:
    MenuItem[] = [
    {
      label: "Home",
      path: "/(tabs)/home",
    },
    {
      label: "Properties",
      path: "/(tabs)/properties",
    },
    {
      label: "How It Works",
      path: "/(tabs)/how-it-works",
    },
    {
      label: "About Us",
      path: "/(tabs)/about",
    },
    {
      label: "Policies",
      path: "/(tabs)/policies",
    },
    {
      label: "FAQ",
      path: "/(tabs)/faq",
    },
    {
      label: "Vacancies",
      path: "/(tabs)/vacancies",
    },
    {
      label: "Contact Us",
      path: "/(tabs)/contact",
    },
  ];

  const AUTH_MENU:
    MenuItem[] = [
    {
      label: "Dashboard",
      path:
        "/(tabs)/dashboard",
    },

    {
      label: "Appointment",
      path:
        "/(tabs)/appointment",

      children: [
         {
          label:
            "Dashboard",

          path:
            "/(tabs)/appointment",
        },
        {
          label:
            "My Appointments",

          path:
            "/(tabs)/appointment/customer",
        },

        {
          label:
            "Book Appointment",

          path:
            "/(tabs)/appointment/customer/create",
        },

        {
          label:
            "Create Availability",

          path:
            "/(tabs)/appointment/lister/create",
        },

        {
          label:
            "Appointment Requests",

          path:
            "/(tabs)/appointment/lister/request",
        },

        {
          label:
            "Manage Appointments",

          path:
            "/(tabs)/appointment/lister/view",
        },
      ],
    },

    {
      label: "Games",
      path: "/(tabs)/games",
    },

    {
      label: "Chat",
      path: "/(tabs)/chat",
    },

    /*
     * Correct wallet route.
     *
     * Loads:
     *
     * app/(tabs)/wallet/index.tsx
     */
    {
      label: "Wallet",
      path: "/(tabs)/wallet",
    },

    {
      label: "Profile",
      path: "/(tabs)/profile",
    },
  ];

  const AGENT_MENU:
    MenuItem[] = [];

  const STAFF_MENU:
    MenuItem[] = [
    {
      label:
        "Staff Dashboard",

      path:
        "/(tabs)/dashboard",
    },
  ];

  const ADMIN_MENU:
    MenuItem[] = [
    {
      label:
        "Admin Dashboard",

      path:
        "/(tabs)/dashboard",
    },
  ];

  let activeMenu:
    MenuItem[] = [
    ...PUBLIC_MENU,
  ];

  if (isAuthenticated) {
    if (role === "Agent") {
      activeMenu = [
        ...PUBLIC_MENU,
        ...AUTH_MENU,
        ...AGENT_MENU,
      ];
    } else if (
      role === "Staff"
    ) {
      activeMenu = [
        ...PUBLIC_MENU,
        ...AUTH_MENU,
        ...STAFF_MENU,
      ];
    } else if (
      role === "Admin"
    ) {
      activeMenu = [
        ...PUBLIC_MENU,
        ...AUTH_MENU,
        ...ADMIN_MENU,
      ];
    } else {
      activeMenu = [
        ...PUBLIC_MENU,
        ...AUTH_MENU,
      ];
    }
  }

 

  const handleLogout =
    async () => {
      closeMenu();

      try {
        await logout();
      } catch (
        error
      ) {
        console.error(
          "Logout error:",
          error
        );
      }
    };

  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={
          styles.header
        }
      >
        <TouchableOpacity
          onPress={() =>
            goTo(
              "/(tabs)/home"
            )
          }
          activeOpacity={0.8}
        >
          <Image
            source={require(
              "../assets/logo2.png"
            )}
            style={
              styles.logo
            }
          />
        </TouchableOpacity>

        <Text
  style={styles.title}
  numberOfLines={2}
  adjustsFontSizeToFit
  minimumFontScale={0.75}
>
  Oramex House and Land Agency Management
</Text>

        {/*
         * Always show hamburger
         * on mobile.
         */}
        {!isWeb && (
          <TouchableOpacity
            style={
              styles.menuButton
            }
            activeOpacity={0.7}
            onPress={() => {
              console.log(
                "Hamburger pressed"
              );

              setMenuVisible(
                true
              );
            }}
          >
            <Ionicons
              name="menu"
              size={34}
              color="#2563eb"
            />
          </TouchableOpacity>
        )}
      </View>

      {/*
       * WEB NAVIGATION
       */}
      {isWeb && (
        <View
          style={
            styles.webMenu
          }
        >
          {activeMenu.map(
            (item) => (
              <TouchableOpacity
                key={
                  item.label
                }
                onPress={() =>
                  item.path &&
                  goTo(
                    item.path
                  )
                }
              >
                <Text
                  style={
                    styles.webMenuItem
                  }
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )
          )}

          {isAuthenticated ? (
  <>
    <TouchableOpacity
      onPress={handleLogout}
    >
      <Text
        style={[
          styles.webMenuItem,
          styles.logoutText,
        ]}
      >
        Logout
      </Text>
    </TouchableOpacity>
  </>
) : (
            <>
              <TouchableOpacity
                onPress={() =>
                  goTo(
                    "/auth/LoginScreen"
                  )
                }
              >
                <Text
                  style={
                    styles.webMenuItem
                  }
                >
                  Login
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  goTo(
                    "/auth/RegisterScreen"
                  )
                }
              >
                <Text
                  style={
                    styles.webMenuItem
                  }
                >
                  Register
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/*
       * MOBILE MENU
       *
       * Modal is rendered directly
       * from Navbar so menuVisible
       * controls it reliably.
       */}
      <Modal
        visible={
          menuVisible &&
          !isWeb
        }
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={
          closeMenu
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          {/*
           * Clicking dark area closes
           * menu.
           */}
          <TouchableOpacity
            style={
              styles.overlayTouchable
            }
            activeOpacity={1}
            onPress={
              closeMenu
            }
          />

          <View
            style={
              styles.mobileMenuContainer
            }
          >
            <View
              style={
                styles.mobileMenuHeader
              }
            >
              <Text
                style={
                  styles.mobileMenuTitle
                }
              >
                Menu
              </Text>

              <TouchableOpacity
                style={
                  styles.closeButtonContainer
                }
                onPress={
                  closeMenu
                }
              >
                <Ionicons
                  name="close"
                  size={30}
                  color="#dc2626"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={
                styles.mobileMenuContent
              }
              contentContainerStyle={
                styles.mobileMenuContentContainer
              }
              showsVerticalScrollIndicator
            >
              {activeMenu.map(
                (item) => {
                  const hasChildren =
                    !!item.children
                      ?.length;

                  const expanded =
                    expandedMenu ===
                    item.label;

                  return (
                    <View
                      key={
                        item.label
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.mobileMenuRow
                        }
                        onPress={() => {
                          if (
                            hasChildren
                          ) {
                            setExpandedMenu(
                              expanded
                                ? null
                                : item.label
                            );

                            return;
                          }

                          if (
                            item.path
                          ) {
                            goTo(
                              item.path
                            );
                          }
                        }}
                      >
                        <Text
                          style={
                            styles.mobileItem
                          }
                        >
                          {
                            item.label
                          }
                        </Text>

                        {hasChildren && (
                          <Ionicons
                            name={
                              expanded
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={21}
                            color="#64748b"
                          />
                        )}
                      </TouchableOpacity>

                      {hasChildren &&
                        expanded && (
                          <View
                            style={
                              styles.submenu
                            }
                          >
                            {item.children?.map(
                              (
                                child
                              ) => (
                                <TouchableOpacity
                                  key={
                                    child.path
                                  }
                                  style={
                                    styles.submenuItem
                                  }
                                  onPress={() =>
                                    goTo(
                                      child.path
                                    )
                                  }
                                >
                                  <Text
                                    style={
                                      styles.submenuText
                                    }
                                  >
                                    {
                                      child.label
                                    }
                                  </Text>
                                </TouchableOpacity>
                              )
                            )}
                          </View>
                        )}
                    </View>
                  );
                }
              )}

              {isAuthenticated ? (
                <>
                  <TouchableOpacity
                    style={styles.mobileMenuRow}
                    onPress={handleLogout}
                  >
                    <Text
                      style={[
                        styles.mobileItem,
                        styles.logoutText,
                      ]}
                    >
                      Logout
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={
                      styles.mobileMenuRow
                    }
                    onPress={() =>
                      goTo(
                        "/auth/LoginScreen"
                      )
                    }
                  >
                    <Text
                      style={
                        styles.mobileItem
                      }
                    >
                      Login
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      styles.mobileMenuRow
                    }
                    onPress={() =>
                      goTo(
                        "/auth/RegisterScreen"
                      )
                    }
                  >
                    <Text
                      style={
                        styles.mobileItem
                      }
                    >
                      Register
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <View
                style={{
                  height: 60,
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      backgroundColor:
        "#ffffff",

      elevation: 4,

      zIndex: 1000,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 70,

     
    },

    logo: {
      width: 40,
      height: 40,
      resizeMode:
        "contain",
    },

    title: {
  flex: 1,
  fontSize: 15,
  lineHeight: 19,
  fontWeight: "800",
  textAlign: "center",
  color: "green",
  marginHorizontal: 8,
  flexShrink: 1,
},

    menuButton: {
      width: 48,
      height: 48,

      alignItems:
        "center",

      justifyContent:
        "center",

      zIndex: 9999,
    },

    /*
     * WEB
     */
    webMenu: {
      flexDirection:
        "row",

      justifyContent:
        "center",

      flexWrap:
        "wrap",

      paddingHorizontal:
        10,

      paddingBottom:
        10,

      gap: 6,
    },

    webMenuItem: {
      color: "#2563eb",

      marginHorizontal:
        8,

      paddingVertical:
        7,

      fontSize: 15,

      fontWeight:
        "600",
    },

    /*
     * MOBILE MODAL
     */
    modalOverlay: {
      flex: 1,

      backgroundColor:
        "rgba(0,0,0,0.50)",

      justifyContent:
        "flex-end",
    },

    overlayTouchable: {
      ...StyleSheet.absoluteFill,
    },

    mobileMenuContainer: {
      backgroundColor:
        "#ffffff",

      borderTopLeftRadius:
        24,

      borderTopRightRadius:
        24,

      maxHeight: "85%",

      overflow: "hidden",
    },

    mobileMenuHeader: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      paddingHorizontal:
        20,

      paddingVertical:
        18,

      borderBottomWidth:
        1,

      borderBottomColor:
        "#e2e8f0",
    },

    mobileMenuTitle: {
      fontSize: 20,

      fontWeight:
        "900",

      color: "#0f172a",
    },

    closeButtonContainer: {
      width: 44,
      height: 44,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    mobileMenuContent: {
      paddingHorizontal:
        20,
    },

    mobileMenuContentContainer: {
      paddingVertical:
        10,
    },

    mobileMenuRow: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      borderBottomWidth:
        1,

      borderBottomColor:
        "#f1f5f9",

      minHeight: 52,
    },

    mobileItem: {
      flex: 1,

      fontSize: 17,

      color: "#2563eb",

      fontWeight:
        "600",
    },

    submenu: {
      backgroundColor:
        "#f8fafc",

      borderRadius:
        10,

      marginBottom:
        6,
    },

    submenuItem: {
      paddingVertical:
        12,

      paddingHorizontal:
        18,
    },

    submenuText: {
      color: "#475569",

      fontSize: 15,

      fontWeight:
        "600",
    },

    logoutText: {
      color: "#dc2626",
    },
  });