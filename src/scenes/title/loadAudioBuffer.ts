// デコード先のサンプルレート。再生側の AudioContext と異なる場合は、再生時にブラウザがリサンプリングする
const DECODE_SAMPLE_RATE = 48000;

/**
 * URL から音源を取得し、AudioBuffer にデコードする
 *
 * 再生用の AudioContext はユーザ操作の前に作成できない（自動再生の制限）ため、
 * 音声を出力しない OfflineAudioContext でデコードする。
 * AudioBuffer は特定のコンテキストに属さないため、後から作成した AudioContext で再生できる
 */
export async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status} ${url}`);
  }
  const data = await response.arrayBuffer();
  // length は 1 以上が必要だが、デコードには影響しない
  const offlineContext = new OfflineAudioContext({
    numberOfChannels: 2,
    length: 1,
    sampleRate: DECODE_SAMPLE_RATE,
  });
  return offlineContext.decodeAudioData(data);
}
