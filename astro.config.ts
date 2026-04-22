import { fileURLToPath } from 'node:url'
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
      'astro:config:setup': async ({ config, updateConfig, command }) => {
        const isProd = command === 'build'
        const defsDir = fileURLToPath(new URL('content/defs/', config.root))
        const previewIndexPath = fileURLToPath(new URL('public/preview-index.json', config.root))
        const allDefs = scanDefsDirectory(defsDir)
        const defs = isProd ? allDefs.filter(d => d.status === 'published') : allDefs
        const aliasMap = buildAliasMap(defs)
        const baseUrl = config.base ?? '/'
        const defContentMap = await buildDefContentMap(defs, aliasMap, baseUrl, isProd)

        writePreviewIndex(defContentMap, previewIndexPath)

        const existingPlugins = config.markdown?.remarkPlugins ?? []
        updateConfig({
          markdown: {
            remarkPlugins: [
              ...existingPlugins,
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
  devToolbar: { enabled: false },
})
