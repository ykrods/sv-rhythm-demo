<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import Title from './scenes/Title.svelte';
  import Play from './scenes/Play.svelte';
  import type { SceneName } from './types';

  // ワイプの時間（ms）
  const WIPE_DURATION = 600;

  // 現在の Scene
  let scene = $state<SceneName>('title');
  // ワイプで表示中の次の Scene。遷移中でなければ null
  let nextScene = $state<SceneName | null>(null);

  // 次の Scene を右端から左へ徐々に表示する
  function wipeFromRight(_node: Element, { duration = WIPE_DURATION } = {}) {
    return {
      duration,
      easing: cubicOut,
      css: (t: number) => `clip-path: inset(0 0 0 ${(1 - t) * 100}%);`,
    };
  }

  function moveTo(target: SceneName) {
    // 現在の Scene への遷移と、遷移中の再遷移は無視する
    if (target === scene || nextScene !== null) return;
    nextScene = target;
  }

  // ワイプの終了時に次の Scene を現在の Scene にし、前の Scene を取り除く
  function finishWipe() {
    if (nextScene === null) return;
    scene = nextScene;
    nextScene = null;
  }
</script>

<div class="stage">
  {#if scene === 'title' || nextScene === 'title'}
    <div
      class="screen"
      class:incoming={nextScene === 'title'}
      in:wipeFromRight
      onintroend={finishWipe}
    >
      <Title onstart={() => moveTo('play')} />
    </div>
  {/if}
  {#if scene === 'play' || nextScene === 'play'}
    <div
      class="screen"
      class:incoming={nextScene === 'play'}
      in:wipeFromRight
      onintroend={finishWipe}
    >
      <Play />
    </div>
  {/if}
</div>

<style>
  .stage {
    position: relative;
    overflow: hidden;
    width: min(100dvw, 100dvh * 9 / 16);
    aspect-ratio: 9 / 16;
    background: #000;
    touch-action: none;
  }

  .screen {
    position: absolute;
    inset: 0;
  }

  .incoming {
    z-index: 1;
  }
</style>
