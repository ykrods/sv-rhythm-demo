# requirements: audio-playback

## 目的
ノーツの進行を曲の進行に合わせるための前提として、スタート操作による曲の再生と、音声の再生位置の取得を実装する。

## タスク種別
設計・実装

## 前提
- `docs/architecture.md`（Scene の切り替え、ゲームロジックの分離）
- `docs/spec/title.md`（開始の操作）
- `docs/spec/play.md`
- `docs/proposal.md`（音声の再生位置に譜面の進行を合わせる方針）
- 仮の音源として `src/assets/sample.mp3` を使用する。

### ブラウザの音声再生について
以下は実装判断のための現状の技術情報であり、将来的に変わる可能性がある。
また macOS のブラウザで調査したためスマホなどでは細部が異なる可能性がある。

- 自動再生（ユーザ操作を伴わない状態での音声再生）はブロックさせるブラウザがある
  - `HTMLAudioElement.play()` の Promise が `NotAllowedError` で reject される
  - `AudioContext` の初期化時や `AudioBufferSourceNode.start` 実行時に警告が出てミュートされる
  - これはブラウザのサイトごとの権限設定で許可される
- クリックなどのユーザ操作で Transient Activation が与えられると、権限に関わらず再生できる
  - ただし、chrome で音声ミュート設定された場合はクリック時に `play()` 等を呼び出してもミュートされ、かつエラーにもならない
- Transient Activation はクリックに対して同期的かどうかでなく、クリック後数秒間許可が与えられるものである
  - これは Chrome・Firefox に当てはまる。
  - Safari（iOS）は許容範囲が狭く同期呼び出しが推奨される。
- 上記より、本プロジェクトではスタート操作のイベントハンドラ内で同期的に再生処理を行うことで、権限設定が不要になるようにする
  - スタート操作は click / keydown など、ユーザ操作として認められるイベントで扱う（pointerdown / touchstart は不可）
- Web Audio API (`AudioContext`) について
  - `AudioBufferSourceNode.start` で再生の予約ができる。
  - `AudioContext.currentTime` はコンテキストを生成した時点が 0 となる(suspend をしない限り)
  - 自動再生の制限があるため、コンテキストの生成から `start()` の呼び出しまでを同期的に行う必要がある

## 要件
- Title 画面のスタート操作(クリック・タップ・Space押下)により、再生を開始し、Play 画面に遷移する
  - ブラウザの音声再生制限を踏まえ、ユーザのスタート操作を起点に再生を開始する
  - 操作の重複によって音声が多重再生されないようにする。
  - 画面のトランジションが存在するため、再生は数秒遅らせて行う。これについての実装方針は後述。
  - 再生開始に失敗した場合、シンプルに `window.alert` でエラーメッセージを表示する
    - 「曲の再生に失敗しました、ブラウザの音声再生の許可設定を確認してください。」
    - メッセージの表示後はスタート操作で再試行できるようにする
  - 音源の読み込み完了前（読み込み中・読み込み失敗）にスタート操作を行った場合は、`window.alert` で「読み込みが未完了です」と表示する
    - 暫定的な挙動であり、後続のタスクで見直す。コードにもその旨をコメントする
- Play 画面にて、後続のタスクで曲の進行を基準にノーツを出現させるため、音声の先頭を 0 とする再生位置を、ms 単位で取得できるようにする
  - 時刻の基準は音声の実際の再生位置とし、開始からの経過時間を別の時計で積算しない。
  - 本タスクでは曲の終わりのリザルト表記などは対象外とするため、曲の終わりに対するイベント処理は基本的に不要
    - ただし、音声やイベントリスナにクリーンアップ処理が必要な場合は本タスクで実装する。

## 実装方針
- 開始時間の予約に対応するため、 Web Audio API（`AudioContext`）を利用する
  - 課題:
    - 曲終了の自前管理
    - iOS の消音スイッチ対応（`navigator.audioSession`）が必要になる。
