import type { TrackData } from '../../types';
import sampleTrack from '../../assets/sample.track.json';
import sampleUrl from '../../assets/sample.mp3';

/**
 * Track のマスターデータを読み込む
 *
 * 今回はデモ版なため固定データを返す
 */
export function loadTrackData(): TrackData {
  return { audioUrl: sampleUrl, ...sampleTrack };
}
