import { BAD_WINDOW } from './judgementWindow';
import type { Judgement, Note } from '../../types';

/**
 * 押下したレーンの、判定の対象になるノーツを返す
 *
 * - 判定済みでなく、ずれが BAD_WINDOW 以内のノーツのうち、hitTime が最も早いもの。なければ undefined
 * - 譜面が hitTime の昇順であることを前提とせず、全件を走査する
 *
 * @param notes 譜面のノーツ
 * @param judged 判定済みのノーツ
 * @param lane 押下したレーン
 * @param inputTime 押下の時刻(ms、再生位置と同じ基準)
 */
export function findTargetNote(
  notes: Note[],
  judged: ReadonlyMap<Note, Judgement>,
  lane: number,
  inputTime: number,
): Note | undefined {
  let target: Note | undefined;
  for (const note of notes) {
    if (note.lane !== lane || judged.has(note)) continue;
    if (Math.abs(inputTime - note.hitTime) > BAD_WINDOW) continue;
    if (!target || note.hitTime < target.hitTime) target = note;
  }
  return target;
}
