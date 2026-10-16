# AGENTS.md

## Project Overview
see README.md

## Commands
- 依存関係のインストール: `npm install`
- 開発サーバの起動: `npm run dev -- --host`
- 型チェック: `npm run check`
- ビルド: `npm run build`
- lint: `npm run lint`
- テスト: `npm run test`

### スクリーンショットの取得手順
`npm run dev -- --host` を起動した状態で、プロジェクトのルートで以下を実行する。

```sh
npx playwright-cli open http://localhost:5173/
npx playwright-cli resize 390 844
npx playwright-cli screenshot --filename=screenshots/390x844.png
# サイズごとに resize / screenshot を繰り返す
npx playwright-cli close
```

- 確認に使う主なサイズ: 360×640、390×844、844×390、1280×720
- 取得した画像は agent が読み込んで確認する
- playwright-cli の詳しい使い方は `.claude/skills/playwright-cli/SKILL.md` を参照する（コマンドは `npx playwright-cli` として実行する）

## Workflow
Spec-Driven Development を原則とし、実装時には具体的には以下のルールに従う。

1. 一作業単位ごとに `docs/tasks/YYYYMMDD-<short-task-name>` でディレクトリを作成する

   - 以降のワークフローのファイルはこのディレクトリ以下に作成する
   - ディレクトリはユーザが作成する場合と、agent が対話中の指示により作成する場合がある

2. requirements.md を作成する。

   - このファイルには機能要求や実装上の条件が記述される
   - このファイルはユーザが直接作成・更新する場合と、agent が対話中の指示により作成・更新する場合がある

3. ユーザが作業計画の作成を指示した場合、agent は requirements.md および docs/tasks 以下の別タスクを除いた docs 以下のドキュメントを元にタスクディレクトリに plan.md を作成する

   - このファイルには実装の基本的なロジックやこの作業により追加・または変更されるモデル（用語、概念）を記述する
   - plan.md はタスクごとに任意で作成する。

4. ユーザが agent に実装指示を出す

   - plan.md が存在する場合、agent は requirements.md および plan.md に基づき実装する
   - plan.md が存在せず、ユーザから plan.md が不要であることが明示された状態で実装指示した場合、agent は requirements.md に基づいた実装を行う
   - 実装中に plan.md で想定していない設計上の判断が必要になった場合、原則として作業を継続し、判断内容と理由を notes.md に記録する

     - 命名や局所的な実装詳細など、仕様・設計に影響しない判断は記録不要とする
     - requirements.md の範囲を超える変更が必要な場合は、実装せずユーザに確認する
     - (NOTE:) これは本来であれば plan.md にあらかじめ記載されていることが望ましいが、実装してみないとわからないパターンがあることを想定している。

5. 実装完了後、agent は検証を行いユーザに報告する

   - `npm run check` および `npm run build` が通ることを確認する
   - 画面やUIの実装時はブラウザのスクリーンショットを取得し、表示内容を確認する
   - 変更したファイルの概要、notes.md に追記した内容、未解決の事項をユーザに報告する

6. ユーザが動作確認・コードレビューを行う

   - 修正が必要な場合は 4. に戻る
   - notes.md から plan.md に内容を反映して実装指示を再実行する場合もある。

7. 作業完了後、ユーザの指示により agent はタスクの成果を docs/ 以下のドキュメントに反映する

   - plan.md / notes.md で追加・変更されたモデル（用語、概念）や設計上の決定を、タスクディレクトリ外の docs/ 以下のドキュメントに反映する
   - 以降の作業では、docs/tasks/ 以下を遡らなくても docs/ 以下のドキュメントで現在の仕様・設計が把握できる状態を保つ
   - アーキテクチャ上の重要な意思決定・設計判断が含まれる場合、decisions/ 以下に判断理由を含めて記録を残す

8. ユーザがドキュメントを含めて全体確認し、問題がなければ commit する

## docs
- そのタスクによりドキュメントが変更される場合を除いて、docs 以下の内容と矛盾が無いように実装する
- docs は以下の場合に更新される
  - ユーザが直接更新する
  - agent への指示で更新する
  - agent が workflow 7 のドキュメント反映で更新する
- docs は以下のファイルを持つ

```
docs/
  + proposal.md  # プロジェクトの目的・スコープ・全体要件
  + architecture.md  # プロジェクトの基本的な設計
  + glossary.md  # 用語集（プロジェクト固有の概念ソースコードに現れる用語、またはそれらが表す概念のみ）
  + spec/  # 仕様
    + ${feature_name}.md # 機能ごとの仕様、実装前に記述されたタスク内容がここに反映される
  + decisions/   # ADR: アーキテクチャについての検討内容を記録したもの
    + 001-xxx.md
  + tasks/ # 個別作業
```

## Git
- agent は git 操作を行わない。必要な場合はユーザに操作を依頼する。

## Boundaries (制限事項)
- agent はユーザの指示なしに plan.md を作成しない
- 作業計画(plan.mdの作成)の指示があった場合、plan.md がユーザに承認され、実装指示が出るまで実装を開始しない
- requirements.md / plan.md の範囲外の変更を行わない（必要と判断した場合はユーザに提案する）

## skills
- .claude/skills/playwright-cli: `npx playwright-cli install --skill` で取得したので、編集しないようにする
