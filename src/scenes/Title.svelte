<script lang="ts">
  import { SCENE_WIDTH, SCENE_HEIGHT } from '../lib/scene';
  import bgUrl from '../assets/bg.webp';
  import Logo from './title/Logo.svelte';
  import StartButton from './title/StartButton.svelte';

  let { onstart }: { onstart: () => void } = $props();

  // 配置（論理座標）。Scene 内コンポーネントは中心を原点として描画されるため、コンポーネントの中心の位置を指定する
  const CENTER_X = SCENE_WIDTH / 2;
  const LOGO_Y = SCENE_HEIGHT * 0.3;
  const BUTTON_Y = SCENE_HEIGHT * 0.65;
  const HINT_Y = SCENE_HEIGHT * 0.75;

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.code !== 'Space') return;
    event.preventDefault();
    if (event.repeat) return;
    onstart();
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<svg viewBox="0 0 {SCENE_WIDTH} {SCENE_HEIGHT}">
  <title>Scene: Title</title>

  <!-- 画像の読み込みが終わるまでの下地 -->
  <rect width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="#0d0b2e" />
  <image
    href={bgUrl}
    width={SCENE_WIDTH}
    height={SCENE_HEIGHT}
    preserveAspectRatio="xMidYMid slice"
  />

  <g transform="translate({CENTER_X} {LOGO_Y})">
    <Logo />
  </g>
  <g transform="translate({CENTER_X} {BUTTON_Y})">
    <StartButton {onstart} />
  </g>
  <text
    class="hint"
    x={CENTER_X}
    y={HINT_Y}
    fill="#fff"
    font-size="14"
    text-anchor="middle"
    dominant-baseline="middle"
  >
    Press SPACE to start
  </text>
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  /* キーボードがありそうな環境（PC）でのみ表示する */
  .hint {
    display: none;
    font-family: sans-serif;
  }

  @media (hover: hover) and (pointer: fine) {
    .hint {
      display: block;
    }
  }
</style>
