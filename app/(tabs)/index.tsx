//Index.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Text, useWindowDimensions, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Ionicons } from '@expo/vector-icons';
import { getDistanceKm } from '../../utils';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, getDoc, updateDoc, increment, deleteField } from 'firebase/firestore';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { MotiView } from '@motify/components';
import { useLocation } from '../../contexts/LocationContext';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { getDocs } from 'firebase/firestore';
import WelcomePopup from '../components/welcomePopUpModal';


const INITIAL_POSTS = [
  {
    id: '1',
    text: 'Welcome to Yapyap! This is a sample yap.',
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    upvotes: 5,
    downvotes: 0,
    lat: 37.775,
    lng: -122.418,
  },
  {
    id: '2',
    text: 'Try posting your own yap below!',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    upvotes: 2,
    downvotes: 0,
    lat: 37.78,
    lng: -122.42,
  },
  {
    id: '3',
    text: 'Another hot yap!',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    upvotes: 10,
    downvotes: 1,
    lat: 37.77,
    lng: -122.41,
  },
];

const MAX_DISTANCE_KM = 5; // Maximum distance to show posts

type Post = {
  id: string;
  text: string;
  timestamp: Date;
  upvotes?: number;
  downvotes?: number;
  lat?: number;
  lng?: number;
};

type VoteType = 'up' | 'down' | null;

