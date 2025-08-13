// services/voteService.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase"; // 這個路徑依你的 firebase 初始化檔案而定

const functions = getFunctions(app, "asia-east1");

/**
 * 呼叫 Cloud Function castVote
 * @param postId 貼文 ID
 * @param value 投票值 (-1, 0, 1)
 */
export async function castVote(postId: string, value: number) {
  const voteFn = httpsCallable(functions, "castVote");
  const res = await voteFn({ postId, value });
  return res.data;
}
