export type Note = {
  id: number;
  lane: number;
  hitTime: number;
};

export type Track = {
  title: string;
  bpm: number;
  notes: Note[];
};

export type JudgeResult = "GREAT" | "GOOD" | "MISS";

export type LaneState = {
  // 最後の判定結果
  judge: JudgeResult | "";
  // 最後に判定した時間（ボタン or ライン通過)
  judgeTime: number;
  // 最後にボタンを押した時間
  hitTime: number;
}