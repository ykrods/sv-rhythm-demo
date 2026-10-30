# plan: play-bg

## 概要
ゲーム画面（Play Scene）に、背景画像・5 本のレーン・判定バーを SVG で表示する。
レーンは奥行きのある表現（台形）にする。表示は静的で、アニメーションやノーツは扱わない。

奥行きの表現は `docs/decisions/002-lane-perspective.md` のとおり、投影の計算を `src/lib/` の純粋関数で行い、変換した座標で SVG に直接描く。
後続のノーツのタスクも同じ関数を使う。

## 追加・変更されるモデル（用語・概念）
- レーン（lane）: ノーツが流れる縦の通り道。5 本あり、左から 0〜4 の番号で区別する（番号は後続のノーツのタスクで使う想定）
- 判定バー（judgement bar）: ノーツを叩くタイミングを示す横線
- 奥行き（depth）: レーン上の位置を表す、判定バーからの奥方向の距離。判定バーで 0、レーン上端で 1、手前（判定バーより下）は負の値
- 投影（project）: 奥行きのない座標（レーン上の横位置 x と奥行き）を、論理座標の位置と縮小率に変換すること

- レーン・ノーツ・判定バーは、前提作業として `docs/glossary.md` に追加済み。その定義どおりに使う
- 奥行き・投影は実装の説明のための用語として plan にのみ記載し、glossary には追加しない

## 座標の決め方
論理座標（360×640）で、requirements.md の値から以下のように決める。

| 項目 | 式 | 値 |
|---|---|---|
| レーン上端の y | `SCENE_HEIGHT * 0.2` | 128 |
| 判定バーの y | `SCENE_HEIGHT * 0.8` | 512 |
| レーン下端の y | `SCENE_HEIGHT` | 640 |
| 上端でのレーン全体の幅 | `SCENE_WIDTH * 0.25` | 90 |
| 判定バーでのレーン全体の幅 | `SCENE_WIDTH` | 360 |
| 下端でのレーン全体の幅 | 投影の結果 | 450 |

### 投影の式
- 奥行きのない座標
  - 横位置 x: 判定バーでの論理座標の幅を基準とし、中央を 0 とする（レーン全体で -180〜180、1 レーンの幅 72）
    - レーンの番号ではなく連続値のため、レーンの境界（例: 左端 -180、レーン 0 と 1 の間 -108）もレーンの中央（例: レーン 0 の中央 -144）も指定できる
  - 奥行き d: 判定バーで0、レーン上端で1。判定バーより手前は負の値。
- 縮小率 
  - 「レーン上端での幅を 90 とする」指定から、上端（d = 1）の縮小率が `0.25 (90/360)` となる。
  - ノーツの動きに奥行きを持たせるため、透視投影を用いる。透視投影では大きさは距離に反比例するので、 `s(d) = 1 / (1 + k·d)` を解いて `k = 1 / 0.25 - 1 = 3` となる
  - レーンだけの描画ではオブジェクトを縮小するわけではないが、共通の座標計算を行うために先行して実装する
- 消失点（d → ∞ で行き着く点）
  - 「レーンの上端は画面の上２割まで」の指定から、上端の論理座標(y)は 128 になる
  - 「判定バーは画面の下２割の位置」の指定から判定バーの論理座標(y)は 512 になる
  - 消失点の y を `y_v` とすると、論理座標(y_v)は次の式で y=0 (Scene の上端) と求まる

    - `Y = y_v + s * (512 - y_v)` 
    - 上端(y=128) の縮小率 0.25 を代入して
    - `128 = y_v + 0.25 * (512 - y_v)` => `128 * 4 = y_v * 4 + 512 - y_v`, `3 * y_v = 512 - 512 = 0`

  - 消失点の x は、`X = 180 + s * x` で d => 無限の時 s = 0 となるため `X = 180` になる

- 上記をまとめると、投影の式は以下になる

  ```
  s = 1 / (1 + 3d)
  X = 180 + s(d) * x
  Y = 512 * s(d) 
  ```

  - ただし、実装時は `LANE_TOP_SCALE` (上端でのレーンの幅の割合)などの定数 k, y_v を算出する形にする
