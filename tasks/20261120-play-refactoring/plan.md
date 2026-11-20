# plan: play-refactoring

## 方針: 入力処理をクラスにまとめ、svg には `{@attach}` で付ける

Svelte 5.29 で入った attachment（`{@attach}`）を使う（このプロジェクトは 5.57.2）。入力の状態（押下中のレーン）とイベントの登録を `.svelte.ts` のクラス 1 つにまとめ、Play.svelte は `press(lane)` の呼び出しと `pressed` の値だけを受け取る。

## 追加するファイル

### `src/scenes/play/LaneInput.svelte.ts`

```ts
import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { SvelteMap } from 'svelte/reactivity';
import { LANE_COUNT } from './lane';
import { laneAtPoint } from './laneAtPoint';

// レーン 0〜4 に割り当てるキー（event.code）
const LANE_KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'];

/** キー・ポインタの入力を「レーン n が押された」に変換し、押下中のレーンを保持する */
export class LaneInput {
  #keyPressed = $state<boolean[]>(Array(LANE_COUNT).fill(false));
  #pointerLanes = new SvelteMap<number, number>();
  #onpress: (lane: number) => void;

  // レーンごとの押下中かどうか（キーまたはポインタ）
  readonly pressed = $derived(
    this.#keyPressed.map((key, lane) => key || [...this.#pointerLanes.values()].includes(lane)),
  );

  constructor(onpress: (lane: number) => void) {
    this.#onpress = onpress;
  }

  // svg に付ける。外れたとき（Scene の破棄時）にリスナーを解除する
  attach: Attachment<SVGSVGElement> = (svg) => {
    const offs = [
      on(svg, 'pointerdown', (e) => this.#handlePointerdown(svg, e)),
      on(window, 'pointerup', this.#handlePointerup),
      on(window, 'pointercancel', this.#handlePointerup),
      on(window, 'keydown', this.#handleKeydown),
      on(window, 'keyup', this.#handleKeyup),
      on(window, 'blur', () => this.#keyPressed.fill(false)),
    ];
    return () => { for (const off of offs) off(); };
  };

  #handleKeydown = (event: KeyboardEvent) => { /* 現在の handleKeydown の中身。press(lane) → this.#onpress(lane) */ };
  #handleKeyup = (event: KeyboardEvent) => { /* … */ };
  #handlePointerdown(svg: SVGSVGElement, event: PointerEvent) { /* 現在の中身。svg 変数は引数を使う */ }
  #handlePointerup = (event: PointerEvent) => { this.#pointerLanes.delete(event.pointerId); };
}
```

## 変更するファイル

### `src/scenes/Play.svelte`

```svelte
<script lang="ts">
  const input = new LaneInput(press);
  function press(lane: number) { /* 今のまま */ }
</script>

<svg viewBox="0 0 {SCENE_WIDTH} {SCENE_HEIGHT}" {@attach input.attach}>
  …
  <LaneButtons pressed={input.pressed} />
```

## 効果
- Play.svelte から `keyPressed`、`pointerLanes`、各ハンドラ、`<svelte:window>`、`bind:this={svg}` がなくなり、残るのは `press(lane)` という判定の入口だけになる
- svg の構造は変わらないので、描画順やレイヤーに影響しない
- `architecture.md` の「状態を持つ処理はクラスで実装してもよい」「`.ts` はクラスごとにファイルを作成する」に沿う
- DOM に依存するため、テストの対象外のままとする（座標からレーンを求める計算は、すでに `laneAtPoint` に切り出されている）

## 注意点
- `onpointerdown` がテンプレートに書かれなくなるため、Svelte コンパイラの `a11y_no_static_element_interactions` 警告が出なくなり、現在の `svelte-ignore` コメントは不要になる
  - 警告が消えるのはコンパイラから見えなくなっただけで、a11y の懸念が解消されたわけではない。理由のコメントはクラス側に移しておく
  - `docs/coding-guidelines.md` の例にこの svg の書き方が載っており、ドキュメントとずれる
- クラスのフィールドを `$derived` にするため、ファイル名は `.svelte.ts` にする

## ドキュメントの更新

### `docs/coding-guidelines.md`「lint・Svelte コンパイラの警告の無効化」
svg の `onpointerdown` の例は、実装と合わなくなるため削除する。代わりに、attachment で登録するイベントの扱いを追記する。

- 削除: 「例: キー入力で同じ操作ができる場合に、svg 全体でポインタの押下を受ける場合」とそのコード例
- 追記（案）:

  ```md
  - `{@attach}` などでイベントを登録し、Svelte コンパイラの警告の対象にならない場合も、警告に相当する懸念があるときは理由をコメントで書く
    - 例: `src/scenes/play/LaneInput.svelte.ts` で svg 全体でポインタの押下を受ける場合

      ```ts
      // a11y: キー入力（a〜g）で同じ操作ができ、ポインタの操作は補助的な入力手段のため、svg（静的な要素）でポインタの押下を受ける
      on(svg, 'pointerdown', (e) => this.#handlePointerdown(svg, e)),
      ```
  ```
