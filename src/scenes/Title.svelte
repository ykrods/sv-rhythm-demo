<script lang="ts">
  import { SCENE_WIDTH, SCENE_HEIGHT } from '../lib/scene';
</script>

<svg viewBox="0 0 {SCENE_WIDTH} {SCENE_HEIGHT}">
  <title>Scene: Title</title>
  <rect width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="#1d2b53" />
  <rect
    x="2"
    y="2"
    width={SCENE_WIDTH - 4}
    height={SCENE_HEIGHT - 4}
    fill="none"
    stroke="#fff"
    stroke-width="4"
  />
  <text
    x={SCENE_WIDTH / 2}
    y={SCENE_HEIGHT / 2}
    fill="#fff"
    font-size="32"
    text-anchor="middle"
    dominant-baseline="middle"
  >
    Title
  </text>
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
