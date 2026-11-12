# plan: scene-transition

## 概要
Scene の切り替え時に、svelte の `fade` transition（パラメータはデフォルト）によるフェードを付ける。
対象は現状唯一の遷移である Title → Play とする。

切り替えは引き続き `App.svelte` が `scene` の状態と `{#if}` で行い（`docs/decisions/001-scene-transition.md`）、各 Scene を包む要素に `transition:fade` を付ける。
Scene（Title / Play）は変更しない。

## 追加・変更されるモデル（用語・概念）
- トランジション（transition）: Scene の切り替え時の演出。今回はフェードのみ
- フェード（fade）: 前の Scene の不透明度を 1 → 0、次の Scene の不透明度を 0 → 1 に同時に変化させ、重ねて切り替える演出（クロスフェード）
  - フェード中は、前の Scene と次の Scene が同時に Stage 上に存在する

- トランジション・フェードは実装の説明のための用語として plan にのみ記載し、glossary には追加しない（追加するかはユーザの判断。「ドキュメント」の節を参照）

## 状態と遷移の流れ（`src/App.svelte`）
状態は既存の `scene: 'title' | 'play'` のみとし、追加しない。

1. Scene がコールバック prop（Title の `onstart`）で App に通知する
2. App が `scene = 'play'` にする（既存のまま）
3. `{#if}` の分岐が切り替わり、以下が同時に始まる
   - Title を包む要素: out トランジション（不透明度 1 → 0）。終了後に DOM から取り除かれる
   - Play を包む要素: マウントされ、in トランジション（不透明度 0 → 1）
4. 400ms 後にフェードが終わり、Play のみが残る

- wipe の際に必要だった `nextScene` や `onintroend` による終了処理は、svelte が out 終了後に要素を取り除くため不要
- `scene` の型（`'title' | 'play'`）は既存どおり App 内に書き、`src/types.ts` には追加しない（今回の変更範囲で型の扱いは変わらないため）

### フェードのパラメータ
- `transition:fade` をパラメータなしで用いる（requirements.md「実装上の条件」）
- svelte 5.57.2 の既定値: `delay = 0`、`duration = 400`（ms）、`easing = linear`
- in / out の両方に同じ fade を使うため、`in:` / `out:` ではなく `transition:` を用いる
- transition はローカル（既定）のまま使う。`{#if}` ブロック直下の要素に付けるため、分岐の切り替え時に再生される

### フェード中の操作
- out トランジション中も Title はマウントされたままのため、Space キー（window の keydown）やボタンへのクリックで `onstart` が再度呼ばれうる
  - `scene` はすでに `'play'` のため、再代入しても状態は変わらず、遷移も再実行されない。ガードは追加しない
- Play はフェードの開始時点でマウントされる。現状 Play はマウント時の処理を持たないため影響はない
  - 音声の再生開始のタイミングは audio-playback で対応する（requirements.md のとおり、このタスクでは扱わない）

### 初回表示
- `main.ts` の `mount` は `intro` を指定していない（既定で `false`）ため、初回の Title にはフェードがかからない

## Stage と Scene の配置
フェード中は 2 つの Scene が同時に存在するため、Stage 内で重ねて配置する。
通常フローのままだと、フェード中に 2 つの Scene が縦に並び、レイアウトが崩れる。

```svelte
<div class="stage">
  {#if scene === 'title'}
    <div class="screen" transition:fade>
      <Title onstart={() => (scene = 'play')} />
    </div>
  {:else if scene === 'play'}
    <div class="screen" transition:fade>
      <Play />
    </div>
  {/if}
</div>
```

- transition はコンポーネントに直接付けられないため、Scene を `div.screen` で包む（見出しを持つ区画ではないため `section` にしない）
- `.stage` に `position: relative`、`overflow: hidden` を追加する。サイズ・背景色・`touch-action` は既存のまま（`docs/spec/layout.md`）
- `.screen` は `position: absolute; inset: 0` で Stage いっぱいに重ねる。Scene の svg は従来どおり `width` / `height` 100% で表示される
- 重なり順は DOM 順（後から挿入される次の Scene が上）のままとし、`z-index` は指定しない
  - フェード中は Stage の背景（`#000`）の上で両 Scene が半透明で重なる。両 Scene とも同じ背景画像を全面に表示しているため、途中で大きく暗くなることはない想定（スクリーンショットで確認する）

## 変更対象ファイル
- `src/App.svelte`（変更）: `fade` の import、`div.screen` の追加、`.stage` / `.screen` のスタイル

`src/scenes/` 以下、`src/main.ts`、`src/app.css`、`src/types.ts` は変更しない。
`docs/` 以下は実装（Workflow 4）では変更しない。
テストの対象は `src/lib/` の純粋なロジックのため（`docs/architecture.md`「テスト」）、テストは追加しない。

## ドキュメント
- `docs/architecture.md`「Scene」: ワイプ実装（revert 済み）の際の記述が残っており、現状の実装・今回の方針と食い違っている
  - 「Scene 切り替え時にワイプのトランジション効果を用いる」→ フェードに変更が必要
  - 「切り替えに用いる状態・遷移の流れ・ワイプの詳細は `docs/spec/scene-transition.md` を参照する」→ 参照先のファイルは revert により存在せず、今回も作成しない（下記）ため、記述の削除が必要
  - 「判断の経緯は `docs/decisions/001-scene-transition.md` を参照」→ ADR 001 はコールバック prop による通知の判断で、トランジションの判断ではない（参照の意図の確認が必要）
  - architecture の更新は Workflow 7 の範囲外のため、ユーザの前提作業として更新を提案する
- `docs/glossary.md`: トランジション・フェードは追加しない（追加するかはユーザの判断）
- `docs/spec/scene-transition.md` は作成しない（ユーザ判断済み）
  - 理由: ワイプでは自前の custom transition と遷移用の状態（`nextScene`）があったため仕様書が必要だったが、今回は svelte 標準の `fade` をデフォルトのまま使い、状態も追加しないため
- `docs/spec/common.md`（新規、Workflow 7）: Scene の切り替え時のフェードはアプリケーション共通の挙動とするため、アプリケーション共通の仕様を書くファイルを作成し、フェードの演出（クロスフェード、400ms・linear、前後の Scene の重ね方）と初回表示ではフェードしないことを記載する（ユーザ判断済み）
- `docs/spec/title.md`（Workflow 7）: 「開始の操作」から `docs/spec/common.md` を参照し、フェード中の開始の操作では再遷移しないことを記載する
- 反映後、Health Check（C6・C7、project scope）を実行する
- `tasks/20261105-audio-playback/requirements.md`: トランジション前提の記述（アンロック方式）があるが、requirements.md のとおり別途ユーザが修正するため、このタスクでは変更しない

## 確認方法
- Health Check（C1〜C6、task scope: `task=20261112-scene-transition`）を実行する
- `npm run dev -- --host` を起動し、playwright-cli で以下を確認する
  - 主要な画面サイズ（360×640、390×844、844×390、1280×720）で、Title と遷移後の Play のスクリーンショットを取得し、レイアウト（Stage のサイズ・中央配置）が変わっていないこと
  - フェードの途中の表示: svelte の CSS トランジションは Web Animations として再生されるため、スタート操作の直後に `document.getAnimations()` を一時停止・`currentTime` を指定（例: 200ms）してスクリーンショットを取得し、Title と Play が Stage 内で重なって半透明に表示されていること（縦に並んでいないこと）
  - フェード後に Title が DOM から取り除かれていること、フェード中の Space キー・クリックの連打で表示が乱れないこと
