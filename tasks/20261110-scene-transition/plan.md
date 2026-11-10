# plan: scene-transition

## 概要
Scene の切り替え時に、次の Scene が右から左へ徐々に現れるワイプのトランジションを付ける。
対象は現状唯一の遷移である Title → Play とする。

切り替えは引き続き `App.svelte` が行い（`docs/decisions/001-scene-transition.md`）、requirements.md の実装例のロジック（`view` / `nextView` と custom transition）をそのまま App に組み込む。
Scene（Title / Play）は変更しない。

## 追加・変更されるモデル（用語・概念）
- トランジション（transition）: Scene の切り替え時の演出。今回はワイプのみ
- ワイプ（wipe）: 次の Scene を右端から左へ徐々に表示し、表示し終えた時点で前の Scene を取り除く演出
- 遷移中の Scene（`nextScene`）: ワイプで表示している途中の、次の Scene。遷移中でなければ `null`
  - 遷移中は、現在の Scene と次の Scene が同時に Stage 上に存在する

- トランジション・ワイプは実装の説明のための用語として plan にのみ記載し、glossary には追加しない（追加するかはユーザの判断。「ドキュメント」の節を参照）

## 状態と遷移の流れ（`src/App.svelte`）
実装例の `view` / `nextView` を、既存の命名に合わせて `scene` / `nextScene` とする。

```ts
type SceneName = 'title' | 'play';

let scene = $state<SceneName>('title');           // 現在の Scene
let nextScene = $state<SceneName | null>(null);   // ワイプで表示中の次の Scene
```

1. Scene がコールバック prop（Title の `onstart`）で App に通知する
2. App は `moveTo('play')` を呼び、`nextScene = 'play'` にする
   - `target === scene`、または遷移中（`nextScene !== null`）の場合は無視する
3. `nextScene` の Scene がマウントされ、`in:` トランジション（ワイプ）が始まる
   - 前の Scene は表示したまま、次の Scene をその上に重ねる（`z-index`）
4. ワイプの終了（`onintroend`）で `finishWipe()` を呼び、`scene = nextScene`、`nextScene = null` にする
   - 前の Scene は `{#if}` の条件から外れて取り除かれる（out トランジションは付けない）
   - 次の Scene の要素は条件が真のまま残るため、再マウントされない

### 遷移中の操作
- 遷移中も Title はマウントされたままのため、Space キー（window の keydown）やボタンの見えている部分へのクリックで `onstart` が再度呼ばれうる
  - 2. のガードにより無視される。Title 側の変更は不要
- Play は遷移の開始時点でマウントされる。現状 Play はマウント時の処理を持たないため影響はない
  - 音声の再生開始のタイミング（遷移後に再生する、アンロック方式）は audio-playback で対応する（requirements.md のとおり、このタスクでは扱わない）

### 初回表示
- `main.ts` の `mount` は `intro` を指定していない（既定で `false`）ため、初回の Title にはワイプがかからない
  - 初回は `onintroend` も発火しないが、`nextScene` が `null` のため問題ない

## ワイプ（custom transition）
実装例のとおり App 内に関数として定義する。

```ts
function wipeFromRight(_node: Element, { duration = WIPE_DURATION } = {}) {
  return {
    duration,
    easing: cubicOut,
    css: (t: number) => `clip-path: inset(0 0 0 ${(1 - t) * 100}%);`,
  };
}
```

- `clip-path: inset()` の左側の切り取り量を 100% → 0% に変化させ、右端から左へ表示範囲を広げる
- easing は `cubicOut`（実装例でコメントアウトされている `expoOut` は採用しない）
- 時間は 600ms。App でしか使わないため、`WIPE_DURATION = 600` として App 内に定義する（`docs/coding-guidelines.md`「共通化」）
- DOM・CSS に依存する表示上の処理でゲームロジックではないため、`src/lib/` には置かない
- svelte の transition はローカル（既定）のまま使う。`{#if}` ブロック直下の要素に付けるため、ブロックの追加時に再生される

## Stage と Scene の配置
実装例の `.stage` / `.screen` を、既存の Stage（`div.stage`）に合わせて組み込む。

```svelte
<div class="stage">
  {#if scene === 'title' || nextScene === 'title'}
    <div
      class="screen"
      class:incoming={nextScene === 'title'}
      in:wipeFromRight
      onintroend={finishWipe}
    >
      <Title onstart={() => moveTo('play')} />
    </div>
  {/if}
  {#if scene === 'play' || nextScene === 'play'}
    <div class="screen" class:incoming={nextScene === 'play'} in:wipeFromRight onintroend={finishWipe}>
      <Play />
    </div>
  {/if}
</div>
```

- 実装例の外側の `section.screen` は Stage（`div.stage`）が担うため置かない
- Scene を包む要素は `div.screen` とする（見出しを持つ区画ではないため `section` にしない）
- `.stage` に `position: relative`、`overflow: hidden` を追加する。サイズ・背景色・`touch-action` は既存のまま
  - 実装例の `width: 100%; height: 100vh` は使わない（Stage のサイズは `docs/spec/layout.md` の指定のまま）
- `.screen` は `position: absolute; inset: 0` で Stage いっぱいに重ねる。Scene の svg は従来どおり `width` / `height` 100% で表示される
- `.incoming` は `z-index: 1` で前の Scene の上に重ねる
- Title は遷移先に関わらず `moveTo` に変わるが、遷移先（`'play'`）を決めるのは引き続き App（ADR 001 と矛盾しない）

## 変更対象ファイル
- `src/App.svelte`（変更）

`src/scenes/` 以下、`src/main.ts`、`src/app.css` は変更しない。
`docs/` 以下は実装（Workflow 4）では変更しない。
テストの対象は `src/lib/` の純粋なロジックのため（`docs/architecture.md`「テスト」）、テストは追加しない。

## ドキュメント
- `docs/architecture.md`「Scene」: ユーザが前提作業として「ワイプのトランジションを用い、詳細は `docs/spec/scene-transition.md` を参照する」旨の 1 行を追記済み
  - `nextScene` などの状態の詳細は architecture には書かず、`docs/spec/scene-transition.md` に記載する
- `docs/glossary.md`: トランジション・ワイプは追加しない（ユーザ判断済み）
- `docs/spec/scene-transition.md`（新規、Workflow 7）: 実装完了後、ユーザの指示により以下を記載する
  - ワイプの演出（向き・時間・easing、前後の Scene の重ね方）
  - 状態 `scene` / `nextScene` と遷移の流れ（「状態と遷移の流れ」の 1〜4）
  - 遷移中の操作の扱い（遷移中の再遷移は無視する）、初回表示ではワイプしないこと
  - `docs/spec/title.md`「開始の操作」の「ゲーム画面に遷移する」からも参照する
  - 作成後、Health Check（C6・C7、project scope）を実行する

## 確認方法
- Health Check（C1〜C6、task scope: `task=20261110-scene-transition`）を実行する
- `npm run dev -- --host` を起動し、playwright-cli で以下を確認する
  - 主要な画面サイズ（360×640、390×844、844×390、1280×720）で、Title と遷移後の Play のスクリーンショットを取得し、レイアウト（Stage のサイズ・中央配置）が変わっていないこと
  - ワイプの途中の表示: svelte の CSS トランジションは Web Animations として再生されるため、スタート操作の直後に `document.getAnimations()` を一時停止・`currentTime` を指定（例: 150ms / 300ms）してスクリーンショットを取得し、右側に Play、左側に Title が表示されていること
  - 遷移中の Space キー・クリックの連打で遷移が多重に起きないこと、遷移後に Title が DOM から取り除かれていること
