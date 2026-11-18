# plan: barline

## 概要
`Track` に `bpm` と `beatsPerBar` を持たせ、1 小節の時間を計算で求める。leadIn は 1 小節の時間とし、`Track.leadIn` を削除する。
Play では、`audioTime` から表示範囲内の小節の頭の時刻を求め、各時刻を奥行きに変換し、既存の透視投影（`project`）で座標にして小節線を描く。

- 時刻 → 奥行きの変換は、小節の頭の時刻と `audioTime` の差に比例させる（奥行きについて等速）。投影により、奥ほどゆっくり・間隔が詰まって見える
- 流れる速度は「レーン上端から判定バーまでの所要時間」の定数で決め、後続のノーツと共有する

## 追加・変更されるモデル（用語・概念）
- 小節線（barline）: 小節の頭の時刻を示す、レーン上を流れる横線。判定に関わらない背景の要素（用語集には追加しない）
- 1 小節の時間（bar duration）: `60000 / bpm * beatsPerBar`（ms）。仮の音源（120 BPM・4 拍子）では 2000ms
  - 1 小節目の頭は音声の先頭（0ms）とし、n 小節目（0 始まり）の頭は `n * 1 小節の時間`
- leadIn: 1 小節の時間とする（変更）。`Track` には持たせず、`bpm` と `beatsPerBar` から求める
- 所要時間（travel time）: 流れる要素がレーン上端（奥行き 1）から判定バー（奥行き 0）に達するまでの時間（ms）。仮置きで 1500ms
  - 小節線と後続のノーツで共有する

### Track の型
requirements.md のとおり `src/types.ts` の `Track` を変更する。

```typescript
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
  /** 1 小節の拍数 */
  beatsPerBar: number;
};
```

## 処理の詳細
### 1. 1 小節の時間と leadIn（`src/lib/`）
Title（再生の予約）と Play（`audioTime` の計算・小節線）の両方で使うため、`src/lib/` に置く（`docs/architecture.md`「配置」）。

```typescript
// src/lib/barDuration.ts
/** 1 小節の時間(ms) */
export function barDuration(bpm: number, beatsPerBar: number): number {
  return (60000 / bpm) * beatsPerBar;
}

// src/lib/leadIn.ts
/** 再生のディレイ時間(ms)。1 小節の時間とする */
export function leadIn({ bpm, beatsPerBar }: Pick<Track, 'bpm' | 'beatsPerBar'>): number {
  return barDuration(bpm, beatsPerBar);
}
```

- 「leadIn = 1 小節の時間」という仕様を 1 か所にまとめるため、`leadIn` を `barDuration` と別の関数にする
  - Title では `Track` の作成前に leadIn が必要なため、引数は `Track` 全体でなく `Pick<Track, 'bpm' | 'beatsPerBar'>` とする（新しい型は追加しない）

### 2. 再生の予約（Title）
- `startTrack` の第 2 引数を `leadIn: number` から `tempo: Pick<Track, 'bpm' | 'beatsPerBar'>` に変更する
  - 内部で `leadIn(tempo)` を求めて `source.start(leadIn / 1000)` で予約し、`{ audioContext, source, ...tempo }` を `Track` として返す
- Title の定数 `LEAD_IN` を削除し、仮の音源の情報を定数で持つ

  ```typescript
  // 仮の音源 sample.mp3 のテンポと拍子。1 小節目の頭は音声の先頭（0ms）
  const SAMPLE_TEMPO = { bpm: 120, beatsPerBar: 4 };
  ```

### 3. 再生位置（Play）
- `toAudioTime(contextTime, leadIn)` の引数は変えず、呼び出しを `toAudioTime(track.audioContext.currentTime, leadIn(track))` に変更する
- 1 小節の時間 `barDuration(track.bpm, track.beatsPerBar)` は Play で `const` として求める（Track は Play の表示中に変わらない）

