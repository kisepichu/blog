import fs from 'node:fs'
import path from 'node:path'

// Astro の pre-render バンドルでは import.meta.url がコンパイル後パスを指すため
// process.cwd() (= プロジェクトルート) 起点で解決する
const fontDir = path.resolve('src/assets/fonts')

function readFont(filePath: string): ArrayBuffer {
  const buf = fs.readFileSync(filePath)
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

export const dotGothic16Font = readFont(path.join(fontDir, 'DotGothic16-Regular.ttf'))
export const mplusRoundedFont = readFont(path.join(fontDir, 'MPLUSRounded1c-Regular.ttf'))