- 下端（Y = 640）では `s = 640 / 512 = 1.25`（幅 450、左右に 45 ずつはみ出す）、`d = (1/s - 1) / k = -1/15`
- 奥行き方向の直線（d を変えて x を固定）は消失点を通る直線になるため、レーンの境界線は上端と下端の 2 点を投影して結べばよい

## コンポーネント構成

```
scenes/Play.svelte  … <svg viewBox="0 0 360 640">
 ├ 下地の rect と背景画像（<image>）
 ├ <g transform="translate(180 512)"> play/Lanes.svelte
 └ <g transform="translate(180 512)"> play/JudgementBar.svelte
```

- `docs/architecture.md`「Scene 内コンポーネントの分割」に従い、レーンと判定バーは `<g>` をルートにした svg の中身のコンポーネントとして `src/scenes/play/` に置く
  - それぞれ filter・mask の `<defs>` を持つため、Play に直接書かずコンポーネントにする
- 背景画像は Title と同じく Play に直接書く（`<defs>` を持たない単純な要素のため）
  - Title と記述が重複するが、数行のため共通化しない

### 原点
- JudgementBar: 中心（判定バーの中央）を原点とする（原則どおり）
- Lanes: 判定バーの中央を原点とする（例外。コメントで明示する）
  - 理由: レーンは下端が Scene からはみ出す台形で、「中心」が見た目上意味を持たない。投影は判定バーを基準（d = 0、s = 1）にしており、後続のノーツも判定バーを基準に位置を決める
- これに合わせ、投影の関数は判定バーの中央を原点とした相対座標を返す（`X - 180`、`Y - 512`）

## ゲームロジック・定数（`src/lib/`）

### `src/lib/lane.ts`（新規）: レーンの配置と奥行きのパラメータ
- `LANE_COUNT = 5`
- `LANE_WIDTH = SCENE_WIDTH / LANE_COUNT`（判定バーでの 1 レーンの幅、72）
- `JUDGEMENT_BAR_Y = SCENE_HEIGHT * 0.8`（Scene 上の判定バーの y）
- `LANE_TOP_Y = SCENE_HEIGHT * 0.2`（Scene 上のレーン上端の y）
- `LANE_TOP_SCALE = 0.25`（レーン上端での縮小率）
- Play（配置）・Lanes（形）・project（投影）から参照し、後続のノーツのタスクでも使うため、`docs/coding-guidelines.md`「共通化」に従い `src/lib/` に置く

### `src/lib/project.ts`（新規）: 投影の関数
- `project(x: number, depth: number): { x: number; y: number; scale: number }`
  - 奥行きのない座標を、判定バーの中央を原点とした論理座標の位置と縮小率に変換する（「投影の式」を参照）
  - `k`・消失点の y は `lane.ts` の定数から求め、`DEPTH_FACTOR`（k）・`VANISHING_Y`（判定バーの中央を原点とした消失点の y、-512）として export する
    - 逆変換の `depthAtY` でも同じ値を使うため（式を 2 か所に重複させない）
- 下端の奥行き（-1/15）を求めるため、y から奥行きを求める逆変換も必要になる
  - `src/lib/depthAtY.ts`（新規）に `depthAtY(y: number): number`（判定バーの中央を原点とした y を受け取る）として置く（1 関数 1 ファイルの方針）
  - Lanes がレーン下端の奥行きを求めるのに使う。後続のタスクで、タップ位置からレーンや奥行きを求めるのにも使える

### テスト（`tests/lib/project.test.ts`、`tests/lib/depthAtY.test.ts`）
- project
  - d = 0 で `{ x, y: 0, scale: 1 }`（判定バーでは変換されない）
  - d = 1 で y = -384（Scene 上の y = 128）、scale = 0.25、x = ±180 が ±45 になる
  - d が大きいほど y が消失点（-512）に近づく
- depthAtY
  - y = 0 で 0、y = -384 で 1、y = 128（Scene の下端）で -1/15
  - project と組み合わせて元の値に戻る

## 実装内容

### 背景画像（`src/scenes/Play.svelte`）
- Title と同じく `src/assets/bg.webp` を import し、`<image>` で Scene 全面に表示する（`preserveAspectRatio="xMidYMid slice"`）
- 画像の読み込みまでの下地として、暗い紺色（`#0d0b2e`）の rect を敷く
- 現在の仮表示（枠線と「Play」の文字）は削除する

