/**
 * 1 小節の時間(ms)
 *
 * @param bpm テンポ（1 分あたりの拍数）
 * @param beatsPerBar 1 小節の拍数
 */
export function barDuration(bpm: number, beatsPerBar: number): number {
  return (60000 / bpm) * beatsPerBar;
}
