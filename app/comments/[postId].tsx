import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext"; // Adjust path if needed
import { db } from "../../firebase";

type Comment = {
  id: string;
  text: string;
  authorId: string;
  createdAt: Date;
  upvotes?: number;
};

type Post = {
  id: string;
  text: string;
  timestamp: Date;
  upvotes?: number;
  downvotes?: number;
  lat?: number;
  lng?: number;
};

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

export default function CommentScreen() {
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode(); // Only get isDarkMode, no toggle needed
  const { t } = useTranslation();

  const [comments, setComments] = useState<Comment[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch post data
  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        const postRef = doc(db, "posts", postId as string);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const postData = postSnap.data();
          setPost({
            id: postSnap.id,
            ...postData,
            timestamp: postData.timestamp?.toDate
              ? postData.timestamp.toDate()
              : new Date(postData.timestamp),
          } as Post);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    };

    fetchPost();
  }, [postId]);

  // Real-time comments listener
  useEffect(() => {
    if (!postId) return;

    const commentsRef = collection(db, "posts", postId as string, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate
            ? doc.data().createdAt.toDate()
            : new Date(doc.data().createdAt),
        })) as Comment[];

        setComments(commentsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [postId]);

  const handleSubmitComment = async () => {
    if (!user || !commentText.trim()) return;

    setSubmitting(true);
    try {
      const commentsRef = collection(db, "posts", postId as string, "comments");
      await addDoc(commentsRef, {
        text: commentText.trim(),
        authorId: user.uid,
        createdAt: serverTimestamp(),
        upvotes: 0,
      });

      setCommentText("");
      Keyboard.dismiss();
      console.log("✅ Comment posted successfully");
    } catch (error) {
      console.error("Error posting comment:", error);
      Alert.alert(t("comments.errorTitle"), t("comments.errorBody"));
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={[styles.commentItem, isDarkMode && styles.commentItemDark]}>
      <View style={styles.commentHeader}>
        <Text
          style={[styles.commentAuthor, isDarkMode && styles.commentAuthorDark]}
        >
          {t("comments.anonymous")}
        </Text>
        <Text
          style={[styles.commentTime, isDarkMode && styles.commentTimeDark]}
        >
          {formatTime(item.createdAt)}
        </Text>
      </View>
      <Text style={[styles.commentText, isDarkMode && styles.commentTextDark]}>
        {item.text}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="chatbubble-outline"
        size={48}
        color={isDarkMode ? "#6B7280" : "#9CA3AF"}
      />
      <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
        {t("comments.emptyTitle")}
      </Text>
      <Text
        style={[styles.emptySubtitle, isDarkMode && styles.emptySubtitleDark]}
      >
        {t("comments.emptySubtitle")}
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        style={[styles.container, isDarkMode && styles.containerDark]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {/* Header without dark mode toggle */}
          <View style={[styles.header, isDarkMode && styles.headerDark]}>
            <View style={styles.headerContent}>
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={isDarkMode ? "#E9D5FF" : "#2563EB"}
                />
              </Pressable>
              <Text
                style={[
                  styles.headerTitle,
                  isDarkMode && styles.headerTitleDark,
                ]}
              >
                {t("comments.title")}
              </Text>
              <View style={styles.placeholder} />
            </View>
            {post && (
              <View
                style={[
                  styles.postPreview,
                  isDarkMode && styles.postPreviewDark,
                ]}
              >
                <Text
                  style={[styles.postText, isDarkMode && styles.postTextDark]}
                >
                  "{post.text}"
                </Text>
                <Text
                  style={[styles.postMeta, isDarkMode && styles.postMetaDark]}
                >
                  {formatTime(post.timestamp)} •{" "}
                  {(post.upvotes ?? 0) - (post.downvotes ?? 0)}{" "}
                  {t("comments.votes")}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={renderComment}
                ListEmptyComponent={loading ? null : renderEmpty()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </TouchableWithoutFeedback>

          {/* Input */}
          <View
            style={[
              styles.inputContainer,
              isDarkMode && styles.inputContainerDark,
            ]}
          >
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.commentInput,
                  isDarkMode && styles.commentInputDark,
                ]}
                placeholder={t("comments.placeholder")}
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={100}
                returnKeyType="send"
                onSubmitEditing={handleSubmitComment}
                blurOnSubmit={false}
              />
              <Pressable
                style={[
                  styles.sendButton,
                  isDarkMode && styles.sendButtonDark,
                  (!commentText.trim() || submitting) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || submitting}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={
                    commentText.trim() && !submitting
                      ? isDarkMode
                        ? "#FDBA74"
                        : "#2563EB"
                      : "#9CA3AF"
                  }
                />
              </Pressable>
            </View>
            <Text
              style={[styles.charCount, isDarkMode && styles.charCountDark]}
            >
              {commentText.length}/100
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
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
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerDark: {
    backgroundColor: "#1F2937",
    borderBottomColor: "#374151",
    shadowOpacity: 0.3,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerTitleDark: {
    color: "#F3F4F6",
  },
  placeholder: {
    width: 32,
  },
  postPreview: {
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  postPreviewDark: {
    backgroundColor: "#1F2937",
    borderTopColor: "#374151",
  },
  postText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    lineHeight: 22,
    marginBottom: 8,
  },
  postTextDark: {
    color: "#E5E7EB",
  },
  postMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  postMetaDark: {
    color: "#9CA3AF",
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  commentItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentItemDark: {
    backgroundColor: "#1F2937",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  commentAuthorDark: {
    color: "#D1D5DB",
  },
  commentTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  commentTimeDark: {
    color: "#9CA3AF",
  },
  commentText: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 20,
  },
  commentTextDark: {
    color: "#E5E7EB",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTitleDark: {
    color: "#D1D5DB",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  emptySubtitleDark: {
    color: "#9CA3AF",
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 16 : 16,
  },
  inputContainerDark: {
    backgroundColor: "#1F2937",
    borderTopColor: "#374151",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentInputDark: {
    backgroundColor: "#111827",
    color: "#F9FAFB",
    borderColor: "#374151",
    shadowOpacity: 0.2,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonDark: {
    backgroundColor: "#374151",
  },
  sendButtonDisabled: {
    backgroundColor: "#F3F4F6",
  },
  charCount: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 4,
  },
  charCountDark: {
    color: "#9CA3AF",
  },
});
