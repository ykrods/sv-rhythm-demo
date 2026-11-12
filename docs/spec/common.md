# common

アプリケーション全体に共通する挙動の仕様。

## Scene の切り替え
Scene の切り替え時は svelte の `fade` transition（デフォルトのパラメータ: 400ms、linear）で切り替える。

- 前の Scene のフェードアウトと次の Scene のフェードインを同時に行い、フェード中は両 Scene を Stage 内で重ねて表示する
- フェードの終了後、前の Scene は取り除かれる
- ページの初回表示時の Scene はフェードしない
