import type { Note } from '../../types';

/**
 * hitTime が from 以上 to 以下のノーツを、譜面の順のまま返す
 *
 * - 譜面が hitTime の昇順であることを前提とせず、毎回全件を走査する
 *
 * @param notes 譜面のノーツ
 * @param from 範囲の始まり(ms)
 * @param to 範囲の終わり(ms)
 */
export function notesBetween(notes: Note[], from: number, to: number): Note[] {
  return notes.filter((note) => from <= note.hitTime && note.hitTime <= to);
}