function formatTime(date: Date) {
  if (!date) return '';
  if (typeof date === 'string') date = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'now';
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

  return posts.filter(post => {
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

const Header = ({ onTestLoading, onShowPopup }: { onTestLoading?: () => void; onShowPopup: () => void }) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { t } = useTranslation();

  return (
    <View style={[styles.header, isDarkMode && styles.headerDark]}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          {/* Feed Title with Simple Black Outline */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
  <Text style={[styles.headerTitleWithOutline, isDarkMode && styles.headerTitleDark]}>
    {t('feed.title')}
  </Text>
  <Pressable onPress={onShowPopup} hitSlop={10}>
    <Ionicons name="information-circle-outline" size={20} color="#FFFFFF" />
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
            name={isDarkMode ? 'sunny' : 'moon'}
            size={24}
            color={isDarkMode ? '#FDBA74' : '#FFFFFF'}
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
    <View style={[
      { flex: 1, justifyContent: 'center', alignItems: 'center' },
      isDarkMode ? { backgroundColor: '#111827' } : { backgroundColor: '#FAFAFA' }
    ]}>
      <MotiView
        from={{ width: size, height: size, borderRadius: size / 2, borderWidth: 0, shadowOpacity: 0.5 }}
        animate={animationStarted ? {
          width: size + 20,
          height: size + 20,
          borderRadius: (size + 20) / 2,
          borderWidth: 4,
          shadowOpacity: 1,
        } : {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 0,
          shadowOpacity: 0.5,
        }}
        transition={{ type: 'timing', duration: 1000, loop: true }}
        style={{ borderColor: '#FDBA74', shadowColor: '#FDBA74', shadowOffset: { width: 0, height: 0 }, shadowRadius: 10, backgroundColor: 'transparent' }}
      />
      <Text style={[
        { fontSize: 16, marginTop: 20 },
        isDarkMode ? { color: '#9CA3AF' } : { color: '#6B7280' }
      ]}>
        {t('common.loading')}
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
  commentCount
}: {
  data: Post[];
  onVote: (id: string, voteType: VoteType) => void;
  onComment: (id: string) => void;
  userVotes: { [postId: string]: VoteType };
  userLocation: { latitude: number; longitude: number } | null;
  commentCount: { [postId: string]: number };
}) => {
  const { isDarkMode } = useDarkMode();
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <View style={[
        styles.emptyStateContainer,
        isDarkMode && styles.emptyStateContainerDark
      ]}>
        <Ionicons
          name="location-outline"
          size={48}
          color={isDarkMode ? '#9CA3AF' : '#6B7280'}
        />
        <Text style={[styles.emptyStateTitle, isDarkMode && styles.emptyStateTitleDark]}>
          {t('feed.empty.title')}
        </Text>
        <Text style={[styles.emptyStateSubtitle, isDarkMode && styles.emptyStateSubtitleDark]}>
          {t('feed.empty.subtitle')}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={item => item.id}
      renderItem={({ item }) => {
        const distance = (userLocation && item.lat && item.lng)
          ? getDistanceKm(userLocation.latitude, userLocation.longitude, item.lat, item.lng)
          : null;
        const userVote = userVotes[item.id] || null;
        const displayUpvotes = item.upvotes ?? 0;
        const displayDownvotes = item.downvotes ?? 0;
        return (
          <Pressable onPress={() => onComment(item.id)} style={styles.postPressable}>
            <View style={[styles.postContainer, isDarkMode && styles.postContainerDark]}>
              <View style={styles.postContent}>
                <Text style={[styles.postText, isDarkMode && styles.postTextDark]}>{item.text}</Text>
                <View style={styles.footerGroup}>
                  <View style={styles.postMeta}>
                    <View style={styles.metaRow}>
                      {distance !== null && (
                        <View style={styles.metaChip}>
                          <Ionicons name="location" size={12} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                          <Text style={[styles.metaText, isDarkMode && styles.metaTextDark]}>{distance.toFixed(1)}km</Text>
                        </View>
                      )}
                      <View style={styles.metaChip}>
                        <Ionicons name="time-outline" size={12} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                        <Text style={[styles.metaText, isDarkMode && styles.metaTextDark]}>{formatTime(item.timestamp)}</Text>
                      </View>
                    </View>
                    {(commentCount[item.id] ?? 0) > 0 && (
  <View style={styles.metaChip}>
    <Ionicons name="chatbubble-outline" size={12} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
    <Text style={[styles.metaText, isDarkMode && styles.metaTextDark]}>
      {commentCount[item.id]} {t('common.reply')}
    </Text>
  </View>
)}
                  </View>
                  {/* <View style={styles.actionRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.replyButton,
                        pressed && styles.replyButtonPressed,
                        isDarkMode && styles.replyButtonDark
                      ]}
                      onPress={() => onComment(item.id)}
                    >
                      <View style={styles.replyButtonContent}>
                        <Ionicons name="chatbubble-outline" size={16} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                        <Text style={[styles.replyButtonText, isDarkMode && styles.replyButtonTextDark]}>{t('common.reply')}</Text>
                      </View>
                    </Pressable>
                  </View> */}
                </View>
              </View>
              <View style={styles.voteContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.voteButton,
                    styles.upvoteButton,
                    userVote === 'up' && styles.upvoteButtonActive,
                    pressed && { transform: [{ scale: 0.95 }] },
                    isDarkMode && styles.voteButtonDark
                  ]}
                  onPress={() => onVote(item.id, userVote === 'up' ? null : 'up')}
                >
                  <Ionicons
                    name="chevron-up"
                    size={40}
                    color={userVote === 'up' ? '#FDBA74' : (isDarkMode ? '#9CA3AF' : '#6B7280')}
                  />
                </Pressable>
                <View style={styles.voteCountContainer}>
                  <Text style={[styles.voteCount, isDarkMode && styles.voteCountDark]}>{displayUpvotes - displayDownvotes}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.voteButton,
                    styles.downvoteButton,
                    userVote === 'down' && styles.downvoteButtonActive,
                    pressed && { transform: [{ scale: 0.95 }] },
                    isDarkMode && styles.voteButtonDark
                  ]}
                  onPress={() => onVote(item.id, userVote === 'down' ? null : 'down')}
                >
                  <Ionicons
                    name="chevron-down"
                    size={40}
                    color={userVote === 'down' ? '#FDBA74' : (isDarkMode ? '#9CA3AF' : '#6B7280')}
                  />
                </Pressable>
              </View>
            </View>
          </Pressable>
        );
      }}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={[styles.postSeparator, isDarkMode && styles.postSeparatorDark]} />}
    />
  );
};

