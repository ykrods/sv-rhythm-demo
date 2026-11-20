<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import { SCENE_WIDTH, SCENE_HEIGHT } from '../lib/scene';
  import { JUDGEMENT_BAR_Y, LANE_COUNT } from './play/lane';
  import bgUrl from '../assets/bg.webp';
  import Lanes from './play/Lanes.svelte';
  import LaneButtons from './play/LaneButtons.svelte';
  import JudgementBar from './play/JudgementBar.svelte';
  import Barlines from './play/Barlines.svelte';
  import Notes from './play/Notes.svelte';
  import JudgementResults, { type JudgementResult } from './play/JudgementResults.svelte';
  import { barDuration } from '../lib/barDuration';
  import { leadIn } from '../lib/leadIn';
  import { toAudioTime } from './play/toAudioTime';
  import { judge } from './play/judge';
  import { LaneInput } from './play/LaneInput.svelte';
  import { findTargetNote } from './play/findTargetNote';
  import { findMissedNotes } from './play/findMissedNotes';
  import type { Judgement, Note, Track } from '../types';

  let { track }: { track: Track } = $props();

  const trackLeadIn = $derived(leadIn(track));
  const trackBarDuration = $derived(barDuration(track.bpm, track.beatsPerBar));

  // 音声の先頭を 0 とする再生位置(ms)。leadIn の間は負の値になる
  let audioTime = $state<number>();

  // 判定済みのノーツ。Track.notes は変更しない
  const judged = new SvelteMap<Note, Judgement>();
  // レーンごとの最新の判定の結果
  const results = $state<(JudgementResult | undefined)[]>(Array(LANE_COUNT).fill(undefined));

  // 表示するノーツ。押下で判定されたノーツは消し、Miss のノーツは下端まで流す
  const visibleNotes = $derived(
    track.notes.filter((note) => {
      const judgement = judged.get(note);
      return judgement === undefined || judgement === 'miss';
    }),
  );

  function setResult(note: Note, judgement: Judgement, time: number) {
    judged.set(note, judgement);
    results[note.lane] = { judgement, audioTime: time };
  }

  function press(lane: number) {
    // 次のフレームを待たず、押下の時点の音声のクロックから時刻を求める
    const inputTime = toAudioTime(track.audioContext.currentTime, trackLeadIn);
    const note = findTargetNote(track.notes, judged, lane, inputTime);
    // 判定の対象になるノーツがない押下（空押し）は何もしない
    if (!note) return;
    const judgement = judge(note.hitTime, inputTime);
    if (judgement) setResult(note, judgement, inputTime);
  }
  const laneInput = new LaneInput(press);

  $effect(() => {
    let frameId = 0;
    const update = () => {
      const time = toAudioTime(track.audioContext.currentTime, trackLeadIn);
      audioTime = time;
      for (const note of findMissedNotes(track.notes, judged, time)) {
        setResult(note, 'miss', time);
      }
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

<svg viewBox="0 0 {SCENE_WIDTH} {SCENE_HEIGHT}" {@attach laneInput.attach}>
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
  <!-- 入力ボタンの光は判定バーより下のレーン面の表現のため、レーンの直上に置く -->
  <g transform="translate({CENTER_X} {JUDGEMENT_BAR_Y})">
    <LaneButtons pressed={laneInput.pressed} />
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
      <Notes {audioTime} notes={visibleNotes} />
    </g>
    <!-- 判定の結果はノーツに隠れないよう最前面に置く -->
    <g transform="translate({CENTER_X} {JUDGEMENT_BAR_Y})">
      <JudgementResults {audioTime} {results} />
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
