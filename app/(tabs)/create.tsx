import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
// @ts-ignore
import MapView, {
  Circle,
  MapView as MapViewType,
  Marker,
  Region,
} from "react-native-maps";
// @ts-ignore
import { MotiView } from "@motify/components";
import { useNavigation } from "@react-navigation/native";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { useLocation } from "../../contexts/LocationContext";
import { db } from "../../firebase";

function getRegionForRadius(
  lat: number,
  lng: number,
  radiusInMeters: number
): Region {
  const oneDegreeOfLatitudeInMeters = 111320;
  const latitudeDelta = (radiusInMeters / oneDegreeOfLatitudeInMeters) * 2.2;
  const longitudeDelta =
    (radiusInMeters /
      (oneDegreeOfLatitudeInMeters * Math.cos(lat * (Math.PI / 180)))) *
    2.2;
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta,
    longitudeDelta,
  };
}

// Function to detect text language and return appropriate character limit
function getCharacterLimit(text: string): number {
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
  const englishRegex = /[a-zA-Z]/;

  const chineseChars = (
    text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []
  ).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = text.length;

  // If more than 50% Chinese characters
  if (chineseChars / totalChars > 0.5) {
    return 100; // Chinese limit: 80-120 chars
  }
  // If more than 70% English characters
  else if (englishChars / totalChars > 0.7) {
    return 200; // English limit: 180-200 chars
  }
  // Mixed or other languages
  else {
    return 150;
  }
}

// Function to get language type for display
function getLanguageType(text: string): string {
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
  const englishRegex = /[a-zA-Z]/;

  const chineseChars = (
    text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []
  ).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = text.length;

  if (totalChars === 0) return "English";

  if (chineseChars / totalChars > 0.5) {
    return "Chinese";
  } else if (englishChars / totalChars > 0.7) {
    return "English";
  } else {
    return "Mixed";
  }
}

const LoadingIndicator = ({ size }: { size: number }) => {
  const { isDarkMode } = useDarkMode();
  const { t } = useTranslation();

  return (
    <View style={[styles.mapLoading, isDarkMode && styles.mapLoadingDark]}>
      <MotiView
        from={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 0,
          shadowOpacity: 0.5,
        }}
        animate={{
          width: size + 20,
          height: size + 20,
          borderRadius: (size + 20) / 2,
          borderWidth: 4,
          shadowOpacity: 1,
        }}
        style={{
          borderColor: "#FDBA74",
          shadowColor: "#FDBA74",
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 10,
          backgroundColor: "transparent",
        }}
      />
      <Text
        style={[styles.mapLoadingText, isDarkMode && styles.mapLoadingTextDark]}
      >
        {t("create.loading")}
      </Text>
    </View>
  );
};