export default function FeedTabScreen() {
  const locationFetchedRef = useRef(false);
  const [showPopup, setShowPopup] = useState(false);
  const layout = useWindowDimensions();
  const { user, primaryUserId } = useAuth();
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(0);
  const routes = useMemo(() => [
    { key: 'hot', title: t('feed.tab.hot') },
    { key: 'recent', title: t('feed.tab.recent') },
  ], [t, i18n.language]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<{ [postId: string]: VoteType }>({});
  const [commentCount, setCommentCount] = useState<{ [postId: string]: number }>({});
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { location: userLocation, setLocation: setUserLocation } = useLocation();

  // Test loading function for development
  const handleTestLoading = () => {
    setLocationLoading(true);
    setTimeout(() => setLocationLoading(false), 3000);
  };

  // Fetch user location on mount
  useEffect(() => {
    if (userLocation) return;

    setLocationLoading(true);
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          setLocationLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch (e: any) {
        setLocationError('Could not fetch location');
      } finally {
        setLocationLoading(false);
      }
    })();
  }, [userLocation]);


  // Filter posts whenever posts or user location changes
  useEffect(() => {
    const filtered = filterPostsByDistance(posts, userLocation, MAX_DISTANCE_KM);
    setFilteredPosts(filtered);
    console.log(`Filtered ${posts.length} posts to ${filtered.length} within ${MAX_DISTANCE_KM}km`);
  }, [posts, userLocation]);

  // Load user votes from Firestore when user changes
  useEffect(() => {
    if (!user || !primaryUserId) return;

    const loadUserVotes = async () => {
      try {
        const userRef = doc(db, 'users', primaryUserId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserVotes(userData.votes || {});
          console.log('✅ Loaded user votes:', userData.votes);
        }
      } catch (err) {
        console.error('Error loading user votes:', err);
      }
    };

    loadUserVotes();
  }, [user, primaryUserId]);


  // Real-time Firestore logic
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
  
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const postData = doc.data();
        return {
          id: doc.id,
          ...postData,
          timestamp: postData.timestamp?.toDate ? postData.timestamp.toDate() : new Date(postData.timestamp)
        } as Post;
      });
  
      setPosts(data);
      setLoading(false);
  
      // Fetch comment counts for each post
      const counts: { [postId: string]: number } = {};
      for (const post of data) {
        try {
          const commentsSnap = await getDocs(collection(db, 'posts', post.id, 'comments'));
          counts[post.id] = commentsSnap.size;
        } catch (err) {
          console.error(`Error loading comment count for post ${post.id}:`, err);
          counts[post.id] = 0;
        }
      }
      setCommentCount(counts);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setPosts(INITIAL_POSTS);
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);
  

  const handleVote = async (postId: string, newVoteType: VoteType) => {
    if (!user) return;

    const currentVote = userVotes[postId] || null;

    // Update local state immediately for responsive UI
    setUserVotes(prev => ({
      ...prev,
      [postId]: newVoteType
    }));

    // Update post vote counts locally for immediate feedback
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;

      let upvoteChange = 0;
      let downvoteChange = 0;

      // Remove previous vote if exists
      if (currentVote === 'up') {
        upvoteChange -= 1;
      } else if (currentVote === 'down') {
        downvoteChange -= 1;
      }

      // Add new vote if not null
      if (newVoteType === 'up') {
        upvoteChange += 1;
      } else if (newVoteType === 'down') {
        downvoteChange += 1;
      }

      return {
        ...post,
        upvotes: (post.upvotes ?? 0) + upvoteChange,
        downvotes: (post.downvotes ?? 0) + downvoteChange,
      };
    }));

    // Update Firestore
    try {
      const postRef = doc(db, 'posts', postId);
      const userRef = doc(db, 'users', primaryUserId || user.uid);

      // Prepare post updates
      const postUpdates: any = {};
      if (currentVote === 'up') {
        postUpdates.upvotes = increment(-1);
      } else if (currentVote === 'down') {
        postUpdates.downvotes = increment(-1);
      }

      if (newVoteType === 'up') {
        postUpdates.upvotes = increment(1);
      } else if (newVoteType === 'down') {
        postUpdates.downvotes = increment(1);
      }

      // Prepare user vote updates
      const userUpdates: any = {};
      if (newVoteType === null) {
        // Remove vote
        userUpdates[`votes.${postId}`] = deleteField();
      } else {
        // Set vote
        userUpdates[`votes.${postId}`] = newVoteType;
      }

      // Update both documents atomically
      await Promise.all([
        updateDoc(postRef, postUpdates),
        updateDoc(userRef, userUpdates)
      ]);

      console.log('✅ Vote updated successfully:', { postId, currentVote, newVoteType });

    } catch (err) {
      console.error('❌ Error updating vote:', err);
      // Revert local state if Firestore save fails
      setUserVotes(prev => ({
        ...prev,
        [postId]: currentVote
      }));

      // Revert post counts
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post;

        let upvoteChange = 0;
        let downvoteChange = 0;

        // Revert the changes
        if (currentVote === 'up') {
          upvoteChange += 1;
        } else if (currentVote === 'down') {
          downvoteChange += 1;
        }

        if (newVoteType === 'up') {
          upvoteChange -= 1;
        } else if (newVoteType === 'down') {
          downvoteChange -= 1;
        }

        return {
          ...post,
          upvotes: (post.upvotes ?? 0) + upvoteChange,
          downvotes: (post.downvotes ?? 0) + downvoteChange,
        };
      }));
    }
  };

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
      <View style={[
        { flex: 1, justifyContent: 'center', alignItems: 'center' },
        isDarkMode ? { backgroundColor: '#111827' } : { backgroundColor: '#FAFAFA' }
      ]}>
        <Text style={{ color: '#EF4444', fontSize: 16 }}>{t('common.error')}</Text>
      </View>
    );
  }

  // Use filtered posts instead of all posts
  const displayPosts = filteredPosts.length > 0 ? filteredPosts : (loading ? [] : filterPostsByDistance(INITIAL_POSTS, userLocation, MAX_DISTANCE_KM));

  const hotPosts = [...displayPosts].sort((a, b) => {
    const aScore = (a.upvotes ?? 0) - (a.downvotes ?? 0);
    const bScore = (b.upvotes ?? 0) - (b.downvotes ?? 0);
    return bScore - aScore;
  });
  const recentPosts = [...displayPosts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const renderScene = SceneMap({
    hot: () => (
      <PostList
        data={hotPosts}
        onVote={handleVote}
        onComment={handleComment}
        userVotes={userVotes}
        userLocation={userLocation}
        commentCount={commentCount}
      />
    ),
    recent: () => (
      <PostList
        data={recentPosts}
        onVote={handleVote}
        onComment={handleComment}
        userVotes={userVotes}
        userLocation={userLocation}
        commentCount={commentCount}
      />
    ),
  });

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Header onShowPopup={() => setShowPopup(true)} onTestLoading={handleTestLoading} />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props: any) => (
          <TabBar
            {...props}
            indicatorStyle={[styles.tabIndicator, isDarkMode && styles.tabIndicatorDark]}
            style={[styles.tabBar, isDarkMode && styles.tabBarDark]}
            labelStyle={[styles.tabLabel, isDarkMode && styles.tabLabelDark]}
            activeColor={isDarkMode ? '#FDBA74' : '#FDBA74'}
            inactiveColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
            pressColor={isDarkMode ? 'rgba(233, 213, 255, 0.04)' : 'rgba(233, 213, 255, 0.04)'}
          />
        )}
      />
       <WelcomePopup visible={showPopup} onClose={() => setShowPopup(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  header: {
    backgroundColor: '#FDBA74',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerDark: {
    backgroundColor: '#1F2937',
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerSubtitleDark: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'bold',
    fontSize: 14,
  },
  darkModeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerTitleWithOutline: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  headerSubtitleWithOutline: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabBarDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  tabIndicator: {
    backgroundColor: '#FDBA74',
    height: 3,
  },
  tabIndicatorDark: {
    backgroundColor: '#FDBA74',
  },
  tabLabel: {
    fontWeight: '600',
    textTransform: 'none',
  },
  tabLabelDark: {
    color: '#F9FAFB',
  },
  postPressable: {
    // No margin since we use separator
  },
  listContainer: {
    flexGrow: 1,
  },
  postContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  postContainerDark: {
    backgroundColor: 'transparent',
  },
  postSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',    
  },
  postSeparatorDark: {
    backgroundColor: '#374151',
  },
  postContent: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'space-between',
  },
  footerGroup: {
    marginTop: 'auto',
    gap: 6,
  },
  postText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
    marginBottom: 8,
  },
  postTextDark: {
    color: '#F9FAFB',
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  metaTextDark: {
    color: '#9CA3AF',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 80,
  },
  replyButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  replyButtonPressed: {
    backgroundColor: '#E2E8F0',
    transform: [{ scale: 0.98 }],
  },
  replyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  replyButtonTextDark: {
    color: '#9CA3AF',
  },
  voteContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: 56,
    minHeight: 100,
    paddingVertical: 4,
  },
  voteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteButtonDark: {
    backgroundColor: 'transparent',
  },
  upvoteButton: {
    // No border styling
  },
  downvoteButton: {
    // No border styling
  },
  upvoteButtonActive: {
    backgroundColor: 'rgba(253, 186, 116, 0.1)',
  },
  downvoteButtonActive: {
    backgroundColor: 'rgba(253, 186, 116, 0.1)',
  },
  voteCountContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 20,
    paddingVertical: 2,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  voteCountDark: {
    color: '#F9FAFB',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
  },
  emptyStateContainerDark: {
    backgroundColor: '#111827',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateTitleDark: {
    color: '#F9FAFB',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateSubtitleDark: {
    color: '#9CA3AF',
  },
});