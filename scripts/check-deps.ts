// 直接依存しているパッケージごとに、推移的な依存の数を集計する
// 制約の内容は docs/architecture.md の「依存パッケージ」を参照
import { existsSync, readFileSync } from 'node:fs'

// 推移的な依存の数の上限（この値以上を違反とする）
const MAX_DEPENDENCIES = 30

const LOCKFILE = 'node_modules/.package-lock.json'

type LockPackage = {
  dependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

type PackageJson = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

// Node のモジュール解決と同様に、from から親ディレクトリ方向に node_modules/<name> を探す
// from は lockfile のキー（例: "node_modules/vite"）。ルートは ""
function resolve(
  packages: Record<string, LockPackage>,
  from: string,
  name: string,
): string | null {
  let base = from
  while (true) {
    const path = `${base ? `${base}/` : ''}node_modules/${name}`
    if (packages[path]) return path
    if (!base) return null
    const index = base.lastIndexOf('/node_modules/')
    base = index < 0 ? '' : base.slice(0, index)
  }
}

// dependencies と optionalDependencies を再帰的に辿り、インストールされている依存のパスを集める
// peerDependencies は辿らない
function collect(
  packages: Record<string, LockPackage>,
  path: string,
  found: Set<string>,
): Set<string> {
  const pkg = packages[path]
  const names = Object.keys({
    ...pkg.dependencies,
    ...pkg.optionalDependencies,
  })
  for (const name of names) {
    const resolved = resolve(packages, path, name)
    if (!resolved || found.has(resolved)) continue
    found.add(resolved)
    collect(packages, resolved, found)
  }
  return found
}

function main(): number {
  if (!existsSync(LOCKFILE)) {
    console.error(`${LOCKFILE} がありません。npm install を実行してください`)
    return 1
  }
  const packages = readJson<{ packages: Record<string, LockPackage> }>(
    LOCKFILE,
  ).packages
  const pkg = readJson<PackageJson>('package.json')
  const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })

  const violations: string[] = []
  const width = Math.max(...names.map((name) => name.length)) + 2
  for (const name of names.sort()) {
    const path = resolve(packages, '', name)
    if (!path) {
      console.error(`${name} がインストールされていません`)
      return 1
    }
    // 依存が循環して自身に戻った場合も、パッケージ自身は数えない
    const found = collect(packages, path, new Set())
    found.delete(path)
    const count = found.size
    const mark = count >= MAX_DEPENDENCIES ? '  <-- 違反' : ''
    console.log(`${name.padEnd(width)}${String(count).padStart(3)}${mark}`)
    if (mark) violations.push(name)
  }

  if (violations.length > 0) {
    console.error(
      `NG: 推移的な依存が ${MAX_DEPENDENCIES} 以上のパッケージがあります: ${violations.join(', ')}`,
    )
    return 1
  }
  console.log(
    `OK: すべてのパッケージの推移的な依存が ${MAX_DEPENDENCIES} 未満です`,
  )
  return 0
}

process.exitCode = main()
