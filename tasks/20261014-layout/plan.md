# plan: layout

## 概要
9:16 固定のゲーム領域（Stage）を画面中央に配置し、その中に開始画面（Title）とゲーム画面（Play）を仮の SVG で表示する。
画面遷移は本タスクの対象外のため、App が保持する現在の画面を表す状態の初期値で表示する画面を切り替える。

## 追加・変更されるモデル（用語・概念）
- **Stage**: 9:16 で固定されたゲーム領域。HTML 要素（div）で構成し、画面サイズに応じて拡大縮小される
- **Scene**: Stage 上に表示される画面の単位。本プロジェクトでは以下の 2 つ
  - **Title**: 開始画面
  - **Play**: ゲーム画面
- **論理座標**: Scene 内の SVG で用いる座標系。viewBox `0 0 360 640` で、実際の画面サイズに依存しない

## コンポーネント構成

```
App.svelte
 └ Stage（div.stage。9:16 で中央配置）
    ├ scenes/Title.svelte  … <svg viewBox="0 0 360 640">
    └ scenes/Play.svelte   … <svg viewBox="0 0 360 640">
```

- `<svg>` 要素は各 Scene コンポーネントが持つ
  - 9:16 の比率・中央配置は Stage（HTML / CSS）が担い、Scene は Stage いっぱいに svg を広げるだけにする
  - Scene ごとに HTML と SVG を選択できるようにするため（例: 開始画面のボタンやリザルトのポップアップを HTML で作る余地を残す）
- Scene 内の表示内容（後続タスクで追加するレーン・ノーツ・判定バーなど）は、ルート要素を `<g>` などの SVG 要素とした svg の中身のコンポーネントとして作る
  - 本タスクではコンポーネントコンポーネントは作成しない（方針のみ）
- Stage は App.svelte 内に直接記述する（独立したコンポーネントにはしない）

## 実装内容

### 論理座標の定数
- `src/lib/stage.ts` を新規作成し、`STAGE_WIDTH = 360`、`STAGE_HEIGHT = 640` を定義する
- 各 Scene の viewBox はこの定数から組み立てる

### Stage のレイアウト（`src/App.svelte`, `src/app.css`）
- `html`, `body`, `#app` を表示領域いっぱい（高さは `100dvh`）にし、Stage を上下左右中央に配置する
- Stage のサイズ
  - `width: min(100dvw, 100dvh * 9 / 16)`、`aspect-ratio: 9 / 16`
  - スマホ（縦）では幅いっぱい、PC・横向きでは高さいっぱいの縦長領域になる
  - 9:16 より縦長な端末では幅いっぱいになり、上下に余白が出る（許容）
- Stage の外側（余白部分）と Stage 内の背景色を分け、領域の境界がわかるようにする

### タッチ操作の抑止
- Stage に `touch-action: none` を指定し、スクロール・ピンチ拡大・ダブルタップ拡大を抑止する
- `body` に `overflow: hidden`、`overscroll-behavior: none` を指定し、ページのスクロールやバウンスを抑止する
- `user-select: none`（`-webkit-user-select` 含む）、`-webkit-touch-callout: none` でテキスト選択・長押しメニューを抑止する
- 補足: iOS Safari は viewport の `user-scalable=no` を無視するため、拡大の抑止は `touch-action` に頼る

### Scene（`src/scenes/Title.svelte`, `src/scenes/Play.svelte`）
- 既存の空ファイル `src/scenes/Title.svelte`, `src/scenes/Play.svelte` を利用する
- それぞれ `<svg viewBox="0 0 360 640">` を Stage いっぱい（`width` / `height` 100%、`display: block`）に表示する
- 仮の表示内容
  - 全面を覆う背景の rect（Scene ごとに色を変える）
  - 中央に Scene 名（"Title" / "Play"）のテキスト
  - 論理座標が正しく効いていることを確認するため、viewBox の外周に沿った枠線

### 表示する Scene の選択（`src/App.svelte`）
- App に現在の Scene を表す状態 `scene: 'title' | 'play'` を持たせ、`{#if}` で表示する Scene を切り替える
- 初期値は `'title'`。本タスクでは遷移操作を実装しないため、Play の表示確認は初期値を書き換えて行う
- 遷移操作（ボタン・キーボード・タップ）は後続タスクで実装する

## 変更対象ファイル
- `src/App.svelte`（変更）
- `src/app.css`（変更）
- `src/lib/stage.ts`（新規）
- `src/scenes/Title.svelte`（既存の空ファイルに実装）
- `src/scenes/Play.svelte`（既存の空ファイルに実装）

`src/old/`, `src/Scratch.svelte` は変更しない。

## 確認方法
- `npm run check` / `npm run build` が通る
- `npm run dev` でブラウザの開発者ツールを使い、以下を目視確認する
  - スマホ（縦）サイズ: 幅いっぱいに表示される
  - PC・横向き: 縦長の領域が中央に表示される
  - 9:16 より縦長なサイズ: 上下に余白が出る
  - 枠線が欠けずに表示される（viewBox が Stage に収まっている）
  - Play の表示（初期値を書き換えて確認）

## 作業完了後のドキュメント反映（Workflow 7 の想定）
- `docs/glossary.md`: Stage / Scene / Title / Play / 論理座標 を追加
- `docs/architecture.md`: コンポーネント構成と、svg 要素を Scene が持つ方針を追加
- `docs/spec/layout.md`（新規）: viewBox 360 × 640、Stage の配置ルール、タッチ操作の抑止
