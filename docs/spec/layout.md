# layout

画面レイアウトの仕様。方針と検討内容は `docs/proposal.md` の「画面サイズ」を参照。

## 論理座標
- Scene の SVG は viewBox `0 0 360 640`（9:16）で描画する
  - 理由: 1 単位がスマホの CSS px とほぼ一致し、フォントサイズや線幅を直感的に指定できる。また 5 レーンで割り切れる（レーン幅 72）
- 値は `src/lib/stage.ts` の `STAGE_WIDTH` / `STAGE_HEIGHT` で定義する

## Stage の配置
- `html`, `body`, `#app` を表示領域いっぱい（高さは `100dvh`）にし、Stage を上下左右中央に配置する
- Stage のサイズは `width: min(100dvw, 100dvh * 9 / 16)`、`aspect-ratio: 9 / 16`
  - スマホ（縦）では幅いっぱい、PC・横向きでは高さいっぱいの縦長領域になる
  - 9:16 より縦長な端末では幅いっぱいになり、上下に余白が出る（許容）
- Stage の外側（余白部分）と Stage 内で背景色を分ける
- Scene の svg は Stage いっぱい（`width` / `height` 100%、`display: block`）に表示する

## タッチ操作の抑止
- Stage に `touch-action: none` を指定し、スクロール・ピンチ拡大・ダブルタップ拡大を抑止する
  - iOS Safari は viewport の `user-scalable=no` を無視するため、拡大の抑止は `touch-action` に頼る
- `body` に `overflow: hidden`、`overscroll-behavior: none` を指定し、ページのスクロールやバウンスを抑止する
- `user-select: none`（`-webkit-user-select` 含む）、`-webkit-touch-callout: none` でテキスト選択・長押しメニューを抑止する
