<script lang="ts">
  import { SCENE_HEIGHT, SCENE_WIDTH } from '../../lib/scene';
  import { JUDGEMENT_BAR_Y, LANE_FADE_LENGTH, LANE_WIDTH } from './lane';
  import { project } from './project';
  import { depthAtY } from './depthAtY';
  import { depthAtTime } from './depthAtTime';
  import { LANE_BOTTOM_DEPTH, LANE_TOP_DEPTH } from './laneDepth';
  import { notesBetween } from './notesBetween';
  import { TRAVEL_TIME } from './travel';
  import type { Note } from '../../types';

  let { audioTime, notes }: { audioTime: number; notes: Note[] } = $props();

  // 判定バーの位置でのノーツの高さ（論理座標）
  const NOTE_HEIGHT = 12;
  // ノーツの奥行き方向の厚み。奥行きの単位で一定のため、奥ほど薄く見える
  const NOTE_DEPTH = depthAtY(-NOTE_HEIGHT);
  // レーン内の左右の余白（判定バーの位置での論理座標）
  const NOTE_MARGIN = 6;

  // 奥行きのない座標での、レーン全体の左端の x
  const LEFT = -SCENE_WIDTH / 2;

  const topY = project(0, LANE_TOP_DEPTH).y;

  // 表示範囲内のノーツ。ノーツの一部でもかかれば描くため、範囲を厚みの半分だけ広げる
  // hitTime はノーツの厚みの中央に対応する（hitTime の時点で中央が判定バーに重なる）
  const polygons = $derived(
    notesBetween(
      notes,
      audioTime + (LANE_BOTTOM_DEPTH - NOTE_DEPTH / 2) * TRAVEL_TIME,
      audioTime + (LANE_TOP_DEPTH + NOTE_DEPTH / 2) * TRAVEL_TIME,
    ).map((note) => {
      const depth = depthAtTime(note.hitTime, audioTime);
      const x0 = LEFT + LANE_WIDTH * note.lane + NOTE_MARGIN;
      const x1 = x0 + LANE_WIDTH - NOTE_MARGIN * 2;
      const near = depth - NOTE_DEPTH / 2;
      const far = depth + NOTE_DEPTH / 2;
      const points = [project(x0, near), project(x1, near), project(x1, far), project(x0, far)]
        .map((p) => `${p.x},${p.y}`)
        .join(' ');
      return { note, points };
    }),
  );
</script>

<!-- 例外: 判定バーの中央を原点 (0, 0) として描画する（投影の基準が判定バーのため） -->
<g>
  <defs>
    <filter
      id="play-notes-glow"
      filterUnits="userSpaceOnUse"
      x={-SCENE_WIDTH / 2}
      y={-JUDGEMENT_BAR_Y}
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
    >
      <feGaussianBlur stdDeviation="3" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <!-- レーン（Lanes.svelte）と同じ範囲でフェードアウトさせる -->
    <linearGradient
      id="play-notes-fade-gradient"
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
      id="play-notes-fade"
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
        fill="url(#play-notes-fade-gradient)"
      />
    </mask>
  </defs>

  <!-- 色・発光は仮置き -->
  <g mask="url(#play-notes-fade)">
    <g fill="#ff5fd2" stroke="#fff" stroke-width="1" filter="url(#play-notes-glow)">
      {#each polygons as { note, points } (note)}
        <polygon {points} />
      {/each}
    </g>
  </g>
</g>
