import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInAnonymously } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";
import i18n, { setI18nLanguage } from "../../contexts/i18n";
import { auth, db } from "../../firebase";
import AboutModal from "../components/aboutPopUpModal"; // Import the new AboutModal component
const swallowPermOrMissing = (e: any) => {
  if (e?.code === "permission-denied" || e?.code === "not-found") return; // ignore
  throw e; // bubble up anything unexpected
};
// Types
type Post = {
  id: string;
  text: string;
  timestamp: Date;
  upvotes: number;
  downvotes: number;
  userId: string;
  lat?: number;
  lng?: number;
};

type UserStats = {
  posts: number;
  upvotes: number;
  likability: number;
};

function formatTime(date: Date) {
  if (!date) return "";
  if (typeof date === "string") date = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleString();
}

function ProfilePostCard({
  post,
  isDarkMode,
}: {
  post: Post;
  isDarkMode: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={[styles.postCard, isDarkMode && styles.postCardDark]}>
      <Text style={[styles.postText, isDarkMode && styles.postTextDark]}>
        {post.text}
      </Text>
      <View style={styles.postMetaRow}>
        <Ionicons
          name="time-outline"
          size={14}
          color={isDarkMode ? "#FDBA74" : "black"}
          style={{ marginRight: 2 }}
        />
        <Text style={[styles.postMeta, isDarkMode && styles.postMetaDark]}>
          {formatTime(post.timestamp)}
        </Text>
        <View
          style={[styles.metaDivider, isDarkMode && styles.metaDividerDark]}
        />
        <Ionicons
          name="arrow-up"
          size={14}
          color={isDarkMode ? "#FDBA74" : "black"}
          style={{ marginRight: 2, marginLeft: 2 }}
        />
        <Text style={[styles.postMeta, isDarkMode && styles.postMetaDark]}>{`${
          post.upvotes ?? 0
        } ${t("profile.upvotes")}`}</Text>
      </View>
    </View>
  );
}

const AVATAR_KEY = "profileAvatarEmoji";

