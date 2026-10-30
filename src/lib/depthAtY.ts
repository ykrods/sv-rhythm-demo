import { DEPTH_FACTOR, VANISHING_Y } from './project';

/**
 * 投影後の y から奥行きを求める（project の逆変換）
 *
 * @param y 判定バーの中央を原点とした論理座標の y
 */
export function depthAtY(y: number): number {
  const scale = 1 - y / VANISHING_Y;
  return (1 / scale - 1) / DEPTH_FACTOR;
}
