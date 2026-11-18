/**
 * from 以上 to 以下にある小節の頭の時刻(ms)を昇順で返す
 *
 * - 1 小節目の頭を 0ms とし、0ms より前の小節は含めない
 * - 時刻は小節の番号 × barDuration で求める（加算を繰り返さず誤差を積まない）
 *
 * @param from 範囲の始まり(ms)
 * @param to 範囲の終わり(ms)
 * @param barDuration 1 小節の時間(ms)
 */
export function barTimesBetween(from: number, to: number, barDuration: number): number[] {
  // 区間中の最小の小節番号
  const first = Math.max(0, Math.ceil(from / barDuration));
  // 区間中の最大の小節番号
  const last = Math.floor(to / barDuration);
  const times: number[] = [];
  for (let n = first; n <= last; n++) {
    times.push(n * barDuration);
  }
  return times;
}
