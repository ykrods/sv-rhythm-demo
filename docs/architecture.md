# architecture
## 基本
- svelte を用いたブラウザゲーム
- 習作なので過度にこだわった作りにはしない

## ファイル配置
```
index.html     # エントリの HTML（Web フォントの読み込みもここで行う）
docs/          # ドキュメント
public/        # favicon など、ts から import しない静的ファイルを配置する
src/
  + main.ts      # App を #app にマウントする
  + App.svelte   # Stage と、現在の Scene の切り替え
  + app.css      # 全体に関わるスタイル
  + types.ts     # 型定義
  + assets/      # 画像などの素材（コンポーネントから import して使う）
  + lib/         # 複数の Scene で使う、または特定の機能に依らない共通の関数・定数など
  + scenes/      # Scene コンポーネントを配置する
    + <Scene 名のスネークケース>/  # Scene ごとに固有のコンポーネント・関数・定数など
tasks/   # AIエージェントへの指示
tests/   # テスト
scripts/ # 開発用スクリプト
screenshots/ # AIエージェントの作業確認用のスクリーンショット
tmp/         # 一時的なファイル（AIエージェントは明示的な指示がない限りこのディレクトリは参照不要）
```

## 画面レイアウト
画面レイアウトに関わるコンポーネント構成は次のようになる。

```
App.svelte
 └ Stage（div.stage。9:16 で中央配置）
    ├ scenes/Title.svelte  … <svg viewBox="0 0 360 640">
    └ scenes/Play.svelte   … <svg viewBox="0 0 360 640">
```

- 9:16 の比率・中央配置は Stage（HTML / CSS）が担い、Scene は Stage いっぱいに要素を広げるだけにする
- なお Stage は独立したコンポーネントにはせず、`App.svelte` 内に `div.stage` として直接記述する

## Scene
- 画面ごとに対応する Scene コンポーネントを作成し、`scenes` 以下に配置する。例: タイトル画面に対応する `scenes/Title.svelte`
- Scene の切り替えは `App.svelte` が行う
  - Scene は「開始」などのイベントをコールバック prop（例: Title の `onstart`）で App に通知する
  - Scene は他の Scene を直接参照しない（遷移先は App が決める）
  - Scene 切り替え時にフェードのトランジション効果を用いる
  - 判断の経緯は `docs/decisions/001-scene-transition.md` を参照
- `<svg>` 要素は各 Scene コンポーネントが持つ
  - 理由: Scene ごとに HTML と SVG を選択できるようにするため（例: リザルトのポップアップを HTML で作る余地を残す）
- `<svg>` 要素を持つ Scene では共通の論理座標を用いる
  - サイズは `src/lib/scene.ts` の定数 `SCENE_WIDTH` / `SCENE_HEIGHT` で定義
  - 各 Scene の viewBox をこの定数から組み立てる

- Scene 内の表示要素のコンポーネントの書き方は `docs/coding-guidelines.md`「Svelte コンポーネント」を参照

## ライブラリ・リソース
### Web フォント
- Web フォントは npm パッケージを使わず、`index.html` の `<link>` で Google Fonts から読み込む
  - 理由: 依存パッケージを増やさないため

### 依存パッケージ
- 外部パッケージの数はなるべく少なくする
- 推移的な依存を含めて 30 以上のパッケージに依存するパッケージは使わない（devDependencies も対象とする）
  - peerDependencies は、プロジェクトが直接依存するパッケージとして別に数えるため含めない
- `npm run check-deps` で確認する
  - インストール済みのパッケージ（`node_modules/.package-lock.json`）を数える。ルートの `package-lock.json` には他のプラットフォーム用のバイナリなど、インストールされない optional な依存も含まれ、件数が実態より多くなるため

## 設計方針
### ソースコードの配置と分割
関数・定数・クラス・Svelte コンポーネント（以下、「関数など」と表記）の置き場所と、関数に切り出す基準を定める。

#### 配置
- 1 つの Scene でのみ使う関数などは `src/scenes/<Scene 名のスネークケース>/` に置く
  - 例: `src/scenes/title/StartButton.svelte`、`src/scenes/play/lane.ts`
