// functions/src/index.ts
import type { Transaction } from "@google-cloud/firestore";
import * as admin from "firebase-admin";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { onCall } from "firebase-functions/v2/https";

admin.initializeApp();
const db = getFirestore();

// Enhanced Expo push function with error handling and token cleanup
async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown> = {},
  ownerUid?: string
) {
  if (!tokens.length) {
    console.log('No push tokens to send to');
    return;
  }

  const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
  const messages = uniqueTokens.map((to) => ({ 
    to, 
    title, 
    body, 
    data, 
    sound: "default",
    priority: "high" as const
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Expo push response:', result);

    // Handle invalid tokens and cleanup
    if (result?.data && Array.isArray(result.data)) {
      const tokensToRemove: string[] = [];
      for (let i = 0; i < result.data.length; i++) {
        const ticketData = result.data[i];
        if (ticketData?.status === 'error') {
          const token = uniqueTokens[i];
          console.error(`Push notification error for token ${token}:`, ticketData?.details || ticketData?.message);
          const errorCode = ticketData?.details?.error || ticketData?.message || '';
          if (typeof errorCode === 'string' && errorCode.includes('DeviceNotRegistered')) {
            tokensToRemove.push(token);
          }
        }
      }
      if (ownerUid && tokensToRemove.length) {
        console.log(`Cleaning up ${tokensToRemove.length} invalid token(s) for user ${ownerUid}`);
        await Promise.all(
          tokensToRemove.map((t) =>
            db.doc(`users/${ownerUid}/pushTokens/${t}`).delete().catch((err) => {
              console.error(`Failed to delete invalid token ${t} for user ${ownerUid}:`, err);
            })
          )
        );
      }
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Fixed upvote notification - only send when vote value is 1
export const notifyOnUpvote = onDocumentCreated(
  { document: "posts/{postId}/votes/{uid}", region: "asia-east1" },
  async (event) => {
    const { postId, uid } = event.params as { postId: string; uid: string };
    const voteData = event.data?.data();
    
    // Only notify on upvotes (value === 1)
    if (!voteData || voteData.value !== 1) {
      console.log('Not an upvote, skipping notification');
      return;
    }

    const postSnap = await db.collection("posts").doc(postId).get();
    if (!postSnap.exists) {
      console.log('Post not found');
      return;
    }

    const post = postSnap.data()!;
    const authorUid = (post.userId ?? post.authorUid) as string | undefined;
    
    if (!authorUid || authorUid === uid) {
      console.log('No author or self-vote, skipping notification');
      return;
    }

    // Get push tokens
    const tokensSnap = await db.collection(`users/${authorUid}/pushTokens`).get();
    const tokens = tokensSnap.docs
      .map((d) => (d.get('token') as string) || d.id)
      .filter(Boolean);

    console.log(`Sending upvote notification to ${tokens.length} tokens`);

    await sendExpoPush(
      tokens,
      "有人讚了你的 Yap",
      "你的貼文收到一個讚 👍",
      {
        type: "upvote",
        postId,
      },
      authorUid
    );

    // Save notification to database
    await db.collection(`users/${authorUid}/notifications`).add({
      type: "upvote",
      postId,
      fromUid: uid,
      createdAt: FieldValue.serverTimestamp(),
      read: false,
    });

    console.log('Upvote notification sent and saved');
  }
);

// Fixed comment notification
export const notifyOnComment = onDocumentCreated(
  { document: "posts/{postId}/comments/{commentId}", region: "asia-east1" },
  async (event) => {
    const { postId, commentId } = event.params as { postId: string; commentId: string };
    const comment = event.data?.data();
    
    if (!comment) {
      console.log('No comment data');
      return;
    }

    const postSnap = await db.collection("posts").doc(postId).get();
    if (!postSnap.exists) {
      console.log('Post not found');
      return;
    }

    const post = postSnap.data()!;
    const authorUid = (post.userId ?? post.authorUid) as string | undefined;
    
    if (!authorUid || authorUid === comment.authorId) {
      console.log('No author or self-comment, skipping notification');
      return;
    }

    // Get push tokens
    const tokensSnap = await db.collection(`users/${authorUid}/pushTokens`).get();
    const tokens = tokensSnap.docs
      .map((d) => (d.get('token') as string) || d.id)
      .filter(Boolean);

    console.log(`Sending comment notification to ${tokens.length} tokens`);

    await sendExpoPush(
      tokens,
      "有人回覆了你的 Yap",
      comment.text ?? "你收到一則新留言",
      { type: "comment", postId, commentId },
      authorUid
    );

    // Save notification to database
    await db.collection(`users/${authorUid}/notifications`).add({
      type: "comment",
      postId,
      commentId,
      fromUid: comment.authorId,
      text: comment.text ?? "",
      createdAt: FieldValue.serverTimestamp(),
      read: false,
    });

    console.log('Comment notification sent and saved');
  }
);

// ========== Comment counters ==========
export const bumpCommentCountOnCreate = onDocumentCreated(
  { document: "posts/{postId}/comments/{commentId}", region: "asia-east1" },
  async (event) => {
    const postId = event.params?.postId;
    if (!postId) return;

    await db.collection("posts").doc(postId).update({
      commentCount: FieldValue.increment(1),
    });

    console.log(`Incremented comment count for post: ${postId}`);
  }
);

export const bumpCommentCountOnDelete = onDocumentDeleted(
  { document: "posts/{postId}/comments/{commentId}", region: "asia-east1" },
  async (event) => {
    const postId = event.params?.postId;
    if (!postId) return;
    const postRef = db.collection("posts").doc(postId);

    await db.runTransaction(async (tx: Transaction) => {
      const snap = await tx.get(postRef);
      const curr = (snap.get("commentCount") ?? 0) as number;
      tx.update(postRef, { commentCount: Math.max(0, curr - 1) });
    });

    console.log(`Decremented comment count for post: ${postId}`);
  }
);

// ========== Voting ==========
export const castVote = onCall({ region: "asia-east1" }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new Error("UNAUTHENTICATED");

  const { postId, value } = request.data as { postId?: string; value?: number };
  if (!postId || ![-1, 0, 1].includes(value as number)) {
    throw new Error("INVALID_ARGUMENT");
  }

  const postRef = db.collection("posts").doc(postId);
  const voteRef = postRef.collection("votes").doc(uid);
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const [postSnap, voteSnap] = await Promise.all([tx.get(postRef), tx.get(voteRef)]);
    if (!postSnap.exists) throw new Error("NOT_FOUND: post");

    const prev = voteSnap.exists ? (voteSnap.get("value") as number) : 0;
    if (prev === value) return; // idempotent

    let upDelta = 0,
      downDelta = 0;
    if (prev === 1) upDelta -= 1;
    if (prev === -1) downDelta -= 1;
    if (value === 1) upDelta += 1;
    if (value === -1) downDelta += 1;

    tx.set(
      voteRef,
      { value, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    const updates: Record<string, unknown> = {};
    if (upDelta) updates["upvotes"] = FieldValue.increment(upDelta);
    if (downDelta) updates["downvotes"] = FieldValue.increment(downDelta);
    if (Object.keys(updates).length) tx.update(postRef, updates);

    const userUpdates: Record<string, unknown> = {
      lastVoteAt: FieldValue.serverTimestamp(),
      lastVoteAtMs: Date.now(),
    };
    const voteFieldPath = `votes.${postId}`;
    if (value === 0) {
      userUpdates[voteFieldPath] = FieldValue.delete();
    } else {
      userUpdates[voteFieldPath] = value;
    }
    tx.set(userRef, userUpdates, { merge: true });
  });

  return { ok: true };
});



