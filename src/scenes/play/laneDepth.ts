import { SCENE_HEIGHT } from '../../lib/scene';
import { JUDGEMENT_BAR_Y } from './lane';
import { depthAtY } from './depthAtY';

// lane.ts に置くと lane.ts → depthAtY.ts → project.ts → lane.ts の循環 import になるため、別ファイルとする

// レーン上端の奥行き
export const LANE_TOP_DEPTH = 1;

// レーン下端（Scene の下端）の奥行き
export const LANE_BOTTOM_DEPTH = depthAtY(SCENE_HEIGHT - JUDGEMENT_BAR_Y);
