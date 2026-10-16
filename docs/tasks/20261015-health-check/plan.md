# plan: health-check

## 概要
プロジェクトの健全性チェック（C1〜C7）の定義を `.claude/skills/health-check/SKILL.md` にまとめ、`/health-check` で単独実行でき、Workflow 5 / 7 からも同じ定義を参照して実行できるようにする。
機械的チェック（C1〜C5）は `npm run verify` で一括実行し、判断を要するチェック（C6・C7）はエージェントが SKILL.md の観点に沿って行う。
あわせて、C4 の判断部分の基準として `docs/coding-guidelines.md` を作成し、C5 のための依存数の集計スクリプトを外部パッケージなしで作成する。

## 追加・変更されるモデル（用語・概念）
- **Health Check**: プロジェクトの健全性を確認する一連のチェック。定義は SKILL.md に 1 か所でまとめる
- **チェック項目（C1〜C7）**: ID 付きのチェックの単位。機械的チェック（C1〜C5）と判断を要するチェック（C6・C7）に分かれる
- **scope**: チェックの対象範囲。`task`（指定タスク）と `project`（プロジェクト全体）の 2 種類
- **指摘**: チェックで見つかった問題。`[ID] 場所 — 内容 — 根拠` の形式で報告する。重要度は付けない

これらは開発プロセス上の概念であり、ゲームのソースコードには現れないため `docs/glossary.md` には追加しない。

## 実装内容

### チェック項目の定義
SKILL.md に以下の内容で記述する。

| ID | 内容 | 照合元 | 確認観点 | 指摘とする条件 |
|---|---|---|---|---|
| C1 | ビルドが通る | `npm run build` | 終了コード、出力された警告 | 失敗した場合。警告が出た場合も報告する |
| C2 | 型チェックが通る | `npm run check` | svelte-check と tsc のエラー・警告 | エラー・警告が 1 件以上ある場合 |
| C3 | テストが通る | `npm run test` | 失敗したテスト | 失敗したテストがある場合 |
| C4 | コーディング規約に従っている | `npm run lint`、`docs/coding-guidelines.md`、`docs/architecture.md` の「設計方針」 | lint の結果。lint で表現できない規約（ファイル配置、ロジックの分離、論理座標の定数の使用など） | lint の違反がある場合。規約に反するコードがある場合 |
| C5 | 依存パッケージの制約に従っている | `npm run check-deps`、`docs/architecture.md` の「依存パッケージ」 | 直接依存しているパッケージごとの推移的な依存数 | 30 以上のパッケージがある場合 |
| C6 | 実装と仕様に齟齬がない | task: requirements.md / plan.md / 関連する spec。project: `docs/spec/` | 仕様に書かれたことが実装されているか、実装が仕様と異なっていないか、仕様にない変更をしていないか | 未実装、仕様と異なる実装、仕様の範囲外の変更がある場合 |
| C7 | ドキュメント間に齟齬がなく、過不足がない | `docs/`（`docs/tasks/` を除く）、`AGENTS.md` | ドキュメント同士の矛盾、ドキュメントとコードの不一致（ファイル名・定数名・値など）、`AGENTS.md` の docs 構成図と実際のファイルの一致、ソースコードに現れる固有の概念が `docs/glossary.md` にあるか | 矛盾・不一致がある場合、記述が不足している場合、実態のない記述が残っている場合 |

- C1〜C5 は npm scripts を実行してその結果で判定する。scope に関わらずプロジェクト全体を対象とする（npm scripts の対象がプロジェクト全体のため）
- C4 の判断部分・C6・C7 は scope に応じて対象のファイルを読んで判断する
- C4 の判断部分の対象は、`project` scope では `src/` と `tests/`、`task` scope では変更ファイルのうち `src/` と `tests/` 以下のものとする

### scope
- `task`: `task=<タスクディレクトリ名>` で指定する（例: `task=20261015-health-check`）
  - 対象: `docs/tasks/<タスク>/` の requirements.md / plan.md（存在する場合）、変更ファイル、関連する spec
  - 変更ファイルは `git status` / `git diff` で特定する（未追跡のファイルも含める）
  - 関連する spec は、requirements.md / plan.md から参照されている spec と、変更ファイルが該当する機能の spec とする
