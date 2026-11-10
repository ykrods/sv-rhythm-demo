# requirements: scene-transition

## 目的
scene の切り替え時のトランジションを実装する

## タスク種別
設計・実装

## 要件
演出効果はワイプを用いる（右から左へ徐々に次の画面に切り替わる）

- 詳細は以下の実装上の条件を参照
- audio-playback は後で対応するため、別途そちらの requirements を修正する

## 実装上の条件
- svelte の custom transition を用いる

基本的なロジックは以下の実装例のまま実装する

```svelte
<script lang="ts">
  import { cubicOut, expoOut } from "svelte/easing";

  import Top from "./Top.svelte";
  import Sub from "./Sub.svelte";

  type View = "top" | "sub";

  let view = $state<View>("top");
  let nextView = $state<View | null>(null);

  function wipeFromRight(_node: Element, { duration = 600 } = {}) {
    return {
      duration,
//      easing: expoOut,
      easing: cubicOut,
      css: (t: number) => `clip-path: inset(0 0 0 ${(1 - t) * 100}%);`,
    };
  }

  function moveTo(target: View) {
    // Ignore additional navigation while the incoming screen is wiping in.
    if (target === view || nextView !== null) return;

    nextView = target;
  }

  function finishWipe() {
    if (nextView === null) return;

    view = nextView;
    nextView = null;
  }
</script>

<main class="stage">
  <section class="screen">
    {#if view === "top" || nextView === "top" }
      <section
        class="screen"
        class:incoming={nextView === "top"}
        in:wipeFromRight={{ duration: 600 }}
        onintroend={finishWipe}
      >
        <Top onMove={() => moveTo("sub")} />
      </section>
    {/if}
    {#if view === "sub" || nextView === "sub" }
      <section
        class="screen"
        class:incoming={nextView === "sub"}
        in:wipeFromRight={{ duration: 600 }}
        onintroend={finishWipe}
      >
        <Sub onMove={() => moveTo("top")} />
      </section>
    {/if}
  </section>
</main>

<style>
  .stage {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  .screen {
    position: absolute;
    inset: 0;
  }

  .incoming {
    z-index: 1;
  }
</style>
```

## 検証
- Health Check（C1〜C6、task scope）を実行する。
- 画面・UI を変更する場合は、主要な画面サイズのスクリーンショットを取得・確認する。

## 対象外
- 現状タイトル画面からプレイ画面への遷移しか存在していないため、これ以外の遷移は別対応とする

## ドキュメント反映
- 実装確認後、ユーザの指示により `docs/spec/` に今回の仕様を反映する。
