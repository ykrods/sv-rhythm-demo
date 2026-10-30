# notes: play-bg

## 実装中の判断

### 投影の係数 k・消失点の y を project.ts から export する
- plan では「`k`・消失点の y は `lane.ts` の定数から求める（モジュール内の定数）」としていたが、逆変換の `depthAtY.ts` でも同じ値が必要になる
- `project.ts` で `DEPTH_FACTOR`（k）・`VANISHING_Y`（判定バーの中央を原点とした消失点の y、-512）として export し、`depthAtY.ts` から import する形にした
  - 理由: 式を 2 か所に重複させないため。投影に固有の値のため `lane.ts`（レーンの配置）ではなく `project.ts` に置いた
- plan.md に反映済み

### project(x, 0) の y が -0 になる
- `y = VANISHING_Y * (1 - scale)` の計算で、d = 0 のとき `-512 * 0 = -0` になる
- 描画上は問題ないため実装は変えず、テストで y を `toBeCloseTo(0)` で比較する形にした（`toEqual` は +0 と -0 を区別するため）

### filter・mask の領域を userSpaceOnUse で指定する
- 判定バーは高さ 0 の `<line>` のため、bbox 基準（既定の objectBoundingBox）の filter 領域が 0 になり描画されない。`filterUnits="userSpaceOnUse"` で領域を明示した
- レーンのフェード用の `<mask>` も、領域をレーン全体（Scene 全体を含む範囲）に `maskUnits="userSpaceOnUse"` で明示した

### フェードの長さ
- 仮の値 `SCENE_HEIGHT * 0.15`（96）のまま、スクリーンショットで違和感がないことを確認した（調整なし）
