# requirements: note-fall

## 目的
`docs/proposal.md` のマイルストーン b「SVG のレーンとノーツの落下」の後半として、譜面データに従ってノーツをレーン上に流す。
小節線（`docs/spec/play.md`「小節線」）と同じ方法で、再生位置からノーツの位置を求める。

## タスク種別
設計・実装

## 前提
- `docs/proposal.md`（マイルストーン b）
- `docs/architecture.md`
- `docs/glossary.md`（レーン・ノーツ・判定バー・奥行き）
- `docs/spec/play.md`（レーンの形・奥行きの表現・小節線・再生位置）
- `docs/spec/title.md`（曲の読み込み・開始の操作）
- `docs/decisions/002-lane-perspective.md`（ノーツは 4 隅を投影した `<polygon>` として描く）

### 前提作業（ユーザが実施済み。コミット a1dc7d6）
- 曲の情報と譜面をまとめたデータ（`TrackData`）を JSON ファイル `src/assets/sample.track.json` に置き、`src/scenes/title/loadTrackData.ts` の `loadTrackData()` で読み込む
  - JSON を静的に import するため、読み込みは同期的に行う。曲・譜面が固定のデモのため、実行時の検証は行わない
  - Title は `loadTrackData()` の結果を `startTrack` に渡し、`Track` は `TrackData` の内容（`bpm`・`beatsPerBar`・`notes`・`audioUrl`）を持つ
  - 音源の URL（`audioUrl`）は JSON に含めず、`loadTrackData()` で `src/assets/sample.mp3` の import と組み合わせる
    - 音源を `src/assets/` に置き、ビルド時に URL が解決される利点を残すため
  - Title は `audioUrl` から音源を読み込む
- `src/types.ts` に `Note`・`TrackData` を追加し、`Track` に `notes: Note[]`・`audioUrl: string` を追加した
  ```typescript
  /** ノーツ */
  export type Note = {
    /** 判定バーに到達する時刻(ms)。曲の先頭（再生位置 0ms）を基準とする */
    hitTime: number;
    /** レーン番号（左から 0〜4） */
    lane: number;
  };

  export type Track = {
    // ...既存のフィールド（audioContext・source・bpm・beatsPerBar）
    /** ノーツの譜面 */
    notes: Note[];
    /** 音源のURL */
    audioUrl: string;
  };

  /** Track のマスターデータ */
  export type TrackData = Omit<Track, 'audioContext' | 'source'>;
  ```
- `sample.track.json` の譜面は、仮の音源（120 BPM・4 拍子）の 2 小節目に 8 分音符（250ms 刻み）で 8 個のノーツを置いた確認用のデータとする
  - 曲全体の譜面はユーザが別途作成する（本タスクの実装はこのデータで確認する）

## 要件
- `Track.notes` を元に、ノーツを Play のレーン上に流す
  - 譜面のノーツを、`hitTime` の時点で判定バーに到達するようにレーン上に流す
  - 流れ方は小節線と同じにする（所要時間・奥行きの対応・上端でのフェードアウト）
  - ノーツは、レーン番号のレーンの幅に収まる長方形を、奥行きの表現に合わせて投影した形（台形）で描く
  - 判定は行わないため、判定バーを通過したノーツはそのまま画面の下端まで流れて消える
  - 表示範囲外のノーツは描画しない

## 検討事項（plan.md で決める）
- ノーツの見た目
  - 色・発光の有無、レーン内の左右の余白
  - 奥行き方向の厚み（時間の長さで決めるか、奥行きの長さで決めるか）と、`hitTime` が厚みのどこ（手前の辺・中央）に当たるか
- 重なり順（小節線・判定バーとの前後）
- 表示範囲内のノーツを求める方法
  - 譜面が `hitTime` の昇順であることを前提にするか
  - 毎フレームの絞り込みの方法（全件の走査で十分か）

## 実装上の条件
- 既存の表示要素（背景・レーン・小節線・判定バー）と曲の再生、開発時の `audioTime` 表示を維持する
- 外部パッケージを追加しない
- 時刻からノーツの位置・範囲を求める処理は純粋な関数とし、テストを書く
  - 小節線で作成した `depthAtTime`・`TRAVEL_TIME` を流用する

## 検証
- ブラウザで、ノーツが `hitTime` の時点で判定バーに到達すること、指定したレーンを流れることを確認する
  - 開発時の `audioTime` 表示と合わせて確認する
- Health Check（C1〜C6、task scope）を実行する
- 主要な画面サイズのスクリーンショットを取得・確認する

## 対象外
- ノーツの判定処理（入力・Great/Good/Bad/Miss の判定・判定後のノーツの消去）
- スコア・コンボ・リザルト
- ロングノーツなど、長方形の単発ノーツ以外の種類
- 譜面の選択・難易度の切り替え
- 出力レイテンシの補正

## ドキュメント反映
- 実装確認後、ユーザの指示により `docs/spec/` に今回の仕様を反映する
