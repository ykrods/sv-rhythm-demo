# plan: title-scene

## 概要
開始画面（Title Scene）に背景画像・タイトルロゴ・スタートボタンを SVG で表示する。
スタートボタンのクリック・タップ、または Space キーで、ゲーム画面（Play Scene）に遷移する。

## 追加・変更されるモデル（用語・概念）
- 新しい用語は追加しない
  - タイトルロゴ・スタートボタンは画面上のUIコンポーネントの呼び名で、プロジェクト固有の概念ではないため glossary には載せない
- Scene の切り替え: Scene は App に「開始」などのイベントをコールバック prop で通知し、App が状態 `scene` を書き換えて Scene を切り替える
  - Scene は他の Scene を直接知らない（遷移先は App が決める）

## コンポーネント構成

```
App.svelte                … scene: 'title' | 'play' を持つ
 └ Stage（div.stage）
    ├ scenes/Title.svelte  … props: onstart: () => void
    │   <svg viewBox="0 0 360 640">
    │    ├ 背景画像（<image>）
    │    ├ タイトルロゴ（<text>）
    │    ├ スタートボタン（<g role="button">）
    │    └ 説明文「Press SPACE to start」（<text class="hint">）
    └ scenes/Play.svelte   … 変更なし
```

- すべて `Title.svelte` 内に書く
  - lint のファイル行数制限（300 行）を超える場合は、`docs/coding-guidelines.md` の分割方針に従い、ロゴ・ボタンを `<g>` をルートにした子コンポーネントに分ける。置き場所は `src/scenes/title/` とし、notes.md に記録する

## 実装内容

### Scene の切り替え（`src/App.svelte`）
- 状態 `scene: 'title' | 'play'`（`$state`）と `{#if}` による切り替えは今の実装のまま
- Title に `onstart={() => (scene = 'play')}` を渡す

### 背景画像
- `src/assets/bg.webp` を import し（Vite がハッシュ付きのファイル名で出力する）、`<image>` で Scene 全面に表示する
  - `x=0 y=0 width={SCENE_WIDTH} height={SCENE_HEIGHT}`、`preserveAspectRatio="xMidYMid slice"`
  - 画像は 900×1600 で 9:16 ちょうどのため、`slice` で切れる部分はない。`slice` は比率が変わったときの保険として指定する
  - 画像はサイズ調整・圧縮済み（約 51KB）のため、本タスクで追加の最適化は行わない
- 画像の読み込みが終わるまでは背景が見えないので、画像の下に暗い紺色の rect を敷く

### タイトルロゴ
- テキスト「sv-rhythm-demo」を SVG の `<text>` で描画する
- Web フォント
  - Google Fonts の Orbitron（太字）を使う。画面イメージの近未来的な雰囲気に近く、英字のみのロゴに合うため
  - `index.html` の `<head>` に `<link>`（`preconnect` と、`display=swap` を付けた CSS）を追加して読み込む
  - npm パッケージ（`@fontsource/*` など）は使わない。依存を増やさないため
  - 読み込み前・読み込み失敗時は `sans-serif` で表示する（許容）
- 見た目
  - 塗りは水色からピンクへの横方向のグラデーション（`<linearGradient>`）
  - `<filter>`（`feGaussianBlur` と `feMerge`）で発光させる
  - 画面イメージに合わせて `skewX` で少し斜体にする
- 配置: 横中央、y は画面の上から 3 割程度（論理座標 y ≈ 200）
  - Orbitron は字幅が広く 14 文字が 360 に収まらない可能性があるため、`textLength`（`lengthAdjust="spacingAndGlyphs"`）で幅を 300 程度に収める

### スタートボタン
- SVG の `<g>` に角丸の `<rect>` と「START」の `<text>` を入れて作る
  - 配置: 横中央、幅 240・高さ 64 程度、y は画面の上から 2/3 程度（論理座標 y ≈ 400）
  - 塗りは青から紫へのグラデーション、枠線を白く発光させる（ロゴと同じ filter を使う）
  - 文字は Orbitron
