# coding guidelines
lint（`npm run lint`）で表現できないコーディング規約。
lint のルールは `biome.json`、ファイルの配置規則や設計方針は `docs/architecture.md` を参照する。

## 全般
- TypeScript で書く
  - Svelte コンポーネントは `<script lang="ts">` とし、Svelte 5 の runes（`$state` など）を使う
- コメントは日本語で書く
- import は相対パスで書く

## 共通化
- 関数・定数などの置き場所は `docs/architecture.md`「ソースコードの配置と分割」を参照する

## TypeScript の型
- 型は原則的に `src/types.ts` に記載し、import して利用する
- 例外として、glossary に記載がなく、実装上の都合で必要となるような型は `src/types.ts` 外で定義しても良いものとする

## スタイル
- コンポーネント固有のスタイルはコンポーネントの `<style>` に書く
- 全体に関わるスタイルは `src/app.css` に書く

## Svelte コンポーネント
- `<svg>` を持つ Scene 内の表示要素（レーン・ノーツ・判定バーなど）は、ルート要素を `<g>` などの SVG 要素とした、svg の中身のコンポーネントとして作る
  - 例外: 単純なテキストなど、`<defs>` を持たず再利用もしない要素は、コンポーネントにせず Scene に直接書いてよい（例: Title の説明文「Press SPACE to start」）
- Scene 内での配置は Scene の責務とし、Scene がコンポーネントを `<g transform="translate(...)">` で包んで配置する
  - コンポーネントは座標を props で受け取らず、自身の中心を原点 (0, 0) として描画する。コンポーネント自身のサイズや見た目はコンポーネントが持つ
  - 中心を原点にできない理由があるコンポーネントは、例外として原点の位置をコメントで明示する
- グラデーション・filter などの `<defs>` はコンポーネントごとに持ち、コンポーネント単体で完結させる。id は Scene・コンポーネント名を前置して重複を避ける（例: `title-button-glow`）
- ファイルが lint の行数制限（300 行）を超えた場合は、レーン・ノーツなどの表示内容ごとに、`<g>` をルートにした子コンポーネントに分ける
- コンポーネントの置き場所と、関数に切り出す基準は `docs/architecture.md`「ソースコードの配置と分割」を参照する

## lint の行数制限を超えた場合の分割方針
- 関数・`.ts` ファイルの分割は `docs/architecture.md`「ソースコードの配置と分割」、Svelte コンポーネントの分割は「Svelte コンポーネント」を参照する
- 行数制限を lint のルールを無効化（`biome-ignore`）によって回避しない

## lint・Svelte コンパイラの警告の無効化
lint（`npm run lint`）のルールと、svelte-check（`npm run check`）が出す Svelte コンパイラの警告（a11y など）を対象とする。

- 原則として lint のルール・Svelte コンパイラの警告に従い、`biome-ignore`・`svelte-ignore` で回避しない
- 例外: 実装上の理由があってルール・警告に反する場合に限り、`biome-ignore`・`svelte-ignore` を使ってよい
  - 対象のルール・警告を限定し、ルール・警告に反する理由を以下の形で書く
    - lint: `biome-ignore <ルール名>: <理由>`
    - Svelte コンパイラ: `svelte-ignore <警告のコード>: <理由>`
  - 例: SVG の中では `<button>` を使えないため、SVG の要素に `role="button"` を付ける場合

    ```svelte
    <!-- biome-ignore lint/a11y/useSemanticElements: SVG の中では <button> を使えないため -->
    <g role="button" tabindex="0" ...>
    ```

- `{@attach}` などでイベントを登録し、Svelte コンパイラの警告の対象にならない場合も、警告に相当する懸念があるときは理由をコメントで書く
  - 例: キー入力で同じ操作ができる場合に、svg 全体でポインタの押下を受ける場合（`src/scenes/play/LaneInput.svelte.ts`）

    ```ts
    // アクセシビリティを考慮すると html のボタン要素などを利用することが望ましいが、
    // 今回はキー入力（a〜g）で同じ操作ができ、ポインタの操作は補助的な入力手段のため良いものとする
    on(svg, 'pointerdown', (e) => this.#handlePointerdown(svg, e as PointerEvent)),
    ```
