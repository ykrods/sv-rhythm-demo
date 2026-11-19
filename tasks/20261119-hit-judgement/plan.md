# plan: hit-judgement

## 概要
Play に入力（キーボード・ポインタ）の受け付けを追加し、押下の時点の再生位置とノーツの `hitTime` のずれから判定を行う。
判定済みのノーツは `Track.notes` を変更せず、Play が持つ「ノーツ → 判定」の Map で管理する。
押下範囲の当たり判定は、svg 全体で受けたポインタの座標を論理座標に変換し、純粋な関数でレーンを求める。ボタン（`LaneButtons.svelte`）は見た目のみを担う。

## 追加・変更されるモデル（用語・概念）
- 判定（`Judgement`）: ノーツに対する押下のタイミングの評価。`'great' | 'good' | 'bad' | 'miss'`
  - `src/types.ts` に追加する
- 判定の範囲（judgement window）: 押下の時刻と `hitTime` のずれ（絶対値）に対する、各判定の閾値
  - ずれが Bad の閾値以内のノーツが、押下の判定の対象になる
- 判定済みのノーツ: 判定（Miss を含む）が決まったノーツ。以降の判定の対象にならない
  - 押下で判定されたノーツ（Great / Good / Bad）は表示から消す
  - Miss のノーツは表示から消さず、従来どおり画面の下端まで流す（見逃したことが分かるようにするため）
- 押下範囲: 入力ボタンの押下を受け付ける範囲（requirements.md「入力ボタン」）

## 処理の詳細
### 1. 判定の範囲（`src/scenes/play/judgementWindow.ts`、追加）
`judge.ts`・`findTargetNote.ts`・`findMissedNotes.ts` で使うため、定数のファイルとする。

```typescript
// 各判定となる、押下の時刻と hitTime のずれ（絶対値、ms）の上限（仮置き）
export const GREAT_WINDOW = 75;
export const GOOD_WINDOW = 150;
export const BAD_WINDOW = 225;
```

- 値は一般的な音ゲーの範囲を参考にした仮置きとし、実際に操作して調整する
- 閾値ちょうどのずれは、その判定に含める（例: ずれ 75ms は Great）
- 早押し・遅押しで範囲を変えない（対称とする）

### 2. 判定の種類（`src/scenes/play/judge.ts`、追加）
```typescript
/**
 * 押下の時刻とノーツの hitTime のずれから判定を求める
 * ずれが判定の範囲（BAD_WINDOW）を超える場合は undefined を返す
 */
export function judge(hitTime: number, inputTime: number): Exclude<Judgement, 'miss'> | undefined;
```

- Miss は押下では発生せず、`findMissedNotes` で判定の範囲を過ぎたノーツに対して決める

### 3. 判定の対象のノーツ（`src/scenes/play/findTargetNote.ts`、追加）
```typescript
/**
 * 押下したレーンの、判定の対象になるノーツを返す
 * 判定済みでなく、ずれが BAD_WINDOW 以内のノーツのうち、hitTime が最も早いもの。なければ undefined
 */
export function findTargetNote(
  notes: Note[],
  judged: ReadonlyMap<Note, Judgement>,
  lane: number,
  inputTime: number,
): Note | undefined;
```

- 同じレーンで判定の範囲内に複数のノーツがある場合は、`hitTime` が最も早いノーツを対象にする
  - 理由: ずれが最も小さいノーツを選ぶ方式では、手前のノーツを飛ばして後のノーツを取り、手前のノーツが Miss になることがある。早いものから順に処理する方が、譜面の順に叩く操作と一致する
  - 現状の譜面（最短 500ms 間隔）では、範囲（±225ms）が重なることはない
- 譜面が `hitTime` の昇順であることを前提とせず、全件を走査する（`notesBetween` と同じ理由）

### 4. 見逃したノーツ（`src/scenes/play/findMissedNotes.ts`、追加）
```typescript
/**
 * 判定済みでなく、判定の範囲を過ぎた（audioTime - hitTime > BAD_WINDOW）ノーツを、譜面の順のまま返す
 */
export function findMissedNotes(
  notes: Note[],
  judged: ReadonlyMap<Note, Judgement>,
  audioTime: number,
): Note[];
```

