# plan: audio-playback

## 概要
Title の表示時にサンプル音源（`src/assets/sample.mp3`）を `fetch` し、`OfflineAudioContext` でデコードして `AudioBuffer` を用意しておく。
スタート操作のイベントハンドラ内で、`AudioContext` の作成、leadIn だけ遅らせた再生の予約、Play への遷移の開始を同期的に行う。
Play は受け取った `track: Track` と `audioContext.currentTime` から、音声の先頭を 0 とする再生位置 `audioTime`（ms）を requestAnimationFrame のループで更新する。

- 音声 API に依存する処理（読み込み・AudioContext の作成・再生の予約）は `src/lib/audio/` に、再生位置の計算（純粋関数）は `src/lib/` に分けて実装する

## 追加・変更されるモデル（用語・概念）
- Track: 再生予約済みの曲。`AudioContext` と、その上で再生される `AudioBufferSourceNode`、leadIn をまとめたもの
  - スタート操作で再生を予約した状態で、Title → App → Play と渡される
- leadIn: `AudioContext` の作成（= 再生の予約）から音声の再生開始までの遅らせ時間（ms）。Scene のフェード後に Play の画面を認識できる間を置くためのもの。仮置きで 2000ms
- audioTime（再生位置）: 音声の先頭を 0 とした再生位置（ms）
  - leadIn の間は負の値になる（後続のタスクで、曲の開始前からノーツを落下させるのに使える）
  - `AudioContext.currentTime`（音声のクロック）から計算し、`performance.now()` などの別の時計で積算しない
  - 出力のレイテンシ（`outputLatency`）は補正しない（判定のタスクで検討する）

- Track・leadIn・audioTime は後続のタスク（ノーツの進行・判定）でも使う概念のため、glossary への追加を提案する（追加はユーザの判断。「ドキュメント」の節を参照）

### Track の型
requirements.md の定義どおり `src/types.ts` に追加する（`docs/coding-guidelines.md`「TypeScript の型」）。

```typescript
export type Track = {
  /** スタート操作で新規に作成したもの。作成と同期的に source を start しているため、音声の開始時刻は leadIn / 1000 秒 */
  audioContext: AudioContext;
  /** leadIn 後に開始するよう start 済みのもの */
  source: AudioBufferSourceNode;
  /** 再生のディレイ時間(ms) */
  leadIn: number;
};
```

### 再生開始時刻
- `AudioContext.currentTime` はコンテキストの作成時点が 0 で、`suspended` の間は進まない
- 再生は `source.start(leadIn / 1000)` で、`AudioContext` の時刻の絶対時刻として予約する。開始時刻は常に `leadIn / 1000` 秒となる
  - 予約時の `currentTime` を加える方式（`audioContext.currentTime + leadIn / 1000`）は、作成と同じ同期処理の中で `currentTime` が 0 であることの保証が明確でないため採用しない（requirements.md「実装方針」）
  - `suspended` で作成されて後から `resume()` された場合も、停止中は `currentTime` が進まないため変わらない
- このため Play では開始時刻を `track.leadIn / 1000` 秒として再生位置を計算でき、Track に開始時刻のフィールドを持たせない（requirements.md のとおり）
- この前提は `Track` の型と `startTrack` のコメントで明示する

## 処理の流れ
### 1. 読み込み（Title の表示時）
- Title のマウント時（`$effect`）に `loadAudioBuffer(sampleUrl)` を呼び、`fetch` → `arrayBuffer()` → `OfflineAudioContext` の `decodeAudioData()` で `AudioBuffer` を得る
  - 音源の URL は `import sampleUrl from '../assets/sample.mp3'`
  - HTTP ステータスがエラー（`!response.ok`）の場合も失敗とする
- デコードに `OfflineAudioContext` を使う理由（requirements.md「実装方針」）
  - 再生用の `AudioContext` はスタート操作で作成するため、Title の表示時にはまだ存在しない
  - `OfflineAudioContext` は音声を出力しないため、自動再生の制限（警告・ミュート）の対象にならない
  - デコード結果の `AudioBuffer` は特定のコンテキストに属さないため、後から作成した `AudioContext` で再生できる
  - `OfflineAudioContext` の作成にはサンプルレートの指定が必要で、デコード結果はそのレートにリサンプリングされる。48000Hz とし、再生側のサンプルレートと異なる場合はブラウザが再生時にリサンプリングする（音質の差は許容する）
