// 各判定となる、押下の時刻と hitTime のずれ（絶対値、ms）の上限（仮置き）
// 閾値ちょうどのずれは、その判定に含める。早押し・遅押しで範囲を変えない
export const GREAT_WINDOW = 75;
export const GOOD_WINDOW = 150;
export const BAD_WINDOW = 225;
