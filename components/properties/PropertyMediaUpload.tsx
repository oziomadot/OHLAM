import React from "react";
import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
} from "react-native";

type Props = {
  selectedPropertyType: number;
  images: any;
  video: any;
  pickImage: (field: string) => void;
  pickVideo: () => void;
};

const buildingPhotoFields = [
  {
    label: "Whole Building / Main Property Photo",
    key: "wholeBuilding",
  },
  {
    label: "Sitting Room Photo",
    key: "sittingRoom",
  },
  {
    label: "Kitchen Photo",
    key: "kitchenImage",
  },
  {
    label: "Room Photo",
    key: "room",
  },
  {
    label: "Toilet Photo",
    key: "toiletImage",
  },
];

export default function PropertyMediaUpload({
  selectedPropertyType,
  images,
  video,
  pickImage,
  pickVideo,
}: Props) {
  if (
    !selectedPropertyType ||
    ![1, 2, 3].includes(selectedPropertyType)
  ) {
    return null;
  }

  const isLand =
    selectedPropertyType === 3;

  /*
   * LAND SALE
   *
   * Land does not have:
   * - sitting room
   * - kitchen
   * - bedroom
   * - toilet
   *
   * We keep the backend field name
   * "wholeBuilding" for compatibility,
   * but display it to the user as
   * "Land Photo".
   */
  if (isLand) {
    const landPhoto =
      images?.wholeBuilding;

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>
          Land Media
        </Text>

        <Text style={styles.helpText}>
          Upload at least one land photo or
          one land video. You may also upload
          both.
        </Text>

        <View style={styles.ruleCard}>
          <Text style={styles.ruleTitle}>
            Media requirement
          </Text>

          <Text style={styles.ruleText}>
            ✓ Land photo only is allowed
          </Text>

          <Text style={styles.ruleText}>
            ✓ Land video only is allowed
          </Text>

          <Text style={styles.ruleText}>
            ✓ Land photo and video are allowed
          </Text>

          <Text style={styles.ruleText}>
            ✕ You cannot submit without any media
          </Text>
        </View>

        {/* LAND PHOTO */}
        <View style={styles.photoBox}>
          <Text style={styles.label}>
            Land Photo
          </Text>

          <Text style={styles.optionalText}>
            Optional if a land video is uploaded
          </Text>

          <Button
            title={
              landPhoto?.uri
                ? "Change Land Photo"
                : "Pick Land Photo"
            }
            onPress={() =>
              pickImage("wholeBuilding")
            }
          />

          {landPhoto?.uri ? (
            <>
              <Image
                source={{
                  uri: landPhoto.uri,
                }}
                style={styles.img}
              />

              <Text style={styles.selectedText}>
                ✓ Land photo selected
              </Text>
            </>
          ) : null}
        </View>

        <View style={styles.orContainer}>
          <Text style={styles.orText}>
            OR / AND
          </Text>
        </View>

        {/* LAND VIDEO */}
        <View style={styles.videoBox}>
          <Text style={styles.label}>
            Land Video
          </Text>

          <Text style={styles.optionalText}>
            Optional if a land photo is uploaded
          </Text>

          <Button
            title={
              video
                ? "Change Land Video"
                : "Pick Land Video"
            }
            onPress={pickVideo}
          />

          {video ? (
            <Text style={styles.selectedText}>
              ✓{" "}
              {video.name ||
                "Land video selected"}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  /*
   * RENTAL / HOUSE SALE
   */
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Property Media
      </Text>

      <Text style={styles.helpText}>
        Upload a property video or at least
        one property photo. You may upload
        both.
      </Text>

      <View style={styles.ruleCard}>
        <Text style={styles.ruleTitle}>
          Media requirement
        </Text>

        <Text style={styles.ruleText}>
          ✓ Video only is allowed
        </Text>

        <Text style={styles.ruleText}>
          ✓ One photo is enough
        </Text>

        <Text style={styles.ruleText}>
          ✓ Multiple photos are allowed
        </Text>

        <Text style={styles.ruleText}>
          ✓ Video and photos are allowed
        </Text>

        <Text style={styles.ruleText}>
          ✕ You cannot submit without any media
        </Text>
      </View>

      {/* VIDEO */}
      <View style={styles.videoBox}>
        <Text style={styles.label}>
          Property Video
        </Text>

        <Text style={styles.optionalText}>
          Optional if at least one photo is uploaded
        </Text>

        <Button
          title={
            video
              ? "Change Video"
              : "Pick Video"
          }
          onPress={pickVideo}
        />

        {video ? (
          <Text style={styles.selectedText}>
            ✓{" "}
            {video.name ||
              "Video selected"}
          </Text>
        ) : null}
      </View>

      <View style={styles.orContainer}>
        <Text style={styles.orText}>
          OR / AND
        </Text>
      </View>

      <Text style={styles.photoHeading}>
        Property Photos
      </Text>

      <Text style={styles.optionalText}>
        All photo slots are optional.
        If you do not upload a video,
        choose at least one photo.
      </Text>

      {buildingPhotoFields.map(
        ({ label, key }) => {
          const image =
            images?.[key];

          return (
            <View
              key={key}
              style={styles.photoBox}
            >
              <Text style={styles.label}>
                {label}
              </Text>

              <Text style={styles.optionalText}>
                Optional
              </Text>

              <Button
                title={
                  image?.uri
                    ? "Change Photo"
                    : "Pick Photo"
                }
                onPress={() =>
                  pickImage(key)
                }
              />

              {image?.uri ? (
                <>
                  <Image
                    source={{
                      uri: image.uri,
                    }}
                    style={styles.img}
                  />

                  <Text
                    style={styles.selectedText}
                  >
                    ✓ Photo selected
                  </Text>
                </>
              ) : null}
            </View>
          );
        }
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      marginVertical: 16,
    },

    sectionTitle: {
      fontSize: 19,
      fontWeight: "800",
      marginBottom: 8,
      color: "#111827",
    },

    helpText: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 14,
      color: "#4B5563",
    },

    ruleCard: {
      backgroundColor: "#F0FDF4",
      borderWidth: 1,
      borderColor: "#BBF7D0",
      padding: 12,
      borderRadius: 10,
      marginBottom: 16,
    },

    ruleTitle: {
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 7,
      color: "#166534",
    },

    ruleText: {
      fontSize: 13,
      lineHeight: 20,
      color: "#374151",
    },

    videoBox: {
      borderWidth: 1,
      borderColor: "#D1D5DB",
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      backgroundColor: "#FFFFFF",
    },

    photoBox: {
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      backgroundColor: "#FFFFFF",
    },

    photoHeading: {
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 4,
      color: "#111827",
    },

    label: {
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 4,
      color: "#111827",
    },

    optionalText: {
      fontSize: 12,
      color: "#6B7280",
      marginBottom: 9,
    },

    img: {
      width: 150,
      height: 150,
      marginTop: 10,
      borderRadius: 8,
    },

    selectedText: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: "700",
      color: "#15803D",
    },

    orContainer: {
      alignItems: "center",
      marginVertical: 8,
    },

    orText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#6B7280",
    },
  });