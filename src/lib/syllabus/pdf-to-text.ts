export async function pdfToText(buffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf")
  const data = new Uint8Array(buffer)
  const doc = await pdfjsLib.getDocument({ data }).promise
  const lines: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()

    let lastY = -1
    for (const item of content.items as any[]) {
      if (item.str.trim()) {
        const y = Math.round((item as any).transform?.[5] || 0)
        if (lastY >= 0 && y !== lastY) {
          lines.push("")
        }
        lines.push(item.str)
        lastY = y
      }
    }

    lines.push("")
    lines.push("---")
    lines.push("")
  }

  return lines.join("\n")
}