- 読み込みの状態は Title 内で `audioBuffer: AudioBuffer | undefined`（読み込み済みのもの）で持つ
- 読み込みに失敗した場合は、次のスタート操作の時点で読み込みをやり直す（「2. スタート操作」）
- Title がスタート前にアンマウントされることはないため、読み込みの中断処理（`AbortController`）は行わない

### 2. スタート操作（Title）
既存のスタート操作（ボタンの click、Space の keydown、ボタン上の Enter の keydown）はすべて Title の `onstart` に集まるため、Title 内に `handleStart()` を作り、StartButton とウィンドウの keydown のリスナからこれを呼ぶ。
StartButton は変更しない（`onstart: () => void` のまま。Title が引数なしの `handleStart` を渡す）。

`handleStart()` はイベントハンドラから同期的に呼ばれ、以下を同期的に行う。

1. 多重実行のガード: Title 内の状態 `starting: boolean` が true なら何もしない。true にする
2. 読み込み済みの `AudioBuffer` がなければ（読み込み中・読み込み失敗）、`window.alert('読み込みが未完了です')` を表示し、`starting` を false に戻して終了する
   - 読み込みに失敗していた場合は、読み込みをやり直す
   - 暫定的な挙動であり後続のタスクで見直す旨を、コードにコメントする（requirements.md「要件」）
3. `startTrack(audioBuffer, LEAD_IN)` で `Track` を得る。この関数は以下を同期的に行う
   1. iOS の消音スイッチ対応: `navigator.audioSession` があれば `type = 'playback'` にする（「iOS の消音スイッチ」）
   2. `new AudioContext()` を作成する
   3. `AudioBufferSourceNode` を作成して `destination` に接続し、`source.start(leadIn / 1000)` で再生を予約する
   4. `audioContext.state` が `running` でなければ `resume()` を呼ぶ
4. `onstart(track)` で App に通知し、遷移を開始する
   - `running` で作成された場合は同期的に通知する
   - `suspended` で作成された場合（Safari など、ユーザ操作の中で作成しても起こりうる）は、`resume()` の解決後に通知する（requirements.md「実装方針」）
     - 再生の予約・`resume()` の呼び出しはユーザ操作の中で同期的に行うため、自動再生の制限には当たらない。遷移の開始だけが `resume()` の分遅れる
     - `resume()` の待機中も `starting` は true のため、スタート操作は無視される

- `LEAD_IN`（2000ms）は Title でのみ使うため、Title 内の定数とする（`docs/coding-guidelines.md`「共通化」）
- `starting` はスタートの成功後も true のままにする。フェード中（Title がまだマウントされている間）のスタート操作は無視され、音声は多重再生されない
  - `docs/spec/title.md` の「フェード中に開始の操作を行っても、遷移は再度行われない」も、App 側の状態に頼らず Title 側のガードで満たされる

### 3. 失敗時（Title）
以下を再生開始の失敗とする。

- `new AudioContext()`・`source.start()` の例外
- `resume()` の reject

（読み込みの未完了・失敗は「2. スタート操作」の 2. で扱い、ここには含めない）

失敗時は以下を行う。

- 作成済みの `AudioContext` があれば `close()` する
- `window.alert('曲の再生に失敗しました、ブラウザの音声再生の許可設定を確認してください。')` を表示する
- `starting` を false に戻し、次のスタート操作で再試行できるようにする

- Chrome のタブのミュートなど、エラーにならずに無音で再生される場合は検出できないため、対象外とする（requirements.md「ブラウザの音声再生について」）

### 4. 遷移（App）
- Title の `onstart` の型を `(track: Track) => void` に変更する
- App は `track: Track | undefined` を `$state.raw` で持ち（`AudioContext` などを深いリアクティブにする必要がないため）、`onstart` で `track` を設定してから `scene = 'play'` にする
- Play には `<Play {track} />` で渡す。`scene === 'play'` のときは必ず `track` があるため、`{:else if scene === 'play' && track}` で絞り込む

