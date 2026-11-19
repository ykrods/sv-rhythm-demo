import { BAD_WINDOW, GOOD_WINDOW, GREAT_WINDOW } from './judgementWindow';
import type { Judgement } from '../../types';

/**
 * 押下の時刻とノーツの hitTime のずれから判定を求める
 *
 * - ずれが判定の範囲（BAD_WINDOW）を超える場合は undefined を返す
 * - Miss は押下では発生しない（判定の範囲を過ぎたノーツに対して findMissedNotes で決める）
 *
 * @param hitTime ノーツが判定バーに到達する時刻(ms)
 * @param inputTime 押下の時刻(ms、再生位置と同じ基準)
 */
export function judge(hitTime: number, inputTime: number): Exclude<Judgement, 'miss'> | undefined {
  const diff = Math.abs(inputTime - hitTime);
  if (diff <= GREAT_WINDOW) return 'great';
  if (diff <= GOOD_WINDOW) return 'good';
  if (diff <= BAD_WINDOW) return 'bad';
  return undefined;
}
