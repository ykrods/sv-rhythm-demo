<script lang="ts">
  import { fade } from 'svelte/transition';
  import Title from './scenes/Title.svelte';
  import Play from './scenes/Play.svelte';
  import type { Track } from './types';

  let scene: 'title' | 'play' = $state('title');
  // AudioContext などを深いリアクティブにする必要はないため $state.raw とする
  let track: Track | undefined = $state.raw();

  function handleStart(startedTrack: Track) {
    track = startedTrack;
    scene = 'play';
  }
</script>

<div class="stage">
  {#if scene === 'title'}
    <div class="screen" transition:fade>
      <Title onstart={handleStart} />
    </div>
  {:else if scene === 'play' && track}
    <div class="screen" transition:fade>
      <Play {track} />
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

  /* フェード中は前後の Scene が同時に存在するため、Stage いっぱいに重ねる */
  .screen {
    position: absolute;
    inset: 0;
  }
</style>