- フレームごとに呼び、結果のノーツを Miss として判定済みにする
- 全件を走査する（`notesBetween` と同じく、負荷は問題にならない想定）

### 5. 押下範囲のレーン（`src/scenes/play/laneAtPoint.ts`、追加）
```typescript
/**
 * Scene 上の論理座標の点が、どのレーンの押下範囲にあるかを返す。押下範囲外なら undefined
 * 押下範囲: x = 0〜SCENE_WIDTH を LANE_COUNT 等分、y = JUDGEMENT_BAR_Y〜SCENE_HEIGHT
 */
export function laneAtPoint(x: number, y: number): number | undefined;
```

- 境界は左のレーン側に含めず、`Math.floor(x / LANE_WIDTH)` で求める（x = 72 はレーン 1）。右端（x = 360）はレーン 4 に含める
- 判定バー上（y = 512）は押下範囲に含める

### 6. 入力の受け付け（`src/scenes/Play.svelte`、変更）
#### 状態
```typescript
// 判定済みのノーツ。Track.notes は変更しない
const judged = new SvelteMap<Note, Judgement>();
// レーンごとの最新の判定の結果と、その時点の再生位置（判定の結果の表示に使う）
let results = $state<(JudgementResult | undefined)[]>(Array(LANE_COUNT).fill(undefined));
// キーで押下中のレーン
let keyPressed = $state<boolean[]>(Array(LANE_COUNT).fill(false));
// ポインタ（pointerId）ごとの押下中のレーン
const pointerLanes = new SvelteMap<number, number>();
// レーンごとの押下中かどうか（キーまたはポインタ）
const pressed = $derived(...);
// 表示するノーツ（押下で判定されたノーツを除く。Miss は残す）
const visibleNotes = $derived(track.notes.filter((note) => { const j = judged.get(note); return j === undefined || j === 'miss'; }));
```

- `JudgementResult = { judgement: Judgement; audioTime: number }` は実装上の都合の型のため、`JudgementResults.svelte` 内で定義して export する（`docs/coding-guidelines.md`「TypeScript の型」の例外）
- `SvelteMap` は `svelte/reactivity` のもの（Svelte の標準機能で、外部パッケージの追加ではない）

#### 押下（キー・ポインタ共通）
```typescript
function press(lane: number) {
  const inputTime = toAudioTime(track.audioContext.currentTime, trackLeadIn);
  const note = findTargetNote(track.notes, judged, lane, inputTime);
  if (!note) return; // 空押しは何もしない
  const judgement = judge(note.hitTime, inputTime);
  judged.set(note, judgement);
  results[lane] = { judgement, audioTime: inputTime };
}
```

- 押下の時刻は、イベントハンドラの中で `AudioContext.currentTime` から求める（再生位置と同じ基準）
  - 次のフレームの `audioTime` を待たないため、フレームの間隔（約 16ms）の誤差を含まない
  - `AudioContext.currentTime` は音声の処理単位ごとに進むため数 ms の粒度があるが、許容する
  - `event.timeStamp`（`performance.now()` の基準）を音声の時刻に換算する方法は、複雑になるため採らない
- Play の表示直後（`audioTime` が未定義）でも、時刻は `currentTime` から求められるため特別扱いしない

#### キーボード
- `<svelte:window onkeydown onkeyup onblur>` で受け付ける（Title の Space と同じく、フォーカスの位置に関わらず有効）
- キーは `event.code` で判別する: `['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG']` の添字をレーン番号とする（Play 内の定数）
  - 理由: キーボード配列・IME・Caps Lock の状態によらず、物理的なキーの位置で判別するため
- `keydown`: `event.repeat` なら無視する。`keyPressed[lane] = true` にして `press(lane)` を呼ぶ
- `keyup`: `keyPressed[lane] = false`
- `blur`（ウィンドウのフォーカスが外れた）: `keyPressed` をすべて false にする（keyup を受け取れず押下中のまま残るのを防ぐ）
- 修飾キー（Ctrl など）との同時押しは区別しない

