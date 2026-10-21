# coding guidelines
lint（`npm run lint`）で表現できないコーディング規約。
lint のルールは `biome.json`、ファイルの配置規則や設計方針は `docs/architecture.md` を参照する。

## 全般
- TypeScript で書く
  - Svelte コンポーネントは `<script lang="ts">` とし、Svelte 5 の runes（`$state` など）を使う
- コメントは日本語で書く
- import は相対パスで書く

## 共通化
- 複数のファイルから参照される定数は `src/lib/` に置く（例: `src/lib/scene.ts` の `SCENE_WIDTH` / `SCENE_HEIGHT`）
  - 1 つのファイルでしか使わない定数は、そのファイル内に定義する

## スタイル
- コンポーネント固有のスタイルはコンポーネントの `<style>` に書く
- 全体に関わるスタイルは `src/app.css` に書く

## lint の行数制限を超えた場合の分割方針
- 関数（50 行）: 処理のまとまりごとに関数に切り出す
  - ゲームロジックであれば、`src/lib/` の別ファイルの純粋関数として切り出す
- ファイル（300 行）
  - Svelte コンポーネントは、レーン・ノーツなどの表示内容ごとに、`<g>` をルートにした子コンポーネントに分ける
  - `src/lib/` は 1 関数(またはクラス) 1 ファイルの方針に従って分ける。定数などは概念的なまとまりごとにファイルを分ける。
- 行数制限を lint のルールを無効化（`biome-ignore`）によって回避しない

## lint のルールの無効化
- 原則として lint のルールに従い、`biome-ignore` で回避しない
- 例外: 実装上の理由があってルールに反する場合に限り、`biome-ignore` を使ってよい
  - 対象のルールを限定し、`biome-ignore <ルール名>: <理由>` の形でルールに反する理由を書く
  - 例: SVG の中では `<button>` を使えないため、SVG の要素に `role="button"` を付ける場合

    ```svelte
    <!-- biome-ignore lint/a11y/useSemanticElements: SVG の中では <button> を使えないため -->
    <g role="button" tabindex="0" ...>
    ```
