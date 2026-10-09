# AGENTS.md

## Project Overview
see README.md

## Commands
- 依存関係のインストール: `bun install`
- 開発サーバの起動: `bun run dev`
- 型チェック: `bun run check`
- ビルド: `bun run build`

## Workflow
Spec-Driven Development を原則とし、具体的には以下のルールに従う。

1. 一作業単位ごとに `docs/tasks/YYYYMMDD-${shorten-task-name}` でディレクトリを作成する

   - 以降のワークフローのファイルはこのディレクトリ以下に作成する
   - ディレクトリはユーザが作成する場合と、agent が対話中の指示により作成する場合がある
   - このタスクには実装とドキュメンテーションがあり、ドキュメンテーションでは 3〜5 の実装ステップはスキップし、requirements.md を元に docs/ 以下を直接作成・更新する

2. requirements.md を作成する。

   - このファイルには機能要求や実装上の条件が記述される
   - このファイルはユーザが直接作成・更新する場合と、agent が対話中の指示により作成・更新する場合がある

3. ユーザが作業計画の作成を指示した場合、agent は requirements.md および docs 以下のドキュメントを元にタスクディレクトリに plan.md を作成する

   - このファイルには実装の基本的なロジックやこの作業により追加・または変更されるモデル（用語、概念）を記述する

4. plan.md をユーザが確認し、問題なければ実装指示を出す

   - 実装は plan.md を元に行い、作業中に plan.md に記載がない意思決定が発生した場合 decisions.md を作成し、そこに記載する
   - これは plan.md にあらかじめ記載されていることが望ましいが、実装してみないとわからないパターンがあることを想定している。また、decisions.md から plan.md に内容を反映して実装指示を再実行する場合もある。
   - 意思決定が発生しても agent は作業を止めず、decisions.md に記録した上で実装を続行する
   - decisions.md の各項目には、判断した内容・理由・検討した他の選択肢を記載する

5. 実装完了後、agent は検証を行いユーザに報告する

   - `bun run check` および `bun run build` が通ることを確認する
   - 変更したファイルの概要、decisions.md に追記した内容、未解決の事項をユーザに報告する

6. ユーザが動作確認を行い、問題がなければ commit する

   - 修正が必要な場合は 4. に戻る

7. 作業完了後、ユーザの指示により agent はタスクの成果を docs/ 以下のドキュメントに反映する

   - plan.md / decisions.md で追加・変更されたモデル（用語、概念）や設計上の決定を、タスクディレクトリ外の docs/ 以下のドキュメントに反映する
   - 以降の作業では、docs/tasks/ 以下を遡らなくても docs/ 以下のドキュメントで現在の仕様・設計が把握できる状態を保つ

## docs
- そのタスクによりドキュメントが変更される場合を除いて、docs 以下の内容と矛盾が無いように実装する
- docs はユーザが更新する場合と agent が workflow 7 のドキュメント反映で更新する場合がある
- docs は以下のファイルを持つ

```
docs/
  + proposal.md  # プロジェクトの目的・スコープ・全体要件
  + architecture.md  # プロジェクトの基本的な設計
  + glossary.md  # 用語集
  + spec  # 仕様
    + ${feature_name}.md # 機能ごとの仕様、実装前に記述されたタスク内容がここに反映される
```

## Git
- agent は commit 操作をしてはいけない。commit は人間が行う。

## Boundaries (制限事項)
- ユーザの指示なしに plan.md を作成しない
- plan.md がユーザに承認され、実装指示が出るまで実装を開始しない
- requirements.md / plan.md の範囲外の変更を行わない（必要と判断した場合はユーザに提案する）