#### ポインタ（タッチ・マウス）
- Play の `<svg>` の `onpointerdown` で受け付け、`laneAtPoint` でレーンを求める
  - クライアント座標から論理座標への変換は `svg.getScreenCTM().inverse()` で行う（`bind:this` で svg を参照）
  - 押下範囲外なら何もしない。範囲内なら `pointerLanes.set(event.pointerId, lane)` にして `press(lane)` を呼ぶ
  - マウスは主ボタン（`event.button === 0`）のみ受け付ける
- `<svelte:window onpointerup onpointercancel>` で `pointerLanes.delete(event.pointerId)` する
  - 押下中に指を別のレーンへ動かしても、押下中のレーンは押下を始めたレーンのままとする（スライドによる入力はしない）
- svg 全体で受ける理由: 押下範囲の上にノーツ・判定バーなどが重なるため。各表示要素で `pointer-events` を調整するより、座標から求める方が単純で、当たり判定を純粋な関数としてテストできる
- マルチタッチは `pointerId` ごとに管理することで対応する（Stage の `touch-action: none` により、2 本指の操作もブラウザに奪われない）

#### Miss の検出
- rAF の `update` で `audioTime` を更新した後、`findMissedNotes(track.notes, judged, audioTime)` の各ノーツを Miss として `judged` に追加し、そのレーンの `results` を更新する

### 7. 入力ボタン（`src/scenes/play/LaneButtons.svelte`、追加）
見た目のみのコンポーネントとする（押下の受け付けは Play が行う）。

- props: `{ pressed: boolean[] }`
- 原点: 判定バーの中央（投影の基準が判定バーのため）。Lanes と同じ例外である旨をコメントで明示する
- 押下中のレーンは、判定バーより下のレーンの部分（`project(x0, 0)`・`project(x1, 0)`・`project(x1, LANE_BOTTOM_DEPTH)`・`project(x0, LANE_BOTTOM_DEPTH)` の台形）を塗る
  - 塗りはレーンの境界線と同じネオン調の青（`#4fc3ff`）で、判定バー側を不透明度 0.5、下端側を 0 とする縦のグラデーション（判定バーが光っているように見せる）
  - 押下していないときは何も描かない（レーン・境界線は Lanes が描く）
- キーの割り当ての表示: 各レーンの押下範囲の、判定バーと Scene の下端の中間（y = 576）に `A` / `S` / `D` / `F` / `G` を白字・不透明度 0.4 で表示する
  - Title の説明文と同じく、`(hover: hover) and (pointer: fine)` のときのみ表示する（`docs/spec/title.md`「説明文の表示条件」）
  - 文字の x は、両端の文字（A・G）を押下範囲の中央より Scene の端に 16 寄せ（Scene の端から 20）、文字の間隔を均等（80）にする（両端のレーンは画面外にはみ出すため、レーンの中央ではなく押下範囲を基準にする）
- 値は仮置きとし、スクリーンショットで確認して調整する

### 8. 判定の結果の表示（`src/scenes/play/JudgementResults.svelte`、追加）
- props: `{ audioTime: number; results: (JudgementResult | undefined)[] }`
- 原点: 判定バーの中央（他のレーン上の要素と揃えるため）
- 各レーンの最新の結果を、判定から 500ms の間（`audioTime - result.audioTime < 500`）表示する
  - 同じレーンで続けて判定した場合は、新しい結果に置き換える（表示時間も新しい結果から数え直す）
  - 経過時間を `audioTime` で求め、別のタイマー（`setTimeout` など）を使わない
  - 表示の有無の判定は UI の表示の計算のため、コンポーネントに書く
- 表示位置: x はレーンの中央（判定バーの位置、`-SCENE_WIDTH / 2 + LANE_WIDTH * (i + 0.5)`）、y = -16（判定バーの少し上）
- 文字: `GREAT` / `GOOD` / `BAD` / `MISS`、Orbitron の太字、サイズ 12、横中央揃え
  - 色（仮置き）: Great は桃色（`#ff5fd2`）、Good は青（`#4fc3ff`）、Bad は白（`#fff`）、Miss は灰色（`#888`）。Great・Good は発光させる