export default function CreatePostScreen() {
  const { user, primaryUserId } = useAuth();
  const navigation = useNavigation();
  const { isDarkMode } = useDarkMode();
  const { t } = useTranslation();

  const {
    location,
    loading: locationLoading,
    error: locationError,
    refresh: refreshLocation,
  } = useLocation();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mapRef = useRef<MapViewType>(null);

  // Dynamic character limit based on text content
  const currentLimit = getCharacterLimit(text);
  const languageType = getLanguageType(text);
  const charactersRemaining = currentLimit - text.length;
  const isNearLimit = charactersRemaining <= 20;
  const isOverLimit = charactersRemaining < 0;

  const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#212121" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [{ color: "#757575" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#2c2c2c" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#383838" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212121" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#000000" }],
    },
  ];

  useEffect(() => {
    if (locationError && !locationLoading) {
      // Optionally retry location after a delay
      const retryTimer = setTimeout(() => {
        refreshLocation();
      }, 3000);
      return () => clearTimeout(retryTimer);
    }
  }, [locationError, locationLoading, refreshLocation]);

  const handleTextChange = (newText: string) => {
    const limit = getCharacterLimit(newText);
    // Allow typing but prevent exceeding the limit
    if (newText.length <= limit) {
      setText(newText);
    }
  };

  const handlePost = async () => {
    if (!text.trim() || !location || !user || !primaryUserId || isOverLimit)
      return;

    setPosting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      // Create the post object
      const postData = {
        text: text.trim(),
        timestamp: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
        lat: location.latitude,
        lng: location.longitude,
        userId: primaryUserId,
      };

      // Add the post to Firestore
      const postRef = await addDoc(collection(db, "posts"), postData);

      // Update user's totalPosts count
      const userRef = doc(db, "users", primaryUserId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, {
          totalPosts: increment(1),
        });
      } else {
        await setDoc(
          userRef,
          {
            totalPosts: 1,
          },
          { merge: true }
        );
      }

      console.log("✅ Post created successfully:", postRef.id);

      setText("");
      setSuccessMessage(t("create.success"));

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error("❌ Error adding post:", error);
      setSubmitError(t("create.error"));
    } finally {
      setPosting(false);
    }
  };

  const handleKeyboardDone = () => {
    Keyboard.dismiss();
  };

  const RADIUS_METERS = 5000;

  const handleCenterOnUser = () => {
    if (location && mapRef.current) {
      const region = getRegionForRadius(
        location.latitude,
        location.longitude,
        RADIUS_METERS
      );
      mapRef.current.animateToRegion(region, 600);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, isDarkMode && styles.containerDark]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <View style={styles.mapContainer}>
            {locationLoading ? (
              <LoadingIndicator size={40} />
            ) : locationError ? (
              <View
                style={[styles.mapLoading, isDarkMode && styles.mapLoadingDark]}
              >
                <Text style={styles.mapError}>{locationError}</Text>
                <TouchableOpacity
                  onPress={refreshLocation}
                  style={{
                    marginTop: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
                    borderRadius: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: "#FDBA74",
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    {t("common.retry")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : location ? (
              <>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={getRegionForRadius(
                    location.latitude,
                    location.longitude,
                    RADIUS_METERS
                  )}
                  customMapStyle={isDarkMode ? darkMapStyle : []}
                  region={undefined}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  showsUserLocation={false}
                >
                  <Circle
                    center={location}
                    radius={140}
                    strokeWidth={0}
                    strokeColor="transparent"
                    fillColor="rgba(253,186,116,0.25)"
                  />
                  <Circle
                    center={location}
                    radius={RADIUS_METERS}
                    strokeColor="#FDBA74"
                    fillColor="rgba(233,213,255,0.1)"
                    strokeWidth={2}
                  />
                  <Marker
                    coordinate={location}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={false}
                  >
                    <View style={styles.hereDotOuter}>
                      <View style={styles.hereDotInner} />
                    </View>
                  </Marker>
                </MapView>
                <TouchableOpacity
                  style={[
                    styles.backButton,
                    isDarkMode && styles.backButtonDark,
                  ]}
                  onPress={handleGoBack}
                  activeOpacity={0.7}
                  accessibilityLabel="Go back"
                >
                  <View
                    style={[
                      styles.backButtonArrow,
                      isDarkMode && styles.backButtonArrowDark,
                    ]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.centerButton,
                    isDarkMode && styles.centerButtonDark,
                  ]}
                  onPress={handleCenterOnUser}
                  activeOpacity={0.7}
                  disabled={locationLoading} // Changed from 'loading' to 'locationLoading'
                  accessibilityLabel="Center map on your location"
                >
                  {locationLoading ? ( // Changed from 'loading' to 'locationLoading'
                    <ActivityIndicator size="small" color="#FDBA74" />
                  ) : (
                    <View style={styles.centerButtonIconOuter}>
                      <View style={styles.centerButtonIconInner} />
                    </View>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // Fallback state when no location, no loading, and no error
              <View
                style={[styles.mapLoading, isDarkMode && styles.mapLoadingDark]}
              >
                <Text
                  style={[
                    styles.mapError,
                    { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  {t("common.noLocation")}
                </Text>
                <TouchableOpacity
                  onPress={refreshLocation}
                  style={{
                    marginTop: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: "#FDBA74",
                    borderRadius: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    {t("common.getLocation")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                isDarkMode && styles.inputDark,
                isOverLimit && styles.inputError,
              ]}
              placeholder={t("create.placeholder")}
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={text}
              onChangeText={handleTextChange}
              editable={!posting}
              multiline
              returnKeyType="done"
              onSubmitEditing={handleKeyboardDone}
              blurOnSubmit={true}
              accessibilityLabel="Post input"
            />

            <View style={styles.characterCountContainer}>
              <Text
                style={[
                  styles.languageIndicator,
                  isDarkMode && styles.languageIndicatorDark,
                ]}
              >
                {languageType}
              </Text>
              <Text
                style={[
                  styles.characterCount,
                  isDarkMode && styles.characterCountDark,
                  isNearLimit && styles.characterCountWarning,
                  isOverLimit && styles.characterCountError,
                ]}
              >
                {text.length}/{currentLimit}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              isDarkMode && styles.buttonDark,
              (pressed || posting) && styles.buttonPressed,
              (!text.trim() || !location || isOverLimit) &&
                (isDarkMode
                  ? styles.buttonDisabledDark
                  : styles.buttonDisabled),
            ]}
            onPress={handlePost}
            disabled={posting || !text.trim() || !location || isOverLimit}
            accessibilityRole="button"
            accessibilityLabel="Post"
          >
            <Text
              style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}
            >
              {posting ? t("create.posting") : t("create.button")}
            </Text>
          </Pressable>

          {submitError && <Text style={styles.error}>{t("create.error")}</Text>}
          {successMessage && (
            <Text style={[styles.success, isDarkMode && styles.successDark]}>
              {t("create.success")}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  containerDark: {
    backgroundColor: "#111827",
  },
  inner: {
    flex: 1,
    justifyContent: "flex-start",
  },
  mapContainer: {
    height: 350,
    marginBottom: 18,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 300,
    backgroundColor: "#F8FAFC",
  },
  mapLoadingDark: {
    backgroundColor: "#1F2937",
  },
  mapLoadingText: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 15,
  },
  mapLoadingTextDark: {
    color: "#9CA3AF",
  },
  mapError: {
    color: "#EF4444",
    fontSize: 15,
    textAlign: "center",
  },
  centerButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 10,
  },
  centerButtonDark: {
    backgroundColor: "#374151",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 10,
  },
  backButtonDark: {
    backgroundColor: "#374151",
  },
  backButtonArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 12,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#FDBA74",
    marginLeft: -2,
  },
  backButtonArrowDark: {
    borderRightColor: "#FDBA74",
  },
  centerButtonIconOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#FDBA74",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  centerButtonIconInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FDBA74",
  },
  inputContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    fontSize: 17,
    backgroundColor: "#f9fafb",
    minHeight: 56,
    color: "#111827",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  inputDark: {
    borderColor: "#4B5563",
    backgroundColor: "#374151",
    color: "#F9FAFB",
    shadowOpacity: 0.1,
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 2,
  },
  characterCountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  languageIndicator: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  languageIndicatorDark: {
    color: "#9CA3AF",
  },
  characterCount: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  characterCountDark: {
    color: "#9CA3AF",
  },
  characterCountWarning: {
    color: "#F59E0B",
  },
  characterCountError: {
    color: "#EF4444",
  },
  button: {
    backgroundColor: "#FDBA74",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#FDBA74",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonDark: {
    backgroundColor: "#C084FC",
    shadowColor: "#C084FC",
  },
  buttonText: {
    color: "gray",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  buttonTextDark: {
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    backgroundColor: "#FDBA74",
  },
  buttonDisabledDark: {
    backgroundColor: "#FDBA74",
  },
  error: {
    color: "#e11d48",
    marginTop: 10,
    textAlign: "center",
    fontSize: 15,
  },
  success: {
    color: "#059669",
    marginTop: 10,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "500",
  },
  successDark: {
    color: "#10B981",
  },
  hereDotOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(253,186,116,0.25)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FDBA74",
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  hereDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FDBA74",
  },
});
