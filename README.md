# Figma to AI JSON

Figma plugin that exports designs to a self-documenting AI-optimized JSON format. The export includes comprehensive metadata (`_meta`) that guides LLMs (Claude, ChatGPT, Gemini) to generate pixel-perfect UI code in any framework/styling system without external documentation.

## Key Features

- **Self-Documenting Format** — `_meta` field contains all mappings and instructions for AI
- **Semantic Analysis** — detects UI roles (button, input, card, icon, avatar)
- **Pattern Detection** — identifies grids, lists, forms, tabs, carousels
- **Design Tokens** — extracts colors, fonts, shadows into reusable references
- **Responsive Hints** — detects breakpoints and adaptive layouts
- **~70% Smaller** — short keys and token deduplication minimize AI token usage

## Framework Flexibility

The JSON format is framework-agnostic - works with any UI framework and styling solution:
- **React** + Tailwind CSS, CSS Modules, styled-components
- **Vue** + Scoped CSS, Tailwind, UnoCSS
- **Svelte** + Scoped styles, Tailwind
- **Angular** + Component styles
- **Vanilla HTML/CSS**

The `_meta` object documents:
- `keys` - Short key legend (t=type, n=name, l=layout, etc.)
- `css` - Generic CSS property mappings
- `html` - HTML element mappings

## Installation

```bash
# Install dependencies
npm install

# Build the plugin
npm run build
```

Then in Figma Desktop:
1. **Plugins** → **Development** → **Import plugin from manifest...**
2. Select `manifest.json` from this project

## Usage

1. **Select** a frame or component in Figma
2. **Run** plugin: **Plugins** → **Development** → **Figma to AI JSON**
3. **Export** and copy to clipboard
4. **Paste** into AI with prompt:

```
Here's a Figma export. Generate a component using your preferred framework/styling:
[paste JSON]
```

The AI will use embedded `_meta` documentation to interpret the format correctly.

## Export Structure

```json
{
  "v": "1.0",
  "_meta": {
    "description": "Self-documenting format guide for AI",
    "types": { "frame": "div", "text": "p/span" },
    "properties": { "w": "width", "h": "height", "p": "padding" },
    "tailwindMappings": { "layout:row": "flex-row", "layout:col": "flex-col" },
    "semanticRoles": { "button": "<button>", "input": "<input>" }
  },
  "tokens": {
    "colors": { "c0": "#3B82F6" },
    "fonts": { "f0": "Inter" },
    "shadows": { "s0": "0 4px 6px rgba(0,0,0,0.1)" }
  },
  "tree": {
    "type": "frame",
    "sem": "button",
    "layout": "row",
    "w": 120,
    "h": 40,
    "bg": "$c0",
    "radius": 8,
    "ch": [...]
  }
}
```

### Property Shortcuts

| Key | Meaning | Key | Meaning |
|-----|---------|-----|---------|
| `t` | type | `n` | name |
| `l` | layout | `g` | gap |
| `j` | justify | `al` | align |
| `w` | width | `h` | height |
| `p` | padding | `bg` | background |
| `r` | radius | `bd` | border |
| `sh` | shadow | `o` | opacity |
| `c` | content | `f` | font |
| `s` | size | `wt` | weight |
| `sm` | semantic | `pi` | patternInfo |
| `ch` | children | `$c0` | color token |
| `"fill"` | 100% (flex-grow) | `"hug"` | fit-content |

## Processing Pipeline

```
Figma Selection
    ↓
parseNode() ─────────── Extract raw properties
    ↓
transformTree() ─────── Convert to optimized format
    ├─ TokenExtractor ── Deduplicate colors/fonts/shadows
    ├─ analyzeSemantics ─ Detect UI roles
    ├─ detectPattern ──── Identify UI patterns
    └─ analyzeResponsive ─ Extract breakpoints
    ↓
Export JSON with _meta
```

## Development

```bash
npm run watch      # Auto-rebuild on changes
npm run typecheck  # Type check
npm run format     # Format code
```

## Documentation

- [FORMAT_SPEC.md](./FORMAT_SPEC.md) — complete format specification
- [DECODER.md](./DECODER.md) — guide for AI interpretation

## License

MIT
