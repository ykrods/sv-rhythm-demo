<script lang="ts">
  import { SCENE_HEIGHT, SCENE_WIDTH } from '../../lib/scene';
  import { JUDGEMENT_BAR_Y, LANE_COUNT, LANE_WIDTH } from './lane';
  import { project } from './project';
  import { LANE_BOTTOM_DEPTH } from './laneDepth';

  // 押下の受け付けは Play が行い、このコンポーネントは見た目のみを担う
  let { pressed }: { pressed: boolean[] } = $props();

  // キーの割り当ての表示
  const KEY_LABELS = ['A', 'S', 'D', 'F', 'G'];
  // 奥行きのない座標での、レーン全体の左端の x
  const LEFT = -SCENE_WIDTH / 2;

  // Scene の下端の y（判定バーの中央を原点とした相対座標）
  const bottomY = SCENE_HEIGHT - JUDGEMENT_BAR_Y;

  // キーの割り当ての表示の y。判定バーと Scene の下端の中間（Scene 上で y = 576）
  const LABEL_Y = bottomY / 2;

  // キーの割り当ての表示の、Scene の左右端から両端の文字（A・G）の中央までの距離
  // 押下範囲の中央（LANE_WIDTH / 2）より 16 狭め、浮いた分を文字の間隔に均等に割り振る
  const LABEL_EDGE_MARGIN = LANE_WIDTH / 2 - 16;
  // キーの割り当ての表示の、文字の中央どうしの間隔
  const LABEL_GAP = (SCENE_WIDTH - LABEL_EDGE_MARGIN * 2) / (LANE_COUNT - 1);

  // 判定バーより下のレーンの部分（台形）と、キーの割り当ての表示の x
  const buttons = KEY_LABELS.map((label, lane) => {
    const x0 = LEFT + LANE_WIDTH * lane;
    const x1 = x0 + LANE_WIDTH;
    const points = [
      project(x0, 0),
      project(x1, 0),
      project(x1, LANE_BOTTOM_DEPTH),
      project(x0, LANE_BOTTOM_DEPTH),
    ]
      .map((p) => `${p.x},${p.y}`)
      .join(' ');
    return { label, points, labelX: LEFT + LABEL_EDGE_MARGIN + LABEL_GAP * lane };
  });
</script>

<!-- 例外: 判定バーの中央を原点 (0, 0) として描画する（投影の基準が判定バーのため） -->
<g>
  <defs>
    <!-- 判定バー側を明るく、下端に向かって透明にする（判定バーが光っているように見せる） -->
    <linearGradient
      id="play-lane-buttons-gradient"
      gradientUnits="userSpaceOnUse"
      x1="0"
      y1="0"
      x2="0"
      y2={bottomY}
    >
      <stop offset="0" stop-color="#4fc3ff" stop-opacity="0.5" />
      <stop offset="1" stop-color="#4fc3ff" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- 色・不透明度は仮置き -->
  {#each buttons as { label, points, labelX }, lane (lane)}
    {#if pressed[lane]}
      <polygon {points} fill="url(#play-lane-buttons-gradient)" />
    {/if}
    <text
      class="key-label"
      x={labelX}
      y={LABEL_Y}
      fill="#fff"
      fill-opacity="0.4"
      font-size="14"
      text-anchor="middle"
      dominant-baseline="central"
    >
      {label}
    </text>
  {/each}
</g>

<style>
  .key-label {
    display: none;
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
  }

  /* キーボードがありそうな環境（PC）でのみ表示する（Title の説明文と同じ条件） */
  @media (hover: hover) and (pointer: fine) {
    .key-label {
      display: block;
    }
  }
</style>
