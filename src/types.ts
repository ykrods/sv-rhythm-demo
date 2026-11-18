/** ノーツ */
export type Note = {
  /** 判定バーに到達する時刻(ms)。曲の先頭（再生位置 0ms）を基準とする */
  hitTime: number;
  /** レーン番号（左から 0〜4） */
  lane: number;
};

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
  /** ノーツの譜面 */
  notes: Note[];
  /** 音源のURL */
  audioUrl: string;
};

/** Track のマスターデータ */
export type TrackData = Omit<Track, 'audioContext' | 'source'>;

/** Scene（Stage 上に表示される画面の単位）の識別子 */
export type SceneId = 'title' | 'play';
