<script lang="ts">
  const WIDTH = 300;
</script>

<!-- ロゴの中心を原点 (0, 0) として描画する -->
<g transform="skewX(-10)">
  <defs>
    <linearGradient id="title-logo-gradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7ff6ff" />
      <stop offset="1" stop-color="#ff7bf2" />
    </linearGradient>
    <filter id="title-logo-glow" x="-20%" y="-50%" width="140%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <text
    fill="url(#title-logo-gradient)"
    filter="url(#title-logo-glow)"
    font-size="40"
    text-anchor="middle"
    dominant-baseline="middle"
    textLength={WIDTH}
    lengthAdjust="spacingAndGlyphs"
  >
    sv-rhythm-demo
  </text>
</g>

<style>
  text {
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
  }
</style>