```svelte
<script lang="ts">
  let scene: 'title' | 'play' = $state('title');
  let track: Track | undefined = $state.raw();

  function handleStart(startedTrack: Track) {
    track = startedTrack;
    scene = 'play';
  }
</script>

{#if scene === 'title'}
  <div class="screen" transition:fade><Title onstart={handleStart} /></div>
{:else if scene === 'play' && track}
  <div class="screen" transition:fade><Play {track} /></div>
{/if}
```

### 5. 再生位置の取得（Play）
- Play は prop `track: Track` を受け取る
- `let audioTime = $state<number>()` を持ち、`$effect` 内で requestAnimationFrame のループを開始する
  - 各フレームで `audioTime = toAudioTime(track.audioContext.currentTime, track.leadIn)` に更新する
  - `$effect` のクリーンアップで `cancelAnimationFrame` する
- 再生位置の計算は純粋関数として `src/lib/toAudioTime.ts` に置く（`docs/architecture.md`「ゲームロジックの分離」）

  ```typescript
  /**
   * AudioContext の時刻(秒)から、音声の先頭を 0 とする再生位置(ms)を求める。
   * 音声は AudioContext の時刻 leadIn / 1000 秒に開始している前提（Track を参照）
   */
  export function toAudioTime(contextTime: number, leadIn: number): number {
    return contextTime * 1000 - leadIn;
  }
  ```

### 6. 再生位置の確認用の表示（Play、開発時のみ）
- `import.meta.env.DEV` のときのみ、Play の `<svg>` の左上に `audioTime` をテキストで表示する
  - 例: `audioTime: -1234 ms`（整数に丸める）。白字・小さめの等幅フォント
  - `audioTime` が未設定（最初のフレームの前）の間は表示しない
- 単純なテキストのため、コンポーネントにせず Play に直接書く（`docs/architecture.md`「Scene 内コンポーネントの分割」の例外）
- 本番ビルドでは表示されないため、`docs/spec/play.md` の表示要素には含めない（開発用の機能として記載するかは Workflow 7 で判断する）

### 7. 曲の終了とクリーンアップ（Play）
- 曲の終了に対するイベント処理（`onended`）は行わない（requirements.md のとおり）
  - 曲の終了後も `AudioContext` の時計は進むため、`audioTime` は曲の長さを超えて増え続ける。終了の扱いはリザルトのタスクで決める
  - rAF のループも曲の終了後に止めない（Play の表示中は動かし続ける）
- Play のアンマウント時（`$effect` のクリーンアップ）に、rAF のループを止め、`track.audioContext.close()` で音声を停止・解放する
  - `close()` によりコンテキスト上のノードはすべて停止するため、`source.stop()` は呼ばない
  - 現状 Play からの遷移はないため実際にアンマウントされることはないが、後続のタスク（リザルト → Title など）や HMR で必要になるため実装する

## iOS の消音スイッチ
- iOS Safari では Web Audio の音声は既定でマナーモード（消音スイッチ）時にミュートされる
- `startTrack()` 内で、`AudioContext` の作成前に `navigator.audioSession.type = 'playback'`（Safari 16.4 以降）を設定し、消音スイッチに関わらず再生されるようにする
  - 非対応のブラウザでは何もしない
- `navigator.audioSession` は TypeScript の DOM の型定義に含まれていないため、機能検出のための最小限の型を `startTrack.ts` 内に定義して使う（glossary にない実装上の型のため `src/types.ts` 外でよい。`docs/coding-guidelines.md`「TypeScript の型」）

## ファイル配置
- 音声 API に依存する処理は `src/lib/audio/` を新設し、1 関数 1 ファイルで置く（requirements.md「実装方針」）
  - `docs/architecture.md` の「`src/lib/` は暗黙的な外部環境への依存を避けるゲームロジックの置き場」という方針と矛盾するが、requirements.md のとおり一旦これで進める。architecture の更新（「ファイル配置」への `src/lib/audio/` の追加など）は前提作業としてユーザが判断する
  - `src/lib/audio/` の関数は外部環境（Web Audio API・`fetch`・`navigator`）に依存するため、テストの対象にしない（`docs/architecture.md`「テスト」）
- 再生位置の計算（`toAudioTime`）は外部環境に依存しない純粋関数のため、`src/lib/` に置く

