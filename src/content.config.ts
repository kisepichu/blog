import { defineCollection } from 'astro:content'
import { z } from 'zod'
import { glob } from 'astro/loaders'

const statusSchema = z.enum(['published', 'draft', 'scrap'])

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/posts' }),
  schema: z.object({
    title: z.string(),
    status: statusSchema.default('draft'),
    tags: z.array(z.string().trim().regex(/^[^\s/?#%]+$/, 'タグに / ? # % および空白は使用できません')).default([]),
    series: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'series は kebab-case の ASCII スラグで指定してください').optional(),
    series_order: z.number().int().positive().optional(),
    date: z.preprocess(
      (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date は YYYY-MM-DD 形式で指定してください'),
    ).optional(),
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
    tags: z.array(z.string().trim().regex(/^[^\s/?#%]+$/, 'タグに / ? # % および空白は使用できません')).default([]),
  }),
})

export const collections = { posts, defs }
