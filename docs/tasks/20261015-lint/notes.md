# notes: lint

## Biome のバージョン固定
- `@biomejs/biome` は `^` を付けず完全一致（`2.5.15`）で固定した
  - 理由: `.svelte` の markup 解析（`html.experimentalFullSupportEnabled`）が実験的機能であり、マイナーバージョンアップでも lint 結果が変わる可能性があるため。更新は動作を確認したうえで明示的に行う

## 推奨ルールの指定方法
- 推奨ルールは `linter.rules.preset: "recommended"` で有効にした
  - Biome 2.5 では `linter.rules.recommended: true` は非推奨（次のメジャーバージョンで削除予定）となっているため

## assist の無効化
- `assist`（import の並び替えなど）は無効にした
  - 理由: `npm run lint`（`biome lint`）では実行されないが、エディタ拡張などから意図せずコードが書き換わらないようにするため。requirements.md の「lint 機能のみを使う」に合わせた

## 行数の数え方
- `noExcessiveLinesPerFunction` は関数本体の行数を数える（関数宣言の行・閉じ括弧の行は含まない）。ESLint の `max-lines-per-function` より数行少なく数えられる
- 動作確認時、関数内のコメント行は行数に数えられなかった（Biome の仕様として明記されている設定はない。ファイル単位のコメント行の扱いは未確認）
