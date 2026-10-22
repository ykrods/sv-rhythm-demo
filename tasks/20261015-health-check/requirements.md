# requirements: health-check

## 目的
プロジェクトの健全性チェック（ビルド・型・テスト・コーディング規約・仕様との整合・ドキュメントの整合・依存パッケージの制約）を、エージェントが一貫した手順で実行できるようにする。
チェックはワークフロー内から実行する場合と、ユーザの指示で単独実行する場合の両方に対応し、チェックの定義は 1 か所にまとめる。

## タスク種別
実装（開発環境の設定）＋ ドキュメンテーション

## 前提
- `AGENTS.md`
- `docs/architecture.md`
- `20261015-lint` が完了していること（`npm run lint` が使える）
- `20261015-test` が完了していること（`npm run test` が使える）

## やること
- チェック項目の定義
  - 以下の 7 項目を ID 付きで定義する

    | ID | 内容 | 種別 |
    |---|---|---|
    | C1 | ビルドが通る | 機械的 |
    | C2 | TypeScript / Svelte の型チェックが通る | 機械的 |
    | C3 | テストが通る | 機械的 |
    | C4 | ソースコードがコーディング規約に従っている | 機械的（lint）＋ 判断 |
    | C5 | 依存パッケージが `docs/architecture.md` の制約（推移的な依存 30 未満）に従っている | 機械的 |
    | C6 | 実装が仕様（docs/spec, requirements.md, plan.md）と齟齬がない | 判断 |
    | C7 | ドキュメント間に齟齬がなく、内容に過不足がない | 判断 |

  - 各項目について「照合元」「確認観点」「指摘とする条件」を記述する
- 範囲（scope）の定義
  - `task`: 指定タスクの requirements.md / plan.md、変更ファイル、関連する spec を対象とする
    - 変更ファイルは `git status` / `git diff` で特定する
  - `project`: docs/ 全体と src/・tests/ 全体を対象とする
    - C6 の照合元は docs/spec のみとする（requirements.md / plan.md は対象外）
- 実行ルール
  - チェック中にソース・ドキュメントの修正は行わない（修正はユーザの指示を受けてから行う）
  - 指摘は `[ID] 場所 — 内容 — 根拠` の形式で報告する
    - 根拠には参照したドキュメントの箇所を示す
    - 重要度は付けない。指摘はすべてユーザに報告し、対応はユーザが決める
  - 判断できない点は推測で問題なしとせず「不明」として報告する
- npm scripts の追加
  - `npm run verify`: 機械的チェック（C1〜C5 の build・check・test・lint・依存数の集計）をまとめて実行する
    - 途中で失敗しても全項目を実行し、最後に結果をまとめて報告する
  - C5 の依存数の集計スクリプトを外部パッケージを使わずに作成する
    - 推移的な依存を含めて数え、devDependencies も対象とする。peerDependencies は含めない
- コーディング規約ドキュメントの作成（C4 の判断部分）
  - `docs/coding-guidelines.md` を作成し、lint で表現できない規約を記述する
    - 例: ファイル・関数が lint の行数制限を超えた場合の分割方針
  - 初版は既存コード（src/）と `docs/architecture.md` から読み取れる方針を整理したものとする
- チェック手順の定義ファイル
  - `.claude/skills/health-check/SKILL.md` に上記の定義・scope・実行ルールを記述する
  - `/health-check` で単独実行でき、引数でチェック項目と scope を指定できるようにする
    - 例: `/health-check C1,C3 task=20261015-xxx`
    - 指定がない場合は全項目・`project` scope で実行する
- AGENTS.md の更新
  - Health Check の節を追加し、呼び出し元ごとの実行内容を記述する

    | 呼び出し元 | 実行するチェック | scope | 結果の出し先 |
    |---|---|---|---|
    | Workflow 5（実装後） | C1–C6 | task | ユーザへの報告 |
    | Workflow 7（docs 反映後） | C6, C7 | project | ユーザへの報告 |
    | ユーザの指示（単独実行） | 指定がなければ全部 | 指定がなければ project | 会話内で報告 |

  - Workflow 5 の「`npm run check` および `npm run build` が通ることを確認する」を Health Check の参照に置き換える
  - Commands に `npm run verify` を追記する
  - Git の節に、読み取り専用の `git status` / `git diff` は許可することを追記する
  - docs の構成図に `coding-guidelines.md` を追記する

## やらないこと
- チェックで検出された既存の問題の修正（報告のみとし、修正は別タスクとする）
- CI（GitHub Actions など）への組み込み
- Claude Code の hooks によるチェックの強制実行

## 検討事項（plan.md で決める）
- C6・C7 をサブエージェント（新しいコンテキスト）で実行するかどうか
