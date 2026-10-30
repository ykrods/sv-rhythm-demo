<script lang="ts">
  import { SCENE_WIDTH, SCENE_HEIGHT } from '../lib/scene';
  import { JUDGEMENT_BAR_Y } from '../lib/lane';
  import bgUrl from '../assets/bg.webp';
  import Lanes from './play/Lanes.svelte';
  import JudgementBar from './play/JudgementBar.svelte';

  // 配置（論理座標）。レーンは判定バーの中央を原点として描画されるため、判定バーと同じ位置を指定する
  const CENTER_X = SCENE_WIDTH / 2;
</script>

<svg viewBox="0 0 {SCENE_WIDTH} {SCENE_HEIGHT}">
  <title>Scene: Play</title>

  <!-- 画像の読み込みが終わるまでの下地 -->
  <rect width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="#0d0b2e" />
  <image
    href={bgUrl}
    width={SCENE_WIDTH}
    height={SCENE_HEIGHT}
    preserveAspectRatio="xMidYMid slice"
  />

  <g transform="translate({CENTER_X} {JUDGEMENT_BAR_Y})">
    <Lanes />
  </g>
  <g transform="translate({CENTER_X} {JUDGEMENT_BAR_Y})">
    <JudgementBar />
  </g>
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
