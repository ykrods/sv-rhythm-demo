<script lang="ts">
  import { STAGE_WIDTH, STAGE_HEIGHT } from '../lib/stage';
</script>

<svg viewBox="0 0 {STAGE_WIDTH} {STAGE_HEIGHT}">
  <title>Scene: Play</title>
  <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#3a1d53" />
  <rect
    x="2"
    y="2"
    width={STAGE_WIDTH - 4}
    height={STAGE_HEIGHT - 4}
    fill="none"
    stroke="#fff"
    stroke-width="4"
  />
  <text
    x={STAGE_WIDTH / 2}
    y={STAGE_HEIGHT / 2}
    fill="#fff"
    font-size="32"
    text-anchor="middle"
    dominant-baseline="middle"
  >
    Play
  </text>
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
