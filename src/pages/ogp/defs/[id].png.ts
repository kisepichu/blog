import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'
import fs from 'node:fs'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { renderDefImage } from '@/lib/ogp/render-def-image'
import { FILTER_DRAFTS } from '@/config/env'

// Astro の pre-render バンドルでは import.meta.url がコンパイル後パスを指すため
// process.cwd() (= プロジェクトルート) 起点で解決する
const fontDir = path.resolve('src/assets/fonts')

function readFont(filePath: string): ArrayBuffer {
  const buf = fs.readFileSync(filePath)
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

const dotGothic16 = readFont(path.join(fontDir, 'DotGothic16-Regular.ttf'))
const mplusRounded = readFont(path.join(fontDir, 'MPLUSRounded1c-Regular.ttf'))

interface DefOgpProps {
  title: string
  english: string
  tags: string[]
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allDefs = await getCollection('defs')
  const defs = FILTER_DRAFTS
    ? allDefs.filter((d) => d.data.status === 'published')
    : allDefs
  return defs.map((def) => ({
    params: { id: def.id },
    props: {
      title: def.data.title,
      english: def.data.english,
      tags: def.data.tags,
    } satisfies DefOgpProps,
  }))
}

export const GET: APIRoute = async ({ props }) => {
  const { title, english, tags } = props as DefOgpProps

  const svg = await renderDefImage({
    title,
    english,
    tags,
    siteUrl: 'kisen.one',
    fonts: { dotGothic16, mplusRounded },
  })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const png = new Uint8Array(resvg.render().asPng())

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  })
}
