<script lang="ts">
  import { SCENE_WIDTH, SCENE_HEIGHT } from '../lib/scene';
  import { JUDGEMENT_BAR_Y } from './play/lane';
  import bgUrl from '../assets/bg.webp';
  import Lanes from './play/Lanes.svelte';
  import JudgementBar from './play/JudgementBar.svelte';
  import Barlines from './play/Barlines.svelte';
  import Notes from './play/Notes.svelte';
  import { barDuration } from '../lib/barDuration';
  import { leadIn } from '../lib/leadIn';
  import { toAudioTime } from './play/toAudioTime';
  import type { Track } from '../types';

  let { track }: { track: Track } = $props();

  const trackLeadIn = $derived(leadIn(track));
  const trackBarDuration = $derived(barDuration(track.bpm, track.beatsPerBar));

  // 音声の先頭を 0 とする再生位置(ms)。leadIn の間は負の値になる
  let audioTime = $state<number>();

  $effect(() => {
    let frameId = 0;
    const update = () => {
      audioTime = toAudioTime(track.audioContext.currentTime, trackLeadIn);
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frameId);
      // コンテキスト上のノードはすべて停止するため、source.stop() は呼ばない
      void track.audioContext.close();
    };
  });

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
  {#if audioTime !== undefined}
    <g transform="translate({CENTER_X} {JUDGEMENT_BAR_Y})">
      <Barlines {audioTime} barDuration={trackBarDuration} />
    </g>
  {/if}
  <g transform="translate({CENTER_X} {JUDGEMENT_BAR_Y})">
    <JudgementBar />
  </g>
  <!-- ノーツは判定バーに重なる瞬間に隠れないよう、判定バーの上に重ねる -->
  {#if audioTime !== undefined}
    <g transform="translate({CENTER_X} {JUDGEMENT_BAR_Y})">
      <Notes {audioTime} notes={track.notes} />
    </g>
  {/if}

  <!-- 開発時のみ、再生位置の確認用に表示する -->
  {#if import.meta.env.DEV && audioTime !== undefined}
    <text class="debug" x="8" y="16" fill="#fff" font-size="12">
      audioTime: {Math.round(audioTime)} ms
    </text>
  {/if}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .debug {
    font-family: monospace;
  }
</style>
