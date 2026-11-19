<script lang="ts" module>
  import type { Judgement } from '../../types';

  /** 判定の結果と、判定した時点の再生位置(ms) */
  export type JudgementResult = { judgement: Judgement; audioTime: number };
</script>

<script lang="ts">
  import { SCENE_WIDTH } from '../../lib/scene';
  import { LANE_WIDTH } from './lane';

  let { audioTime, results }: { audioTime: number; results: (JudgementResult | undefined)[] } =
    $props();

  // 判定の結果を表示する時間(ms)
  const DISPLAY_DURATION = 500;
  // 判定バーからの表示位置の y（判定バーの中央を原点とした相対座標）
  const RESULT_Y = -16;

  // 色は仮置き
  const LABELS: Record<Judgement, { text: string; color: string; glow: boolean }> = {
    great: { text: 'GREAT', color: '#ff5fd2', glow: true },
    good: { text: 'GOOD', color: '#4fc3ff', glow: true },
    bad: { text: 'BAD', color: '#fff', glow: false },
    miss: { text: 'MISS', color: '#888', glow: false },
  };

  // 表示中の結果。経過時間は audioTime で求め、別のタイマーを使わない
  const visible = $derived(
    results.flatMap((result, lane) =>
      result && audioTime - result.audioTime < DISPLAY_DURATION
        ? [{ lane, x: -SCENE_WIDTH / 2 + LANE_WIDTH * (lane + 0.5), ...LABELS[result.judgement] }]
        : [],
    ),
  );
</script>

<!-- 例外: 判定バーの中央を原点 (0, 0) として描画する（レーン上の要素と揃えるため） -->
<g>
  <defs>
    <filter id="play-judgement-results-glow" x="-20%" y="-50%" width="140%" height="200%">
      <feGaussianBlur stdDeviation="2" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  {#each visible as { lane, x, text, color, glow } (lane)}
    <text
      class="result"
      {x}
      y={RESULT_Y}
      fill={color}
      font-size="12"
      text-anchor="middle"
      dominant-baseline="central"
      filter={glow ? 'url(#play-judgement-results-glow)' : undefined}
    >
      {text}
    </text>
  {/each}
</g>

<style>
  .result {
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
  }
</style>
