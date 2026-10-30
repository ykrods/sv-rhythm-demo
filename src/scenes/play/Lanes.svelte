<script lang="ts">
  import { SCENE_HEIGHT, SCENE_WIDTH } from '../../lib/scene';
  import { JUDGEMENT_BAR_Y, LANE_COUNT, LANE_WIDTH } from '../../lib/lane';
  import { project } from '../../lib/project';
  import { depthAtY } from '../../lib/depthAtY';

  // 奥行きのない座標での、レーン全体の左右端の x
  const LEFT = -SCENE_WIDTH / 2;
  const RIGHT = SCENE_WIDTH / 2;

  // レーン上端と下端（Scene の下端）の奥行き
  const TOP_DEPTH = 1;
  const BOTTOM_DEPTH = depthAtY(SCENE_HEIGHT - JUDGEMENT_BAR_Y);

  // 上端からフェードアウトが終わる（不透明になる）までの長さ
  const FADE_LENGTH = SCENE_HEIGHT * 0.15;

  const topY = project(0, TOP_DEPTH).y;

  const backgroundPoints = [
    project(LEFT, TOP_DEPTH),
    project(RIGHT, TOP_DEPTH),
    project(RIGHT, BOTTOM_DEPTH),
    project(LEFT, BOTTOM_DEPTH),
  ]
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  // レーンの両端と間の境界線
  const borders = Array.from({ length: LANE_COUNT + 1 }, (_, i) => {
    const x = LEFT + LANE_WIDTH * i;
    return { top: project(x, TOP_DEPTH), bottom: project(x, BOTTOM_DEPTH) };
  });
</script>

<!-- 例外: 判定バーの中央を原点 (0, 0) として描画する（投影の基準が判定バーのため） -->
<g>
  <defs>
    <filter id="play-lanes-glow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <linearGradient
      id="play-lanes-fade-gradient"
      gradientUnits="userSpaceOnUse"
      x1="0"
      y1={topY}
      x2="0"
      y2={topY + FADE_LENGTH}
    >
      <stop offset="0" stop-color="#fff" stop-opacity="0" />
      <stop offset="1" stop-color="#fff" stop-opacity="1" />
    </linearGradient>
    <mask
      id="play-lanes-fade"
      maskUnits="userSpaceOnUse"
      x={-SCENE_WIDTH}
      y={-JUDGEMENT_BAR_Y}
      width={SCENE_WIDTH * 2}
      height={SCENE_HEIGHT}
    >
      <rect
        x={-SCENE_WIDTH}
        y={-JUDGEMENT_BAR_Y}
        width={SCENE_WIDTH * 2}
        height={SCENE_HEIGHT}
        fill="url(#play-lanes-fade-gradient)"
      />
    </mask>
  </defs>

  <g mask="url(#play-lanes-fade)">
    <polygon points={backgroundPoints} fill="#0a0a2e" fill-opacity="0.6" />
    <g stroke="#4fc3ff" stroke-width="1.5" filter="url(#play-lanes-glow)">
      {#each borders as { top, bottom }, i (i)}
        <line x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} />
      {/each}
    </g>
  </g>
</g>
