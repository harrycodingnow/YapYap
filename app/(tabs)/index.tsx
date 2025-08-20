//Index.tsx
import { castVote } from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "@motify/components";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useIsFocused } from "@react-navigation/native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import type { DocumentSnapshot } from "firebase/firestore";
import { doc, onSnapshot } from "firebase/firestore";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { TabBar, TabView } from "react-native-tab-view";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { useLocation } from "../../contexts/LocationContext";
import { db } from "../../firebase";
import { fetchLatestPostsPage, fetchTopPostsPage } from "../../services/posts";
import { getDistanceKm } from "../../utils";
import WelcomePopup from "../components/welcomePopUpModal";

const MAX_DISTANCE_KM = 5;

type Post = {
  id: string;
  text: string;
  timestamp: Date;
  upvotes?: number;
  downvotes?: number;
  lat?: number;
  lng?: number;
  commentCount?: number;
};

type VoteType = "up" | "down" | null;
type VoteValue = -1 | 0 | 1;

function formatTime(date: Date) {
  if (!date) return "";
  if (typeof date === "string") date = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString();
}

// Helper function to filter posts by distance
function filterPostsByDistance(
  posts: Post[],
  userLocation: { latitude: number; longitude: number } | null,
  maxDistance: number = MAX_DISTANCE_KM
): Post[] {
  if (!userLocation) return posts;

  return posts.filter((post) => {
    // If post doesn't have location data, exclude it
    if (!post.lat || !post.lng) return false;

    const distance = getDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      post.lat,
      post.lng
    );

    return distance <= maxDistance;
  });
}
const deduplicatePosts = (posts: Post[]): Post[] => {
  const seen = new Set();
  return posts.filter((post) => {
    if (seen.has(post.id)) {
      return false;
    }
    seen.add(post.id);
    return true;
  });
};

const toServerValue = (v: VoteType): VoteValue =>
  v === "up" ? 1 : v === "down" ? -1 : 0;

const Header = ({
  onTestLoading,
  onShowPopup,
}: {
  onTestLoading?: () => void;
  onShowPopup: () => void;
}) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { t } = useTranslation();

  return (
    <View style={[styles.header, isDarkMode && styles.headerDark]}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          {/* Feed Title with Simple Black Outline */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text
              style={[
                styles.headerTitleWithOutline,
                isDarkMode && styles.headerTitleDark,
              ]}
            >
              {t("feed.title")}
            </Text>
            <Pressable onPress={onShowPopup} hitSlop={10}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
          {/* Subtitle with Simple Black Outline */}
          {/* <Text style={[styles.headerSubtitleWithOutline, isDarkMode && styles.headerSubtitleDark]}>
            {t('feed.subtitle')}
          </Text>
          <Text style={[styles.headerSubtitleWithOutline, isDarkMode && styles.headerSubtitleDark]}>
            {t('feed.subtitle2')}
          </Text> */}
        </View>
        <Pressable onPress={toggleDarkMode} style={styles.darkModeButton}>
          <Ionicons
            name={isDarkMode ? "sunny" : "moon"}
            size={24}
            color={isDarkMode ? "#FDBA74" : "#FFFFFF"}
          />
        </Pressable>
      </View>
    </View>
  );
};

