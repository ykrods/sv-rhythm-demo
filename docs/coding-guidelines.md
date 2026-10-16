# coding guidelines
lint（`npm run lint`）で表現できないコーディング規約。
lint のルールは `biome.json`、設計方針は `docs/architecture.md` を参照する。

## 全般
- TypeScript で書く
  - Svelte コンポーネントは `<script lang="ts">` とし、Svelte 5 の runes（`$state` など）を使う
- コメントは日本語で書く
- import は相対パスで書く

## ファイル配置
- Scene は `src/scenes/`、ゲームロジックは `src/lib/`、テストは `tests/` に置く
  - 詳細は `docs/architecture.md` の「コンポーネント構成」「設計方針」「テスト」を参照する

## 論理座標
- Scene 内の座標・サイズは `src/lib/stage.ts` の `STAGE_WIDTH` / `STAGE_HEIGHT` を基準にし、360 / 640 を直接書かない

## スタイル
- コンポーネント固有のスタイルはコンポーネントの `<style>` に書く
- 全体に関わるスタイルは `src/app.css` に書く

## lint の行数制限を超えた場合の分割方針
- 関数（50 行）: 処理のまとまりごとに関数に切り出す
  - ゲームロジックであれば、`src/lib/` の別ファイルの純粋関数として切り出す
- ファイル（300 行）
  - Svelte コンポーネントは、レーン・ノーツなどの部品ごとに、`<g>` をルートにした子コンポーネントに分ける
  - `src/lib/` は 1 関数 1 ファイルの方針に従って分ける
- lint のルールを無効化（`biome-ignore`）して回避しない
