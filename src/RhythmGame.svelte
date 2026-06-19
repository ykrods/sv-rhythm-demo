<script lang="ts">
  import type { Track, Note, LaneState } from "./types";

  import { SvelteSet } from 'svelte/reactivity';

  import loadTrack from "./loadTrack";

  let track = $state<Track | null>(null);
  
  const bpm = 75;
  // memo: 75bpm で 800ms ごとに beat が刻まれる
  const msPb = 60_000 / bpm;

  const approachDuration = 1_600;
  const exitDuration = 400;
  const lifetime = approachDuration + exitDuration;
  const judgementBarRate = approachDuration / lifetime;
  const GreatRange = 75;
  const GoodRange = 150;
  const nLanes = 5;

  // requestAnimationFrameId
  let rafId = $state<number | null>(null);
  let notes: Note[] = $state([]);
  let clock: number = $state(0);
  let laneHeight = $state(0);
  let judgedNotes = $state(new SvelteSet<number>());
  let laneStates: LaneState[] = $state([...Array(nLanes)].map(_ => ({
    judge: "",
    judgeTime: 0,
    hitTime: 0,
  })));

  // for id (tmporary impl)
  let count = $state(1);

  function reverseFade(node: Element, { duration = 400 }: { duration?: number } = {}) {
		return {
			duration,
			css: (t: number, u: number) => `opacity: ${u}`
		};
	}

  function spawnNotes(current: number) {
    // 一旦 1ビードごとに 1つノートを追加
    const id = count;
    notes = [...notes, { id, lane: 0, hitTime: current + approachDuration + 300 }];
    count++;
    /*
    const nextNotes: Note[] = [
      { lane: 0, pos: current},
    ];
    notes = [...notes, ...nextNotes];
    */
  }
  
  function checkMiss(now: number) {
    notes.filter(note => 
      GoodRange < now - note.hitTime && 
      !judgedNotes.has(note.id)
    ).forEach((note) => {
      console.log("miss:", note.id);
      laneStates[note.lane].judge = "MISS";
      laneStates[note.lane].judgeTime = clock;

      judgedNotes.add(note.id);
    });
  }

  function start() {
    if (rafId) return;

    notes = [];
    clock = 0;
    judgedNotes.clear();

    const startAt = performance.now();
    let nextBeatTime = 0;

    laneStates = [...Array(nLanes)].map(_ => ({
      judge: "",
      judgeTime: startAt,
      hitTime: startAt,
    }));

    const loop = (now: number) => {
      clock = now;
      const elapsed = now - startAt;

      // memo: spawnNotes の実装次第で if でも良いので後で修正するかも
      while (nextBeatTime <= elapsed) {
        spawnNotes(startAt + nextBeatTime);
        nextBeatTime += msPb;
      }

      // miss の処理
      checkMiss(now);

      // 不要な note の削除
      notes = notes.filter(note => now - note.hitTime < lifetime);

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  $effect(() => {
    (async () => {
      track = await loadTrack();
      start();
    })();

    return stop;
  });

  function onKeydown(e: KeyboardEvent) {
    if (rafId) {
      switch (e.key) {
        case 'a': checkHit(0); break;
        case 's': checkHit(1); break;
        case 'd': checkHit(2); break;
        case 'f': checkHit(3); break;
        case 'g': checkHit(4); break;
        default:
          break;
      }
    }
  }

  function checkHit(lane: number) {
    // GREAT or GOOD になる可能性のあるノートを取り出す
    const targetNote = notes.find((note) => 
      note.lane === lane && 
      Math.abs(clock - note.hitTime) <= GoodRange &&
      !judgedNotes.has(note.id)
    )

    if (targetNote) {
      const d = Math.abs(clock - targetNote.hitTime);
      if (d <= GreatRange) {
        laneStates[lane].judge = "GREAT";
      } else {
        laneStates[lane].judge = "GOOD";
      }
      judgedNotes.add(targetNote.id);
    } else {
      laneStates[lane].judge = "MISS";
    }

    laneStates[lane].judgeTime = clock;
    laneStates[lane].hitTime = clock;
  }
</script>
<div class="view">
  <div class="lanes" bind:clientHeight={laneHeight}>
    {#each notes as note (note.id)}
      {@const progress = Math.min(1, (clock - (note.hitTime - approachDuration)) / lifetime)}
      {@const opacity = (progress < judgementBarRate) ? progress + 0.2 : progress * (-1) + 1.6 }
      <div
        class="note"
        style:left={0}
        style:transform={`translateY(${progress * laneHeight}px)`}
        style:opacity
      >{ note.id} </div>
    {/each}

    <div class="judge-results" style:top={`${(judgementBarRate * 100 - 4)}%`}>
      {#each laneStates as laneState}
        <div class="wrap">
          {#key laneState.judgeTime}
            <div class="judge" in:reverseFade>{laneState.judge}</div>
          {/key}
        </div>
      {/each}
    </div>
    
    <div class="hit-effects">
      {#each laneStates as laneState}
        <div class="wrap">
          {#key laneState.hitTime}
            <div class="hit-effect" in:reverseFade></div>
          {/key}
        </div>        
      {/each}
    </div>

    <div class="judge-line" style:top={`${judgementBarRate * 100}%`}></div>
  </div>
  <div class="footer">
    <p>clock: { (clock / 1000).toFixed(1) } / laneHeight: {laneHeight} </p>
  </div>
</div>
<svelte:window onkeydown={onKeydown}/>
<style>
  .view {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  .lanes {
    width: 320px;
    position: relative;
    flex: 1;
    background: linear-gradient(#111, #222);
    overflow: hidden;
  }
  .judge {
    position: absolute;
    color: #ffe082;
    opacity: 0;
  }
  .judge-line {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: #ffe082;
    box-shadow: 0 0 10px rgba(255, 224, 130, 0.6);
  }
  .footer {
    height: 100px;
  }
  .note {
    position: absolute;
    display: inline-block;
    width: 48px;
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(90deg, #ff4d6d, #ff8fab);
    box-shadow: 0 0 10px rgba(255, 77, 109, 0.4);
    transform-origin: center;
    pointer-events: none;
  }
  .hit-effect {
    opacity: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(0deg, #ffe0823a 0 30%, #ffe08200);
  }
  .judge-results {
    position: absolute;
    display: flex;
    width: 100%;
    height: 24px;

    & .wrap {
      flex: 1;
    }
  }
  .hit-effects {
    position: absolute;
    bottom: 0;
    display: flex;
    width: 100%;
    height: 70%;

    & .wrap {
      flex: 1;
    }
  }
</style>
