//AuthContext.tsx
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";

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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create or update user document in Firestore
  const createOrUpdateUserDocument = async (user: User) => {
    try {
      console.log("📝 Creating/updating user document for:", user.uid);
      const userRef = doc(db, "users", user.uid);

      await setDoc(
        userRef,
        {
          uid: user.uid,
          isAnonymous: user.isAnonymous,
          createdAt: serverTimestamp(), // If already eists, merge won't overwrite this
          lastActive: serverTimestamp(),
          totalPosts: 0, // Initialize post count
          totalUpvotes: 0, // Initialize karma
          votes: {}, // Initialize empty votes object
        },
        { merge: true }
      );

      console.log("✅ User document created/updated for:", user.uid);
    } catch (err) {
      console.error("❌ Error with user document:", err);
      throw err;
    }
  };

  useEffect(() => {
    console.log("🚀 AuthProvider initializing...");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(
        "🔐 Auth state changed:",
        user ? `User ${user.uid}` : "No user"
      );

      try {
        if (user) {
          console.log("👤 User authenticated:", user.uid);
          setUser(user);
          setError(null);

          // Create/update user document directly
          await createOrUpdateUserDocument(user);

          console.log("✅ Auth setup complete");
        } else {
          console.log("🔄 No user, attempting anonymous sign in...");
          setError(null);
          const result = await signInAnonymously(auth);
          console.log("✅ Anonymous sign in successful:", result.user.uid);
          return;
        }
      } catch (err: any) {
        console.error("❌ Auth error:", err);
        setError(err.message || "Authentication failed");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log("🧹 Cleaning up auth listener");
      unsubscribe();
    };
  }, []);

  console.log("🔍 AuthProvider render state:", {
    user: user ? "exists" : "null",
    loading,
    error,
  });

  return (
    <AuthContext.Provider
      value={{ user, loading, error, primaryUserId: user?.uid || null }}
    >
      {children}
    </AuthContext.Provider>
  );
};