- `project`: `docs/`（`docs/tasks/` を除く）と `src/`・`tests/` を対象とする
  - C6 の照合元は `docs/spec/` のみとする

### 実行ルール
- チェック中にソース・ドキュメントの修正は行わない（修正はユーザの指示を受けてから行う）
- 指摘は `[ID] 場所 — 内容 — 根拠` の形式で報告する
  - 場所は `ファイルパス:行番号` の形式とする（ファイル全体・複数箇所に関わる場合はファイルパスのみでよい）
  - 根拠には参照したドキュメントの箇所を示す（例: `docs/spec/layout.md「論理座標」`）
- 判断できない点は推測で問題なしとせず「不明」として報告する
- 報告の最後に、実行したチェック項目ごとの結果（指摘の有無）を一覧で示す。実行しなかった項目も、実行していないことがわかるようにする

報告の例:

```
[C6] src/scenes/Play.svelte:5 — viewBox が 0 0 360 600 になっている — docs/spec/layout.md「論理座標」
[C7] docs/architecture.md — 不明: 「Stage は App.svelte 内に直接記述する」が今も意図した設計か判断できない — docs/spec/layout.md「Stage の配置」

| ID | 結果 |
|---|---|
| C1 | OK |
| ... | ... |
| C6 | 指摘 1 件 |
| C7 | 不明 1 件 |
```

### C6・C7 の実行方法（検討事項の結論）
C6・C7 はサブエージェント（新しいコンテキスト）で実行する。

- 理由
  - Workflow 5 では実装した agent 自身がチェックすることになり、実装中の判断や会話の内容に引きずられて「問題なし」としやすい。新しいコンテキストで docs とコードだけを読ませることで、ドキュメントに書かれていないことは判断材料にならず、ドキュメントの不足も見つかりやすくなる
  - docs やコードを広く読むため、メインのコンテキストを圧迫しない
- 方法
  - メインの agent が C1〜C5 を実行し、C6・C7 は general-purpose のサブエージェントに依頼する
  - 依頼のプロンプトには SKILL.md のパス、対象のチェック項目、scope、変更ファイルの一覧を渡し、SKILL.md の定義に従って指摘を返すよう指示する。修正を行わないことも明示する
  - メインの agent はサブエージェントの指摘を C1〜C5 の結果とあわせて報告する。サブエージェントの指摘は取捨選択せずそのまま報告する

### `/health-check` の引数
- 形式: `/health-check [チェック項目] [scope]`。順不同
  - チェック項目: `C1,C3` のようにカンマ区切りで指定する
  - scope: `task=<タスクディレクトリ名>` または `project`
  - 例: `/health-check C1,C3 task=20261015-xxx`、`/health-check C6`
- 指定がない場合は全項目・`project` scope で実行する
- 解釈できない引数がある場合は、チェックを実行せずユーザに確認する
- SKILL.md の frontmatter に `argument-hint` を書き、本文では `$ARGUMENTS` で引数を受け取る
- C1〜C5 のうち一部だけが指定された場合は、`npm run verify` ではなく該当する npm scripts を個別に実行する

### SKILL.md の構成
```
---
name: health-check
description: プロジェクトの健全性チェック（ビルド・型・テスト・コーディング規約・依存パッケージ・仕様との整合・ドキュメントの整合）を実行する
argument-hint: "[C1,C2,...] [task=<タスクディレクトリ名> | project]"
---

# Health Check
## 引数
## scope
## チェック項目（C1〜C7 の表）
## 実行手順
  1. 引数の解釈
  2. task scope の場合、変更ファイルの特定（git status / git diff）
  3. C1〜C5 の実行（npm run verify または個別の npm scripts）
  4. C6・C7 のサブエージェントへの依頼
  5. 結果の報告
## 報告形式
```

### npm scripts（`package.json`）
- `"check-deps": "node scripts/check-deps.ts"`: C5 の依存数の集計
- `"verify": "node scripts/verify.ts"`: C1〜C5 の一括実行

