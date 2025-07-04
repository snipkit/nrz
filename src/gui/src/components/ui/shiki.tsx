import { useLayoutEffect, useState } from 'react'
import { codeToHtml } from 'shiki/bundle/web'
import { cn } from '@/lib/utils.ts'
import { useTheme } from '@/components/ui/theme-provider.tsx'

export function CodeBlock({
  code,
  lang,
  className,
}: {
  code: string
  lang: string
  className?: string
}) {
  const [out, setOut] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  useLayoutEffect(() => {
    async function startCodeBlock() {
      const out = await codeToHtml(code, {
        lang,
        theme:
          resolvedTheme === 'light' ? 'min-light' : (
            (JSON.parse(customDarkTheme) as string)
          ),
      })
      if (out) {
        setOut(out)
      }
    }
    startCodeBlock().catch((err: unknown) => console.error(err))
  }, [code, lang, resolvedTheme])

  if (!out) return null

  return (
    <div
      className={cn(
        'snap-x overflow-x-scroll rounded-b-lg text-xs',
        className,
      )}>
      <div
        className="[&>.min-light]:!bg-neutral-100"
        dangerouslySetInnerHTML={{ __html: out }}
      />
    </div>
  )
}

const customDarkTheme = `{
  "name": "NrZ Theme",
  "type": "dark",
  "semanticHighlighting": true,
  "semanticTokenColors": {
    "enumMember": {
      "foreground": "#ffffff"
    },
    "variable.constant": {
      "foreground": "#62c073"
    },
    "variable.defaultLibrary": {
      "foreground": "#62c073"
    }
  },
  "tokenColors": [
    {
      "scope": ["comment"],
      "settings": {
        "foreground": "#888888"
      }
    },
    {
      "scope": [
        "comment.block.documentation",
        "comment.block.documentation variable.other"
      ],
      "settings": {
        "foreground": "#888888"
      }
    },
    {
      "scope": ["comment.block.documentation entity.name.type"],
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": ["comment.block.documentation storage.type"],
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "scope": ["string", "punctuation.definition.string.template"],
      "settings": {
        "foreground": "#62c073"
      }
    },
    {
      "scope": "constant.numeric",
      "settings": {
        "foreground": "#FFFFFF"
      }
    },
    {
      "scope": "constant.language",
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": ["constant.character", "constant.other"],
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": "variable.language.this",
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": [
        "keyword",
        "keyword.operator.new",
        "storage.modifier.async",
        "keyword.operator.less"
      ],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": "keyword.operator",
      "settings": {
        "foreground": "#EFEFEF"
      }
    },
    {
      "scope": "punctuation",
      "settings": {
        "foreground": "#EFEFEF"
      }
    },
    {
      "scope": "punctuation.definition.comment",
      "settings": {
        "foreground": "#888888"
      }
    },
    {
      "scope": "punctuation.definition.tag",
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "scope": "string.quoted punctuation.definition.string",
      "settings": {
        "foreground": "#62c073"
      }
    },
    {
      "scope": [
        "string.regexp",
        "string.regexp punctuation.definition.string"
      ],
      "settings": {
        "foreground": "#62c073"
      }
    },
    {
      "scope": "storage",
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": "storage.type",
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": "entity.name.class",
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": [
        "entity.name.function",
        "meta.require",
        "support.function.any-method",
        "variable.function",
        "support.function.builtin.python",
        "meta.function-call.generic.python"
      ],
      "settings": {
        "foreground": "#bf7af0"
      }
    },
    {
      "scope": [
        "keyword.operator.assignment",
        "keyword.operator.arithmetic",
        "keyword.operator.bitwise",
        "keyword.operator.relational",
        "keyword.operator.increment",
        "keyword.operator.decrement",
        "keyword.operator.logical",
        "keyword.operator.comparison",
        "keyword.operator.ternary",
        "keyword.operator.expression"
      ],
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": "variable.parameter",
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "scope": ["source.css.scss", "source.css"],
      "settings": {
        "foreground": "#62c073"
      }
    },
    {
      "scope": ["entity.other.attribute-name"],
      "settings": {
        "foreground": "#bf7af0"
      }
    },
    {
      "scope": ["support.function", "support.variable.dom"],
      "settings": {
        "foreground": "#FFFFFF"
      }
    },
    {
      "scope": "support.constant",
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": ["support.type"],
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "scope": ["support.class"],
      "settings": {
        "foreground": "#62c073"
      }
    },
    {
      "scope": "invalid",
      "settings": {
        "foreground": "#E34234"
      }
    },
    {
      "scope": "invalid.deprecated",
      "settings": {
        "foreground": "#E34234",
        "background": "#664E4D"
      }
    },
    {
      "scope": "invalid.illegal",
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "scope": ["meta.diff", "meta.diff.header"],
      "settings": {
        "foreground": "#718493"
      }
    },
    {
      "scope": "markup.deleted",
      "settings": {
        "foreground": "#E61F44"
      }
    },
    {
      "scope": "markup.inserted",
      "settings": {
        "foreground": "#A6E22E"
      }
    },
    {
      "scope": "markup.changed",
      "settings": {
        "foreground": "#FFFFFF"
      }
    },
    {
      "scope": "constant.numeric.line-number.find-in-files - match",
      "settings": {}
    },
    {
      "scope": "entity.name.filename.find-in-files",
      "settings": {
        "foreground": "#E6DB74"
      }
    },
    {
      "scope": "keyword.other",
      "settings": {
        "foreground": "#B0BEC5"
      }
    },
    {
      "scope": [
        "meta.property-value",
        "support.constant.property-value",
        "constant.other.color"
      ],
      "settings": {
        "foreground": "#9FBDE0"
      }
    },
    {
      "scope": "meta.property-value punctuation.separator.key-value",
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "scope": [
        "keyword.other.use",
        "keyword.other.function.use",
        "keyword.other.namespace",
        "keyword.other.new",
        "keyword.other.special-method",
        "keyword.other.unit",
        "keyword.other.use-as"
      ],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": [
        "meta.use support.class.builtin",
        "meta.other.inherited-class support.class.builtin"
      ],
      "settings": {
        "foreground": "#62c073"
      }
    },
    {
      "scope": "variable.other",
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "scope": "meta.object-literal.key",
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": "variable.parameter.function.coffee",
      "settings": {
        "foreground": "#9FBDE0"
      }
    },
    {
      "scope": "markup.deleted.git_gutter",
      "settings": {
        "foreground": "#E61F44"
      }
    },
    {
      "scope": "markup.inserted.git_gutter",
      "settings": {}
    },
    {
      "scope": "markup.changed.git_gutter",
      "settings": {
        "foreground": "#FFFFFF"
      }
    },
    {
      "scope": "meta.template.expression",
      "settings": {
        "foreground": "#9FBDE0"
      }
    },
    {
      "scope": [
        "variable.other.constant.property",
        "keyword.operator.ternary",
        "keyword.operator.expression.typeof"
      ],
      "settings": {
        "foreground": "#B267E6"
      }
    },
    {
      "scope": ["entity.name.type", "support.type.python"],
      "settings": {
        "foreground": "#FFFFFF"
      }
    },
    {
      "scope": "token.info-token",
      "settings": {
        "foreground": "#6796E6"
      }
    },
    {
      "scope": "token.warn-token",
      "settings": {
        "foreground": "#CD9731"
      }
    },
    {
      "scope": "token.error-token",
      "settings": {
        "foreground": "#F44747"
      }
    },
    {
      "scope": "token.debug-token",
      "settings": {
        "foreground": "#B267E6"
      }
    },
    {
      "scope": [
        "entity.name.tag.tsx",
        "entity.name.tag.js.jsx",
        "entity.name.tag.html",
        "entity.name.tag.xml",
        "entity.name.tag.script.html.vue",
        "entity.name.tag.template.html.vue",
        "entity.name.tag.style.html.vue",
        "entity.name.tag.style.html.vue",
        "entity.name.tag.script.html",
        "entity.name.tag.template.html",
        "entity.name.tag.style.html",
        "entity.name.tag.block.any.html"
      ],
      "settings": {
        "foreground": "#62c073"
      }
    },
    {
      "scope": [
        "support.class.component.tsx",
        "support.class.component.jsx"
      ],
      "settings": {
        "foreground": "#62c073"
      }
    },
    {
      "scope": [
        "support.type.primitive.tsx",
        "support.type.primitive.ts"
      ],
      "settings": {
        "foreground": "#bf7af0"
      }
    },
    {
      "scope": "storage.modifier.tsx",
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": "entity.other.inherited-class.tsx",
      "settings": {
        "foreground": "#FFFFFF"
      }
    },
    {
      "scope": "meta.object.member variable.other.readwrite.tsx",
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "scope": "meta.structure.dictionary.json string.quoted.double.json",
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "scope": "meta.structure.dictionary.value.json string.quoted.double.json",
      "settings": {
        "foreground": "#62c073"
      }
    },
    {
      "scope": [
        "meta.structure.dictionary.json",
        "punctuation.definition.string"
      ],
      "settings": {
        "foreground": "#62c073"
      }
    },
    {
      "scope": [
        "meta.structure.dictionary.json",
        "support.type.property-name.json"
      ],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": [
        "punctuation.definition.list.begin.markdown",
        "punctuation.definition.list.begin.mdx",
        "punctuation.definition.list.end.markdown",
        "punctuation.definition.list.end.mdx",
        "punctuation.definition.quote.begin.markdown",
        "punctuation.definition.quote.begin.mdx",
        "punctuation.definition.quote.end.markdown",
        "punctuation.definition.quote.end.mdx",
        "meta.separator.markdown",
        "meta.separator.mdx",
        "markup.inline.raw.string.markdown",
        "markup.raw.code.text.mdx"
      ],
      "settings": {
        "foreground": "#FFFFFF"
      }
    },
    {
      "scope": [
        "entity.name.section.markdown",
        "entity.name.section.mdx"
      ],
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": [
        "punctuation.definition.heading.markdown",
        "punctuation.definition.heading.mdx"
      ],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": [
        "markup.raw.inline.markdown",
        "markup.raw.inline.mdx"
      ],
      "settings": {
        "foreground": "#9FBDE0"
      }
    },
    {
      "scope": [
        "punctuation.definition.bold.markdown",
        "punctuation.definition.bold.mdx",
        "punctuation.definition.italic.markdown",
        "punctuation.definition.italic.mdx",
        "punctuation.definition.entity"
      ],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": [
        "punctuation.definition.string.begin.markdown",
        "punctuation.definition.string.begin.mdx",
        "punctuation.definition.string.end.markdown",
        "punctuation.definition.string.end.mdx"
      ],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": [
        "punctuation.definition.metadata.markdown",
        "punctuation.definition.metadata.mdx"
      ],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": [
        "markup.underline.link.markdown",
        "markup.underline.link.image.markdown",
        "string.other.link.destination.mdx",
        "meta.image.inline.markdown",
        "meta.image.inline.mdx"
      ],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": [
        "markup.bold.markdown",
        "string.other.strong.asterisk.mdx",
        "markup.italic.markdown",
        "markup.italic.mdx"
      ],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": ["markup.italic.markdown", "markup.italic.mdx"],
      "settings": {}
    },
    {
      "scope": ["markup.bold.markdown", "markup.bold.mdx"],
      "settings": {}
    },
    {
      "scope": ["markup.raw.block.markdown", "markup.raw.block.mdx"],
      "settings": {
        "foreground": "#9FBDE0"
      }
    },
    {
      "scope": "keyword.other.rust",
      "settings": {
        "foreground": "#B267E6"
      }
    },
    {
      "scope": "keyword.other.fn.rust",
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "name": "PHP: Begin block",
      "scope": [
        "punctuation.section.embedded.begin.php",
        "keyword.other.class.php"
      ],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "name": "PHP: Class name",
      "scope": ["support.class.php"],
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "name": "PHP: Meta use",
      "scope": ["meta.use.php"],
      "settings": {
        "foreground": "#62c073"
      }
    },
    {
      "scope": "keyword.other.definition.ini",
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "name": "Prisma: Primitive",
      "scope": "support.type.primitive.prisma",
      "settings": {
        "foreground": "#FFFFFF"
      }
    },
    {
      "name": "Prisma: Constant",
      "scope": "support.constant.constant.prisma",
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "name": "Prisma: Relation",
      "scope": "variable.language.relations.prisma",
      "settings": {
        "foreground": "#62c073"
      }
    },
    {
      "scope": "entity.name.tag.yaml",
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": "storage.type.java",
      "settings": {
        "foreground": "#FFFFFF"
      }
    },
    {
      "scope": [
        "keyword.other.package.java",
        "keyword.other.import.java"
      ],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": "storage.modifier.package.java",
      "settings": {
        "foreground": "#FFFFFF"
      }
    },
    {
      "scope": "storage.modifier.import.java",
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "scope": "punctuation.separator.java",
      "settings": {
        "foreground": "#EFEFEF"
      }
    },
    {
      "scope": "meta.tag.xml",
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": [
        "keyword.other.declaration-specifier.swift",
        "keyword.other.declaration-specifier.accessibility.swift"
      ],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": [
        "support.type.swift",
        "meta.function-result.swift",
        "variable.language.swift",
        "keyword.operator.custom.infix.swift"
      ],
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": "variable.parameter.function.swift",
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "scope": "entity.name.function.swift",
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": [
        "variable.parameter.function.swift",
        "meta.parameter-clause.swift"
      ],
      "settings": {
        "foreground": "#DCE3EA"
      }
    },
    {
      "scope": ["support.function.go"],
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": [
        "keyword.operator.address.go",
        "keyword.operator.pointer.go"
      ],
      "settings": {
        "foreground": "#43AAF9"
      }
    },
    {
      "scope": ["keyword.channel.go"],
      "settings": {
        "foreground": "#B267E6"
      }
    },
    {
      "scope": [
        "storage.type.numeric.go",
        "storage.type.string.go",
        "storage.type.error.go",
        "storage.type.boolean.go",
        "storage.type.byte.go",
        "storage.type.uintptr.go",
        "storage.type.error.go",
        "storage.type.rune.go",
        "storage.type.complex.go"
      ],
      "settings": {
        "foreground": "#FFFFFF"
      }
    },
    {
      "scope": ["entity.name.tag.astro"],
      "settings": {
        "foreground": "#f75f8f"
      }
    },
    {
      "scope": ["support.class.component.astro"],
      "settings": {
        "foreground": "#f75f8f"
      }
    }
  ],
  "colors": {
    "editor.background": "#000000",
    "editor.foreground": "#DCE3EA",
    "editor.hoverHighlightBackground": "#f75f8f",
    "editor.lineHighlightBackground": "#00000022",
    "editor.selectionBackground": "#43AAF955",
    "editor.wordHighlightBackground": "#43AAF922",
    "editor.wordHighlightStrongBackground": "#43AAF922",
    "editorBracketMatch.background": "#f75f8f",
    "editorBracketMatch.border": "#43AAF9",
    "editorCursor.foreground": "#DCE3EA",
    "editorGutter.addedBackground": "#62c073",
    "editorGutter.background": "#000000",
    "editorGutter.deletedBackground": "#E61F44",
    "editorGutter.modifiedBackground": "#FFFFFF",
    "editorIndentGuide.background": "#00000088",
    "editorInlayHint.background": "#34393E",
    "editorInlayHint.foreground": "#DCE3EA",
    "editorLineNumber.foreground": "#454d54",
    "editorLink.activeForeground": "#f75f8f",
    "editorOverviewRuler.addedForeground": "#62c073",
    "editorOverviewRuler.deletedForeground": "#E61F44",
    "editorOverviewRuler.errorForeground": "#E61F44",
    "editorOverviewRuler.findMatchForeground": "#43AAF955",
    "editorOverviewRuler.infoForeground": "#B267E6",
    "editorOverviewRuler.modifiedForeground": "#FFFFFF",
    "editorOverviewRuler.warningForeground": "#FFFFFF",
    "editorRuler.foreground": "#34393E",
    "editorSuggestWidget.foreground": "#DCE3EA",
    "editorSuggestWidget.highlightForeground": "#f75f8f",
    "editorSuggestWidget.selectedBackground": "#454d54",
    "editorWhitespace.foreground": "#34393E",
    "editorWidget.background": "#34393E",
    "editorWidget.border": "#454d54",
    "sideBar.background": "#010101",
    "sideBar.foreground": "#DCE3EA",
    "sideBarSectionHeader.background": "#000000",
    "sideBarSectionHeader.foreground": "#DCE3EA",
    "badge.background": "#f75f8f",
    "badge.foreground": "#DCE3EA",
    "list.activeSelectionBackground": "#f75f8f55",
    "list.activeSelectionForeground": "#DCE3EA",
    "list.focusBackground": "#0A0A0A",
    "list.hoverBackground": "#0A0A0A",
    "list.inactiveSelectionBackground": "#000000",
    "titleBar.activeBackground": "#000000",
    "activityBar.background": "#000000",
    "activityBar.foreground": "#DCE3EA",
    "activityBarBadge.background": "#f75f8f",
    "activityBarBadge.foreground": "#DCE3EA",
    "editorGroupHeader.tabsBackground": "#0A0A0A",
    "tab.inactiveBackground": "#0A0A0A44",
    "tab.inactiveForeground": "#DCE3EA88",
    "tab.activeModifiedBorder": "#FFFFFF",
    "tab.inactiveModifiedBorder": "#43AAF9",
    "tab.unfocusedActiveModifiedBorder": "#FFFFFF88",
    "tab.unfocusedInactiveModifiedBorder": "#43AAF988",
    "terminal.ansiBlack": "#34393E",
    "terminal.ansiBlue": "#43AAF9",
    "terminal.ansiBrightBlack": "#454d54",
    "terminal.ansiBrightBlue": "#A7D1F5",
    "terminal.ansiBrightCyan": "#D7C9F0",
    "terminal.ansiBrightGreen": "#B7F0E5",
    "terminal.ansiBrightMagenta": "#f75f8f",
    "terminal.ansiBrightRed": "#E61F44",
    "terminal.ansiBrightWhite": "#DCE3EA",
    "terminal.ansiBrightYellow": "#A7D1F5",
    "terminal.ansiCyan": "#B267E6",
    "terminal.ansiGreen": "#62c073",
    "terminal.ansiMagenta": "#f75f8f",
    "terminal.ansiRed": "#E61F44",
    "terminal.ansiWhite": "#DCE3EA",
    "terminal.ansiYellow": "#43AAF9",
    "terminal.background": "#000000",
    "terminal.foreground": "#DCE3EA",
    "gitDecoration.conflictingResourceForeground": "#B267E6",
    "gitDecoration.deletedResourceForeground": "#E61F44",
    "gitDecoration.ignoredResourceForeground": "#454d54",
    "gitDecoration.modifiedResourceForeground": "#FFFFFF",
    "gitDecoration.untrackedResourceForeground": "#62c073",
    "statusBar.background": "#000000",
    "statusBar.foreground": "#DCE3EA",
    "statusBar.noFolderBackground": "#000000",
    "scrollbar.shadow": "#000000",
    "scrollbarSlider.activeBackground": "#f75f8f",
    "scrollbarSlider.background": "#454d54aa",
    "scrollbarSlider.hoverBackground": "#f75f8f",
    "button.background": "#43AAF9",
    "button.foreground": "#DCE3EA",
    "dropdown.background": "#000000",
    "dropdown.border": "#000000",
    "dropdown.foreground": "#DCE3EA",
    "extensionButton.prominentBackground": "#f75f8f",
    "extensionButton.prominentForeground": "#DCE3EA",
    "extensionButton.prominentHoverBackground": "#f75f8f",
    "focusBorder": "#f75f8f",
    "foreground": "#DCE3EA",
    "input.background": "#000000",
    "input.border": "#454d54",
    "input.foreground": "#DCE3EA",
    "input.placeholderForeground": "#454d54",
    "inputOption.activeBorder": "#43AAF9",
    "panel.background": "#000000",
    "panel.border": "#454d54",
    "panelTitle.activeBorder": "#f75f8f",
    "panelTitle.inactiveForeground": "#454d54",
    "peekView.border": "#f75f8f",
    "peekViewEditor.background": "#000000",
    "peekViewEditor.matchHighlightBackground": "#43AAF955",
    "peekViewEditorGutter.background": "#000000",
    "peekViewResult.background": "#34393E",
    "peekViewResult.fileForeground": "#DCE3EA",
    "peekViewResult.lineForeground": "#E6E6E6",
    "peekViewResult.matchHighlightBackground": "#43AAF955",
    "peekViewResult.selectionBackground": "#0A0A0A",
    "peekViewResult.selectionForeground": "#DCE3EA",
    "peekViewTitle.background": "#000000",
    "peekViewTitleDescription.foreground": "#DCE3EA",
    "peekViewTitleLabel.foreground": "#E6E6E6",
    "progressBar.background": "#43AAF9"
  }
}`
