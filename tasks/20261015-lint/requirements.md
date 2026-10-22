# requirements: lint

## 目的
ソースコードの規模と構造を機械的にチェックできるようにする。
細かいコードスタイルの統一よりも、関数・ファイルが大きくなりすぎていないかを検出して、コンポーネント設計の見直しを促すことを主な目的とする。

## タスク種別
実装（開発環境の設定）

## 前提
- `docs/architecture.md`

## やること
- Biome の導入
  - 設定ファイルは `biome.json` とする
  - lint 機能のみを使う（formatter は無効にする）
  - `.svelte` ファイルの markup も解析対象にするため、HTML の完全サポート（`html.experimentalFullSupportEnabled`）を有効にする
    - 実験的機能のため、Biome のバージョンアップ時に挙動が変わる可能性がある
  - 理由: ESLint（eslint-plugin-svelte / typescript-eslint）は依存パッケージが多いため（ESLint 構成で約 100 パッケージ、Biome は 2 パッケージ）
    - Svelte 固有のルール（`{#each}` の key、rune の誤用など）がチェックできなくなることは許容する
- 規模・構造に関するルールの設定(後述)
- npm scripts の追加
  - `npm run lint`: lint を実行する（自動修正はしない）
- AGENTS.md の Commands に `npm run lint` を追記する

## やらないこと
- lint で検出された既存コードの違反の修正（違反の一覧をユーザに報告するのみとし、修正は別タスクとする）
- ヘルスチェックへの組み込み（`20261015-health-check` で行う）
- コーディング規約ドキュメント（`docs/coding-guidelines.md`）の作成（`20261015-health-check` で行う）
- CI への組み込み
- format ツールの導入（Biome の formatter も使わない。一旦スコープ外）
- 分岐の多さ（`noExcessiveCognitiveComplexity`）、ネストの深さなどのチェック（一旦スコープ外）

## lint のルール設定
- `src/` 以下の `.ts`, `.svelte` ファイルを対象とする
- 推奨ルールセット（recommended）を有効にする
- 以下のルールに違反した場合は `error` にする

  - 1 関数 50 行以内（`complexity/noExcessiveLinesPerFunction`）
  - 1 ファイル 300 行以内（`style/noExcessiveLinesPerFile`）
    - `.svelte` ではファイル全体（script・markup・style）が対象になる
  - いずれも空行は数えない
    - コメント行の扱いは設定できないため、Biome の仕様に従う
