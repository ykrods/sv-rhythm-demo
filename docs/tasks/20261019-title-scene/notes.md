# notes: title-scene

## スタートボタンの `role="button"` と lint
- plan のとおり SVG の `<g>` に `role="button"` / `tabindex="0"` / `aria-label` を付けたところ、biome の `lint/a11y/useSemanticElements` がエラーになる（「`<button>` に置き換えよ」）
- 一方、`role` を外すと svelte-check が `a11y_no_static_element_interactions`（「pointerup / click ハンドラを持つ `<g>` には ARIA role が必要」）の警告を出す
  - `onclick` を `onpointerup` に変えても同じ警告が出ることを確認した
- requirements.md でボタンは SVG の要素で作る（`<button>` は使わない）と決めており、`docs/coding-guidelines.md` で `biome-ignore` による回避は禁止しているため、lint の設定の変更などの判断をユーザに確認する
- 対応（ユーザの判断）: `docs/coding-guidelines.md` に「lint のルールの無効化」の節を追加し、理由がある場合は理由を書いたうえで `biome-ignore` を使ってよいという例外を設けた
  - スタートボタン（分割後は `src/scenes/title/StartButton.svelte`）に `<!-- biome-ignore lint/a11y/useSemanticElements: SVG の中では <button> を使えないため -->` を付けた

## Title の子コンポーネントへの分割
- plan では行数制限を超えた場合のみ分割する想定だったが、分かりやすさのためにユーザの指示で分割した
  - `src/scenes/title/Logo.svelte`: タイトルロゴ。props なし
  - `src/scenes/title/StartButton.svelte`: スタートボタン。props `onstart`
  - いずれも `<g>` をルートにした svg の中身のコンポーネント
- 判断
  - 説明文は分割当初 StartButton に含めていたが、配置を Scene の責務にしたことに伴い Title に移した（「部品の配置と原点」を参照）
  - Space キーでの開始はボタンではなく Scene 全体の操作のため、Title に残した（フォーカス中の Enter は StartButton が扱う）
  - グラデーション・発光の filter は各コンポーネントの `<defs>` に持たせ、コンポーネント単体で完結させた。id の重複を避けるため、発光の filter は `title-logo-glow` / `title-button-glow` に分けた

## 部品の配置と原点
- 分割当初は、Title が props `y` で部品に縦の位置を渡し、横方向の中央揃え（`SCENE_WIDTH / 2`）は部品が持つ形にしていた
  - health-check（C7）で、部品が x 座標を自分で決めるのが方針の範囲内か不明と指摘された
- 対応（ユーザの判断）: 配置は Scene の責務とし、部品に座標を渡さない
  - Title が部品を `<g transform="translate(...)">` で包んで配置する
  - 部品は自身の中心を原点 (0, 0) として描画する。中心を原点にできない部品は、例外として原点の位置をコメントで明示する
    - 部品ごとに原点を変える案と比較し、規則が 1 つで済むこと、中央揃えの UI が多く Scene が部品のサイズを知らずに中央に置けることから、中心に統一した
  - 説明文はボタンとの位置関係もレイアウトの一部として、Title が持つことにした（ユーザの判断）
- `docs/architecture.md`「Scene 内コンポーネントの分割」に反映した

## 配置の値（plan からの変更）
- plan の配置はおおよその値（「≈」）で書いていたため、実装で以下の値に決めた。見た目はユーザが確認済み
  - ロゴ: 中心の y が Scene の高さの 30%（y = 192）
  - スタートボタン: 中心の y が Scene の高さの 65%（y = 416）。plan の「y は画面の上から 2/3 程度（y ≈ 400）」は上端と中心のどちらか曖昧で、2/3 と 400 も一致していなかった
  - 説明文: 中心の y が Scene の高さの 75%（y = 480）。plan では y ≈ 470
- plan では位置・サイズを `Title.svelte` 内の定数にするとしていたが、分割に伴い、位置（部品の中心）は `Title.svelte`、サイズは各部品の定数とした
- 説明文のフォントは plan に記載がなく、指定しないとセリフ体で表示されたため `sans-serif` とした
