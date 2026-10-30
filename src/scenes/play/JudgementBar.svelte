<script lang="ts">
  import { SCENE_WIDTH } from '../../lib/scene';

  const HALF_WIDTH = SCENE_WIDTH / 2;
  // 発光がはみ出す分の余白
  const GLOW_MARGIN = 20;
</script>

<!-- 判定バーの中心を原点 (0, 0) として描画する -->
<g>
  <defs>
    <!-- 高さ 0 の線は bbox 基準の filter 領域が 0 になるため、userSpaceOnUse で領域を指定する -->
    <filter
      id="play-judgement-bar-glow"
      filterUnits="userSpaceOnUse"
      x={-HALF_WIDTH - GLOW_MARGIN}
      y={-GLOW_MARGIN}
      width={SCENE_WIDTH + GLOW_MARGIN * 2}
      height={GLOW_MARGIN * 2}
    >
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <line
    x1={-HALF_WIDTH}
    y1="0"
    x2={HALF_WIDTH}
    y2="0"
    stroke="#4fc3ff"
    stroke-width="3"
    filter="url(#play-judgement-bar-glow)"
  />
</g>
