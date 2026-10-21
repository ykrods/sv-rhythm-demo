# architecture
## 基本
- svelte を用いたブラウザゲーム
- 習作なので過度にこだわった作りにはしない

## ファイル配置
```
index.html     # エントリの HTML（Web フォントの読み込みもここで行う）
src/
  + main.ts      # App を #app にマウントする
  + App.svelte   # Stage と、現在の Scene の切り替え
  + app.css      # 全体に関わるスタイル
  + assets/      # 画像などの素材（コンポーネントから import して使う）
  + lib/         #  ゲーム内ロジック、複数のファイルから参照される定数
  + scenes/      # Scene コンポーネントを配置する
    + <Scene 名のスネークケース>/  # Scene ごとに固有のコンポーネント
tests/   # テスト
scripts/ # 開発用スクリプト
```

## 画面のコンポーネント構成

大まかなコンポーネント構成は次のようになる。

```
App.svelte
 └ Stage（div.stage。9:16 で中央配置）
    ├ scenes/Title.svelte  … <svg viewBox="0 0 360 640">
    └ scenes/Play.svelte   … <svg viewBox="0 0 360 640">
```

- Stage は App.svelte 内に直接記述する（独立したコンポーネントにはしない）
- App は現在の Scene を表す状態 `scene: 'title' | 'play'` を持ち、`{#if}` で表示する Scene を切り替える
  - Scene は「開始」などのイベントをコールバック prop（例: Title の `onstart`）で App に通知し、App が `scene` を書き換えて Scene を切り替える
  - Scene は他の Scene を直接参照しない（遷移先は App が決める）
  - 判断の経緯は `docs/decisions/001-scene-transition.md` を参照
- 論理座標のサイズは `src/lib/scene.ts` の定数 `SCENE_WIDTH` / `SCENE_HEIGHT` で定義し、各 Scene の viewBox はこの定数から組み立てる

### Stage と Scene の役割分担
- 9:16 の比率・中央配置は Stage（HTML / CSS）が担い、Scene は Stage いっぱいに要素を広げるだけにする
- `<svg>` 要素は Stage ではなく各 Scene コンポーネントが持つ
  - 理由: Scene ごとに HTML と SVG を選択できるようにするため（例: リザルトのポップアップを HTML で作る余地を残す）

### Scene 内コンポーネントの分割
- Scene 内の表示要素（レーン・ノーツ・判定バーなど）は、ルート要素を `<g>` などの SVG 要素とした、svg の中身のコンポーネントとして作る
  - コンポーネントは `src/scenes/<Scene 名のスネークケース>/` に置く（例: `src/scenes/title/StartButton.svelte`）
  - Scene 内での配置は Scene の責務とし、Scene がコンポーネントを `<g transform="translate(...)">` で包んで配置する
    - コンポーネントは座標を props で受け取らず、自身の中心を原点 (0, 0) として描画する。コンポーネント自身のサイズや見た目はコンポーネントが持つ
    - 中心を原点にできない理由があるコンポーネントは、例外として原点の位置をコメントで明示する
  - 例外: 単純なテキストなど、`<defs>` を持たず再利用もしない要素は、コンポーネントにせず Scene に直接書いてよい（例: Title の説明文「Press SPACE to start」）
  - グラデーション・filter などの `<defs>` はコンポーネントごとに持ち、コンポーネント単体で完結させる。id は Scene・コンポーネント名を前置して重複を避ける（例: `title-button-glow`）

### Web フォント
- Web フォントは npm パッケージを使わず、`index.html` の `<link>` で Google Fonts から読み込む
  - 理由: 依存パッケージを増やさないため

## 設計方針
### ゲームロジックの分離
- ゲームロジック（ノーツの進行、判定、スコア計算など）はコンポーネントから分離し、 `src/lib/` に置く
  - ゲームロジックは、関数またはクラスとして実装し、暗黙的な外部環境への依存を避ける
  - 時刻や入力などは引数で受け取り、 `performance.now()` などの現在時刻や、DOM・コンポーネントの状態を直接参照しない
  - 状態を持たない処理は、原則として純粋関数で実装する
  - 状態を持つ処理はクラスで実装してもよい
  - 関数の例: `judge(noteTime: number, inputTime: number): Judgement`
- 関数またはクラスごとにファイルを作成する（例: `src/lib/judge.ts`、`src/lib/ScoreManager.ts`）
- コンポーネント側は、requestAnimationFrame や入力イベントから時刻・入力を集めてゲームロジックを呼び出し、結果を描画することに専念する

### 依存パッケージ
- 外部パッケージの数はなるべく少なくする
- 推移的な依存を含めて 30 以上のパッケージに依存するパッケージは使わない（devDependencies も対象とする）
  - peerDependencies は、プロジェクトが直接依存するパッケージとして別に数えるため含めない
- `npm run check-deps` で確認する
  - インストール済みのパッケージ（`node_modules/.package-lock.json`）を数える。ルートの `package-lock.json` には他のプラットフォーム用のバイナリなど、インストールされない optional な依存も含まれ、件数が実態より多くなるため

## テスト
- テストには Vitest を使い、`npm run test` で実行する
- テストの対象は `src/lib/` の純粋なロジックとする
  - コンポーネントテスト・E2E テストは行わない
- テストファイルは `tests/` 以下に、テスト対象とパスを揃えて置く
  - 例: `src/lib/judge.ts` のテストは `tests/lib/judge.test.ts`
- テストファイルも型チェック（`npm run check`）と lint（`npm run lint`）の対象とする

## 開発用スクリプト
- 開発用のスクリプト（`npm run verify` / `npm run check-deps` など）は `scripts/` に置く
- TypeScript で書き、Node で直接実行する（例: `node scripts/verify.ts`）
  - 型の除去による実行のため Node 22.18 / 23.6 以降が必要。`tsconfig.node.json` の `erasableSyntaxOnly` の範囲で書く
  - 外部パッケージは使わず、Node の標準モジュールのみで書く
- 型チェックは `tsconfig.node.json`、lint は `biome.json` の対象に含める
- テストの対象にはしない
