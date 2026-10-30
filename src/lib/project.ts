import { JUDGEMENT_BAR_Y, LANE_TOP_SCALE, LANE_TOP_Y } from './lane';

// 透視投影の係数 k。縮小率 s(d) = 1 / (1 + k·d) が上端（d = 1）で LANE_TOP_SCALE になるように決める
export const DEPTH_FACTOR = 1 / LANE_TOP_SCALE - 1;

// 消失点の y（判定バーの中央を原点とした相対座標）
// Scene 上の消失点を y_v とすると LANE_TOP_Y = y_v + LANE_TOP_SCALE·(JUDGEMENT_BAR_Y - y_v) となることから求める
export const VANISHING_Y =
  (LANE_TOP_Y - LANE_TOP_SCALE * JUDGEMENT_BAR_Y) / (1 - LANE_TOP_SCALE) - JUDGEMENT_BAR_Y;

/**
 * 奥行きのない座標を、判定バーの中央を原点とした論理座標の位置と縮小率に変換する
 *
 * @param x 判定バーの位置での横位置（中央が 0）
 * @param depth 奥行き（判定バーで 0、レーン上端で 1、判定バーより手前は負の値）
 */
export function project(x: number, depth: number): { x: number; y: number; scale: number } {
  const scale = 1 / (1 + DEPTH_FACTOR * depth);
  return { x: x * scale, y: VANISHING_Y * (1 - scale), scale };
}
