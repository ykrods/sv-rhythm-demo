# architecture
## 基本
- svelte を用いたブラウザゲーム
- 習作なので過度にこだわった作りにはしない

## コンポーネント構成

```
App.svelte
 └ Stage（div.stage。9:16 で中央配置）
    ├ scenes/Title.svelte  … <svg viewBox="0 0 360 640">
    └ scenes/Play.svelte   … <svg viewBox="0 0 360 640">
```

- Stage は App.svelte 内に直接記述する（独立したコンポーネントにはしない）
- App は現在の Scene を表す状態 `scene: 'title' | 'play'` を持ち、`{#if}` で表示する Scene を切り替える
- 論理座標のサイズは `src/lib/stage.ts` の定数 `STAGE_WIDTH` / `STAGE_HEIGHT` で定義し、各 Scene の viewBox はこの定数から組み立てる

### Stage と Scene の役割分担
- 9:16 の比率・中央配置は Stage（HTML / CSS）が担い、Scene は Stage いっぱいに要素を広げるだけにする
- `<svg>` 要素は Stage ではなく各 Scene コンポーネントが持つ
  - 理由: Scene ごとに HTML と SVG を選択できるようにするため（例: 開始画面のボタンやリザルトのポップアップを HTML で作る余地を残す）
- Scene 内の部品（レーン・ノーツ・判定バーなど）は、ルート要素を `<g>` などの SVG 要素とした、svg の中身のコンポーネントとして作る

## 設計方針
### ゲームロジックの分離
- ゲームロジック（ノーツの進行、判定、スコア計算など）はコンポーネントから分離し、`src/lib/` に置く
- ゲームロジックは、時刻や入力などを引数で受け取り結果を返す純粋関数として切り出す
  - 関数の中で `performance.now()` などの現在時刻や、DOM・コンポーネントの状態を直接参照しない
  - 例: `judge(noteTime: number, inputTime: number): Judgement`
- 関数ごとにファイルを作成する（例: `src/lib/judge.ts`）
- コンポーネント側は、requestAnimationFrame や入力イベントから時刻・入力を集めてゲームロジックを呼び出し、結果を描画することに専念する

## テスト
- テストには Vitest を使い、`npm run test` で実行する
- テストの対象は `src/lib/` の純粋なロジックとする
  - コンポーネントテスト・E2E テストは行わない
- テストファイルは `tests/` 以下に、テスト対象とパスを揃えて置く
  - 例: `src/lib/judge.ts` のテストは `tests/lib/judge.test.ts`
- テストファイルも型チェック（`npm run check`）と lint（`npm run lint`）の対象とする
