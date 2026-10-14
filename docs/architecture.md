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
