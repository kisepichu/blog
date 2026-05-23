import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'
import { Resvg } from '@resvg/resvg-js'
import { renderPostImage } from '@/lib/ogp/render-post-image'
import { dotGothic16Font } from '@/lib/ogp/fonts'
import { FILTER_DRAFTS } from '@/config/env'

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
  if (!props) return new Response(null, { status: 404 })
  const { title, date, tags } = props as PostOgpProps

  const svg = await renderPostImage({
    title,
    date,
    tags,
    siteUrl: 'kisen.one',
    fonts: { dotGothic16: dotGothic16Font },
  })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const png = new Uint8Array(resvg.render().asPng())

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  })
}