- Title 画面の表示時に音源データの取得、デコードを行う
  - スタート操作と同時に `start()` で予約開始を行うため
  - 再生用の `AudioContext` はスタート操作で作成するため、デコードには `OfflineAudioContext` を使う
    - `OfflineAudioContext` は音声を出力しないため自動再生の制限を受けず、デコード結果の `AudioBuffer` は後から作成した `AudioContext` で再生できる
  ```javascript
  // コードのイメージ
  const response = await fetch("sample.mp3");
  // length は 1 以上が必要だが、デコードには影響しない
  const offlineContext = new OfflineAudioContext({ numberOfChannels: 2, length: 1, sampleRate: 48000 });
  const buffer = await offlineContext.decodeAudioData(await response.arrayBuffer());
  ```
- スタート操作で  `AudioContext` の作成、再生の予約・遷移の開始を同期的に行う
  - ブラウザによってはユーザ操作の中で作成しても `AudioContext` が `suspended` で作成されることがある。その場合は再生の予約・`resume()` の呼び出しまでを同期的に行い、遷移は `resume()` の解決後に開始する
    - `resume()` が reject された場合は再生開始の失敗として扱う
- Play 画面のコンポーネント引数として `track: Track` を渡す。
  ```typescript
  type Track {
    audioContext: AudioContext
    source: AudioBufferSourceNode
    /** 再生のディレイ時間(ms) */
    leadIn: number
  }
  ```
- 再生の予約は以下の方法で行う
  ```javascript
  // 楽曲の再生開始予定時刻（AudioContext の時刻での絶対時刻。作成時点が 0）
  const startTime = track.leadIn / 1000;
  // 再生
  source.start(startTime);
  ```

  - スタート操作時点で再生が開始されているためその状態で Play に渡されることになる
  - startTime は予約時の `currentTime` に依存しない絶対時刻で指定するため、Play でも leadIn から計算可能であり、 `Track` にフィールドとしては持たせない
- leadIn の値は仮置きで 2000ms とする
  - フェード後に Play の画面を認識できる程度の間を置く。後続のタスクで調整する前提。
- Play 画面では `audioTime = $state<number>()` をもつ
  - `requestAnimationFrame` を用いたループを作成し、その中で `audioContext.currentTime` で `audioTime` を更新する
- 再生位置の確認方法
  - 本タスクでは `audioTime` を使う描画がないため、ブラウザでの確認手段が必要
  - 開発時（`import.meta.env.DEV`）のみ Play の隅に `audioTime` をテキストで表示する
- 音声 API に依存する処理（読み込み・再生開始・audioSession の設定）の置き場所
  - `src/lib/` は architecture 上「暗黙的な外部環境への依存を避けるゲームロジック」の置き場であり、音声 API に依存する処理を置くと方針と矛盾する
  - 対応 => `src/lib/audio/` を新設し、1 関数 1 ファイルで置く（`docs/architecture.md`「ファイル配置」の更新が必要。前提作業としてユーザが更新）
  - architecture と矛盾するが、アーキテクチャを更新するか内容を見て判断するため一旦これで進める

## 実装上の条件
- 既存の画面レイアウトとスタート操作を維持する。
- 音声や DOM に依存する処理を、純粋なゲームロジックと区別して実装する。
- 外部パッケージを追加せず、ブラウザ標準の機能を使用する。

## 検証
- ブラウザでスタート操作からの再生、再生位置の取得、重複操作、再生開始失敗、曲終了、再生終了処理を確認する。
- Health Check（C1〜C6、task scope）を実行する。
- 画面・UI を変更する場合は、主要な画面サイズのスクリーンショットを取得・確認する。

## 対象外
- ノーツの描画・落下、譜面の進行。
- 曲の終わりによるリザルト表示
- 入力判定、スコア、リザルト。
- 一時停止・再開、シーク、音量調整などの操作 UI。
- 自動ループ、自作曲への差し替え。
- 本タスクでは `currentTime` をそのまま使い、レイテンシの補正は判定のタスクで検討する
  - `AudioContext.currentTime` は実際にスピーカーから音が出る時刻より `outputLatency` 分（環境により数十 ms）先行する

## ドキュメント反映
- 実装確認後、ユーザの指示により `docs/spec/` に今回の仕様を反映する。



  

