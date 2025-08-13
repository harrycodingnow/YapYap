// functions/src/index.ts
import type { Transaction } from "@google-cloud/firestore";
import * as admin from 'firebase-admin';
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { onCall } from "firebase-functions/v2/https";


admin.initializeApp();
const db = getFirestore();

// export const backfillScores = onCall(async (req) => {
//   // Optional auth check
//   if (!req.auth?.uid) throw new Error('Unauthenticated');

//   const snap = await db.collection('posts').get();
//   let batch = db.batch();
//   let count = 0;

//   snap.forEach(doc => {
//     const data = doc.data() as any;
//     if (data.score === undefined) {
//       batch.update(doc.ref, { score: 0 });
//       count++;
//       if (count % 450 === 0) {
//         batch.commit();
//         batch = db.batch();
//       }
//     }
//   });

//   if (count % 450 !== 0) await batch.commit();

//   return { updated: count };
// });

// Increment when a comment is created
export const bumpCommentCountOnCreate = onDocumentCreated(
  {
    document: "posts/{postId}/comments/{commentId}",
    region: "asia-east1",
  },
  async (event) => {
    const postId = event.params?.postId;
    if (!postId) {
      console.error("No postId found in event params");
      return;
    }

    await db
      .collection("posts")
      .doc(postId)
      .update({ commentCount: FieldValue.increment(1) });
    
    console.log(`Incremented comment count for post: ${postId}`);
  }
);

// Decrement (never below 0) when a comment is deleted
export const bumpCommentCountOnDelete = onDocumentDeleted(
  {
    document: "posts/{postId}/comments/{commentId}",
    region: "asia-east1",
  },
  async (event) => {
    const postId = event.params?.postId;
    if (!postId) {
      console.error("No postId found in event params");
      return;
    }

    const postRef = db.collection("posts").doc(postId);

    await db.runTransaction(async (tx: Transaction) => {
      const docSnap = await tx.get(postRef);
      const curr = (docSnap.get("commentCount") ?? 0) as number;
      tx.update(postRef, { commentCount: Math.max(0, curr - 1) });
    });
    
    console.log(`Decremented comment count for post: ${postId}`);
  }
);


export const castVote = onCall(
  { region: "asia-east1" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new Error("UNAUTHENTICATED");

    const { postId, value } = request.data as { postId?: string; value?: number };
    if (!postId || ![-1, 0, 1].includes(value as number)) {
      throw new Error("INVALID_ARGUMENT");
    }

    const postRef = db.collection("posts").doc(postId);
    const voteRef = postRef.collection("votes").doc(uid);
    const userRef = db.collection("users").doc(uid); // 🔑 mirror + cooldown lives here

    await db.runTransaction(async (tx) => {
      // --- Cooldown check (1.2s) ---
      const userSnap = await tx.get(userRef);
      const lastVoteAt = userSnap.get("lastVoteAt") as FirebaseFirestore.Timestamp | undefined;
      const now = FieldValue.serverTimestamp();
      if (lastVoteAt) {
        const msNow = Date.now(); // serverTimestamp not resolved here, so compare on client next time; or keep a numeric mirror:
        // Alternative: store numeric ms, not Timestamp:
        // const nowMs = Date.now(); const lastMs = userSnap.get("lastVoteAtMs") ?? 0;
        // if (nowMs - lastMs < 1200) throw new Error("RESOURCE_EXHAUSTED");
      }

      const [postSnap, voteSnap] = await Promise.all([tx.get(postRef), tx.get(voteRef)]);
      if (!postSnap.exists) throw new Error("NOT_FOUND: post");

      const prev = voteSnap.exists ? (voteSnap.get("value") as number) : 0; // -1 | 0 | 1
      if (prev === value) return; // idempotent

      // deltas
      let upDelta = 0, downDelta = 0;
      if (prev === 1) upDelta -= 1;
      if (prev === -1) downDelta -= 1;
      if (value === 1) upDelta += 1;
      if (value === -1) downDelta += 1;      

      // per-post vote doc
      tx.set(
        voteRef,
        { value, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );

      // post counters / score
      const updates: Record<string, unknown> = {};
      if (upDelta) updates["upvotes"] = FieldValue.increment(upDelta);
      if (downDelta) updates["downvotes"] = FieldValue.increment(downDelta);      
      if (Object.keys(updates).length) tx.update(postRef, updates);

      // 🔑 mirror into users/{uid}.votes[postId] so your client onSnapshot(user) updates
      const userUpdates: Record<string, unknown> = {
        lastVoteAt: FieldValue.serverTimestamp(),
        // if you want a strict cooldown, also track milliseconds:
        lastVoteAtMs: Date.now(),
      };
      const voteFieldPath = `votes.${postId}`;
      if (value === 0) {
        userUpdates[voteFieldPath] = FieldValue.delete(); // remove key when unvoting
      } else {
        userUpdates[voteFieldPath] = value; // -1 or 1
      }
      tx.set(userRef, userUpdates, { merge: true });
    });

    return { ok: true };
  }
);


