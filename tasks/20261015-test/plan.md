# plan: test

## 概要
Vitest を導入し、`npm run test` で `tests/` 以下のテストを 1 回実行できるようにする。
Vitest の設定は既存の `vite.config.ts` に追記して Vite の設定を共有する。
テストファイルは `npm run check`（型チェック）と `npm run lint`（Biome）の対象にも含める。
あわせて、テストの対象とテストしやすくするための設計方針を `docs/architecture.md` に記載する。

## 追加・変更されるモデル（用語・概念）
- **ゲームロジック**: ノーツの進行・判定・スコア計算など、描画や入力イベントに依存しない計算処理。`src/lib/` に純粋関数として置き、テストの対象とする
- **テストファイル**: `tests/` 以下に、テスト対象の `src/` からの相対パスと揃えて `*.test.ts` として置く

## 実装内容

### Vitest の導入
- `vitest` を devDependencies に追加する
  - 現在の最新版（5.0.x）は peerDependencies が `vite ^6.4.0 || ^7.0.0 || ^8.0.0` で、既存の vite 8 と組み合わせられる
  - バージョン指定は他のパッケージと同じく `^` 付きとする
- コンポーネントテストは行わないため、jsdom / happy-dom などの DOM 環境は導入しない（テスト環境は Vitest のデフォルトの `node`）

### Vitest の設定（`vite.config.ts`）
- Vite の `defineConfig` に `test` フィールドを追加する
  - `vitest.config.ts` を別に作らず、既存の設定（svelte プラグインなど）をそのまま共有する
  - `test` フィールドの型のため、先頭に `/// <reference types="vitest/config" />` を追加する
- 設定内容
  - `include: ['tests/**/*.test.ts']`（`tests/` 以下のみをテストファイルとして扱う）

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
```

### npm scripts（`package.json`）
- `"test": "vitest run"` を追加する
  - `vitest`（引数なし）は watch モードになるため、`run` を指定して 1 回で終了させる

### テストの書き方
- `describe` / `it` / `expect` などは `vitest` から明示的に import する（`globals: true` は使わない）
  - 理由: tsconfig に Vitest のグローバル型を追加する必要がなく、どこから来た関数かがコードから読めるため
- テスト対象は相対パスで import する（例: `tests/lib/stage.test.ts` から `../../src/lib/stage`）

### 型チェック（`tsconfig.app.json`）
- `include` に `tests/**/*.ts` を追加する
  - `npm run check` の `svelte-check --tsconfig ./tsconfig.app.json` でテストファイルも型チェックされる
  - テストは `src/` のコードを import するため、`src/` と同じコンパイラ設定でチェックするのが自然であり、tsconfig を新設するより変更が少ない

### lint（`biome.json`）
- `files.includes` に `tests/**/*.ts` を追加する
- ルールは `src/` と同じものを適用する（テスト用の例外は設けない）
  - `describe` / `it` に渡すコールバックも関数として `noExcessiveLinesPerFunction`（50 行）の対象になる点に注意する
  - テストファイルは対象の関数ごとに分かれる想定のため、当面は問題にならないと考える

### 最小限のテスト（`tests/lib/stage.test.ts`）
- 既存の `src/lib/stage.ts` を対象に、環境の動作確認を兼ねたテストを 1 つ作成する
- 内容: `STAGE_WIDTH` / `STAGE_HEIGHT` の比が 9:16 であること（`docs/spec/layout.md` の論理座標の仕様）

```ts
import { describe, expect, it } from 'vitest'
import { STAGE_HEIGHT, STAGE_WIDTH } from '../../src/lib/stage'

describe('stage', () => {
  it('論理座標の縦横比が 9:16 である', () => {
    expect(STAGE_WIDTH * 16).toBe(STAGE_HEIGHT * 9)
  })
})
```

### `docs/architecture.md` への追記
requirements.md の指定により、本タスク内で以下の 2 節を追加する。

```markdown
## 設計方針
### ゲームロジックの分離
- ゲームロジック（ノーツの進行、判定、スコア計算など）はコンポーネントから分離し、`src/lib/` に置く
- ゲームロジックは、時刻や入力などを引数で受け取り結果を返す純粋関数として切り出す
  - 関数の中で `performance.now()` などの現在時刻や、DOM・コンポーネントの状態を直接参照しない
  - 例: `judge(noteTime: number, inputTime: number): Judgement`
- 関数ごとにファイルを作成する（例: `src/lib/judge.ts`）
- コンポーネント側は、requestAnimationFrame や入力イベントから時刻・入力を集めてゲームロジックを呼び出し、結果を描画することに専念する

## テスト
- テストには Vitest を使い、`npm run test` で実行する
- テストの対象は `src/lib/` の純粋なロジックとする
  - コンポーネントテスト・E2E テストは行わない
- テストファイルは `tests/` 以下に、テスト対象とパスを揃えて置く
  - 例: `src/lib/judge.ts` のテストは `tests/lib/judge.test.ts`
- テストファイルも型チェック（`npm run check`）と lint（`npm run lint`）の対象とする
```

### AGENTS.md
- Commands に `- テスト: npm run test` を追記する

## 変更対象ファイル
- `package.json` / `package-lock.json`（変更: vitest の追加、`test` スクリプトの追加）
- `vite.config.ts`（変更: `test` フィールドの追加）
- `tsconfig.app.json`（変更: `include` に `tests/**/*.ts` を追加）
- `biome.json`（変更: `files.includes` に `tests/**/*.ts` を追加）
- `tests/lib/stage.test.ts`（新規）
- `docs/architecture.md`（変更: 「設計方針」「テスト」の節を追加）
- `AGENTS.md`（変更: Commands に追記）

`src/` 以下は変更しない。

## 確認方法
- `npm run test` が 1 回実行して終了し、`tests/lib/stage.test.ts` が成功する
- テストをわざと失敗させる（期待値を書き換える）と `npm run test` が失敗する（確認後に元に戻す）
- `npm run check` がテストファイルを含めて通る
  - テストファイルにわざと型エラーを入れると `npm run check` が失敗する（確認後に元に戻す）
- `npm run lint` がテストファイルを含めて通る（`Checked N files` の件数が増えている）
- `npm run build` が通り、ビルド成果物にテストファイルが含まれない

## 作業完了後のドキュメント反映（Workflow 7 の想定）
- `docs/architecture.md` は本タスク内で更新するため、追加の反映は原則不要
- `docs/glossary.md`: 「ゲームロジック」を用語として追加するか検討する

## 確認事項
- テストファイルに `src/` と同じ lint ルール（関数 50 行の制限を含む）を適用する方針でよいか
  - `describe` のコールバックが長くなる場合は、`biome.json` の `overrides` で `tests/` だけ緩める選択肢もある
- `docs/architecture.md` の「設計方針」の記述例（`judge` 関数のシグネチャなど）は説明用の仮のもので、実際の名前・型は後続タスクで決める前提でよいか
