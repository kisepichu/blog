/**
 * e2e ビルド (DRAFT_VISIBLE=1) では draft をフィルタしない。
 * 通常の本番ビルドでは published のみ表示する。
 */
export const FILTER_DRAFTS: boolean =
  import.meta.env.PROD && process.env['DRAFT_VISIBLE'] !== '1'
