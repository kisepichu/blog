import { defineCollection } from 'astro:content'
import { z } from 'zod'
import { glob } from 'astro/loaders'

const statusSchema = z.enum(['published', 'draft', 'scrap'])

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/posts' }),
  schema: z.object({
    title: z.string(),
    status: statusSchema.default('draft'),
    tags: z.array(z.string()).default([]),
    series: z.string().optional(),
    series_order: z.number().int().positive().optional(),
  }).refine(
    (data) => !data.series || data.series_order !== undefined,
    { message: 'series_order は series 指定時に必須です' }
  ),
})

const defs = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/defs' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    aliases: z.array(z.string()).default([]),
    status: statusSchema.default('draft'),
    tags: z.array(z.string()).default([]),
  }),
})

export const collections = { posts, defs }
