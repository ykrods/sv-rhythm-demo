import { BAD_WINDOW } from './judgementWindow';
import type { Judgement, Note } from '../../types';

/**
 * 判定済みでなく、判定の範囲を過ぎた（audioTime - hitTime > BAD_WINDOW）ノーツを、譜面の順のまま返す
 *
 * @param notes 譜面のノーツ
 * @param judged 判定済みのノーツ
 * @param audioTime 再生位置(ms)
 */
export function findMissedNotes(
  notes: Note[],
  judged: ReadonlyMap<Note, Judgement>,
  audioTime: number,
): Note[] {
  return notes.filter((note) => !judged.has(note) && audioTime - note.hitTime > BAD_WINDOW);
}
