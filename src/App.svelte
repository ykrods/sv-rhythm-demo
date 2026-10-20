<script lang="ts">
  import Title from './scenes/Title.svelte';
  import Play from './scenes/Play.svelte';

  let scene: 'title' | 'play' = $state('title');
</script>

<div class="stage">
  {#if scene === 'title'}
    <Title onstart={() => (scene = 'play')} />
  {:else if scene === 'play'}
    <Play />
  {/if}
</div>

<style>
  .stage {
    width: min(100dvw, 100dvh * 9 / 16);
    aspect-ratio: 9 / 16;
    background: #000;
    touch-action: none;
  }
</style>
