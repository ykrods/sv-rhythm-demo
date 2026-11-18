import type { Track } from '../../types';
import { leadIn } from '../../lib/leadIn';

// navigator.audioSession（Safari 16.4 以降）は TypeScript の DOM の型定義にないため、機能検出に必要な分だけ定義する
type NavigatorWithAudioSession = Navigator & {
  audioSession?: { type: string };
};

/**
 * AudioContext を作成し、leadIn(ms) 後に audioBuffer を再生するよう予約する
 * leadIn は tempo から求める（1 小節の時間。src/lib/leadIn.ts）
 *
 * - ユーザ操作（click / keydown）のイベントハンドラ内で同期的に呼ぶこと（自動再生の制限のため）
 * - 音声の開始時刻は、AudioContext の時刻（作成時点が 0）で leadIn / 1000 秒とする（Track を参照）。
 *   予約時の currentTime に依存しない絶対時刻で指定するため、Play で開始時刻を Track の bpm・beatsPerBar から求められる
 * - AudioContext が suspended で作成された場合は resume() を呼び、その Promise を戻り値の resumed で返す。
 *   running で作成された場合、resumed は undefined
 * - 例外が発生した場合は、作成済みの AudioContext を閉じてから例外を投げる
 */
export function startTrack(
  audioBuffer: AudioBuffer,
  tempo: Pick<Track, 'bpm' | 'beatsPerBar'>,
): { track: Track; resumed: Promise<void> | undefined } {
  // iOS の消音スイッチ（マナーモード）に関わらず再生されるようにする。AudioContext の作成前に設定する
  const { audioSession } = navigator as NavigatorWithAudioSession;
  if (audioSession) {
    audioSession.type = 'playback';
  }

  const audioContext = new AudioContext();
  try {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    // 楽曲の再生開始予定時刻（AudioContext の時刻での絶対時刻）
    source.start(leadIn(tempo) / 1000);

    const resumed = audioContext.state === 'running' ? undefined : audioContext.resume();
    return { track: { audioContext, source, ...tempo }, resumed };
  } catch (error) {
    void audioContext.close();
    throw error;
  }
}