### レーン（`src/scenes/play/Lanes.svelte`）
- 上端（d = 1）と下端（d = `depthAtY(SCENE_HEIGHT - JUDGEMENT_BAR_Y)`）の奥行きで、`project` を使って座標を求めて描く
- 背景: レーン全体の 4 隅（x = ±180、上端・下端）を投影した `<polygon>` を、透過ありの濃紺で塗る（例: `#0a0a2e`、`fill-opacity` 0.6 程度）
- 境界線: レーンの両端と間に引く線（左端・レーン間の 4 本・右端の計 6 本）。x = -180 + 72·i（i = 0〜5）の 6 本について、上端と下端を投影した点を結ぶ `<line>` を、ネオン調の青（例: `#4fc3ff`）、線幅 1.5〜2 程度で描く
  - 線幅は奥でも一定（縮小しない）とする。奥ほど細くする表現は必要になれば検討する
  - ネオン調の発光は Title と同じく `<filter>`（`feGaussianBlur` + `feMerge`）で付ける。id は `play-lanes-glow`
- 上端のフェードアウト: `<mask>` に縦方向の `<linearGradient>`（`gradientUnits="userSpaceOnUse"`）を入れ、背景と境界線の両方にかける。id は `play-lanes-fade`
  - 上端（y = -384）で不透明度 0、上端から一定の長さ（仮に `SCENE_HEIGHT * 0.15` = 96）で不透明度 1 にする
  - フェードは論理座標の y で指定する（奥行きでは指定しない）。フェードの長さはスクリーンショットで見た目を確認して調整する
- 下端は Scene の外まで描くが、svg の viewBox 外は切り取られる

### 判定バー（`src/scenes/play/JudgementBar.svelte`）
- 幅 `SCENE_WIDTH`（360）の横線を、原点を中心に描く（x: -180〜180、y: 0）
- 色はレーンと同じネオン調の青。レーンの境界線より太く（3〜4 程度）、発光を強めにして目立たせる
  - filter の id は `play-judgement-bar-glow`
- 配置順: レーンの上に重ねる

## 変更対象ファイル
- `src/scenes/Play.svelte`（変更）
- `src/scenes/play/Lanes.svelte`（新規）
- `src/scenes/play/JudgementBar.svelte`（新規）
- `src/lib/lane.ts`（新規）
- `src/lib/project.ts`（新規）
- `src/lib/depthAtY.ts`（新規）
- `tests/lib/project.test.ts`（新規）
- `tests/lib/depthAtY.test.ts`（新規）

`src/scenes/Title.svelte`、`src/App.svelte` は変更しない。
`docs/` 以下は実装（Workflow 4）では変更しない。

## ドキュメント
- `docs/decisions/002-lane-perspective.md`: ユーザの指示により作成済み（タスクの前提作業であり、このタスクの範囲外）
- `docs/spec/play.md`（新規、requirements.md の「やること」）: 実装完了後、ユーザの指示により Workflow 7 で作成する
  - 実装・requirements.md・plan.md と整合させ、このタスクで実装した範囲の外部仕様を記載する
  - 想定する内容
    - 表示要素（背景画像、レーン、判定バー）と配置（「座標の決め方」の値）
    - レーンの形（奥行きの表現、5 等分、上端のフェードアウト）と色
  - 作成後、Health Check（C6・C7、project scope）を実行する
- 実装中に architecture / glossary / ADR の更新が必要になった場合は、notes.md に記録してユーザに提案し、指示を待つ

## 確認方法
- Health Check（C1〜C6、task scope: `task=20261021-play-bg`）を実行する
  - 手順は `.claude/skills/health-check/SKILL.md` に従う（`npm run verify` の build / check / test / lint / check-deps に加え、規約・仕様との整合も確認する）
- `npm run dev -- --host` を起動し、Title でスタートして Play を表示した状態のスクリーンショット（360×640、390×844、844×390、1280×720）で以下を確認する
  - 背景画像が Stage いっぱいに表示される
  - レーンが上端 2 割の位置から始まってフェードアウトし、判定バーの位置で幅が画面幅と一致し、下端で左右にはみ出している
  - 判定バーが下から 2 割の位置に表示される
  - 画面イメージ（`scene-play.png`）と見た目の雰囲気が大きく外れていない
