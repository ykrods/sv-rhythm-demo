# plan: note-fall

## 概要
小節線と同じく、再生位置 `audioTime` から表示範囲内のノーツを絞り込み、各ノーツの `hitTime` を `depthAtTime` で奥行きに変換する。
ノーツは「判定バーの位置で高さ 12 の長方形」をレーン面上に置いたものとして扱い、4 隅を `project` で投影した `<polygon>`（台形）として描く（`docs/decisions/002-lane-perspective.md`）。

## 追加・変更されるモデル（用語・概念）
- ノーツの奥行き方向の厚み（`NOTE_DEPTH`）: ノーツの手前の辺と奥の辺の奥行きの差
  - 判定バーの位置での見た目の高さ（`NOTE_HEIGHT` = 12）から `depthAtY(-NOTE_HEIGHT)` で求める（約 0.008）
  - 奥行きの単位で一定にするため、奥ほど薄く見える（レーン面上の長方形を投影した形になる）
- ノーツの中心: `hitTime` はノーツの厚みの中央に対応する。`hitTime` の時点で、ノーツの中央が判定バーに重なる

## 処理の詳細
### 1. 表示範囲の奥行き（`src/scenes/play/laneDepth.ts`、追加）
レーン上端（奥行き 1）と Scene の下端の奥行きは、Lanes・Barlines・Notes の 3 ファイルで使うため、定数として切り出す（`docs/architecture.md`「配置」: 1 つのファイルでしか使わない定数はそのファイル内に、それ以外は概念ごとのファイルに）。

```typescript
// src/scenes/play/laneDepth.ts
import { SCENE_HEIGHT } from '../../lib/scene';
import { JUDGEMENT_BAR_Y } from './lane';
import { depthAtY } from './depthAtY';

// レーン上端の奥行き
export const LANE_TOP_DEPTH = 1;
// レーン下端（Scene の下端）の奥行き
export const LANE_BOTTOM_DEPTH = depthAtY(SCENE_HEIGHT - JUDGEMENT_BAR_Y);
```

- `lane.ts` に置かないのは、`lane.ts` → `depthAtY.ts` → `project.ts` → `lane.ts` の循環 import になるため
- Lanes・Barlines の `TOP_DEPTH`・`BOTTOM_DEPTH` をこの定数に置き換える（値・表示は変わらない）

### 2. 表示範囲内のノーツ（`src/scenes/play/notesBetween.ts`、追加）
```typescript
/**
 * hitTime が from 以上 to 以下のノーツを、譜面の順のまま返す
 */
export function notesBetween(notes: Note[], from: number, to: number): Note[] {
  return notes.filter((note) => from <= note.hitTime && note.hitTime <= to);
}
```

- 毎フレーム全件を走査する
  - 理由: 1 曲のノーツ数は多くても数百〜千程度で、フレームごとの `filter` の負荷は問題にならない。譜面が `hitTime` の昇順であることを前提にしなくてよく、譜面データの誤りで表示が崩れない
  - 二分探索などによる絞り込みは、負荷が問題になった場合に検討する
- 表示範囲は、ノーツの厚みの半分だけ広げて求める（ノーツの一部でも表示範囲にかかれば描く）
  - `from = audioTime + (LANE_BOTTOM_DEPTH - NOTE_DEPTH / 2) * TRAVEL_TIME`
  - `to = audioTime + (LANE_TOP_DEPTH + NOTE_DEPTH / 2) * TRAVEL_TIME`
  - レーン上端より奥にはみ出した部分は、上端のフェードの mask で透明になる（グラデーションの外側は端の色が延長されるため）
- `hitTime` が 0 未満のノーツや、leadIn の間に表示範囲に入るノーツも特別扱いしない（譜面のとおりに流す）

### 3. ノーツのコンポーネント（`src/scenes/play/Notes.svelte`、追加）
表示範囲内のすべてのノーツを描くコンポーネントとする（Barlines と同じ構成）。

- props: `{ audioTime: number; notes: Note[] }`
- 原点: 判定バーの中央（投影の基準が判定バーのため）。Lanes・Barlines と同じ例外である旨をコメントで明示する
- 処理
  1. `notesBetween` で表示範囲内のノーツを得る
  2. 各ノーツの中心の奥行き `depth = depthAtTime(note.hitTime, audioTime)` を求める
  3. レーンの左右端（奥行きのない座標）: `x0 = -SCENE_WIDTH / 2 + LANE_WIDTH * lane + NOTE_MARGIN`、`x1 = x0 + LANE_WIDTH - NOTE_MARGIN * 2`
  4. 4 隅 `project(x0, depth - NOTE_DEPTH / 2)`・`project(x1, depth - NOTE_DEPTH / 2)`・`project(x1, depth + NOTE_DEPTH / 2)`・`project(x0, depth + NOTE_DEPTH / 2)` を `<polygon>` の `points` にする
  5. `$derived` で求め、`{#each}` のキーはノーツのオブジェクト（`(note)`）とする
     - `hitTime` と `lane` が同じノーツが譜面にあってもキーが重複しないため。`track.notes` のオブジェクトはフレーム間で同一
