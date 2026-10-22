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
- 依存パッケージ数の確認: `npm run check-deps`
- 一括チェック（build・check・test・lint・check-deps）: `npm run verify`

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

1. 一作業単位ごとに `tasks/YYYYMMDD-<short-task-name>` でディレクトリを作成する。以降、これをタスクディレクトリと表記する。

   - 以降のワークフローのファイルはタスクディレクトリ以下に作成する
   - タスクディレクトリはユーザが作成する場合と、agent が対話中の指示により作成する場合がある

2. requirements.md を作成する。

   - このファイルには機能要求や実装上の条件が記述される
   - このファイルはユーザが直接作成・更新する場合と、agent が対話中の指示により作成・更新する場合がある

3. ユーザが作業計画の作成を指示した場合、agent は requirements.md および docs 以下のドキュメントを元にタスクディレクトリに plan.md を作成する

   - このファイルには実装の基本的なロジックやこの作業により追加・または変更されるモデル（用語、概念）を記述する
   - plan.md の作成はタスクごとに任意とし、作業内容が明確もしくは簡潔な場合、ユーザが plan.md を作成を省略して実装指示する場合もある。

4. ユーザが agent に実装指示を出す

   - agent はタスクディレクトリ以下のドキュメントおよび `docs/` 以下の内容に基づき実装する
     - そのタスクにより `docs/` 以下の内容を更新する場合を除いて、 `docs/` 以下の内容と矛盾が無いように実装する
   - 実装中に初めて architecture / glossary / ADR の更新が必要になった場合、agent は notes.md に記録してユーザへ提案し、ユーザの指示を待つ。
   - 実装中に plan.md で想定していない設計上の判断が必要になった場合、原則として作業を継続し、判断内容と理由を notes.md に記録する

     - 命名や局所的な実装詳細など、仕様・設計に影響しない判断は記録不要とする
     - requirements.md の範囲を超える変更が必要な場合は、実装せずユーザに確認する
     - (NOTE:) これは本来であれば plan.md にあらかじめ記載されていることが望ましいが、実装してみないとわからないパターンがあることを想定している。

5. 実装完了後、agent は検証を行いユーザに報告する

   - Health Check（C1〜C6、task scope）を実行する（「Health Check」の節を参照）
   - 画面やUIの実装時はブラウザのスクリーンショットを取得し、表示内容を確認する
   - 変更したファイルの概要、notes.md に追記した内容、未解決の事項をユーザに報告する

6. ユーザが動作確認・コードレビューを行う

   - 修正が必要な場合は 4. に戻る
   - notes.md から plan.md に内容を反映して実装指示を再実行する場合もある。

7. 作業完了後、ユーザの指示により agent は実装した内容を `docs/spec` 以下のドキュメントに反映する

   - 実装だけでなく `requirements.md`, `plan.md` とも整合させた上で、実装が妥当と判断できる外部仕様を記載する
   - 以降の作業で、`tasks/` 以下を遡らなくても `docs/` 以下のドキュメントで現在の仕様・設計が把握できる状態を保つ
   - `docs/spec` 以外のドキュメントの更新はこのステップの範囲外とする
   - ドキュメント反映後、Health Check（C6・C7、project scope）を実行し、結果をユーザに報告する

8. ユーザがドキュメントを含めて全体確認し、問題がなければ commit する

## Health Check
- プロジェクトの健全性チェック（C1〜C7）の定義・scope・実行手順は `.claude/skills/health-check/SKILL.md` にまとめる
- 呼び出し元ごとに以下を実行する

| 呼び出し元 | 実行するチェック | scope | 結果の出し先 |
|---|---|---|---|
| Workflow 5（実装後） | C1–C6 | task | ユーザへの報告 |
| Workflow 7（docs 反映後） | C6, C7 | project | ユーザへの報告 |
| ユーザの指示（単独実行） | 指定がなければ全部 | 指定がなければ project | 会話内で報告 |

- 指摘はすべてユーザに報告し、対応はユーザが決める（チェック中に修正は行わない）

## docs
目的や構成は `docs/index.md` に記載してあるので必要に応じて参照する。

### ドキュメントの更新ルール
- `docs/spec/` 以下は、原則的にタスク内の Workflow 7. で更新する。
  - 例外は、用語の定義を後から変更する場合など、実装を伴わない場合
- `docs/spec/` 以外の用語集・ADRの追加判断はユーザが行う。
  - ユーザがタスクの作業中にアーキテクチャや用語、ADRを追加する指示を出す場合もあるが、これはタスクの前提作業であり、タスクの範囲外とする。

## Git
- agent は git 操作を行わない。ただし、読み取り専用の `git status` / `git diff` は実行してよい。それ以外が必要な場合はユーザに操作を依頼する。

## Boundaries (制限事項)
- agent はユーザの指示なしに plan.md を作成しない
- 作業計画(plan.mdの作成)の指示があった場合、plan.md がユーザに承認され、実装指示が出るまで実装を開始しない
- requirements.md / plan.md の範囲外の変更を行わない（必要と判断した場合はユーザに提案する）

## skills
- .claude/skills/playwright-cli: `npx playwright-cli install --skill` で取得したので、編集しないようにする
