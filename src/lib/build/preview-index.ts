import type { DefContentMap } from './def-content-map'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export function writePreviewIndex(defContentMap: DefContentMap, path: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(defContentMap))
}
