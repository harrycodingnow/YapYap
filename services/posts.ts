// app/services/posts.ts
import {
  collection,
  DocumentSnapshot,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from 'firebase/firestore';
import { db } from '../firebase';

const PAGE = 30;

export async function fetchLatestPostsPage(last?: DocumentSnapshot) {
  const base = query(
    collection(db, 'posts'),
    orderBy('timestamp', 'desc'),
    limit(PAGE)
  );
  const q = last ? query(base, startAfter(last)) : base;
  const snap = await getDocs(q);
  return {
    items: snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })),
    nextCursor: snap.docs.at(-1) ?? null,
  };
}

export async function fetchTopPostsPage(last?: DocumentSnapshot) {
  const base = query(
    collection(db, 'posts'),
    orderBy('upvotes', 'desc'),
    orderBy('timestamp', 'desc'),
    limit(PAGE)
  );
  const q = last ? query(base, startAfter(last)) : base;
  const snap = await getDocs(q);

  console.log('[Hot] docs:', snap.size);
  return {
      items: snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })),
      nextCursor: snap.docs.at(-1) ?? null,
    };
}