- 操作
  - クリック・タップ: `onclick` で `onstart()` を呼ぶ
    - Stage に `touch-action: none` があるため、タップでも遅延なく click が発火する
  - ホバー・押下時に明るさを変える（`:hover` / `:active`）。`cursor: pointer`
- アクセシビリティ
  - `role="button"`、`tabindex="0"`、`aria-label="Start"` を付ける
    - svelte-check の a11y 警告（クリックできる要素にフォーカスとキー操作が必要）を出さないため
  - フォーカス中の Enter で `onstart()` を呼ぶ（ボタンの `onkeydown`）
  - フォーカス時の枠は `:focus-visible` のときだけ表示する（クリック時に枠が出ないようにする）

### Space キーでの開始
- `<svelte:window onkeydown>` で Space（`event.code === 'Space'`）を受けて `onstart()` を呼ぶ
  - Title が表示されている間だけリスナが登録され、Play に切り替わると自動で外れる
  - `event.repeat` が true のときは無視する
  - `preventDefault()` でブラウザ標準の動作（スクロールなど）を抑止する
- Space の処理はウィンドウのリスナだけで行い、ボタンの `onkeydown` では扱わない（フォーカス中に二重に呼ばれないようにする）

### 説明文「Press SPACE to start」
- スタートボタンの下（論理座標 y ≈ 470）に白字の `<text class="hint">` で表示する
- requirements.md のテクニカルノートのとおり、メディアクエリ `(hover: hover) and (pointer: fine)` に当てはまるときだけ表示する
  - SVG の要素にも CSS の `display` が効くため、例のコードのまま使える

### 座標の定数
- ロゴ・ボタン・説明文の位置やサイズは `Title.svelte` 内の定数として定義し、`SCENE_WIDTH` / `SCENE_HEIGHT` を基準に組み立てる
  - Title でしか使わないため、`docs/coding-guidelines.md`「ファイル配置」に従い `src/lib/` には置かない

## 変更対象ファイル
- `src/scenes/Title.svelte`（変更）
- `src/App.svelte`（変更: `onstart` を渡す）
- `index.html`（変更: Web フォントの読み込み）
- `docs/spec/title.md`（新規）
- `docs/architecture.md`（変更: Scene の切り替え）

`src/scenes/Play.svelte`、`src/assets/bg.png`、`src/assets/bg-simple.png`、`old/` は変更しない（コードからは参照しない）。

## ドキュメント
requirements.md の「やること」に従い、実装とあわせて記載する。

- `docs/spec/title.md`（新規）
  - 表示要素（背景画像、タイトルロゴ、スタートボタン、説明文）と配置
  - 開始の操作（クリック・タップ、Space、フォーカス中の Enter）
  - 説明文の表示条件（メディアクエリ）と、許容する挙動
- `docs/architecture.md`
  - 「コンポーネント構成」に、Scene はコールバック prop でイベントを App に通知し、App が `scene` を書き換えて切り替えることを追記する
  - Web フォントを `index.html` から Google Fonts で読み込むことを追記する

## 確認方法
- `npm run verify`（build / check / test / lint / check-deps）が通る
- `npm run dev -- --host` を起動し、スクリーンショット（360×640、390×844、844×390、1280×720）で以下を確認する
  - 背景画像が Stage いっぱいに表示される
  - ロゴが Web フォントで表示され、Stage からはみ出さない
  - ボタンと説明文が画面イメージに近い位置に表示される
- playwright-cli で以下を確認する
  - ボタンをクリックすると Play に切り替わる
  - Space キーで Play に切り替わる
- 説明文がタッチ端末で非表示になることは、playwright-cli でタッチ端末をエミュレートできれば確認する。できなければ、確認できなかったことを報告する
