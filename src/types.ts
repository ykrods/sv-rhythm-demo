/** 再生予約済みの曲 */
export type Track = {
  /**
   * スタート操作で新規に作成したもの。
   * source は AudioContext の時刻 leadIn / 1000 秒（作成時点が 0）に開始するよう予約している。
   * leadIn は 1 小節の時間（src/lib/leadIn.ts）
   */
  audioContext: AudioContext;
  /** leadIn 後に開始するよう start 済みのもの */
  source: AudioBufferSourceNode;
  /** テンポ（1 分あたりの拍数） */
  bpm: number;
  /** 1 小節の拍数。1 小節目の頭は音声の先頭（0ms）とする */
  beatsPerBar: number;
};

/** Scene（Stage 上に表示される画面の単位）の識別子 */
export type SceneId = 'title' | 'play';
