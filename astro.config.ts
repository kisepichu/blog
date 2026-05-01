import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import remarkDirective from 'remark-directive'
import remarkDefinitionBlock from './src/lib/remark/remark-definition-block'
import remarkAdmonition from './src/lib/remark/remark-admonition'
import remarkLocalDefinition from './src/lib/remark/remark-local-definition'
import remarkConceptLink from './src/lib/remark/remark-concept-link'
import remarkEmbedDefinition from './src/lib/remark/remark-embed-definition'
import { scanDefsDirectory, buildAliasMap, buildDefMetaMap } from './src/lib/build/alias-map'
import { buildDefContentMap } from './src/lib/build/def-content-map'
import { writePreviewIndex } from './src/lib/build/preview-index'
import type { AstroIntegration } from 'astro'

function contentPipelineIntegration(): AstroIntegration {
  return {
    name: 'content-pipeline',
    hooks: {
      'astro:config:setup': async ({ config, updateConfig, command }) => {
        const isProd = command === 'build'
        const draftVisible = process.env['DRAFT_VISIBLE'] === '1'
        const defsDir = fileURLToPath(new URL('content/defs/', config.root))
        const previewIndexPath = fileURLToPath(new URL('public/preview-index.json', config.root))
        const allDefs = scanDefsDirectory(defsDir)
        const defs = (isProd && !draftVisible) ? allDefs.filter(d => d.status === 'published') : allDefs
        const aliasMap = buildAliasMap(defs)
        const defMetaMap = buildDefMetaMap(defs)
        const baseUrl = config.base ?? '/'
        const defContentMap = await buildDefContentMap(defs, aliasMap, defMetaMap, baseUrl, isProd)

        writePreviewIndex(defContentMap, previewIndexPath)

        const existingPlugins = config.markdown?.remarkPlugins ?? []
        updateConfig({
          markdown: {
            remarkPlugins: [
              ...existingPlugins,
              remarkDirective,
              remarkDefinitionBlock,
              remarkAdmonition,
              remarkLocalDefinition,
              [remarkConceptLink, { aliasMap, defMetaMap, baseUrl, isProd }],
              [remarkEmbedDefinition, { defContentMap, aliasMap, isProd }],
            ],
          },
        })
      },
    },
  }
}

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE ?? 'https://blog.kisen.one',
  integrations: [react(), contentPipelineIntegration()],
  devToolbar: { enabled: false },
})