export default function ProfileScreen() {
  const { user, primaryUserId } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    posts: 0,
    upvotes: 0,
    likability: 0,
  });
  const [loading, setLoading] = useState(true);
  const [joinDate, setJoinDate] = useState<string>("");
  const [showAboutModal, setShowAboutModal] = useState(false); // Add state for modal
  const { t } = useTranslation();
  const [avatarEmoji, setAvatarEmoji] = useState("🦸🏻‍♂️");

  // Remove local language state, use i18n.language
  const language = i18n.language as "en" | "zh";

  // Save language preference when it changes
  const toggleLanguage = async () => {
    const newLanguage = language === "en" ? "zh" : "en";
    await setI18nLanguage(newLanguage);
  };

  async function resetAnonymousIdentity(uid: string) {
    try {
      // Delete user data in Firestore
      const postsRef = collection(db, "posts");
      const userPostsQuery = query(postsRef, where("userId", "==", uid));
      const userPostsSnapshot = await getDocs(userPostsQuery);
      const deleteUserPosts = async (userId: string) => {
        try {
          const postsRef = collection(db, "posts");
          const q = query(postsRef, where("userId", "==", userId));
          const snapshot = await getDocs(q);

          const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
          await Promise.all(deletePromises);

          console.log(
            `🗑️ Deleted ${snapshot.docs.length} posts for user ${userId}`
          );
        } catch (err) {
          console.error("Failed to delete posts:", err);
        }
      };

      const deletePromises = userPostsSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "posts", docSnap.id))
      );
      await Promise.all(deletePromises);
      await deleteDoc(doc(db, "users", uid)).catch(swallowPermOrMissing);
      await deleteUserPosts(uid);

      // 🚨 Clear stored device ID so new user gets fresh ID
      await AsyncStorage.removeItem("deviceId");
      await AsyncStorage.removeItem("primaryUserId");

      // Sign out and sign in again
      await auth.signOut();
      await signInAnonymously(auth);

      console.log("✅ Fully reset anonymous identity");
    } catch (error) {
      console.error("❌ Error during reset:", error);
    }
  }

  useEffect(() => {
    const loadAvatar = async () => {
      const saved = await AsyncStorage.getItem(AVATAR_KEY);
      if (saved) setAvatarEmoji(saved);
    };
    loadAvatar();
  }, []);

  const toggleAvatar = async () => {
    const newEmoji =
      avatarEmoji === "🦸🏻"
        ? "🦸🏻‍♀️"
        : avatarEmoji === "🦸🏻‍♀️"
        ? "🦊"
        : avatarEmoji === "🦊"
        ? "🐰"
        : "🦸🏻";
    setAvatarEmoji(newEmoji);
    await AsyncStorage.setItem(AVATAR_KEY, newEmoji);
  };

  // Fetch user's join date
  useEffect(() => {
    const fetchUserData = async () => {
      if (!primaryUserId) return;

      try {
        const userRef = doc(db, "users", primaryUserId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.createdAt) {
            const date = userData.createdAt.toDate();
            setJoinDate(
              `Joined ${date.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}`
            );
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [primaryUserId]);

  // Fetch user's posts
  useEffect(() => {
    if (!primaryUserId) return;

    const postsRef = collection(db, "posts");
    const q = query(
      postsRef,
      where("userId", "==", primaryUserId),
      orderBy("timestamp", "desc"),
      limit(10) // Limit to recent 10 posts for performance
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const posts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate
            ? doc.data().timestamp.toDate()
            : new Date(doc.data().timestamp),
        })) as Post[];

        setUserPosts(posts);

        // Calculate stats
        const totalPosts = posts.length;
        const totalUpvotes = posts.reduce(
          (sum, post) => sum + (post.upvotes ?? 0),
          0
        );

        // Calculate likability: average upvotes per post (scaled for better display)
        const likability =
          totalPosts > 0
            ? Math.round((totalUpvotes / totalPosts) * 10) / 10
            : 0;

        setUserStats({
          posts: totalPosts,
          upvotes: totalUpvotes,
          likability: likability,
        });

        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user posts:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [primaryUserId]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          isDarkMode && styles.containerDark,
        ]}
      >
        <ActivityIndicator size="large" color="#FDBA74" />
        <Text
          style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}
        >
          {t("profile.loading")}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <Pressable onPress={toggleAvatar}>
            <View
              style={[
                styles.avatarCircle,
                isDarkMode && styles.avatarCircleDark,
              ]}
            >
              <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
            </View>
          </Pressable>
          <Text style={[styles.username, isDarkMode && styles.usernameDark]}>
            {t("profile.username")}
          </Text>
          <Text style={[styles.joinDate, isDarkMode && styles.joinDateDark]}>
            {joinDate || t("profile.joinedRecently")}
          </Text>
        </View>

        {/* Stats Card */}
        <View style={[styles.statsCard, isDarkMode && styles.statsCardDark]}>
          <View style={styles.statCol}>
            <Text
              style={[styles.statValue, isDarkMode && styles.statValueDark]}
            >
              {userStats.posts}
            </Text>
            <Text
              style={[styles.statLabel, isDarkMode && styles.statLabelDark]}
            >
              {t("profile.posts")}
            </Text>
          </View>
          <View
            style={[styles.statDivider, isDarkMode && styles.statDividerDark]}
          />
          <View style={styles.statCol}>
            <Text
              style={[styles.statValue, isDarkMode && styles.statValueDark]}
            >
              {userStats.upvotes}
            </Text>
            <Text
              style={[styles.statLabel, isDarkMode && styles.statLabelDark]}
            >
              {t("profile.upvotes")}
            </Text>
          </View>
          <View
            style={[styles.statDivider, isDarkMode && styles.statDividerDark]}
          />
          <View style={styles.statCol}>
            <Text
              style={[styles.statValue, isDarkMode && styles.statValueDark]}
            >
              {userStats.likability}
            </Text>
            <Text
              style={[styles.statLabel, isDarkMode && styles.statLabelDark]}
            >
              {t("profile.likability")}
            </Text>
          </View>
        </View>

        {/* Recent Posts */}
        <Text
          style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}
        >
          {t("profile.recentYaps")}
        </Text>
        {userPosts && userPosts.length > 0 ? (
          <>
            {(showAllPosts ? userPosts : userPosts.slice(0, 2)).map((post) => (
              <ProfilePostCard
                key={post.id}
                post={post}
                isDarkMode={isDarkMode}
              />
            ))}

            {userPosts.length > 2 && (
              <TouchableOpacity
                style={styles.showAllButton}
                onPress={() => setShowAllPosts(!showAllPosts)}
              >
                <Text style={styles.showAllText}>
                  {showAllPosts
                    ? t("profile.showLess")
                    : t("profile.showAll", { count: userPosts.length })}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Text style={styles.noPosts}>{t("profile.noPosts")}</Text>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          {/* Language Toggle Button */}
          <TouchableOpacity
            style={[styles.actionBtn, isDarkMode && styles.actionBtnDark]}
            onPress={toggleLanguage}
          >
            <Ionicons
              name="language-outline"
              size={18}
              color={isDarkMode ? "#F9FAFB" : "black"}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.actionBtnText,
                isDarkMode && styles.actionBtnTextDark,
              ]}
            >
              {language === "en"
                ? t("profile.switchToChinese")
                : t("profile.switchToEnglish")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, isDarkMode && styles.actionBtnDark]}
            onPress={async () => {
              Alert.alert(
                t("profile.resetConfirmTitle"),
                t("profile.resetConfirmBody"),
                [
                  { text: t("profile.resetCancel"), style: "cancel" },
                  {
                    text: t("profile.resetDelete"),
                    style: "destructive",
                    onPress: async () => {
                      try {
                        if (user?.uid) {
                          await resetAnonymousIdentity(user.uid);
                          Alert.alert(
                            t("profile.resetComplete"),
                            t("profile.resetCompleteBody")
                          );
                        }
                      } catch (err) {
                        Alert.alert(t("profile.resetError"));
                      }
                    },
                  },
                ],
                { cancelable: true }
              );
            }}
          >
            <Ionicons
              name="refresh"
              size={18}
              color={isDarkMode ? "#F9FAFB" : "black"}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.actionBtnText,
                isDarkMode && styles.actionBtnTextDark,
              ]}
            >
              {t("profile.resetIdentity")}
            </Text>
          </TouchableOpacity>

          {/* Updated About Button */}
          <TouchableOpacity
            style={[styles.actionBtn, isDarkMode && styles.actionBtnDark]}
            onPress={() => setShowAboutModal(true)} // Show modal when pressed
          >
            <Ionicons
              name="chatbox-ellipses-outline"
              size={18}
              color={isDarkMode ? "#F9FAFB" : "black"}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.actionBtnText,
                isDarkMode && styles.actionBtnTextDark,
              ]}
            >
              {t("profile.about")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* About Modal */}
      <AboutModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        isDarkMode={isDarkMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: 60,
  },
  containerDark: {
    backgroundColor: "#111827",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  loadingTextDark: {
    color: "#9CA3AF",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Extra padding at bottom for better scrolling experience
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFDBBB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#6366F1",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircleDark: {
    backgroundColor: "#FDBA74",
    shadowColor: "#FDBA74",
  },
  avatarEmoji: {
    fontSize: 40,
  },
  username: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 2,
  },
  usernameDark: {
    color: "#F9FAFB",
  },
  status: {
    fontSize: 15,
    color: "#6366F1",
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
  joinDateDark: {
    color: "#9CA3AF",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsCardDark: {
    backgroundColor: "#1F2937",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FDBA74",
    marginBottom: 2,
  },
  statValueDark: {
    color: "#FDBA74",
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  statLabelDark: {
    color: "#9CA3AF",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
    borderRadius: 1,
  },
  statDividerDark: {
    backgroundColor: "#374151",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitleDark: {
    color: "#F9FAFB",
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  postCardDark: {
    backgroundColor: "#1F2937",
  },
  postText: {
    fontSize: 15,
    color: "#222",
    marginBottom: 10,
    fontWeight: "500",
  },
  postTextDark: {
    color: "#F9FAFB",
  },
  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  postMeta: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  postMetaDark: {
    color: "#9CA3AF",
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 8,
  },
  metaDividerDark: {
    backgroundColor: "#4B5563",
  },
  noPosts: {
    color: "#6B7280",
    fontSize: 15,
    marginBottom: 18,
    textAlign: "center",
  },
  actionsSection: {
    marginTop: 24,
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff", // 🟣 Lighter purple (was '#F1F5F9')
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: "#7C3AED", // 🟣 Purple shadow
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 2,
  },
  actionBtnDark: {
    backgroundColor: "#1F2937", // 🟣 Dark purple
    shadowColor: "#FDBA74",
  },
  actionBtnText: {
    color: "black", // 🟣 Purple for light mode
    fontWeight: "600",
    fontSize: 15,
  },
  actionBtnTextDark: {
    color: "white", // White text in dark mode
  },
  showAllButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 18,
    borderRadius: 8,
    backgroundColor: "#787886ff",
  },
  showAllText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
