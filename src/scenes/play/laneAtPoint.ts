import { SCENE_HEIGHT, SCENE_WIDTH } from '../../lib/scene';
import { JUDGEMENT_BAR_Y, LANE_COUNT, LANE_WIDTH } from './lane';

/**
 * Scene 上の論理座標の点が、どのレーンの押下範囲にあるかを返す。押下範囲外なら undefined
 *
 * - 押下範囲: x = 0〜SCENE_WIDTH を LANE_COUNT 等分、y = JUDGEMENT_BAR_Y〜SCENE_HEIGHT（両端を含む）
 * - レーンの境界の x は右のレーンに含める。右端（x = SCENE_WIDTH）は最も右のレーンに含める
 *
 * @param x Scene 上の論理座標の x
 * @param y Scene 上の論理座標の y
 */
export function laneAtPoint(x: number, y: number): number | undefined {
  if (x < 0 || x > SCENE_WIDTH || y < JUDGEMENT_BAR_Y || y > SCENE_HEIGHT) return undefined;
  return Math.min(Math.floor(x / LANE_WIDTH), LANE_COUNT - 1);
}
