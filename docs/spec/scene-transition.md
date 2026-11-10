# scene-transition

Scene の切り替え（遷移）の仕様。
Scene の切り替えを App が行う設計は `docs/architecture.md`「Scene」、判断の経緯は `docs/decisions/001-scene-transition.md` を参照。

## 遷移
現状の遷移は Title → Play のみ（開始の操作は `docs/spec/title.md`「開始の操作」を参照）。

## 状態
`src/App.svelte` は以下の 2 つの状態で Scene を管理する。

- `scene: 'title' | 'play'`: 現在の Scene
- `nextScene: 'title' | 'play' | null`: ワイプで表示している途中の次の Scene。遷移中でなければ `null`

遷移中は `scene` と `nextScene` の 2 つの Scene が同時に Stage 上に存在する。

## 遷移の流れ
1. Scene がコールバック prop（例: Title の `onstart`）で App に通知する
2. App が遷移先を決め、`nextScene` に設定する
   - 遷移先が現在の Scene と同じ場合、または遷移中（`nextScene` が `null` でない）の場合は無視する
3. 次の Scene が表示され、ワイプが始まる
4. ワイプが終わった時点で `scene` を次の Scene に、`nextScene` を `null` にする
   - 前の Scene は取り除かれる。次の Scene は表示されたまま（作り直されない）

## ワイプ
- 次の Scene を、前の Scene の上に重ね、右端から左へ徐々に表示する
  - 次の Scene の左側を `clip-path: inset()` で切り取り、切り取る量を 100% から 0% に変化させる
- 時間は 600ms、easing は `cubicOut`
- 前の Scene は動かさず、ワイプが終わるまでそのまま表示する（前の Scene には演出を付けない）
- 初回表示（アプリ起動時の Title）にはワイプを付けない

## 遷移中の操作
- 前の Scene はワイプが終わるまで操作を受け付ける状態で残るが、遷移中の再遷移は無視されるため、重複した操作（Space キーの連打など）で遷移が多重に起きることはない
- 次の Scene は遷移の開始時点で表示されるため、次の Scene のマウント時の処理はワイプの開始時に動く

## 配置
- Stage（`div.stage`）に `position: relative`、`overflow: hidden` を指定する
- 各 Scene は `div.screen`（`position: absolute; inset: 0`）で包み、Stage いっぱいに重ねる
- 次の Scene は `z-index: 1` で前の Scene の上に重ねる
