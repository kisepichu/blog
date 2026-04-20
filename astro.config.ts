import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import remarkDirective from 'remark-directive'
import remarkDefinitionBlock from './src/lib/remark/remark-definition-block'
import remarkLocalDefinition from './src/lib/remark/remark-local-definition'
import remarkConceptLink from './src/lib/remark/remark-concept-link'
import remarkEmbedDefinition from './src/lib/remark/remark-embed-definition'
import { scanDefsDirectory, buildAliasMap } from './src/lib/build/alias-map'
import { buildDefContentMap } from './src/lib/build/def-content-map'
import { writePreviewIndex } from './src/lib/build/preview-index'
import type { AstroIntegration } from 'astro'

function contentPipelineIntegration(): AstroIntegration {
  return {
    name: 'content-pipeline',
    hooks: {
      'astro:config:setup': async ({ config, updateConfig }) => {
        const isProd = process.env.NODE_ENV === 'production'
        const allDefs = scanDefsDirectory('content/defs/')
        const defs = isProd ? allDefs.filter(d => d.status === 'published') : allDefs
        const aliasMap = buildAliasMap(defs)
        const baseUrl = config.base ?? '/'
        const defContentMap = await buildDefContentMap(defs, aliasMap, baseUrl, isProd)

        writePreviewIndex(defContentMap, 'public/preview-index.json')

        updateConfig({
          markdown: {
            remarkPlugins: [
              remarkDirective,
              remarkDefinitionBlock,
              remarkLocalDefinition,
              [remarkConceptLink, { aliasMap, baseUrl, isProd }],
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
  integrations: [react(), contentPipelineIntegration()],
})
