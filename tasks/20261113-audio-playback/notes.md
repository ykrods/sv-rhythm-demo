# notes: audio-playback

## 実装中の判断
### startTrack の戻り値
- plan では「`Track` を返す」としていたが、`{ track, resumed }` を返す形にした
  - `resumed`: `AudioContext` が `suspended` で作成された場合の `resume()` の Promise。`running` で作成された場合は `undefined`
  - 理由: 同期的に遷移するか `resume()` の解決を待つかの判定を、`startTrack` 内の状態確認 1 回にまとめるため（Title 側で `state` を再確認すると判定が 2 か所に分かれる）

### HMR で Play が再マウントされた場合
- Play のクリーンアップで `AudioContext` を close するため、開発時に Play.svelte を保存して HMR で再マウントされると、音声が止まり `audioTime` も止まる（新しい Play は close 済みの同じ Track を受け取るため）
- 開発時のみの挙動で、本番の動作には影響しないため対応しない。音声を再度確認する場合はページを再読み込みする

### 再生の予約時刻
- requirements.md の式 `audioContext.currentTime + (track.leadIn / 1000)` ではなく、`source.start(leadIn / 1000)`（AudioContext の時刻の絶対時刻）で予約するように変更した（ユーザの指示。requirements.md の式も修正済み）
  - 理由: Play の再生位置の計算（`toAudioTime`）は開始時刻を `leadIn / 1000` 秒としているが、作成と同じ同期処理の中で `currentTime` が 0 であることの保証が明確でなく、予約時の `currentTime` が 0 でないと再生位置の 0 が曲の先頭とずれるため（Health Check C6 の指摘）
  - 絶対時刻で指定することで、予約時の `currentTime` に関わらず、予約と再生位置の計算が一致する
