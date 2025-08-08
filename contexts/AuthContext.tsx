//AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  primaryUserId: string | null;  
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  primaryUserId: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryUserId, setPrimaryUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get or create a device ID for tracking purposes
  const getDeviceId = async (): Promise<string> => {
    try {
      let deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('deviceId', deviceId);
        console.log('🆔 Created new device ID:', deviceId);
      } else {
        console.log('🆔 Using existing device ID:', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('❌ Error with device ID:', error);
      return Date.now().toString();
    }
  };

  // Find existing user with same device ID
  const findUserByDeviceId = async (deviceId: string) => {
    try {
      console.log('🔍 Looking for user with device ID:', deviceId);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('deviceId', '==', deviceId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Return the first (and should be only) user with this device ID
        const existingUserDoc = querySnapshot.docs[0];
        console.log('✅ Found existing user:', existingUserDoc.id);
        return {
          uid: existingUserDoc.id,
          data: existingUserDoc.data()
        };
      }
      console.log('❌ No existing user found with device ID');
      return null;
    } catch (error) {
      console.error('❌ Error finding user by device ID:', error);
      return null;
    }
  };

  // Store the primary user ID for this device
  const storePrimaryUserId = async (userId: string) => {
    try {
      await AsyncStorage.setItem('primaryUserId', userId);
      console.log('💾 Stored primary user ID:', userId);
    } catch (error) {
      console.error('❌ Error storing primary user ID:', error);
    }
  };

  // Get stored primary user ID
  const getPrimaryUserId = async (): Promise<string | null> => {
    try {
      const stored = await AsyncStorage.getItem('primaryUserId');
      console.log('📱 Retrieved stored primary user ID:', stored);
      return stored;
    } catch (error) {
      console.error('❌ Error getting stored primary user ID:', error);
      return null;
    }
  };

  // Resolve which user ID should be the primary one for this device
  const resolvePrimaryUserId = async (user: User): Promise<string> => {
    console.log('🔄 Resolving primary user ID for user:', user.uid);
    
    const deviceId = await getDeviceId();
    const existingUser = await findUserByDeviceId(deviceId);
    const storedId = await getPrimaryUserId();
  
    // Priority order:
    // 1. Existing user with same device ID
    // 2. Stored primary user ID (if user document exists)
    // 3. Current user ID
    
    if (existingUser) {
      console.log('✅ Using existing user as primary:', existingUser.uid);
      await storePrimaryUserId(existingUser.uid);
      return existingUser.uid;
    }
    
    if (storedId) {
      // Verify the stored user still exists
      try {
        const storedUserRef = doc(db, 'users', storedId);
        const storedUserSnap = await getDoc(storedUserRef);
        if (storedUserSnap.exists()) {
          console.log('✅ Using stored primary user ID:', storedId);
          return storedId;
        } else {
          console.log('⚠️ Stored user ID no longer exists, using current user');
        }
      } catch (error) {
        console.log('⚠️ Error checking stored user, using current user');
      }
    }
    
    console.log('✅ Using current user as primary:', user.uid);
    await storePrimaryUserId(user.uid);
    return user.uid;
  };

  // Merge posts from old user to new user
  const mergeUserPosts = async (oldUserId: string, newUserId: string) => {
    try {
      console.log('🔄 Merging posts from', oldUserId, 'to', newUserId);
      
      // Find all posts from the old user
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('userId', '==', oldUserId));
      const querySnapshot = await getDocs(q);
      
      // Update each post to the new user ID
      const updatePromises = querySnapshot.docs.map(postDoc => 
        updateDoc(postDoc.ref, { userId: newUserId })
      );
      
      await Promise.all(updatePromises);
      console.log('✅ Merged', querySnapshot.docs.length, 'posts');
      
    } catch (error) {
      console.error('❌ Error merging posts:', error);
    }
  };

  // Create or update user document in Firestore
  const createUserDocument = async (user: User, resolvedPrimaryUserId: string) => {
    try {
      console.log('📝 Creating/updating user document for:', resolvedPrimaryUserId);
      const deviceId = await getDeviceId();
      const userRef = doc(db, 'users', resolvedPrimaryUserId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('🆕 Creating new user document');
        
        // If we're using a different user ID than the current auth user, merge posts
        if (resolvedPrimaryUserId !== user.uid) {
          await mergeUserPosts(user.uid, resolvedPrimaryUserId);
        }
        
        // Create new user document with initial stats
        await setDoc(userRef, {
          uid: resolvedPrimaryUserId,
          authUid: user.uid, // Keep track of the current auth user
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          isAnonymous: user.isAnonymous,
          deviceId: deviceId,
          mergedUsers: resolvedPrimaryUserId !== user.uid ? [user.uid] : [], // Track any users that were merged into this one
          totalPosts: 0, // Initialize post count
          totalUpvotes: 0, // Initialize karma
          votes: {}, // Initialize empty votes object
        });
        
        console.log('✅ Created new user document for:', resolvedPrimaryUserId);
      } else {
        // Update lastActive and authUid
        await setDoc(userRef, {
          lastActive: serverTimestamp(),
          authUid: user.uid, // Update current auth user
        }, { merge: true });
        console.log('🔄 Updated existing user:', resolvedPrimaryUserId);
      }
    } catch (err) {
      console.error('❌ Error with user document:', err);
      throw err;
    }
  };

  // Enable Firebase persistence (this helps with anonymous auth)
  const enablePersistence = async () => {
    try {
      await auth.authStateReady();
      console.log('✅ Firebase auth ready');
    } catch (error) {
      console.log('⚠️ Firebase persistence info:', error);
    }
  };

  useEffect(() => {
    console.log('🚀 AuthProvider initializing...');
    enablePersistence();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 Auth state changed:', user ? `User ${user.uid}` : 'No user');
      
      try {
        if (user) {
          console.log('👤 User authenticated:', user.uid);
          setUser(user);
          setError(null);
      
          // Resolve which user ID should be primary for this device
          const resolvedId = await resolvePrimaryUserId(user);
          console.log('🎯 Resolved primary user ID:', resolvedId);
          setPrimaryUserId(resolvedId); 
          
          // Create/update user document
          await createUserDocument(user, resolvedId);
          
          console.log('✅ Auth setup complete');
        } else {
          console.log('🔄 No user, attempting anonymous sign in...');
          setError(null);
          const result = await signInAnonymously(auth);
          console.log('✅ Anonymous sign in successful:', result.user.uid);
          // Don't set loading to false here, let the auth state change handle it
          return;
        }
      } catch (err: any) {
        console.error('❌ Auth error:', err);
        setError(err.message || 'Authentication failed');
      } finally {
        // Only set loading to false if we have a user or an error
        if (user || error) {
          console.log('✅ Setting loading to false');
          setLoading(false);
        }
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ Auth timeout reached, forcing loading to false');
        setLoading(false);
        setError('Authentication timeout');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  console.log('🔍 AuthProvider render state:', { 
    user: user ? 'exists' : 'null', 
    primaryUserId, 
    loading, 
    error 
  });

  return (
    <AuthContext.Provider value={{ user, loading, error, primaryUserId }}>
      {children}
    </AuthContext.Provider>
  );
};