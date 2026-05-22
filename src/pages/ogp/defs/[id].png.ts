import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'
import fs from 'node:fs'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { renderDefImage } from '@/lib/ogp/render-def-image'

const fontDir = path.resolve('src/assets/fonts')
const dotGothic16 = fs.readFileSync(path.join(fontDir, 'DotGothic16-Regular.ttf')).buffer as ArrayBuffer
const mplusRounded = fs.readFileSync(path.join(fontDir, 'MPLUSRounded1c-Regular.ttf')).buffer as ArrayBuffer

export const getStaticPaths: GetStaticPaths = async () => {
  const allDefs = await getCollection('defs')
  const defs = import.meta.env.PROD
    ? allDefs.filter((d) => d.data.status === 'published')
    : allDefs
  return defs.map((def) => ({ params: { id: def.id } }))
}

export const GET: APIRoute = async ({ params, site }) => {
  const allDefs = await getCollection('defs')
  const def = allDefs.find((d) => d.id === params.id)
  if (!def) return new Response('Not found', { status: 404 })

  const siteUrl = site ? new URL(site).hostname : 'kisen.one'

  const svg = await renderDefImage({
    title: def.data.title,
    english: def.data.english,
    tags: def.data.tags,
    siteUrl,
    fonts: { dotGothic16, mplusRounded },
  })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const png = new Uint8Array(resvg.render().asPng())

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  })
}