## 変更対象ファイル
- `src/types.ts`（変更）: `Track` を追加
- `src/lib/audio/loadAudioBuffer.ts`（新規）: URL から `AudioBuffer` を読み込む（`fetch`・`OfflineAudioContext` でのデコード）。HTTP エラーは reject する
- `src/lib/audio/startTrack.ts`（新規）: audioSession の設定、`AudioContext` の作成、再生の予約、`suspended` の場合の `resume()` の呼び出しを同期的に行い、`Track` を返す。ユーザ操作のイベントハンドラ内で同期的に呼ぶ前提をコメントで明示する
- `src/lib/toAudioTime.ts`（新規）: 再生位置の計算（純粋関数）
- `tests/lib/toAudioTime.test.ts`（新規）: `toAudioTime` のテスト（leadIn 中の負の値、開始時刻で 0 になること、ms への変換）
- `src/scenes/Title.svelte`（変更）: 表示時の読み込み、`handleStart`（ガード・再生の開始・失敗時の alert）、`onstart` の型の変更
- `src/scenes/Play.svelte`（変更）: prop `track`、`audioTime` と rAF のループ、開発時の `audioTime` の表示、クリーンアップ
- `src/App.svelte`（変更）: `track` の状態、Play への受け渡し

- `src/scenes/title/StartButton.svelte` は変更しない
- 画面の表示内容は、開発時のみの `audioTime` の表示を除いて変更しない
- 外部パッケージは追加しない
- `docs/` 以下は実装（Workflow 4）では変更しない

## ドキュメント
- `docs/architecture.md`（前提作業としてユーザに提案）
  - 「ファイル配置」に `src/lib/audio/` を追加する
  - 「設計方針」に、音声 API に依存する処理の置き場所と、時刻の基準を音声のクロック（`AudioContext.currentTime`）とする方針を追記する
- `docs/glossary.md`: Track・leadIn・audioTime（再生位置）の追加を提案する（ユーザの判断）
- ADR: 再生方式として `HTMLAudioElement` ではなく Web Audio API を選んだ判断（遅らせ再生・時計の精度と、曲の終了の自前管理・iOS 消音スイッチ対応のトレードオフ）は ADR に記録する価値があると考えるため、作成を提案する（ユーザの判断）
- Workflow 7 で反映する `docs/spec/`
  - `docs/spec/title.md`: 表示時の音声の読み込み、「開始の操作」に、スタート操作での再生の予約、多重再生の防止、失敗時の alert と再試行を追記する
  - `docs/spec/play.md`: 曲の再生（leadIn 後に開始、曲の終了後の扱い、アンマウント時の停止）と再生位置の定義を追記する

## 確認方法
- Health Check（C1〜C6、task scope: `task=20261113-audio-playback`）を実行する
- `npm run dev -- --host` を起動し、playwright-cli で以下を確認する
  - スタート操作（クリック・Space・Enter）で Play に遷移し、leadIn 後に再生が始まること（`AudioContext.state` が `running`、開発時の表示で再生位置が進むこと）
  - 再生位置が leadIn の間は負で、音声の開始時に 0 となり、ms 単位で増えること
  - スタート操作の連打（Space の連打、クリックと Space の同時操作）で `AudioContext` が 1 つしか作成されないこと（`window.AudioContext` をラップして作成回数を数える）
  - 再生開始の失敗: `window.AudioContext` を例外を投げるものに差し替えてスタート操作し、alert が表示され Title に留まること。差し替えを戻して再度スタート操作し、再生できること
  - 読み込みの未完了: playwright の route で mp3 のリクエストを保留（または abort）した状態でスタート操作し、「読み込みが未完了です」の alert が表示され Title に留まること。abort した場合は、route を解除して再度スタート操作すると読み込みがやり直され、読み込み完了後のスタート操作で再生できること
  - 曲の終了: 曲の終了後もエラーが出ず、表示が乱れないこと（曲の長さだけ待つ）
  - 再生終了処理: 現状 Play からの遷移がないため、HMR（Play.svelte の保存）で Play が再マウントされた際に前の `AudioContext` が close されること（`state` が `closed`）を確認する
- iOS の消音スイッチ・`suspended` で作成される場合・実機での自動再生制限は playwright では確認できないため、ユーザの実機確認とする
- スクリーンショットは主要な画面サイズで Title と Play を取得し、開発時の `audioTime` の表示以外のレイアウトが変わっていないことを確認する
