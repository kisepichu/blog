import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'
import { Resvg } from '@resvg/resvg-js'
import { renderDefImage } from '@/lib/ogp/render-def-image'
import { dotGothic16Font, mplusRoundedFont } from '@/lib/ogp/fonts'
import { FILTER_DRAFTS } from '@/config/env'

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
    fonts: { dotGothic16: dotGothic16Font, mplusRounded: mplusRoundedFont },
  })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const png = new Uint8Array(resvg.render().asPng())

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  })
}
