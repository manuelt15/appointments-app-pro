import { PDFDocument } from 'pdf-lib'
import { PDFArray, PDFRawStream, decodePDFRawStream, type PDFRef } from 'pdf-lib/cjs/core'

/**
 * Texto dibujado en cada página, para los tests. Resuelve y descomprime los
 * streams de contenido y convierte las cadenas en hexadecimal: pdf-lib pinta el
 * texto con la fuente estándar, que codifica un byte por carácter (WinAnsi).
 */
export async function pageTexts(bytes: Uint8Array): Promise<string[]> {
  const pdf = await PDFDocument.load(bytes)
  return pdf.getPages().map((page) => {
    const contents = page.node.Contents()
    const entries = contents instanceof PDFArray ? contents.asArray() : contents ? [contents] : []
    return entries
      .map((entry) => pdf.context.lookup(entry as PDFRef))
      .filter((stream) => stream instanceof PDFRawStream)
      .map((stream) => Buffer.from(decodePDFRawStream(stream as PDFRawStream).decode()).toString('latin1'))
      .map((raw) => raw.replace(/<([0-9A-Fa-f]+)>/g, (_, hex: string) => Buffer.from(hex, 'hex').toString('latin1')))
      .join('\n')
  })
}
