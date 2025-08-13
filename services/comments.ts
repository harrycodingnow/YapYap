import { collection, DocumentSnapshot, getDocs, limit, orderBy, query, startAfter } from 'firebase/firestore';
import { db } from '../firebase';

export async function fetchCommentsPage(
  postId: string,
  last?: DocumentSnapshot,
  dir: 'asc' | 'desc' = 'asc',
  pageSize = 50
) {
  const base = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', dir), limit(pageSize));
  const q = last ? query(base, startAfter(last)) : base;
  const snap = await getDocs(q);
  return {
    items: snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })),
    nextCursor: snap.docs.at(-1) ?? null,
  };
}
