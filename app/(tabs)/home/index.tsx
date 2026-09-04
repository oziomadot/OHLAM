import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import React, {
  useCallback,
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  View,
  RefreshControl,
} from "react-native";

import { MaterialCommunityIcons, } from "@expo/vector-icons";

import {
  useVideoPlayer,
  VideoView,
} from "expo-video";

import API, {
  BASE_URL,
} from "@/src/services/api";

import Navbar from "components/Navbar";
import ScreenWrapper from "components/ScreenWrapper";

import usePreventScreenCapture from "@/hooks/usePreventScreenCapture";

/*
|--------------------------------------------------------------------------
| Categories
|--------------------------------------------------------------------------
*/

const categories = [
  {
    name: "Rent",
    key: "rents",
  },
  {
    name: "House for Sale",
    key: "houseSales",
  },
  {
    name: "Land for Sale",
    key: "landSales",
  },
];

/*
|--------------------------------------------------------------------------
| Media URL
|--------------------------------------------------------------------------
*/

const getMediaUrl = (
  raw: any
): string | null => {
  if (
    !raw ||
    typeof raw !== "string"
  ) {
    return null;
  }

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://")
  ) {
    return raw;
  }

  const baseOrigin =
    BASE_URL.replace(
      /\/api\/?$/,
      ""
    );

  return `${baseOrigin}/storage/${raw.replace(
    /^\/+/,
    ""
  )}`;
};

/*
|--------------------------------------------------------------------------
| Property Image
|--------------------------------------------------------------------------
*/

const getImageUrl = (
  item: any
): string | null => {
  const media =
    item?.media;

  const raw =
    media?.whole_building_url ||
    media?.sitting_room_url ||
    media?.kitchen_url ||
    media?.room_url ||
    media?.toilet_url ||

    media?.wholeBuilding ||
    media?.sittingRoom ||
    media?.kitchen ||
    media?.room ||
    media?.toilet ||

    null;

  return getMediaUrl(
    raw
  );
};

/*
|--------------------------------------------------------------------------
| Property Video
|--------------------------------------------------------------------------
*/

const getVideoUrl = (
  item: any
): string | null => {
  const media =
    item?.media;

  const raw =
    media?.video_url ||
    media?.video ||
    null;

  return getMediaUrl(
    raw
  );
};

/*
|--------------------------------------------------------------------------
| Video Preview
|--------------------------------------------------------------------------
*/

function PropertyVideo({
  url,
}: {
  url: string;
}) {
  const player =
    useVideoPlayer(
      {
        uri: url,
      },
      (player) => {
        player.loop = true;
        player.muted = true;
      }
    );

  return (
    <View
      style={
        styles.propertyVideoBox
      }
    >
      <VideoView
        style={styles.propertyVideo}
        player={player as any}
        nativeControls
        contentFit="cover"
      />

      <View
        style={styles.videoLabel}
      >
        <MaterialCommunityIcons
          name="video"
          size={16}
          color="#ffffff"
        />

        <Text
          style={styles.videoLabelText}
        >
          Property Video
        </Text>
      </View>
    </View>
  );
}
/*
|--------------------------------------------------------------------------
| Property Media Preview
|--------------------------------------------------------------------------
*/

