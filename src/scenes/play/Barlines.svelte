<script lang="ts">
  import { SCENE_HEIGHT, SCENE_WIDTH } from '../../lib/scene';
  import { JUDGEMENT_BAR_Y, LANE_FADE_LENGTH } from './lane';
  import { project } from './project';
  import { depthAtY } from './depthAtY';
  import { depthAtTime } from './depthAtTime';
  import { barTimesBetween } from './barTimesBetween';
  import { TRAVEL_TIME } from './travel';

  let { audioTime, barDuration }: { audioTime: number; barDuration: number } = $props();

  // 奥行きのない座標での、レーン全体の左右端の x
  const LEFT = -SCENE_WIDTH / 2;
  const RIGHT = SCENE_WIDTH / 2;

  // 表示範囲の奥行き（レーン上端と Scene の下端）
  const TOP_DEPTH = 1;
  const BOTTOM_DEPTH = depthAtY(SCENE_HEIGHT - JUDGEMENT_BAR_Y);

  const topY = project(0, TOP_DEPTH).y;

  // 表示範囲内の小節線。奥行きから時刻の範囲を求め（time = audioTime + depth * TRAVEL_TIME）、各時刻を投影する
  const barlines = $derived(
    barTimesBetween(
      audioTime + BOTTOM_DEPTH * TRAVEL_TIME,
      audioTime + TOP_DEPTH * TRAVEL_TIME,
      barDuration,
    ).map((time) => {
      const depth = depthAtTime(time, audioTime);
      return { time, left: project(LEFT, depth), right: project(RIGHT, depth) };
    }),
  );
</script>

<!-- 例外: 判定バーの中央を原点 (0, 0) として描画する（投影の基準が判定バーのため） -->
<g>
  <defs>
    <!-- レーン（Lanes.svelte）と同じ範囲でフェードアウトさせる -->
    <linearGradient
      id="play-barlines-fade-gradient"
      gradientUnits="userSpaceOnUse"
      x1="0"
      y1={topY}
      x2="0"
      y2={topY + LANE_FADE_LENGTH}
    >
      <stop offset="0" stop-color="#fff" stop-opacity="0" />
      <stop offset="1" stop-color="#fff" stop-opacity="1" />
    </linearGradient>
    <mask
      id="play-barlines-fade"
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
        fill="url(#play-barlines-fade-gradient)"
      />
    </mask>
  </defs>

  <!-- 背景の要素のため、判定バーより目立たないよう半透明・発光なしとする（仮置き） -->
  <g mask="url(#play-barlines-fade)" stroke="#4fc3ff" stroke-opacity="0.4" stroke-width="1">
    {#each barlines as { time, left, right } (time)}
      <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} />
    {/each}
  </g>
</g>
