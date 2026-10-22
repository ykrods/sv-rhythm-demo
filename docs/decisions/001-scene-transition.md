# 001: Scene の切り替えはコールバック prop で App に通知する

- 日付: 2026-10-20
- 関連タスク: `tasks/20261019-title-scene/`

## 背景
開始画面（Title）のスタートボタン・Space キーで、ゲーム画面（Play）に遷移する必要がある。
App は現在の Scene を表す状態 `scene: 'title' | 'play'` を持ち、`{#if}` で表示する Scene を切り替えている。
Scene からこの状態をどう変更するかを決める必要があった。

## 決定
- Scene は「開始」などのイベントをコールバック prop（例: Title の `onstart: () => void`）で App に通知する
- App がコールバックの中で `scene` を書き換え、表示する Scene を切り替える
- Scene は他の Scene や遷移先を知らない

## 理由
- 遷移先の決定が App に集まり、画面遷移の全体像を App だけで把握できる
- Scene が他の Scene に依存しないため、Scene の追加・遷移の変更（例: リザルトからタイトルに戻る）で既存の Scene を変更せずに済む
- Svelte 5 の標準的なイベント通知の方法（コールバック prop）で、追加の仕組みが要らない

## 検討した他の案
- `scene` を `$bindable` で Scene に渡し、Scene が直接書き換える
  - Scene が遷移先の値（`'play'` など）を知る必要があり、Scene 同士が間接的に依存する
- 共有のストア（`.svelte.ts` の `$state`）に現在の Scene を置く
  - Scene が 2 つの現状では仕組みとして過剰。状態の変更箇所が分散する
