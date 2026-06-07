type TokenPattern = {
  className: string
  regex: RegExp
}

export type CodeToken = {
  className: string | null
  text: string
}

const commonPatterns: TokenPattern[] = [
  { className: 'tok-comment', regex: /\/\/[^\n]*|\/\*[\s\S]*?\*\//y },
  { className: 'tok-string', regex: /`(?:\\[\s\S]|[^`\\])*`|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'/y },
  { className: 'tok-number', regex: /\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?)(?:e[+-]?\d+)?\b/y },
  { className: 'tok-keyword', regex: /\b(?:async|await|break|case|catch|class|const|continue|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|return|static|super|switch|this|throw|try|typeof|var|void|while|yield)\b/y },
  { className: 'tok-type', regex: /\b(?:Array|boolean|Boolean|Date|Error|Map|Number|Object|Promise|Record|Set|string|String|unknown|void)\b/y },
  { className: 'tok-boolean', regex: /\b(?:false|null|true|undefined)\b/y },
  { className: 'tok-function', regex: /\b[A-Za-z_$][\w$]*(?=\s*\()/y },
  { className: 'tok-variable', regex: /\b[A-Za-z_$][\w$]*\b/y },
  { className: 'tok-operator', regex: /=>|===|!==|==|!=|<=|>=|\+\+|--|&&|\|\||[{}()[\].,;:?+\-*/%=&|!<>]/y },
]

const typeScriptPatterns: TokenPattern[] = [
  { className: 'tok-keyword', regex: /\b(?:as|declare|enum|implements|interface|keyof|namespace|private|protected|public|readonly|satisfies|type)\b/y },
  ...commonPatterns,
]

const javaPatterns: TokenPattern[] = [
  { className: 'tok-comment', regex: /\/\/[^\n]*|\/\*[\s\S]*?\*\//y },
  { className: 'tok-string', regex: /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'/y },
  { className: 'tok-number', regex: /\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?)(?:e[+-]?\d+)?[dDfFlL]?\b/y },
  { className: 'tok-keyword', regex: /\b(?:abstract|assert|break|case|catch|class|continue|default|do|else|enum|extends|final|finally|for|if|implements|import|instanceof|interface|new|package|private|protected|public|return|static|super|switch|synchronized|this|throw|throws|try|while)\b/y },
  { className: 'tok-type', regex: /\b(?:boolean|byte|char|double|float|int|long|short|String|var|void)\b/y },
  { className: 'tok-boolean', regex: /\b(?:false|null|true)\b/y },
  { className: 'tok-function', regex: /\b[A-Za-z_$][\w$]*(?=\s*\()/y },
  { className: 'tok-variable', regex: /\b[A-Za-z_$][\w$]*\b/y },
  { className: 'tok-operator', regex: /==|!=|<=|>=|\+\+|--|&&|\|\||[{}()[\].,;:?+\-*/%=&|!<>]/y },
]

const jsonPatterns: TokenPattern[] = [
  { className: 'tok-property', regex: /"(?:\\[\s\S]|[^"\\])*"(?=\s*:)/y },
  { className: 'tok-string', regex: /"(?:\\[\s\S]|[^"\\])*"/y },
  { className: 'tok-number', regex: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/y },
  { className: 'tok-boolean', regex: /\b(?:false|null|true)\b/y },
  { className: 'tok-operator', regex: /[{}[\],:]/y },
]

const patternsByLanguage: Record<string, TokenPattern[]> = {
  java: javaPatterns,
  javascript: commonPatterns,
  js: commonPatterns,
  json: jsonPatterns,
  ts: typeScriptPatterns,
  typescript: typeScriptPatterns,
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

export const tokenizeCode = (code: string, language: string): CodeToken[] => {
  const patterns = patternsByLanguage[language.toLowerCase()] ?? commonPatterns
  const tokens: CodeToken[] = []
  let index = 0

  while (index < code.length) {
    const match = patterns
      .map(pattern => {
        pattern.regex.lastIndex = index
        const result = pattern.regex.exec(code)
        return result?.index === index ? { className: pattern.className, text: result[0] } : null
      })
      .find(Boolean)

    if (!match) {
      tokens.push({ className: null, text: code[index] })
      index += 1
      continue
    }

    tokens.push(match)
    index += match.text.length
  }

  return tokens
}

export const highlightCode = (code: string, language: string) => {
  return tokenizeCode(code, language)
    .map(token => {
      const text = escapeHtml(token.text)
      return token.className ? `<span class="${token.className}">${text}</span>` : text
    })
    .join('')
}
