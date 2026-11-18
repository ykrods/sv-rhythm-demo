import { TRAVEL_TIME } from './travel';

/**
 * 時刻 time に判定バーに達する要素の、再生位置 audioTime での奥行き
 *
 * - 奥行きは時刻に対して線形とする。投影（project）により、奥ほどゆっくり・間隔が詰まって見える
 * - 判定バーの前は正、判定バーを過ぎると負になる
 *
 * @param time 判定バーに達する時刻(ms、音声の先頭が 0)
 * @param audioTime 再生位置(ms)
 */
export function depthAtTime(time: number, audioTime: number): number {
  return (time - audioTime) / TRAVEL_TIME;
}
