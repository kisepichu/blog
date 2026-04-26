import { describe, it, expect } from 'vitest'
import { extractDefinitionBlockHtml } from './extract-definition-block'

describe('extractDefinitionBlockHtml', () => {
  it('<div class="definition-block"> の内側の HTML を返す', () => {
    const html = '<div class="definition-block"><p>内容</p></div>'
    expect(extractDefinitionBlockHtml(html)).toBe('<p>内容</p>')
  })

  it('definition-block が存在しない場合は null を返す', () => {
    const html = '<div class="other-class"><p>内容</p></div>'
    expect(extractDefinitionBlockHtml(html)).toBeNull()
  })

  it('definition-block--extra のみ存在する場合は null を返す', () => {
    const html = '<div class="definition-block--extra"><p>余分な定義</p></div>'
    expect(extractDefinitionBlockHtml(html)).toBeNull()
  })

  it('複数の definition-block がある場合、先頭のみの inner HTML を返す', () => {
    const html =
      '<div class="definition-block"><p>最初の定義</p></div>' +
      '<div class="definition-block"><p>二番目の定義</p></div>'
    expect(extractDefinitionBlockHtml(html)).toBe('<p>最初の定義</p>')
  })

  it('definition-block の内側に複数の要素がある場合、すべてを返す', () => {
    const html = '<div class="definition-block"><p>段落1</p><p>段落2</p></div>'
    expect(extractDefinitionBlockHtml(html)).toBe('<p>段落1</p><p>段落2</p>')
  })

  it('空文字列を渡した場合は null を返す', () => {
    expect(extractDefinitionBlockHtml('')).toBeNull()
  })

  it('definition-block の前後に他の要素があっても正しく抽出する', () => {
    const html =
      '<h1>タイトル</h1>' +
      '<div class="definition-block"><p>定義内容</p></div>' +
      '<p>後続テキスト</p>'
    expect(extractDefinitionBlockHtml(html)).toBe('<p>定義内容</p>')
  })

  it('data-pagefind-body が class より前に出力された場合も正しく抽出する', () => {
    const html = '<div data-pagefind-body class="definition-block"><p>内容</p></div>'
    expect(extractDefinitionBlockHtml(html)).toBe('<p>内容</p>')
  })

  it('definition-block--extra より前に definition-block がある場合は先頭の definition-block を返す', () => {
    const html =
      '<div class="definition-block"><p>メイン定義</p></div>' +
      '<div class="definition-block--extra"><p>追加定義</p></div>'
    expect(extractDefinitionBlockHtml(html)).toBe('<p>メイン定義</p>')
  })
})