- 定数（Notes 内でのみ使うためファイル内に定義する）
  - `NOTE_HEIGHT = 12`（判定バーの位置での高さ）、`NOTE_DEPTH = depthAtY(-NOTE_HEIGHT)`
  - `NOTE_MARGIN = 6`（レーン内の左右の余白。判定バーの位置でノーツの幅は 60）
- 見た目
  - 塗りはネオン調の桃色（`#ff5fd2`）、白（`#fff`）の細い縁取り（線幅 1）で、発光させる
    - レーン・小節線・判定バーの青と区別でき、Title のロゴのグラデーション（水色→桃色）と色味を揃える
  - 発光は Lanes と同様の `feGaussianBlur` + `feMerge`。filter の領域は `userSpaceOnUse` で Scene 全体を指定する（id: `play-notes-glow`）
  - 上端のフェードは Lanes・Barlines と同じ範囲・グラデーションの mask を持つ（id: `play-notes-fade`）
  - 値は仮置きとし、スクリーンショットで確認して調整する
- レーン番号が 0〜4 の範囲外のノーツは考慮しない（譜面データは固定で、実行時の検証は行わない。requirements.md「前提作業」）

### 4. Play での配置
- 重なり順: 背景 → レーン → 小節線 → 判定バー → ノーツ
  - ノーツは判定バーの上に重ねる。判定バーに重なる瞬間（叩くタイミング）にノーツが隠れないようにするため
- Barlines と同じく `audioTime` が定義されている間のみ、`translate(CENTER_X JUDGEMENT_BAR_Y)` で配置し、`notes={track.notes}` を渡す

## ファイル配置
```
src/scenes/
  Play.svelte              # 変更: Notes を判定バーの上に配置する
  play/
    Notes.svelte           # 追加
    notesBetween.ts        # 追加
    laneDepth.ts           # 追加: LANE_TOP_DEPTH / LANE_BOTTOM_DEPTH
    Lanes.svelte           # 変更: TOP_DEPTH / BOTTOM_DEPTH を laneDepth.ts の定数に置き換える
    Barlines.svelte        # 変更: 同上
tests/scenes/play/
  notesBetween.test.ts     # 追加
```

- テストの観点（`notesBetween`）
  - 範囲の境界を含む、範囲外を含まない、譜面の順を保つ、`hitTime` の昇順でない譜面でも範囲内のノーツをすべて返す、範囲内になければ空
- ノーツの 4 隅の計算は UI の表示位置の計算のため、コンポーネントに書きテストしない（`docs/architecture.md`「関数に切り出す基準」）
- `NOTE_DEPTH` の値（約 0.008）は `depthAtY` のテストで式が検証済みのため、個別にテストしない

## ドキュメント
- Workflow 7 で `docs/spec/play.md` に反映する内容（実装確認後、ユーザの指示により行う）
  - 冒頭の現状説明（ノーツは表示のみ、判定は未実装）
  - 表示要素「ノーツ」と重なり順
  - ノーツの流れ方（`hitTime` で中央が判定バーに重なる、厚み、表示範囲）
  - 譜面データ（`sample.track.json` の形式）を記載するか、記載先を `title.md`「曲の読み込み」とするか
- architecture / glossary / ADR の更新は不要と考える
  - 「譜面」を glossary に追加するかはユーザの判断とする

## 確認方法
- `npm run test` で追加したテストが通ること
- ブラウザ（開発時）で以下を確認する
  - ノーツが指定したレーン（0, 0, 0, 0, 1, 2, 3, 4）を流れること
  - `audioTime` が各 `hitTime`（2000〜3750ms、250ms 刻み）のときに、ノーツの中央が判定バーに重なること
    - 最初のノーツ（2000ms）が 2 小節目の小節線と同時に判定バーに達すること
  - 上端でフェードインし、判定バーを通過した後、画面の下端まで流れて消えること
  - 既存のレーン・小節線の表示が変わらないこと（laneDepth.ts への置き換え）
- 主要な画面サイズ（360×640、390×844、844×390、1280×720）のスクリーンショットを取得・確認する
  - ノーツが流れている状態を撮るため、スタート操作の約 4 秒後（`audioTime` が 2000ms 付近）に取得する
- Health Check（C1〜C6、task scope）を実行する