const LoadingIndicator = ({ size }: { size: number }) => {
  const { isDarkMode } = useDarkMode();
  const { t } = useTranslation();
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStarted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={[
        { flex: 1, justifyContent: "center", alignItems: "center" },
        isDarkMode
          ? { backgroundColor: "#111827" }
          : { backgroundColor: "#FAFAFA" },
      ]}
    >
      <MotiView
        from={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 0,
          shadowOpacity: 0.5,
        }}
        animate={
          animationStarted
            ? {
                width: size + 20,
                height: size + 20,
                borderRadius: (size + 20) / 2,
                borderWidth: 4,
                shadowOpacity: 1,
              }
            : {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 0,
                shadowOpacity: 0.5,
              }
        }
        transition={{ type: "timing", duration: 1000, loop: true }}
        style={{
          borderColor: "#FDBA74",
          shadowColor: "#FDBA74",
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 10,
          backgroundColor: "transparent",
        }}
      />
      <Text
        style={[
          { fontSize: 16, marginTop: 20, textAlign: "center" },
          isDarkMode ? { color: "#9CA3AF" } : { color: "#6B7280" },
        ]}
      >
        {t("common.loading")}
      </Text>
    </View>
  );
};
const PostList = ({
  data,
  onVote,
  onComment,
  userVotes,
  userLocation,
  onEndReached,
  onRefresh,
  refreshing = false,
}: {
  data: Post[];
  onVote: (id: string, voteType: VoteType) => void;
  onComment: (id: string) => void;
  userVotes: { [postId: string]: VoteType };
  userLocation: { latitude: number; longitude: number } | null;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}) => {
  const { isDarkMode } = useDarkMode();
  const { t } = useTranslation();
  const tabBarHeight = useBottomTabBarHeight();

  // Empty state component
  const EmptyState = () => (
    <View
      style={[
        styles.emptyStateContainer,
        isDarkMode && styles.emptyStateContainerDark,
      ]}
    >
      <Ionicons
        name="location-outline"
        size={48}
        color={isDarkMode ? "#9CA3AF" : "#6B7280"}
      />
      <Text
        style={[
          styles.emptyStateTitle,
          isDarkMode && styles.emptyStateTitleDark,
        ]}
      >
        {t("feed.empty.title")}
      </Text>
      <Text
        style={[
          styles.emptyStateSubtitle,
          isDarkMode && styles.emptyStateSubtitleDark,
        ]}
      >
        {t("feed.empty.subtitle")}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const distance =
          userLocation && item.lat && item.lng
            ? getDistanceKm(
                userLocation.latitude,
                userLocation.longitude,
                item.lat,
                item.lng
              )
            : null;
        const userVote = userVotes[item.id] || null;
        const displayUpvotes = item.upvotes ?? 0;
        const displayDownvotes = item.downvotes ?? 0;
        return (
          <Pressable
            onPress={() => onComment(item.id)}
            style={styles.postPressable}
          >
            <View
              style={[
                styles.postContainer,
                isDarkMode && styles.postContainerDark,
              ]}
            >
              <View style={styles.postContent}>
                <Text
                  style={[styles.postText, isDarkMode && styles.postTextDark]}
                >
                  {item.text}
                </Text>
                <View style={styles.footerGroup}>
                  <View style={styles.postMeta}>
                    <View style={styles.metaRow}>
                      {distance !== null && (
                        <View style={styles.metaChip}>
                          <Ionicons
                            name="location"
                            size={12}
                            color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                          />
                          <Text
                            style={[
                              styles.metaText,
                              isDarkMode && styles.metaTextDark,
                            ]}
                          >
                            {distance.toFixed(1)}km
                          </Text>
                        </View>
                      )}
                      <View style={styles.metaChip}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                        />
                        <Text
                          style={[
                            styles.metaText,
                            isDarkMode && styles.metaTextDark,
                          ]}
                        >
                          {formatTime(item.timestamp)}
                        </Text>
                      </View>
                    </View>
                    {(item.commentCount ?? 0) > 0 && (
                      <View style={styles.metaChip}>
                        <Ionicons
                          name="chatbubble-outline"
                          size={12}
                          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                        />
                        <Text
                          style={[
                            styles.metaText,
                            isDarkMode && styles.metaTextDark,
                          ]}
                        >
                          {item.commentCount} {t("common.reply")}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.voteContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.voteButton,
                    styles.upvoteButton,
                    userVote === "up" && styles.upvoteButtonActive,
                    pressed && { transform: [{ scale: 0.95 }] },
                    isDarkMode && styles.voteButtonDark,
                  ]}
                  onPress={() =>
                    onVote(item.id, userVote === "up" ? null : "up")
                  }
                >
                  <Ionicons
                    name="chevron-up"
                    size={40}
                    color={
                      userVote === "up"
                        ? "#FDBA74"
                        : isDarkMode
                        ? "#9CA3AF"
                        : "#6B7280"
                    }
                  />
                </Pressable>
                <View style={styles.voteCountContainer}>
                  <Text
                    style={[
                      styles.voteCount,
                      isDarkMode && styles.voteCountDark,
                    ]}
                  >
                    {displayUpvotes - displayDownvotes}
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.voteButton,
                    styles.downvoteButton,
                    userVote === "down" && styles.downvoteButtonActive,
                    pressed && { transform: [{ scale: 0.95 }] },
                    isDarkMode && styles.voteButtonDark,
                  ]}
                  onPress={() =>
                    onVote(item.id, userVote === "down" ? null : "down")
                  }
                >
                  <Ionicons
                    name="chevron-down"
                    size={40}
                    color={
                      userVote === "down"
                        ? "#FDBA74"
                        : isDarkMode
                        ? "#9CA3AF"
                        : "#6B7280"
                    }
                  />
                </Pressable>
              </View>
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={<EmptyState />}
      contentContainerStyle={[
        styles.listContainer,
        { paddingBottom: tabBarHeight + 16 },

        data.length === 0 && { flex: 1 },
      ]}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => (
        <View
          style={[styles.postSeparator, isDarkMode && styles.postSeparatorDark]}
        />
      )}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
};