### 依存数の集計（`scripts/check-deps.ts`、新規）
- 外部パッケージを使わず、Node の標準モジュールのみで書く
- TypeScript で書き、Node で直接実行する（Node 24 の型の除去による実行。`tsconfig.node.json` の `erasableSyntaxOnly` の範囲で書く）
- 処理
  1. `package.json` の `dependencies` と `devDependencies` を集計の対象とする
  2. `node_modules/.package-lock.json`（npm がインストール時に作る、実際にインストールされたパッケージの一覧）を読む
     - ルートの `package-lock.json` は使わない。他のプラットフォーム用のバイナリなど、インストールされない optional な依存も含まれており、件数が実態より多くなるため
     - ファイルがない場合は `npm install` を促すメッセージを出して失敗する
  3. 対象パッケージごとに `dependencies` と `optionalDependencies` を再帰的に辿り、重複を除いた件数を数える
     - 依存の解決は Node のモジュール解決と同様に、`node_modules` を親ディレクトリ方向に探す
     - インストールされていない依存（optional で入っていないもの）は数えない
     - `peerDependencies` は数えない
     - パッケージ自身は数えない
  4. パッケージごとの件数を一覧で出力し、30 以上のものがあれば違反として示し、終了コード 1 で終了する
- 上限値（30）はスクリプト内の定数とし、`docs/architecture.md` の「依存パッケージ」を参照するコメントを付ける

出力の例:

```
@biomejs/biome                   1
...
vitest                          22
OK: すべてのパッケージの推移的な依存が 30 未満です
```

### 一括実行（`scripts/verify.ts`、新規）
- `npm run build` / `check` / `test` / `lint` / `check-deps` を順に実行する
  - `child_process.spawnSync` で実行し、各コマンドの出力はそのまま表示する
  - 途中で失敗しても残りをすべて実行する
- 最後にチェック項目ごとの結果を一覧で出力し、1 つでも失敗があれば終了コード 1 で終了する

```
== verify ==
C1 build       OK
C2 check       OK
C3 test        NG
C4 lint        OK
C5 check-deps  OK
```

### scripts/ の型チェックと lint
- `tsconfig.node.json` の `include` に `scripts/**/*.ts` を追加する（`npm run check` の `tsc -p tsconfig.node.json` で型チェックされる）
  - `tsconfig.node.json` は Node 向けの設定（`types: ["node"]`、`allowImportingTsExtensions`、`erasableSyntaxOnly`）で、Node で直接実行するスクリプトに合っている
- `biome.json` の `files.includes` に `scripts/**/*.ts` を追加する
- scripts/ はテストの対象にしない（`docs/architecture.md` の「テスト」でテストの対象を `src/lib/` としているため）

### `docs/coding-guidelines.md`（新規）
既存のコードと `docs/architecture.md` から読み取れる方針を整理する。architecture.md と重複する内容は参照にとどめる。

- 全般
  - TypeScript で書く。Svelte コンポーネントは `<script lang="ts">` とし、Svelte 5 の runes（`$state` など）を使う
  - コメントは日本語で書く
  - import は相対パスで書く
- ファイル配置
  - Scene は `src/scenes/`、ゲームロジックは `src/lib/`、テストは `tests/` に置く（詳細は architecture.md の「コンポーネント構成」「設計方針」「テスト」）
- 論理座標
  - Scene 内の座標・サイズは `STAGE_WIDTH` / `STAGE_HEIGHT` を基準にし、360 / 640 を直接書かない
- スタイル
  - コンポーネント固有のスタイルはコンポーネントの `<style>` に書き、全体に関わるスタイルは `src/app.css` に書く
- lint の行数制限を超えた場合の分割方針
  - 関数（50 行）: 処理のまとまりごとに関数に切り出す。ゲームロジックであれば `src/lib/` の別ファイルの純粋関数として切り出す
  - ファイル（300 行）: Svelte コンポーネントは、レーン・ノーツなどの部品ごとに `<g>` をルートにした子コンポーネントに分ける。`src/lib/` は 1 関数 1 ファイルの方針に従って分ける
  - lint のルールを無効化（`biome-ignore`）して回避しない
