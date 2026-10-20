<script lang="ts">
  let { onstart }: { onstart: () => void } = $props();

  const WIDTH = 240;
  const HEIGHT = 64;
  const LEFT = -WIDTH / 2;
  const TOP = -HEIGHT / 2;

  // Space は Title のウィンドウのリスナで扱うため、ここでは Enter のみ扱う
  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    onstart();
  }
</script>

<!-- ボタンの中心を原点 (0, 0) として描画する -->
<g>
  <defs>
    <linearGradient id="title-button-gradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2f6bff" />
      <stop offset="1" stop-color="#a43cff" />
    </linearGradient>
    <filter id="title-button-glow" x="-20%" y="-50%" width="140%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- biome-ignore lint/a11y/useSemanticElements: SVG の中では <button> を使えないため -->
  <g
    class="button"
    role="button"
    tabindex="0"
    aria-label="Start"
    onclick={onstart}
    onkeydown={handleKeydown}
  >
    <rect
      x={LEFT}
      y={TOP}
      width={WIDTH}
      height={HEIGHT}
      rx="16"
      fill="url(#title-button-gradient)"
      stroke="#fff"
      stroke-width="2"
      filter="url(#title-button-glow)"
    />
    <!-- ホバー・押下時に明るくするための重ね塗り -->
    <rect class="highlight" x={LEFT} y={TOP} width={WIDTH} height={HEIGHT} rx="16" fill="#fff" />
    <text
      class="label"
      x="0"
      y="0"
      fill="#fff"
      font-size="24"
      text-anchor="middle"
      dominant-baseline="central"
    >
      START
    </text>
  </g>
</g>

<style>
  .button {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .button:focus {
    outline: none;
  }

  .button:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 4px;
  }

  .highlight {
    opacity: 0;
    pointer-events: none;
  }

  .button:hover .highlight {
    opacity: 0.12;
  }

  .button:active .highlight {
    opacity: 0.25;
  }

  .label {
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    letter-spacing: 6px;
    pointer-events: none;
  }
</style>
