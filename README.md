# Figma to AI JSON

Figma plugin that exports designs to an AI-optimized JSON format for LLMs (Claude, ChatGPT, Gemini, etc.) to generate pixel-perfect React/Tailwind code.

## Installation

### 1. Build the plugin

```bash
# Install dependencies
npm install

# Build the plugin
npm run build
```

### 2. Add to Figma

1. Open Figma Desktop
2. Go to **Plugins** → **Development** → **Import plugin from manifest...**
3. Select the `manifest.json` file from this project folder
4. The plugin is now available in **Plugins** → **Development** → **Figma to AI JSON**

## Usage

### Step 1: Select a design

Select any frame, component, or element in Figma that you want to export.

### Step 2: Run the plugin

Open **Plugins** → **Development** → **Figma to AI JSON**

### Step 3: Configure options

- **Extract Design Tokens** — extracts colors, fonts, and shadows into reusable tokens
- **Include Children** — recursively exports all nested elements

### Step 4: Export

Click **Export JSON** button, then:
- **Copy to Clipboard** — for pasting directly into AI chat
- **Download JSON** — to save as a file

### Step 5: Generate code with AI

Paste the JSON into your preferred AI assistant (Claude, ChatGPT, Gemini, etc.) with a prompt like:

```
Here's a Figma export in JSON format. Please generate a React component
with Tailwind CSS that matches this design:

[paste JSON here]
```

## How It Works

The plugin processes Figma designs through several stages:

```
Select in Figma → Parse → Transform → Extract Tokens → Export JSON
```

1. **Parser** — extracts raw Figma properties (layout, styles, text, effects)
2. **Transformer** — converts to optimized format with short keys
3. **Token Extractor** — identifies repeated values and creates reusable tokens

## Export Format

The plugin generates a compact JSON structure:

```json
{
  "v": "1.0",
  "name": "Button",
  "tokens": {
    "colors": { "c0": "#3B82F6", "c1": "#FFFFFF" },
    "fonts": { "f0": "Inter" },
    "shadows": { "s0": "0 4px 6px rgba(0,0,0,0.1)" }
  },
  "tree": {
    "type": "frame",
    "layout": "row",
    "w": 120,
    "h": 40,
    "p": [12, 24, 12, 24],
    "bg": "$c0",
    "radius": 8,
    "ch": [
      {
        "type": "text",
        "content": "Click me",
        "font": "$f0",
        "fontSize": 14,
        "fill": "$c1"
      }
    ]
  }
}
```

### Key mappings

| Short | Meaning |
|-------|---------|
| `w` | width |
| `h` | height |
| `p` | padding |
| `bg` | background |
| `ch` | children |
| `layout` | flex direction (`row` / `col`) |
| `"fill"` | flex-grow (100% width/height) |
| `"hug"` | fit-content (auto) |
| `$c0` | token reference (color #0) |

### Why this format?

- **~70% smaller** than verbose JSON
- **Token references** eliminate repetition
- **Short keys** reduce AI token usage
- **Semantic values** (`fill`, `hug`) map directly to CSS

## Development

```bash
# Watch mode (auto-rebuild on changes)
npm run watch

# Type check
npm run typecheck

# Format code
npm run format
```

## Documentation

- [FORMAT_SPEC.md](./FORMAT_SPEC.md) — complete format specification
- [DECODER.md](./DECODER.md) — guide for AI to interpret the JSON
