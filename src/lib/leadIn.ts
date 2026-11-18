import type { Track } from '../types';
import { barDuration } from './barDuration';

/**
 * 再生のディレイ時間(ms)。1 小節の時間とする
 *
 * Track の作成前（再生の予約時）にも求められるよう、bpm と beatsPerBar のみを受け取る
 */
export function leadIn({ bpm, beatsPerBar }: Pick<Track, 'bpm' | 'beatsPerBar'>): number {
  return barDuration(bpm, beatsPerBar);
}
