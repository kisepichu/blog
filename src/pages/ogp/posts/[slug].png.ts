import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'
import fs from 'node:fs'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { renderPostImage } from '@/lib/ogp/render-post-image'
import { FILTER_DRAFTS } from '@/config/env'

// Astro の pre-render バンドルでは import.meta.url がコンパイル後パスを指すため
// process.cwd() (= プロジェクトルート) 起点で解決する
const fontDir = path.resolve('src/assets/fonts')

function readFont(filePath: string): ArrayBuffer {
  const buf = fs.readFileSync(filePath)
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

const dotGothic16 = readFont(path.join(fontDir, 'DotGothic16-Regular.ttf'))

interface PostOgpProps {
  title: string
  date: string | undefined
  tags: string[]
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allPosts = await getCollection('posts')
  const posts = FILTER_DRAFTS
    ? allPosts.filter((p) => p.data.status === 'published')
    : allPosts
  return posts.map((post) => ({
    params: { slug: post.id },
    props: {
      title: post.data.title,
      date: post.data.date,
      tags: post.data.tags,
    } satisfies PostOgpProps,
  }))
}

export const GET: APIRoute = async ({ props }) => {
  const { title, date, tags } = props as PostOgpProps

  const svg = await renderPostImage({
    title,
    date,
    tags,
    siteUrl: 'kisen.one',
    fonts: { dotGothic16 },
  })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const png = new Uint8Array(resvg.render().asPng())

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  })
}