export default function FeedTabScreen() {
  const isFocused = useIsFocused();
  const locationFetchedRef = useRef(false);
  const [showPopup, setShowPopup] = useState(false);
  const layout = useWindowDimensions();
  const { user, primaryUserId } = useAuth();
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(0);
  const routes = useMemo(
    () => [
      { key: "hot", title: t("feed.tab.hot") },
      { key: "recent", title: t("feed.tab.recent") },
    ],
    [t, i18n.language]
  );

  const [userVotes, setUserVotes] = useState<{ [postId: string]: VoteType }>(
    {}
  );
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { location: userLocation, setLocation: setUserLocation } =
    useLocation();

  // Test loading function for development
  const handleTestLoading = () => {
    setLocationLoading(true);
    setTimeout(() => setLocationLoading(false), 3000);
  };

  const [hotPosts, setHotPosts] = useState<Post[]>([]);
  const [hotCursor, setHotCursor] = useState<DocumentSnapshot | null>(null);
  const [hotDone, setHotDone] = useState(false);
  const [hotLoading, setHotLoading] = useState(false);

  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentCursor, setRecentCursor] = useState<DocumentSnapshot | null>(
    null
  );
  const [recentDone, setRecentDone] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);

  const [refreshingHot, setRefreshingHot] = useState(false);
  const [refreshingRecent, setRefreshingRecent] = useState(false);

  const normalize = (items: any[]): Post[] =>
    items.map((p) => ({
      ...p,
      timestamp: p.timestamp?.toDate
        ? p.timestamp.toDate()
        : new Date(p.timestamp),
    }));

  console.log("[Hot Feed1] :", hotPosts.length);
  console.log("[Recent Feed1] :", recentPosts.length);

  const loadHot = useCallback(
    async (initial = false) => {
      if (hotLoading || (hotDone && !initial)) return;
      setHotLoading(true);
      const { items, nextCursor } = await fetchTopPostsPage(
        initial ? undefined : hotCursor || undefined
      );
      console.log("[Hot] page items:", items.length, "hasNext:", !!nextCursor);
      const norm = normalize(items);

      setHotPosts((prev) => {
        const newPosts = initial ? norm : prev.concat(norm);
        return deduplicatePosts(newPosts); // Deduplicate here
      });

      setHotCursor(nextCursor);
      setHotDone(items.length === 0 || !nextCursor);
      setHotLoading(false);
    },
    [hotLoading, hotDone, hotCursor]
  );

  const loadRecent = useCallback(
    async (initial = false) => {
      if (recentLoading || (recentDone && !initial)) return;
      setRecentLoading(true);
      const { items, nextCursor } = await fetchLatestPostsPage(
        initial ? undefined : recentCursor || undefined
      );
      const norm = normalize(items);

      setRecentPosts((prev) => {
        const newPosts = initial ? norm : prev.concat(norm);
        return deduplicatePosts(newPosts); // Deduplicate here
      });

      setRecentCursor(nextCursor);
      setRecentDone(items.length === 0 || !nextCursor);
      setRecentLoading(false);
    },
    [recentLoading, recentDone, recentCursor]
  );

  // Fetch user location on mount
  useEffect(() => {
    if (userLocation) {
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Permission to access location was denied");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e: any) {
        setLocationError("Could not fetch location");
      } finally {
        setLocationLoading(false);
      }
    })();
  }, [userLocation]);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasSeenWelcome = await AsyncStorage.getItem("hasSeenWelcome");
        if (hasSeenWelcome === null) {
          setShowPopup(true);
        }
      } catch (error) {
        console.error("Error reading AsyncStorage:", error);
      }
    };

    if (user) {
      // Only check when user is authenticated
      checkFirstLaunch();
    }
  }, [user]);

  // Load user votes from Firestore when user changes
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid); // ← 用 auth uid
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        setUserVotes(snap.data()?.votes || {});
      },
      (err) => {
        console.error("votes subscription error:", err);
        setUserVotes({});
      }
    );
    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    if (!isFocused) return;
    if (user && !locationLoading && hotPosts.length === 0 && !hotLoading) {
      loadHot(true);
    }
    if (
      user &&
      !locationLoading &&
      index === 1 &&
      recentPosts.length === 0 &&
      !recentLoading
    ) {
      loadRecent(true);
    }
  }, [
    isFocused,
    user,
    locationLoading,
    index,
    hotPosts.length,
    hotLoading,
    recentPosts.length,
    recentLoading,
    loadHot,
    loadRecent,
  ]);

  // Keep this for recent posts (unchanged):
  useEffect(() => {
    if (index === 1 && recentPosts.length === 0) {
      loadRecent(true);
    }
  }, [index, recentPosts.length]);

  // Keep this for component lifecycle (unchanged):
  useEffect(() => {
    console.log("🏗️ [LIFECYCLE] Component mounted");
    return () => {
      console.log("🏗️ [LIFECYCLE] Component unmounted");
    };
  }, []);

  const getVoteDelta = (
    currentVote: VoteType | null,
    newVote: VoteType | null
  ) => {
    if (currentVote === newVote) return [0, 0];
    if (currentVote === "up" && newVote === "down") return [-1, 1];
    if (currentVote === "down" && newVote === "up") return [1, -1];
    if (currentVote === null && newVote === "up") return [1, 0];
    if (currentVote === null && newVote === "down") return [0, 1];
    if (currentVote === "up" && newVote === null) return [-1, 0];
    if (currentVote === "down" && newVote === null) return [0, -1];
    return [0, 0];
  };

  async function handleVote(postId: string, newVote: VoteType) {
    const currentVote = userVotes[postId] ?? null;

    // Calculate the vote delta
    const getDelta = (cur: VoteType | null, nxt: VoteType | null) => {
      if (cur === nxt) return [0, 0];
      if (cur === "up" && nxt === "down") return [-1, 1];
      if (cur === "down" && nxt === "up") return [1, -1];
      if (cur === null && nxt === "up") return [1, 0];
      if (cur === null && nxt === "down") return [0, 1];
      if (cur === "up" && nxt === null) return [-1, 0];
      if (cur === "down" && nxt === null) return [0, -1];
      return [0, 0];
    };

    const [updelta, downdelta] = getDelta(currentVote, newVote);

    // Optimistic UI update
    setUserVotes((prev) => ({ ...prev, [postId]: newVote }));
    const apply = (arr: Post[]) =>
      arr.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              upvotes: (p.upvotes ?? 0) + updelta,
              downvotes: (p.downvotes ?? 0) + downdelta,
            }
      );

    // Update both feeds optimistically
    setHotPosts((prev) => apply(prev));
    setRecentPosts((prev) => apply(prev));

    try {
      // Send the vote to the server
      await castVote(
        postId,
        newVote === "up" ? 1 : newVote === "down" ? -1 : 0
      );
    } catch (err) {
      console.error("Vote failed", err);

      // Revert the optimistic update if the server call fails
      setUserVotes((prev) => ({ ...prev, [postId]: currentVote }));
      const revert = (arr: Post[]) =>
        arr.map((p) =>
          p.id !== postId
            ? p
            : {
                ...p,
                upvotes: (p.upvotes ?? 0) - updelta,
                downvotes: (p.downvotes ?? 0) - downdelta,
              }
        );
      setHotPosts((prev) => revert(prev));
      setRecentPosts((prev) => revert(prev));
    }
  }

  const handleComment = (postId: string) => {
    // Navigate to comment screen
    router.push(`/comments/${postId}`);
  };

  // Show loading state if location is loading
  if (!userLocation && locationLoading) {
    return <LoadingIndicator size={60} />;
  }

  if (locationError) {
    return (
      <View
        style={[
          { flex: 1, justifyContent: "center", alignItems: "center" },
          isDarkMode
            ? { backgroundColor: "#111827" }
            : { backgroundColor: "#FAFAFA" },
        ]}
      >
        <Text style={{ color: "#EF4444", fontSize: 16 }}>
          {t("common.error")}
        </Text>
      </View>
    );
  }

  const handleClosePopup = async () => {
    try {
      await AsyncStorage.setItem("hasSeenWelcome", "true");
      setShowPopup(false);
    } catch (error) {
      console.error("Error saving to AsyncStorage:", error);
      setShowPopup(false); // Still close even if save fails
    }
  };

  const refreshHot = async () => {
    setRefreshingHot(true);
    setHotCursor(null);
    setHotDone(false);
    setHotPosts([]); // Clear existing posts
    await loadHot(true);
    setRefreshingHot(false);
  };

  const refreshRecent = async () => {
    setRefreshingRecent(true);
    setRecentCursor(null);
    setRecentDone(false);
    setRecentPosts([]); // Clear existing posts
    await loadRecent(true);
    setRefreshingRecent(false);
  };

  const filteredHot = filterPostsByDistance(
    hotPosts,
    userLocation,
    MAX_DISTANCE_KM
  );
  const filteredRecent = filterPostsByDistance(
    recentPosts,
    userLocation,
    MAX_DISTANCE_KM
  );

  console.log("[Hot Feed] :", hotPosts.length);
  console.log("[Recent Feed] :", recentPosts.length);

  console.log("[Hot Feed] Filtered posts count:", filteredHot.length);
  console.log("[Recent Feed] Filtered posts count:", filteredRecent.length);

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case "hot":
        return (
          <PostList
            data={filteredHot}
            onVote={handleVote}
            onComment={handleComment}
            userVotes={userVotes}
            userLocation={userLocation}
            onEndReached={() => loadHot()}
            refreshing={refreshingHot}
            onRefresh={refreshHot}
          />
        );
      case "recent":
        return (
          <PostList
            data={filteredRecent}
            onVote={handleVote}
            onComment={handleComment}
            userVotes={userVotes}
            userLocation={userLocation}
            onEndReached={() => loadRecent()}
            refreshing={refreshingRecent}
            onRefresh={refreshRecent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Header
        onShowPopup={() => setShowPopup(true)}
        onTestLoading={handleTestLoading}
      />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        lazy={false}
        renderTabBar={(props: any) => (
          <TabBar
            {...props}
            indicatorStyle={[
              styles.tabIndicator,
              isDarkMode && styles.tabIndicatorDark,
            ]}
            style={[styles.tabBar, isDarkMode && styles.tabBarDark]}
            labelStyle={[styles.tabLabel, isDarkMode && styles.tabLabelDark]}
            activeColor={isDarkMode ? "#FDBA74" : "#FDBA74"}
            inactiveColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
            pressColor={
              isDarkMode
                ? "rgba(233, 213, 255, 0.04)"
                : "rgba(233, 213, 255, 0.04)"
            }
          />
        )}
      />
      <WelcomePopup visible={showPopup} onClose={handleClosePopup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  containerDark: {
    backgroundColor: "#111827",
  },
  header: {
    backgroundColor: "#FDBA74",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerDark: {
    backgroundColor: "#1F2937",
  },
  headerTitleDark: {
    color: "#FFFFFF",
  },
  headerSubtitleDark: {
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "bold",
    fontSize: 14,
  },
  darkModeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerTitleWithOutline: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
    textShadowColor: "#000000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  headerSubtitleWithOutline: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "bold",
    textShadowColor: "#000000",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0,
  },
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabBarDark: {
    backgroundColor: "#1F2937",
    borderBottomColor: "#374151",
  },
  tabIndicator: {
    backgroundColor: "#FDBA74",
    height: 3,
  },
  tabIndicatorDark: {
    backgroundColor: "#FDBA74",
  },
  tabLabel: {
    fontWeight: "600",
    textTransform: "none",
  },
  tabLabelDark: {
    color: "#F9FAFB",
  },
  postPressable: {
    // No margin since we use separator
  },
  listContainer: {
    flexGrow: 1,
  },
  postContainer: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "stretch",
  },
  postContainerDark: {
    backgroundColor: "transparent",
  },
  postSeparator: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  postSeparatorDark: {
    backgroundColor: "#374151",
  },
  postContent: {
    flex: 1,
    marginRight: 16,
    justifyContent: "space-between",
  },
  footerGroup: {
    marginTop: "auto",
    gap: 6,
  },
  postText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 22,
    marginBottom: 8,
  },
  postTextDark: {
    color: "#F9FAFB",
  },
  postMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#6B7280",
  },
  metaTextDark: {
    color: "#9CA3AF",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 80,
  },
  replyButtonDark: {
    backgroundColor: "#374151",
    borderColor: "#4B5563",
  },
  replyButtonPressed: {
    backgroundColor: "#E2E8F0",
    transform: [{ scale: 0.98 }],
  },
  replyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  replyButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#475569",
  },
  replyButtonTextDark: {
    color: "#9CA3AF",
  },
  voteContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    minWidth: 56,
    minHeight: 100,
    paddingVertical: 4,
  },
  voteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  voteButtonDark: {
    backgroundColor: "transparent",
  },
  upvoteButton: {
    // No border styling
  },
  downvoteButton: {
    // No border styling
  },
  upvoteButtonActive: {
    backgroundColor: "rgba(253, 186, 116, 0.1)",
  },
  downvoteButtonActive: {
    backgroundColor: "rgba(253, 186, 116, 0.1)",
  },
  voteCountContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 20,
    paddingVertical: 2,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
  },
  voteCountDark: {
    color: "#F9FAFB",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#FAFAFA",
  },
  emptyStateContainerDark: {
    backgroundColor: "#111827",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateTitleDark: {
    color: "#F9FAFB",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyStateSubtitleDark: {
    color: "#9CA3AF",
  },
});