- 複数の Scene で使う関数など、またはアプリケーションの特定の機能に依らない共通の関数などは `src/lib/` に置く
  - 例: 画面サイズは特定の機能に依らず共通なため、`src/lib/scene.ts` に定義する
  - 例: architecture や共通仕様で「このアプリでは日付を以下のフォーマットで表示する」などと定められた場合、日付をフォーマットする関数を `src/lib/` に置く
- `src/scenes/<Scene 名のスネークケース>/` にはコンポーネントと関数など（`.ts`）を混在させてよい
  - ブラウザ API に依存するかどうかで、ディレクトリを分けない
- 1 つのファイルでしか使わない定数は、そのファイル内に定義する
- `.ts` は関数またはクラスごとにファイルを作成する（例: `judge.ts`、`ScoreManager.ts`）。定数は概念的なまとまりごとにファイルを分ける（例: `lane.ts`）

#### 関数に切り出す基準
- ゲームロジック（座標計算・ノーツの位置計算・判定・スコア計算など）は、コンポーネントから純粋な関数として切り出す
  - 複数の手順からなる計算や、条件分岐を含む計算は切り出す
  - 1 つの式で書ける計算（例: `x={i * LANE_WIDTH}`）はコンポーネントに書いてよい
  - 暗黙的な外部環境への依存を避ける。時刻や入力などは引数で受け取り、`performance.now()` などの現在時刻や、DOM・コンポーネントの状態を直接参照しない
  - 状態を持つ処理はクラスで実装してもよい
  - 関数の例: `judge(noteTime: number, inputTime: number): Judgement`
- ブラウザ API の呼び出し（音声の読み込み・再生など）は、UI の表示・操作に関係しない場合、`.ts` の関数として切り出してよい（例: `src/scenes/title/startTrack.ts`）
- コンポーネント内に残してよい関数
  - コンポーネントの責務である UI の表示や操作に関わる関数（イベントハンドラ、コンポーネントの状態を更新する関数など）
  - lint の行数制限を超えておらず、かつ判断に迷う場合はコンポーネントに残す
- 関数が lint の行数制限（50 行）を超えた場合は、処理のまとまりごとに関数に切り出す
  - ファイルの行数制限（300 行）を超えた場合は、上記「配置」のファイルの単位に従って分ける。Svelte コンポーネントの分割は `docs/coding-guidelines.md`「Svelte コンポーネント」を参照
- コンポーネント側は、requestAnimationFrame や入力イベントから時刻・入力を集めてゲームロジックを呼び出し、結果を描画することに専念する

## テスト
- テストには Vitest を使い、`npm run test` で実行する
- テストの対象は `src/` 以下の純粋なロジック（結果が引数のみで決まるもの）とする
  - コンポーネントテスト・E2E テストは行わない
  - ブラウザ API（Web Audio、`fetch`、`navigator`、DOM など）に直接依存する関数はテストの対象外とする
    - 外部依存のある関数は外部 API の呼び出しに専念させて薄く保ち、計算・判定などは純粋関数に切り出してテストの対象とする
    - 例: `startTrack` はテストの対象外とし、再生位置の計算は `toAudioTime` に切り出してテストする
  - 純粋なロジックでも、自明な処理（定数の定義、単純な値の受け渡しなど）はテストしなくてよい。すべての関数をユニットテストする必要はない
- テストファイルは `tests/` 以下に、テスト対象とパスを揃えて置く
  - 例: `src/scenes/play/project.ts` のテストは `tests/scenes/play/project.test.ts`
- テストファイルも型チェック（`npm run check`）と lint（`npm run lint`）の対象とする

## 開発用スクリプト
- 開発用のスクリプト（`npm run verify` / `npm run check-deps` など）は `scripts/` に置く
- TypeScript で書き、Node で直接実行する（例: `node scripts/verify.ts`）
  - 型の除去による実行のため Node 22.18 / 23.6 以降が必要。`tsconfig.node.json` の `erasableSyntaxOnly` の範囲で書く
  - 外部パッケージは使わず、Node の標準モジュールのみで書く
- 型チェックは `tsconfig.node.json`、lint は `biome.json` の対象に含める
- テストの対象にはしない
