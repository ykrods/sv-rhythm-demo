<script lang="ts">
  import { SCENE_WIDTH, SCENE_HEIGHT } from '../lib/scene';
  import bgUrl from '../assets/bg.webp';
  import Logo from './title/Logo.svelte';
  import StartButton from './title/StartButton.svelte';
  import sampleUrl from '../assets/sample.mp3';
  import { loadAudioBuffer } from '../lib/audio/loadAudioBuffer';
  import { startTrack } from '../lib/audio/startTrack';
  import type { Track } from '../types';

  let { onstart }: { onstart: (track: Track) => void } = $props();

  // スタート操作から音声の再生開始までの遅らせ時間(ms)。フェード後に Play の画面を認識できる程度の間を置く（仮置き）
  const LEAD_IN = 2000;

  // 配置（論理座標）。Scene 内コンポーネントは中心を原点として描画されるため、コンポーネントの中心の位置を指定する
  const CENTER_X = SCENE_WIDTH / 2;
  const LOGO_Y = SCENE_HEIGHT * 0.3;
  const BUTTON_Y = SCENE_HEIGHT * 0.65;
  const HINT_Y = SCENE_HEIGHT * 0.75;

  // 読み込み済みの音源。読み込み中・読み込み失敗の間は undefined
  let audioBuffer: AudioBuffer | undefined;
  let loadFailed = false;
  // 多重実行のガード。スタートの成功後も true のままにし、フェード中の操作で多重再生されないようにする
  let starting = false;

  function load() {
    loadFailed = false;
    loadAudioBuffer(sampleUrl).then(
      (buffer) => {
        audioBuffer = buffer;
      },
      (error) => {
        console.error(error);
        loadFailed = true;
      },
    );
  }

  $effect(() => {
    load();
  });

  function failStart(error: unknown, track?: Track) {
    console.error(error);
    if (track) void track.audioContext.close();
    window.alert('曲の再生に失敗しました、ブラウザの音声再生の許可設定を確認してください。');
    starting = false;
  }

  // スタート操作のイベントハンドラから同期的に呼ぶ（自動再生の制限のため）
  function handleStart() {
    if (starting) return;
    starting = true;

    if (!audioBuffer) {
      // TODO: 暫定的な挙動。読み込み完了前のスタート操作の扱いは後続のタスクで見直す
      window.alert('読み込みが未完了です');
      if (loadFailed) load();
      starting = false;
      return;
    }

    let started: ReturnType<typeof startTrack>;
    try {
      started = startTrack(audioBuffer, LEAD_IN);
    } catch (error) {
      failStart(error);
      return;
    }
    const { track, resumed } = started;
    if (!resumed) {
      onstart(track);
      return;
    }
    // suspended で作成された場合は、resume() の解決後に遷移する
    resumed.then(
      () => onstart(track),
      (error) => failStart(error, track),
    );
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.code !== 'Space') return;
    event.preventDefault();
    if (event.repeat) return;
    handleStart();
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
    <StartButton onstart={handleStart} />
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
