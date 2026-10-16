// 機械的チェック（C1〜C5）を順に実行し、結果をまとめて表示する
// チェック項目の定義は .claude/skills/health-check/SKILL.md を参照
import { spawnSync } from 'node:child_process'

const CHECKS = [
  { id: 'C1', script: 'build' },
  { id: 'C2', script: 'check' },
  { id: 'C3', script: 'test' },
  { id: 'C4', script: 'lint' },
  { id: 'C5', script: 'check-deps' },
]

// 途中で失敗しても残りのチェックをすべて実行する
const results = CHECKS.map(({ id, script }) => {
  console.log(`\n== ${id} npm run ${script} ==`)
  const { status } = spawnSync('npm', ['run', script], { stdio: 'inherit' })
  return { id, script, ok: status === 0 }
})

console.log('\n== verify ==')
for (const { id, script, ok } of results) {
  console.log(`${id} ${script.padEnd(12)}${ok ? 'OK' : 'NG'}`)
}

process.exitCode = results.every(({ ok }) => ok) ? 0 : 1