- セミコロンの有無は規約にしない
  - 現状はファイルによって異なる（`src/main.ts` はなし、`src/lib/stage.ts` や `.svelte` はあり）
  - Biome にはセミコロンの lint ルールがなく、formatter の設定（`javascript.formatter.semicolons`）でしか扱えない。formatter は `20261015-lint` で無効にしているため、lint ではチェックできない
  - lint でチェックできない規約にすると、既存ファイルが C4 の判断部分で毎回指摘されるため、今回は書かない。統一する場合は formatter の導入として別タスクで扱う

### AGENTS.md の更新
- Commands に以下を追記する
  - `- 一括チェック（build・check・test・lint・check-deps）: npm run verify`
  - `- 依存パッケージ数の確認: npm run check-deps`
- Workflow 5 の「`npm run check` および `npm run build` が通ることを確認する」を以下に置き換える
  - `Health Check（C1〜C6、task scope）を実行する（「Health Check」の節を参照）`
- Workflow 7 の末尾に以下を追記する
  - `ドキュメント反映後、Health Check（C6・C7、project scope）を実行し、結果をユーザに報告する`
- Health Check の節を新設する（Workflow の節の後）
  - チェックの定義は `.claude/skills/health-check/SKILL.md` にあること
  - 呼び出し元ごとの実行内容（requirements.md の表をそのまま記載する）
  - 指摘の報告後、対応はユーザが決めること
- Git の節を以下に変更する
  - `agent は git 操作を行わない。ただし、読み取り専用の git status / git diff は実行してよい。それ以外が必要な場合はユーザに操作を依頼する。`
- docs の構成図に `+ coding-guidelines.md  # コーディング規約（lint で表現できないもの）` を追記する

## 変更対象ファイル
- `.claude/skills/health-check/SKILL.md`（新規）
- `scripts/check-deps.ts`（新規）
- `scripts/verify.ts`（新規）
- `package.json`（変更: `check-deps` / `verify` スクリプトの追加）
- `tsconfig.node.json`（変更: `include` に `scripts/**/*.ts` を追加）
- `biome.json`（変更: `files.includes` に `scripts/**/*.ts` を追加）
- `docs/coding-guidelines.md`（新規）
- `AGENTS.md`（変更）

`src/` / `tests/` 以下は変更しない。パッケージの追加はしない。

## 確認方法
- `npm run check-deps` がパッケージごとの件数を出力し、成功する。件数が事前の手動集計（vitest 22、svelte 18、vite 14 など）と一致する
  - 上限値を一時的に 20 にすると、vitest が違反として示され、終了コード 1 になる（確認後に元に戻す）
- `npm run verify` が C1〜C5 を実行し、一覧を出力して成功する
  - テストをわざと失敗させると、残りの項目も実行されたうえで C3 が NG になり、終了コード 1 になる（確認後に元に戻す）
- `npm run check` / `npm run lint` が scripts/ を含めて通る
- `/health-check` を引数なしで実行し、全項目・project scope で報告形式どおりに報告される
- `/health-check C1,C3 task=20261015-health-check` を実行し、指定した項目・scope だけが実行される

## 作業完了後のドキュメント反映（Workflow 7 の想定）
- `docs/coding-guidelines.md` と AGENTS.md は本タスク内で作成・更新するため、追加の反映は原則不要
- `docs/architecture.md`: 開発用スクリプト（`scripts/`）の置き場所と、Node で TypeScript を直接実行する方針を追記するか検討する
- `docs/decisions/`: C6・C7 をサブエージェントで実行する判断を ADR として残すか検討する

## 確認事項
なし（以下は確認済み）

- `scripts/` を TypeScript で書き Node で直接実行する（Node 22.18 / 23.6 以降が必要。現在の環境は Node 24.21）
- C4 の判断部分の対象に `tests/` を含める
- セミコロンは規約にしない（`docs/coding-guidelines.md` の節を参照）
- 「`biome-ignore` で回避しない」を新しい規約として入れる