### 4. 時刻 → 奥行き（`src/scenes/play/`）
```typescript
// src/scenes/play/travel.ts
/** 流れる要素がレーン上端（奥行き 1）から判定バー（奥行き 0）に達するまでの時間(ms)（仮置き） */
export const TRAVEL_TIME = 1500;

// src/scenes/play/depthAtTime.ts
/**
 * 時刻 time に判定バーに達する要素の、再生位置 audioTime での奥行き
 * 判定バーの前は正、判定バーを過ぎると負になる
 */
export function depthAtTime(time: number, audioTime: number): number {
  return (time - audioTime) / TRAVEL_TIME;
}
```

- 奥行きを時刻に対して線形にする理由
  - `project` の奥行きを等速で動かすと、奥行きのある面上を等速で進むように見える（奥ほどゆっくり、間隔が詰まって見える）。requirements.md「奥ほど幅が狭く、間隔が詰まって見える」を投影だけで満たせる
  - 後続のノーツも同じ関数で位置を決めれば、小節線とノーツの位置関係が一致する
- 逆に、表示範囲（奥行き）から時刻の範囲を求めるのは `time = audioTime + depth * TRAVEL_TIME` で、Barlines 内で計算する（式が自明なため関数にしない）
- 所要時間 1500ms は仮置き。leadIn（2000ms）より短いため、曲の先頭の小節線は Play の表示から 500ms 後（フェードの 400ms の後）にレーン上端に現れる。見た目を確認して調整する
- Play 固有のため `src/scenes/play/` に置く。ノーツも Play 固有のため共有に支障はない

### 5. 表示範囲内の小節の頭の時刻（`src/scenes/play/`）
```typescript
// src/scenes/play/barTimesBetween.ts
/**
 * from 以上 to 以下にある小節の頭の時刻(ms)を昇順で返す
 * 1 小節目の頭を 0ms とし、0ms より前の小節は含めない
 */
export function barTimesBetween(from: number, to: number, barDuration: number): number[]
```

- n の範囲は `max(0, ceil(from / barDuration))` 〜 `floor(to / barDuration)`
  - 時刻は `n * barDuration` で求める（加算を繰り返さず誤差を積まない）
- 0ms より前（leadIn の間に相当する、曲の先頭より前の小節）の小節線は表示しない
  - 理由: 音声のない区間に小節線を流すと、曲の先頭と区切りの関係が分かりにくくなるため。1 小節目の頭の小節線は表示する
- 曲の終了は扱わない（`Track` は曲の長さを持たず、`audioTime` は曲の終了後も増え続ける）。曲の終了後も小節線は流れ続ける
  - `docs/spec/play.md`「曲の終了に対する処理は行わない」と一致する。リザルトのタスクで見直す

### 6. 小節線のコンポーネント（`src/scenes/play/Barlines.svelte`）
表示範囲内のすべての小節線を描くコンポーネントとする。

- props: `{ audioTime: number; barDuration: number }`
  - 時刻を受け取って自身で投影するため、座標は props で受け取らない（`docs/coding-guidelines.md`「Svelte コンポーネント」）
- 原点: Lanes と同じく、判定バーの中央を原点とする（投影の基準が判定バーのため）。例外である旨をコメントで明示する
- Play では Lanes と判定バーの間に、同じ `translate(CENTER_X JUDGEMENT_BAR_Y)` で配置する（重なり順: レーン → 小節線 → 判定バー）
  - Play の `audioTime` は最初のフレームまで `undefined` のため、定義されている間のみ表示する
- 処理
  1. 表示範囲の奥行き: 上端 `1`、下端 `depthAtY(SCENE_HEIGHT - JUDGEMENT_BAR_Y)`（Lanes と同じ）
  2. `barTimesBetween(audioTime + BOTTOM_DEPTH * TRAVEL_TIME, audioTime + TOP_DEPTH * TRAVEL_TIME, barDuration)` で時刻を得る
  3. 各時刻を `depthAtTime` で奥行きにし、`project(-SCENE_WIDTH / 2, depth)`・`project(SCENE_WIDTH / 2, depth)` を両端とする `<line>` を描く
  4. `$derived` で求め、`{#each}` のキーは時刻とする