function PropertyMediaPreview({
  videoUrl,
  imageUrl,
}: {
  videoUrl: string | null;
  imageUrl: string | null;
}) {
  /*
   * Video has priority.
   */
  if (
    videoUrl
  ) {
    return (
      <PropertyVideo
        url={
          videoUrl
        }
      />
    );
  }

  /*
   * Otherwise show image.
   */
  if (
    imageUrl
  ) {
    return (
      <Image
        source={{
          uri:
            imageUrl,
        }}
        style={styles.image}
        resizeMode="cover"
      />
    );
  }

  /*
   * No media.
   */
  return (
    <View
      style={styles.noImage}
    >
      <MaterialCommunityIcons
        name="image-off"
        size={34}
        color="#94a3b8"
      />

      <Text
        style={styles.noImageText}
      >
        No Media
      </Text>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Main Screen
|--------------------------------------------------------------------------
*/

const IndexScreen = () => {
    const [properties, setProperties] = useState<any>({});

    const [filters, setFilters] = useState({
        min: "",
        max: "",
        search: "",
      });

  

      const [
      expandedSections,
      setExpandedSections,
    ] = useState<Record<string, boolean>>({});

    const [ loading, setLoading,] = useState(true);

    const [
      refreshing,
      setRefreshing,
    ] =
      useState(
        false
      );

    const router =
      useRouter();

    usePreventScreenCapture(
      true
    );



    // NOTIFICATIONS

    const [
      unreadNotificationCount,
      setUnreadNotificationCount,
    ] = useState(0);



const loadUnreadNotificationCount =
  async () => {
    try {
      const response =
        await API
          .getUnreadNotificationCount();

      setUnreadNotificationCount(
        Number(
          response
            ?.unread_count ||
            0
        )
      );
    } catch (
      error: any
    ) {
      /*
       * The public home screen may also be opened by
       * unauthenticated users. Do not show an error in
       * that situation.
       */
      if (
        error?.response
          ?.status !== 401
      ) {
        console.log(
          "Unable to load unread notification count:",
          error
        );
      }

      setUnreadNotificationCount(
        0
      );
    }
  };


    /*
    |--------------------------------------------------------------------------
    | Load Properties
    |--------------------------------------------------------------------------
    */

    const loadProperties =
      async () => {
        try {
          setLoading(
            true
          );

          const res =
            await API.getProperties();

          console.log(
            "list of uploads:",
            res.data
          );

          setProperties(
            res.data
              ?.properties ||
              {}
          );
        } catch (
          error
        ) {
          console.log(
            "❌ Error loading properties:",
            error
          );
        } finally {
          setLoading(
            false
          );
        }
      };

   useFocusEffect(
  useCallback(
    () => {
      loadProperties();
      loadUnreadNotificationCount();
    },
    []
  )
);

    const onRefresh =
      async () => {
        setRefreshing(
          true
        );

        await Promise.all([
          loadProperties(),
          loadUnreadNotificationCount(),
        ]);

        setRefreshing(
          false
        );
  };

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    const formatMoney = (
      amount: any
    ) => {
      if (
        amount === null ||
        amount === undefined ||
        amount === ""
      ) {
        return "Price on request";
      }

      const value =
        Number(
          String(
            amount
          ).replace(
            /,/g,
            ""
          )
        );

      if (
        !Number.isFinite(
          value
        )
      ) {
        return "Price on request";
      }

      return `₦${value.toLocaleString(
        "en-NG"
      )}`;
    };

    const getSafeLocation =
      (
        item: any
      ) => {
        const area =
          item?.area
            ?.name ||
          item
            ?.popular_name;

        const state =
          item?.state
            ?.name;

        if (
          area &&
          state
        ) {
          return `${area}, ${state}`;
        }

        if (
          area
        ) {
          return area;
        }

        if (
          state
        ) {
          return state;
        }

        return "Location available after verification";
      };

    const getListerRole =
      (
        item: any
      ) => {
        return (
          item
            ?.listing_role
            ?.name ||
          item
            ?.listingRole
            ?.name ||
          item
            ?.registrationStatus
            ?.name ||
          item
            ?.lister_role ||
          "Property Lister"
        );
      };

    const isListerVerified =
      (
        item: any
      ) => {
        return Boolean(
          item?.user
            ?.is_verified ||
            item?.user
              ?.verified ||
            item
              ?.lister_verified ||
            item?.agent
              ?.is_verified
        );
      };

    const isPropertyVerified =
      (
        item: any
      ) => {
        return Boolean(
          item
            ?.ownership_verified ||
            item
              ?.is_verified ||
            item
              ?.verified ||
            item
              ?.verification_status_id ===
              2 ||
            item
              ?.verification_status
              ?.name
              ?.toLowerCase() ===
              "verified"
        );
      };

    const isCompleted =
      (
        item: any
      ) => {
        return Boolean(
          item
            ?.transaction_completed ||
            item
              ?.status
              ?.name
              ?.toLowerCase() ===
              "completed"
        );
      };

    const getUnavailableLabel =
      (
        item: any,
        categoryKey:
          string
      ) => {
        return (
          item
            ?.status
            ?.display_name ||
          item
            ?.status
            ?.name ||
          (
            categoryKey ===
            "rents"
              ? "Available"
              : "For Sale"
          )
        );
      };

    const normalizeNumberInput = (
      value: string
    ) => {
      const cleaned = String(
        value || ""
      ).replace(/[^0-9.]/g, "");

      const parsed = Number(cleaned);

      return Number.isFinite(parsed)
        ? parsed
        : 0;
    };

    const clearFilters = () => {
      setFilters({
        min: "",
        max: "",
        search: "",
      });
    };

    const hasActiveFilters =
      Boolean(
        filters.search.trim() ||
        filters.min.trim() ||
        filters.max.trim()
      );

    const filterItems =
      (
        items: any[]
      ) => {
        const search =
          filters.search
            .trim()
            .toLowerCase();

        const minAmount =
          normalizeNumberInput(
            filters.min
          );

        const maxAmount =
          normalizeNumberInput(
            filters.max
          );

        return items.filter(
          (
            item
          ) => {
            const amount =
              Number(
                String(
                  item?.amount ??
                    0
                ).replace(
                  /,/g,
                  ""
                )
              ) || 0;

            const matchMin =
              !filters.min.trim() ||
              amount >= minAmount;

            const matchMax =
              !filters.max.trim() ||
              amount <= maxAmount;

            const searchableText =
              [
                item?.address,
                item?.popular_name,
                item?.state?.name,
                item?.area?.name,
                item?.property_type?.name,
                item?.propertyType?.name,
                item?.listing_role?.name,
                item?.listingRole?.name,
                item?.verification_status?.name,
                item?.status?.name,
                item?.status?.display_name,
                item?.rental_detail?.building_type?.name,
                item?.rental_detail?.flat_type?.name,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchSearch =
              !search ||
              searchableText.includes(
                search
              );

            return (
              matchMin &&
              matchMax &&
              matchSearch
            );
          }
        );
      };

    const groupRentals =
      (
        rents: any[]
      ) => {
        const groups:
          any = {};

        rents.forEach(
          (
            item
          ) => {
            const buildingType =
              item
                ?.rental_detail
                ?.building_type
                ?.name ||
              "Others";

            const flatType =
              item
                ?.rental_detail
                ?.flat_type
                ?.name;

            const groupName =
              buildingType ===
              "Flat"
                ? flatType ||
                  "Unspecified Flat Type"
                : buildingType;

            if (
              !groups[
                groupName
              ]
            ) {
              groups[
                groupName
              ] = [];
            }

            groups[
              groupName
            ].push(
              item
            );
          }
        );

        return groups;
      };

    /*
    |--------------------------------------------------------------------------
    | Property Card
    |--------------------------------------------------------------------------
    */

    const PropertyCard =
      ({
        item,
        categoryKey,
        fullWidth = false,
      }: any) => {
        const imageUrl =
          getImageUrl(
            item
          );

        const videoUrl =
          getVideoUrl(
            item
          );

        const listerVerified =
          isListerVerified(
            item
          );

        const propertyVerified =
          isPropertyVerified(
            item
          );

        const completed =
          isCompleted(
            item
          );

        const statusLabel =
          getUnavailableLabel(
            item,
            categoryKey
          );

        const lowerStatus =
          String(
            statusLabel ||
              ""
          ).toLowerCase();

        const unavailable =
          lowerStatus.includes(
            "sold"
          ) ||
          lowerStatus.includes(
            "rented"
          );

        return (
          <TouchableOpacity
            activeOpacity={
              0.88
            }
            onPress={() =>
              router.push(
                `/home/property/${item.id}`
              )
            }
            style={[
              styles.card,
              fullWidth &&
                styles.cardFullWidth,
            ]}
          >
            {/*
            ==========================================================
            MEDIA
            ==========================================================
            */}

            <View
              style={
                styles.imageWrap
              }
            >
              <PropertyMediaPreview
                videoUrl={
                  videoUrl
                }
                imageUrl={
                  imageUrl
                }
              />

              <View
                style={[
                  styles.statusBadge,

                  unavailable
                    ? styles.dangerBadge
                    : styles.successBadge,
                ]}
              >
                <Text
                  style={
                    styles.statusBadgeText
                  }
                >
                  {
                    statusLabel
                  }
                </Text>
              </View>

              {completed && (
                <View
                  style={
                    styles.completedBadge
                  }
                >
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={13}
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.completedText
                    }
                  >
                    Completed
                  </Text>
                </View>
              )}
            </View>

            {/*
            ==========================================================
            CARD BODY
            ==========================================================
            */}

            <View
              style={
                styles.cardBody
              }
            >
              <Text
                style={
                  styles.price
                }
              >
                {formatMoney(
                  item.amount
                )}
              </Text>

              <View
                style={
                  styles.locationRow
                }
              >
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={15}
                  color="#64748b"
                />

                <Text
                  style={
                    styles.location
                  }
                  numberOfLines={
                    1
                  }
                >
                  {getSafeLocation(
                    item
                  )}
                </Text>
              </View>

              <Text
                style={
                  styles.privacyText
                }
              >
                Exact address is hidden until safe verification.
              </Text>

              <View
                style={
                  styles.metaRow
                }
              >
                <View
                  style={
                    styles.metaPill
                  }
                >
                  <MaterialCommunityIcons
                    name="account-tie"
                    size={14}
                    color="#334155"
                  />

                  <Text
                    style={
                      styles.metaText
                    }
                  >
                    {getListerRole(
                      item
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.metaPill
                  }
                >
                  <MaterialCommunityIcons
                    name="shield-lock"
                    size={14}
                    color="#334155"
                  />

                  <Text
                    style={
                      styles.metaText
                    }
                  >
                    Secure Chat
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.trustGrid
                }
              >
                <View
                  style={[
                    styles.trustItem,

                    listerVerified
                      ? styles.trustGood
                      : styles.trustPending,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      listerVerified
                        ? "account-check"
                        : "account-clock"
                    }
                    size={15}
                    color={
                      listerVerified
                        ? "#047857"
                        : "#92400e"
                    }
                  />

                  <Text
                    style={[
                      styles.trustText,

                      {
                        color:
                          listerVerified
                            ? "#047857"
                            : "#92400e",
                      },
                    ]}
                  >
                    {listerVerified
                      ? "Lister Verified"
                      : "Lister Pending"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.trustItem,

                    propertyVerified
                      ? styles.trustGood
                      : styles.trustPending,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      propertyVerified
                        ? "home-circle-outline"
                        : "home-alert"
                    }
                    size={15}
                    color={
                      propertyVerified
                        ? "#047857"
                        : "#92400e"
                    }
                  />

                  <Text
                    style={[
                      styles.trustText,

                      {
                        color:
                          propertyVerified
                            ? "#047857"
                            : "#92400e",
                      },
                    ]}
                  >
                    {propertyVerified
                      ? "Property Verified"
                      : "Property Pending"}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.actionRow
                }
              >
                <TouchableOpacity
                  style={
                    styles.primaryAction
                  }
                  onPress={() =>
                    router.push(
                      `/home/property/${item.id}`
                    )
                  }
                >
                  <Text
                    style={
                      styles.primaryActionText
                    }
                  >
                    View Details
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.iconAction
                  }
                  onPress={() =>
                    router.push(
                      `/home/property/${item.id}`
                    )
                  }
                >
                  <MaterialCommunityIcons
                    name="heart-outline"
                    size={20}
                    color="#2563eb"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        );
      };

    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (
      loading
    ) {
      return (
        <ScreenWrapper>
          <View
            style={
              styles.loadingContainer
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
              Loading verified properties...
            </Text>
          </View>
        </ScreenWrapper>
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
      <ScreenWrapper>
        <Navbar />

        <ScrollView
          style={
            styles.page
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
          {/*
          ==========================================================
          HERO
          ==========================================================
          */}

         <View
  style={
    styles.hero
  }
>
  <View
    style={
      styles.heroTopRow
    }
  >
    <Text
      style={
        styles.kicker
      }
    >
      Smart Real Estate Marketplace
    </Text>

    <TouchableOpacity
      style={
        styles.notificationButton
      }
      activeOpacity={
        0.8
      }
      accessibilityRole="button"
      accessibilityLabel={
        unreadNotificationCount > 0
          ? `${unreadNotificationCount} unread notifications`
          : "Notifications"
      }
      onPress={() =>
        router.push(
          "/(tabs)/dashboard/notification"
        )
      }
    >
      <MaterialCommunityIcons
        name={
          unreadNotificationCount > 0
            ? "bell"
            : "bell-outline"
        }
        size={26}
        color="#0f172a"
      />

      {unreadNotificationCount >
        0 && (
        <View
          style={
            styles.notificationBadge
          }
        >
          <Text
            style={
              styles.notificationBadgeText
            }
          >
            {unreadNotificationCount >
            99
              ? "99+"
              : unreadNotificationCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  

            <Text
              style={
                styles.headerTitle
              }
            >
              Find safer houses, flats and land across Nigeria
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Verified listings, protected messaging, escrow support and privacy-safe property discovery.
            </Text>

            <View
              style={
                styles.filterCard
              }
            >
              <View
                style={
                  styles.filterHeader
                }
              >
                <View
                  style={
                    styles.filterTitleRow
                  }
                >
                  <MaterialCommunityIcons
                    name="tune-variant"
                    size={20}
                    color="#0f172a"
                  />

                  <Text
                    style={
                      styles.filterTitle
                    }
                  >
                    Find the right property
                  </Text>
                </View>

                {hasActiveFilters && (
                  <TouchableOpacity
                    onPress={
                      clearFilters
                    }
                    style={
                      styles.clearFilterButton
                    }
                  >
                    <Text
                      style={
                        styles.clearFilterText
                      }
                    >
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View
                style={
                  styles.searchBox
                }
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={21}
                  color="#64748b"
                />

                <TextInput
                  value={
                    filters.search
                  }
                  onChangeText={(
                    value
                  ) =>
                    setFilters(
                      (
                        current
                      ) => ({
                        ...current,
                        search:
                          value,
                      })
                    )
                  }
                  placeholder="Search state, area, property type..."
                  placeholderTextColor="#94a3b8"
                  style={
                    styles.searchInput
                  }
                  returnKeyType="search"
                  autoCorrect={
                    false
                  }
                />

                {!!filters.search && (
                  <TouchableOpacity
                    onPress={() =>
                      setFilters(
                        (
                          current
                        ) => ({
                          ...current,
                          search:
                            "",
                        })
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                )}
              </View>

              <Text
                style={
                  styles.priceFilterLabel
                }
              >
                Price range
              </Text>

              <View
                style={
                  styles.priceFilterRow
                }
              >
                <View
                  style={
                    styles.priceInputBox
                  }
                >
                  <Text
                    style={
                      styles.currencyPrefix
                    }
                  >
                    ₦
                  </Text>

                  <TextInput
                    value={
                      filters.min
                    }
                    onChangeText={(
                      value
                    ) =>
                      setFilters(
                        (
                          current
                        ) => ({
                          ...current,
                          min:
                            value,
                        })
                      )
                    }
                    placeholder="Minimum"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    style={
                      styles.priceInput
                    }
                  />
                </View>

                <View
                  style={
                    styles.priceDivider
                  }
                />

                <View
                  style={
                    styles.priceInputBox
                  }
                >
                  <Text
                    style={
                      styles.currencyPrefix
                    }
                  >
                    ₦
                  </Text>

                  <TextInput
                    value={
                      filters.max
                    }
                    onChangeText={(
                      value
                    ) =>
                      setFilters(
                        (
                          current
                        ) => ({
                          ...current,
                          max:
                            value,
                        })
                      )
                    }
                    placeholder="Maximum"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    style={
                      styles.priceInput
                    }
                  />
                </View>
              </View>

              <View
                style={
                  styles.filterFooter
                }
              >
                <MaterialCommunityIcons
                  name="lightning-bolt-outline"
                  size={16}
                  color="#2563eb"
                />

                <Text
                  style={
                    styles.filterFooterText
                  }
                >
                  Results update instantly as you type.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.trustBanner
              }
            >
              <View
                style={
                  styles.trustBannerItem
                }
              >
                <MaterialCommunityIcons
                  name="shield-check"
                  size={20}
                  color="#2563eb"
                />

                <Text
                  style={
                    styles.trustBannerText
                  }
                >
                  Verification
                </Text>
              </View>

              <View
                style={
                  styles.trustBannerItem
                }
              >
                <MaterialCommunityIcons
                  name="message-lock"
                  size={20}
                  color="#2563eb"
                />

                <Text
                  style={
                    styles.trustBannerText
                  }
                >
                  Safe Chat
                </Text>
              </View>

              <View
                style={
                  styles.trustBannerItem
                }
              >
                <MaterialCommunityIcons
                  name="wallet"
                  size={20}
                  color="#2563eb"
                />

                <Text
                  style={
                    styles.trustBannerText
                  }
                >
                  Escrow
                </Text>
              </View>
            </View>
          </View>

          {/*
          ==========================================================
          PROPERTY CATEGORIES
          ==========================================================
          */}

          {categories.map(
            ({
              name,
              key,
            }) => {
              const items =
                filterItems(
                  properties[
                    key
                  ] || []
                );

              if (
                !items.length
              ) {
                return null;
              }

              let grouped:
                any = {
                [name]:
                  items,
              };

              if (
                key ===
                "rents"
              ) {
                grouped =
                  groupRentals(
                    items
                  );
              }

              return (
                <View
                  key={
                    key
                  }
                  style={
                    styles.section
                  }
                >
                  <View
                    style={
                      styles.sectionHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.sectionTitle
                        }
                      >
                        {name}
                      </Text>

                      <Text
                        style={
                          styles.sectionSubtitle
                        }
                      >
                        {items.length} trusted listing
                        {items.length >
                        1
                          ? "s"
                          : ""}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        setExpandedSections(
                          (
                            current
                          ) => ({
                            ...current,
                            [key]:
                              !current[
                                key
                              ],
                          })
                        )
                      }
                      style={
                        styles.seeAllButton
                      }
                    >
                      <Text
                        style={
                          styles.seeAll
                        }
                      >
                        {expandedSections[
                          key
                        ]
                          ? "Show less"
                          : "See all"}
                      </Text>

                      <MaterialCommunityIcons
                        name={
                          expandedSections[
                            key
                          ]
                            ? "chevron-up"
                            : "chevron-right"
                        }
                        size={19}
                        color="#2563eb"
                      />
                    </TouchableOpacity>
                  </View>

                  {Object.entries(
                    grouped
                  ).map(
                    ([
                      subcat,
                      list,
                    ]: any) => (
                      <View
                        key={
                          subcat
                        }
                        style={
                          styles.subSection
                        }
                      >
                        <Text
                          style={
                            styles.subTitle
                          }
                        >
                          {
                            subcat
                          }
                        </Text>

                        {list.length >
                          1 &&
                          !expandedSections[
                            key
                          ] && (
                            <View
                              style={
                                styles.swipeHint
                              }
                            >
                              <MaterialCommunityIcons
                                name="chevron-left"
                                size={18}
                                color="#2563eb"
                              />

                              <Text
                                style={
                                  styles.swipeHintText
                                }
                              >
                                Swipe to see more
                              </Text>

                              <MaterialCommunityIcons
                                name="chevron-right"
                                size={18}
                                color="#2563eb"
                              />
                            </View>
                          )}

                        {expandedSections[
                          key
                        ] ? (
                          <View
                            style={
                              styles.expandedList
                            }
                          >
                            {list.map(
                              (
                                item: any
                              ) => (
                                <PropertyCard
                                  key={
                                    item.id
                                  }
                                  item={
                                    item
                                  }
                                  categoryKey={
                                    key
                                  }
                                  fullWidth
                                />
                              )
                            )}
                          </View>
                        ) : (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={
                              true
                            }
                            persistentScrollbar
                            contentContainerStyle={
                              styles.horizontalContent
                            }
                          >
                            {list.map(
                              (
                                item: any
                              ) => (
                                <PropertyCard
                                  key={
                                    item.id
                                  }
                                  item={
                                    item
                                  }
                                  categoryKey={
                                    key
                                  }
                                />
                              )
                            )}
                          </ScrollView>
                        )}
                      </View>
                    )
                  )}
                </View>
              );
            }
          )}

          {/*
          ==========================================================
          SAFETY
          ==========================================================
          */}

          <View
            style={
              styles.safetyCard
            }
          >
            <MaterialCommunityIcons
              name="alert-decagram"
              size={28}
              color="#92400e"
            />

            <Text
              style={
                styles.safetyTitle
              }
            >
              Safety Reminder
            </Text>

            <Text
              style={
                styles.safetyText
              }
            >
              Do not pay directly to strangers. Use verified listings, in-app messaging, property inspection appointments and escrow deposit protection.
            </Text>
          </View>

          <View
            style={{
              height:
                40,
            }}
          />
        </ScrollView>
      </ScreenWrapper>
    );
  };

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    loadingContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    loadingText: {
      marginTop: 12,
      color:
        "#64748b",
      fontWeight:
        "700",
    },

    hero: {
      paddingHorizontal:
        18,
      paddingTop: 20,
      paddingBottom: 18,
      backgroundColor:
        "#ffffff",
      borderBottomLeftRadius:
        28,
      borderBottomRightRadius:
        28,
    },

    kicker: {
      color:
        "#2563eb",
      fontWeight:
        "900",
      fontSize: 13,
      marginBottom: 8,
    },

    headerTitle: {
      fontSize: 28,
      fontWeight:
        "900",
      color:
        "#0f172a",
      lineHeight: 36,
    },

    subtitle: {
      marginTop: 10,
      fontSize: 15,
      color:
        "#64748b",
      lineHeight: 23,
      marginBottom: 16,
    },

    filterCard: {
      marginTop: 4,
      backgroundColor:
        "#f8fafc",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      borderRadius: 22,
      padding: 14,
    },

    filterHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 12,
    },

    filterTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    filterTitle: {
      color:
        "#0f172a",
      fontWeight:
        "900",
      fontSize: 15,
    },

    clearFilterButton: {
      backgroundColor:
        "#fee2e2",
      paddingHorizontal:
        10,
      paddingVertical:
        6,
      borderRadius: 999,
    },

    clearFilterText: {
      color:
        "#b91c1c",
      fontSize: 12,
      fontWeight:
        "900",
    },

    searchBox: {
      minHeight: 50,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#cbd5e1",
      borderRadius: 15,
      paddingHorizontal: 13,
    },

    searchInput: {
      flex: 1,
      color:
        "#0f172a",
      fontSize: 14,
      fontWeight:
        "600",
      paddingVertical: 12,
    },

    priceFilterLabel: {
      marginTop: 13,
      marginBottom: 7,
      color:
        "#475569",
      fontSize: 12,
      fontWeight:
        "800",
    },

    priceFilterRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    priceInputBox: {
      flex: 1,
      minHeight: 48,
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#cbd5e1",
      borderRadius: 14,
      paddingHorizontal: 12,
    },

    currencyPrefix: {
      color:
        "#334155",
      fontWeight:
        "900",
      marginRight: 5,
    },

    priceInput: {
      flex: 1,
      color:
        "#0f172a",
      fontWeight:
        "700",
      paddingVertical: 11,
    },

    priceDivider: {
      width: 10,
      height: 2,
      backgroundColor:
        "#94a3b8",
      borderRadius: 2,
    },

    filterFooter: {
      marginTop: 10,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    filterFooterText: {
      color:
        "#64748b",
      fontSize: 11,
      fontWeight:
        "700",
    },

    trustBanner: {
      marginTop: 16,
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      gap: 10,
    },

    trustBannerItem: {
      flex: 1,
      backgroundColor:
        "#eff6ff",
      paddingVertical:
        11,
      borderRadius: 16,
      alignItems:
        "center",
      gap: 5,
    },

    trustBannerText: {
      color:
        "#1e40af",
      fontSize: 11,
      fontWeight:
        "900",
    },

    section: {
      marginTop: 24,
    },

    sectionHeader: {
      paddingHorizontal:
        18,
      marginBottom: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    sectionTitle: {
      fontSize: 22,
      fontWeight:
        "900",
      color:
        "#0f172a",
    },

    sectionSubtitle: {
      color:
        "#64748b",
      marginTop: 3,
      fontSize: 13,
    },

    seeAllButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#eff6ff",
      paddingLeft: 11,
      paddingRight: 7,
      paddingVertical: 8,
      borderRadius: 999,
    },

    seeAll: {
      color:
        "#2563eb",
      fontWeight:
        "900",
      fontSize: 12,
    },

    swipeHint: {
      alignSelf:
        "flex-end",
      marginRight: 18,
      marginBottom: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#eff6ff",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 999,
    },

    swipeHintText: {
      color:
        "#2563eb",
      fontSize: 11,
      fontWeight:
        "800",
    },

    expandedList: {
      paddingHorizontal: 18,
      gap: 16,
    },

    subSection: {
      marginBottom: 20,
    },

    subTitle: {
      paddingHorizontal:
        18,
      fontSize: 16,
      fontWeight:
        "900",
      color:
        "#334155",
      marginBottom: 10,
    },

    horizontalContent: {
      paddingLeft: 18,
      paddingRight: 8,
    },

    /*
    |--------------------------------------------------------------------------
    | Property Card
    |--------------------------------------------------------------------------
    */

    card: {
      width: 285,
      marginRight: 14,
      backgroundColor:
        "#ffffff",
      borderRadius: 24,
      overflow:
        "hidden",
      elevation: 4,
    },

    cardFullWidth: {
      width: "100%",
      marginRight: 0,
    },

    imageWrap: {
      width:
        "100%",
      height: 165,
      backgroundColor:
        "#e2e8f0",
      overflow:
        "hidden",
    },

    image: {
      width:
        "100%",
      height:
        "100%",
    },

    /*
    |--------------------------------------------------------------------------
    | Video
    |--------------------------------------------------------------------------
    */

    videoContainer: {
      width:
        "100%",
      height:
        "100%",
      backgroundColor:
        "#000000",
    },

    video: {
      width:
        "100%",
      height:
        "100%",
    },

    videoBadge: {
      position:
        "absolute",
      top: 12,
      right: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
      backgroundColor:
        "rgba(15,23,42,0.78)",
      paddingHorizontal:
        9,
      paddingVertical:
        5,
      borderRadius:
        999,
    },

    videoBadgeText: {
      color:
        "#ffffff",
      fontSize: 10,
      fontWeight:
        "900",
    },

    propertyVideoBox: {
      width:
        "100%",
      height: 165,
      borderRadius: 24,
      overflow:
        "hidden",
      backgroundColor:
        "#000000",
    },

    propertyVideo: {
      width:
        "100%",
      height:
        "100%",
    },

    videoLabel: {
      position:
        "absolute",
      bottom: 12,
      left: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
      backgroundColor:
        "rgba(15,23,42,0.78)",
      paddingHorizontal:
        9,
      paddingVertical:
        5,
      borderRadius:
        999,
    },

    videoLabelText: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "900",
    },

    noImage: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    noImageText: {
      color:
        "#94a3b8",
      fontWeight:
        "700",
      marginTop: 6,
    },

    statusBadge: {
      position:
        "absolute",
      top: 12,
      left: 12,
      paddingHorizontal:
        10,
      paddingVertical:
        6,
      borderRadius:
        999,
    },

    successBadge: {
      backgroundColor:
        "#16a34a",
    },

    dangerBadge: {
      backgroundColor:
        "#dc2626",
    },

    statusBadgeText: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "900",
    },

    completedBadge: {
      position:
        "absolute",
      bottom: 12,
      left: 12,
      backgroundColor:
        "#0f172a",
      paddingHorizontal:
        10,
      paddingVertical:
        6,
      borderRadius:
        999,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    completedText: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "900",
    },

    cardBody: {
      padding: 14,
    },

    price: {
      fontSize: 20,
      fontWeight:
        "900",
      color:
        "#0f172a",
    },

    locationRow: {
      marginTop: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    location: {
      flex: 1,
      color:
        "#475569",
      fontWeight:
        "700",
    },

    privacyText: {
      marginTop: 5,
      fontSize: 11,
      color:
        "#94a3b8",
      fontWeight:
        "600",
    },

    metaRow: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
      marginTop: 12,
    },

    metaPill: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
      backgroundColor:
        "#f1f5f9",
      paddingHorizontal:
        9,
      paddingVertical:
        6,
      borderRadius:
        999,
    },

    metaText: {
      color:
        "#334155",
      fontSize: 11,
      fontWeight:
        "800",
    },

    trustGrid: {
      gap: 8,
      marginTop: 12,
    },

    trustItem: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
      paddingVertical:
        8,
      paddingHorizontal:
        10,
      borderRadius:
        14,
    },

    trustGood: {
      backgroundColor:
        "#ecfdf5",
    },

    trustPending: {
      backgroundColor:
        "#fffbeb",
    },

    trustText: {
      fontSize: 12,
      fontWeight:
        "900",
    },

    actionRow: {
      flexDirection:
        "row",
      gap: 10,
      marginTop: 14,
    },

    primaryAction: {
      flex: 1,
      backgroundColor:
        "#2563eb",
      paddingVertical:
        12,
      borderRadius:
        14,
      alignItems:
        "center",
    },

    primaryActionText: {
      color:
        "#ffffff",
      fontWeight:
        "900",
    },

    iconAction: {
      width: 46,
      backgroundColor:
        "#eff6ff",
      borderRadius:
        14,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    safetyCard: {
      marginHorizontal:
        18,
      marginTop: 10,
      backgroundColor:
        "#fffbeb",
      borderColor:
        "#fde68a",
      borderWidth: 1,
      padding: 18,
      borderRadius:
        24,
    },

    safetyTitle: {
      marginTop: 8,
      color:
        "#92400e",
      fontSize: 17,
      fontWeight:
        "900",
    },

    safetyText: {
      marginTop: 8,
      color:
        "#92400e",
      lineHeight: 22,
      fontWeight:
        "600",
    },


    heroTopRow: {
  flexDirection:
    "row",
  alignItems:
    "center",
  justifyContent:
    "space-between",
  marginBottom: 8,
},

notificationButton: {
  width: 46,
  height: 46,
  borderRadius: 16,
  backgroundColor:
    "#f1f5f9",
  alignItems:
    "center",
  justifyContent:
    "center",
  position:
    "relative",
  borderWidth: 1,
  borderColor:
    "#e2e8f0",
},

notificationBadge: {
  position:
    "absolute",
  top: -5,
  right: -7,
  minWidth: 21,
  height: 21,
  borderRadius: 11,
  paddingHorizontal: 5,
  backgroundColor:
    "#dc2626",
  alignItems:
    "center",
  justifyContent:
    "center",
  borderWidth: 2,
  borderColor:
    "#ffffff",
},

notificationBadgeText: {
  color:
    "#ffffff",
  fontSize: 10,
  lineHeight: 13,
  fontWeight:
    "900",
},
  });

export default IndexScreen;