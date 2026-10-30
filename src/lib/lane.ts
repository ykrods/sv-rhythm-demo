import { SCENE_HEIGHT, SCENE_WIDTH } from './scene';

// レーンの本数
export const LANE_COUNT = 5;

// 判定バーの位置での 1 レーンの幅（論理座標）
export const LANE_WIDTH = SCENE_WIDTH / LANE_COUNT;

// Scene 上の判定バーの y（画面の下 2 割の位置）
export const JUDGEMENT_BAR_Y = SCENE_HEIGHT * 0.8;

// Scene 上のレーン上端の y（画面の上 2 割の位置）
export const LANE_TOP_Y = SCENE_HEIGHT * 0.2;

// レーン上端での縮小率（判定バーの位置での幅に対する割合）
export const LANE_TOP_SCALE = 0.25;