- 見た目（背景の要素として判定バー・ノーツより目立たせない）
  - 色はネオン調の青（`#4fc3ff`）で不透明度 0.4、線幅 1。発光（filter）はかけない
  - 線幅は奥でも一定とする（レーンの境界線と同じ）
  - 値は仮置きとし、スクリーンショットで確認して調整する
- 上端のフェードアウト
  - Lanes と同じ範囲・同じグラデーションの mask を Barlines 内に持つ（id: `play-barlines-fade`）。`<defs>` はコンポーネントごとに持つ規約のため（`docs/coding-guidelines.md`「Svelte コンポーネント」）
  - フェードの長さ（`SCENE_HEIGHT * 0.15`）は Lanes 内の定数 `FADE_LENGTH` を `src/scenes/play/lane.ts` の `LANE_FADE_LENGTH` に移し、Lanes と Barlines で共有する（2 ファイルで使うため。`docs/architecture.md`「配置」）

## ファイル配置
```
src/
  types.ts                       # 変更: Track から leadIn を削除し、bpm / beatsPerBar を追加
  lib/
    barDuration.ts               # 追加
    leadIn.ts                    # 追加
  scenes/
    Title.svelte                 # 変更: LEAD_IN を削除し、SAMPLE_TEMPO を startTrack に渡す
    Play.svelte                  # 変更: leadIn(track) で audioTime を求め、Barlines を配置する
    title/startTrack.ts          # 変更: 引数を tempo に変更
    play/
      Barlines.svelte            # 追加
      Lanes.svelte               # 変更: FADE_LENGTH を lane.ts の LANE_FADE_LENGTH に置き換える
      lane.ts                    # 変更: LANE_FADE_LENGTH を追加
      travel.ts                  # 追加: TRAVEL_TIME
      depthAtTime.ts             # 追加
      barTimesBetween.ts         # 追加
tests/
  lib/barDuration.test.ts        # 追加
  scenes/play/depthAtTime.test.ts      # 追加
  scenes/play/barTimesBetween.test.ts  # 追加
```

- `leadIn` は `barDuration` を呼ぶだけで自明なため、テストしない（`docs/architecture.md`「テスト」）
- `toAudioTime` とそのテストは変更しない
- テストの観点
  - `barDuration`: 120 BPM・4 拍子で 2000ms、拍子・BPM の変化に比例・反比例する
  - `depthAtTime`: `time = audioTime` で 0、`TRAVEL_TIME` 前に 1、判定バーを過ぎると負
  - `barTimesBetween`: 境界を含む、0ms より前を含まない、範囲内に小節の頭がなければ空、範囲が複数小節にまたがる

## ドキュメント
- Workflow 7 で `docs/spec/` に反映する内容（実装確認後、ユーザの指示により行う）
  - `docs/spec/play.md`: 小節線の表示要素・流れ方（所要時間・奥行きの対応・表示範囲）、重なり順、leadIn の説明
  - `docs/spec/title.md`: leadIn（2000ms → 1 小節の時間）の説明
- architecture / glossary / ADR の更新は不要と考える

## 確認方法
- `npm run test` で追加したテストが通ること
- ブラウザ（開発時）で以下を確認する
  - 小節線が上端でフェードインし、奥ほど間隔が詰まって下に流れ、画面の下端で消えること
  - `audioTime` の表示が 2000ms の倍数のときに、小節線が判定バーの位置にあること
  - 曲の開始（`audioTime` = 0）より前の小節線が表示されないこと
  - leadIn が従来どおり 2000ms であること（スタート操作から約 2 秒後に音が鳴る）
- 主要な画面サイズ（360×640、390×844、844×390、1280×720）のスクリーンショットを取得・確認する
  - 小節線が流れている状態を撮るため、スタート操作の後、数秒待ってから取得する
- Health Check（C1〜C6、task scope）を実行する