- 判定時のエフェクトはこの表示のみとし、表示・非表示の切り替えにアニメーションは付けない（requirements.md）

### 9. Play での配置
- 重なり順: 背景 → レーン → 入力ボタン → 小節線 → 判定バー → ノーツ → 判定の結果
  - 入力ボタンの光は判定バーより下のレーン面の表現のため、レーンの直上に置く
  - 判定の結果は、ノーツに隠れないよう最前面に置く
- Notes には `track.notes` の代わりに `visibleNotes` を渡す
- いずれも `translate(CENTER_X JUDGEMENT_BAR_Y)` で配置する。JudgementResults は `audioTime` が定義されている間のみ表示する

## ファイル配置
```
src/
  types.ts                   # 変更: Judgement を追加
  scenes/
    Play.svelte              # 変更: 入力の受け付け・判定の状態・LaneButtons / JudgementResults の配置
    play/
      judgementWindow.ts     # 追加: GREAT_WINDOW / GOOD_WINDOW / BAD_WINDOW
      judge.ts               # 追加
      findTargetNote.ts      # 追加
      findMissedNotes.ts     # 追加
      laneAtPoint.ts         # 追加
      LaneButtons.svelte     # 追加
      JudgementResults.svelte # 追加
tests/scenes/play/
  judge.test.ts              # 追加
  findTargetNote.test.ts     # 追加
  findMissedNotes.test.ts    # 追加
  laneAtPoint.test.ts        # 追加
```

- テストの観点
  - `judge`: 各閾値の境界（ちょうど・超える）、早押し・遅押しの対称性、範囲外で undefined
  - `findTargetNote`: 他のレーンのノーツを選ばない、判定済みを選ばない、範囲内で最も早いノーツを選ぶ、昇順でない譜面でも正しく選ぶ、範囲外なら undefined
  - `findMissedNotes`: 範囲を過ぎたノーツのみ返す（境界ちょうどは含めない）、判定済みを含めない、譜面の順を保つ
  - `laneAtPoint`: 各レーンの境界、左右端、判定バーより上・Scene の外で undefined
- Play.svelte は入力の処理が増えるが、300 行以内に収まる想定。超える場合は入力の受け付けの分割を notes.md に記録して検討する
- svg の `onpointerdown` について、lint（a11y）の指摘が出た場合は、キーボードでの代替操作（a〜g キー）があることを理由に `biome-ignore` を付ける（`docs/coding-guidelines.md`「lint のルールの無効化」）

## ドキュメント
- Workflow 7 で `docs/spec/play.md` に反映する内容（実装確認後、ユーザの指示により行う）
  - 冒頭の現状説明、表示要素（入力ボタン・判定の結果）と重なり順
  - 入力（キー割り当て・押下範囲・同時押し）と判定（範囲・対象のノーツの選び方・Miss・判定後のノーツの表示）
- glossary への「判定(judgement)」の追加を提案する（`Judgement` 型としてソースコードに現れるため）。追加の判断はユーザが行う
- architecture / ADR の更新は不要と考える

## 確認方法
- `npm run test` で追加したテストが通ること
- ブラウザ（開発時）で以下を確認する
  - a / s / d / f / g キー、押下範囲のクリックで、押下中のレーンが光ること
  - タイミングを合わせて押すと判定の結果がレーンの判定バーの上に表示され、ノーツが消えること
  - 押さなかったノーツが Miss と表示され、ノーツはそのまま下端まで流れること
  - 判定の範囲外での押下（空押し）で何も起きないこと
  - 複数のキーの同時押しで、それぞれのレーンが光ること
- 主要な画面サイズ（360×640、390×844、844×390、1280×720）のスクリーンショットを取得・確認する
  - 押下中・判定の結果の表示中の状態を撮る
- Health Check（C1〜C6、task scope）を実行する
