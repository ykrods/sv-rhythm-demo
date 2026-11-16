/**
 * AudioContext の時刻から、音声の先頭を 0 とする再生位置(ms)を求める。
 * 音声は AudioContext の時刻 leadIn / 1000 秒に開始している前提（Track を参照）
 *
 * @param contextTime AudioContext の currentTime(秒)
 * @param leadIn 再生のディレイ時間(ms)
 */
export function toAudioTime(contextTime: number, leadIn: number): number {
  return contextTime * 1000 - leadIn;
}
