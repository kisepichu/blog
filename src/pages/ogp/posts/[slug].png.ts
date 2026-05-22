import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'
import fs from 'node:fs'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { renderPostImage } from '@/lib/ogp/render-post-image'
import { FILTER_DRAFTS } from '@/config/env'

const fontDir = path.resolve('src/assets/fonts')
const dotGothic16 = fs.readFileSync(path.join(fontDir, 'DotGothic16-Regular.ttf')).buffer as ArrayBuffer
const mplusRounded = fs.readFileSync(path.join(fontDir, 'MPLUSRounded1c-Regular.ttf')).buffer as ArrayBuffer

export const getStaticPaths: GetStaticPaths = async () => {
  const allPosts = await getCollection('posts')
  const posts = FILTER_DRAFTS
    ? allPosts.filter((p) => p.data.status === 'published')
    : allPosts
  return posts.map((post) => ({ params: { slug: post.id } }))
}

export const GET: APIRoute = async ({ params, site }) => {
  const allPosts = await getCollection('posts')
  const post = allPosts.find((p) => p.id === params.slug)
  if (!post) return new Response('Not found', { status: 404 })

  const siteUrl = site ? new URL(site).hostname : 'kisen.one'

  const svg = await renderPostImage({
    title: post.data.title,
    date: post.data.date,
    tags: post.data.tags,
    siteUrl,
    fonts: { dotGothic16, mplusRounded },
  })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const png = new Uint8Array(resvg.render().asPng())

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  })
}
