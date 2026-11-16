/** 再生予約済みの曲 */
export type Track = {
  /**
   * スタート操作で新規に作成したもの。
   * source は AudioContext の時刻 leadIn / 1000 秒（作成時点が 0）に開始するよう予約している
   */
  audioContext: AudioContext;
  /** leadIn 後に開始するよう start 済みのもの */
  source: AudioBufferSourceNode;
  /** 再生のディレイ時間(ms) */
  leadIn: number;
};

/** Scene（Stage 上に表示される画面の単位）の識別子 */
export type SceneId = 'title' | 'play';
