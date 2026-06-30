function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function parseInline(md: string): string {
  return md
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}

function parseCodeBlock(lines: string[], i: number): { html: string; endIndex: number } {
  const fence = lines[i].trim()
  const lang = fence.slice(3).trim()
  const codeLines: string[] = []
  let j = i + 1
  while (j < lines.length && !lines[j].trim().startsWith("```")) {
    codeLines.push(escapeHtml(lines[j]))
    j++
  }
  const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : ""
  const html = `<pre><code${langClass}>${codeLines.join("\n")}</code></pre>\n`
  return { html, endIndex: j }
}

function parseListLine(line: string): { html: string; isListStart: boolean } {
  const trimmed = line.trim()
  const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)/)
  if (unorderedMatch) {
    return { html: `<li>${parseInline(unorderedMatch[1])}</li>\n`, isListStart: true }
  }
  const orderedMatch = trimmed.match(/^\d+[.)]\s+(.*)/)
  if (orderedMatch) {
    return { html: `<li>${parseInline(orderedMatch[1])}</li>\n`, isListStart: true }
  }
  return { html: "", isListStart: false }
}

function parseHeading(line: string): string | null {
  const trimmed = line.trim()
  const match = trimmed.match(/^(#{1,6})\s+(.*)/)
  if (match) {
    const level = match[1].length
    return `<h${level}>${parseInline(match[2])}</h${level}>\n`
  }
  return null
}

function parseThematicBreak(line: string): boolean {
  return /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())
}

export function parseMarkdownToHtml(md: string): string {
  const lines = md.split("\n")
  const htmlParts: string[] = []
  let inParagraph = false
  let inList = false
  let listType: "ul" | "ol" | null = null

  function closeParagraph() {
    if (inParagraph) {
      htmlParts.push("</p>\n")
      inParagraph = false
    }
  }

  function closeList() {
    if (inList) {
      htmlParts.push(listType === "ul" ? "</ul>\n" : "</ol>\n")
      inList = false
      listType = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === "") {
      closeParagraph()
      closeList()
      continue
    }

    if (trimmed.startsWith("```")) {
      closeParagraph()
      closeList()
      const { html, endIndex } = parseCodeBlock(lines, i)
      htmlParts.push(html)
      i = endIndex
      continue
    }

    if (parseThematicBreak(line)) {
      closeParagraph()
      closeList()
      htmlParts.push("<hr>\n")
      continue
    }

    const heading = parseHeading(line)
    if (heading) {
      closeParagraph()
      closeList()
      htmlParts.push(heading)
      continue
    }

    const listItem = parseListLine(line)
    if (listItem.isListStart) {
      closeParagraph()
      const isOrdered = /^\d+[.)]\s/.test(trimmed)
      const newListType = isOrdered ? "ol" : "ul"
      if (!inList || listType !== newListType) {
        closeList()
        listType = newListType
        inList = true
        htmlParts.push(listType === "ul" ? "<ul>\n" : "<ol>\n")
      }
      htmlParts.push(listItem.html)
      continue
    }

    closeList()

    if (line.startsWith("> ")) {
      closeParagraph()
      htmlParts.push(`<blockquote>\n<p>${parseInline(trimmed.slice(2))}</p>\n</blockquote>\n`)
      continue
    }

    if (!inParagraph) {
      htmlParts.push("<p>")
      inParagraph = true
    } else {
      htmlParts.push("<br>\n")
    }

    htmlParts.push(parseInline(trimmed))
  }

  closeParagraph()
  closeList()

  return htmlParts.join("")
}
