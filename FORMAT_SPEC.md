# Figma Export Format Specification v1.0

## Overview

This format is optimized for AI/LLMs to generate pixel-perfect UI code in any framework from Figma designs.

## Design Principles

1. **Compact** - Short keys to minimize tokens
2. **Unambiguous** - Each property has one clear meaning
3. **Complete** - All data needed for pixel-perfect rendering
4. **Hierarchical** - Mirrors component tree structure
5. **Framework-Agnostic** - Works with any UI framework or styling solution

---

## Root Structure

```json
{
  "v": "1.0",
  "name": "ComponentName",
  "tokens": { ... },
  "tree": { ... }
}
```

| Key | Type | Description |
|-----|------|-------------|
| `v` | string | Format version |
| `name` | string | Component/frame name |
| `tokens` | object | Design tokens (colors, fonts, shadows) |
| `tree` | object | Component tree |

---

## Design Tokens

Tokens reduce repetition and file size by extracting common values.

```json
{
  "tokens": {
    "colors": {
      "c0": "#FFFFFF",
      "c1": "#000000",
      "c2": "#6366F1",
      "c3": "rgba(0,0,0,0.1)"
    },
    "fonts": {
      "f0": "Inter",
      "f1": "Roboto"
    },
    "shadows": {
      "s0": "0 1px 2px rgba(0,0,0,0.05)",
      "s1": "0 4px 6px -1px rgba(0,0,0,0.1)"
    }
  }
}
```

Token references use `$` prefix: `"bg": "$c0"` → background: #FFFFFF

---

## Node Types

| Type Code | Figma Type | Description |
|-----------|------------|-------------|
| `frame` | FRAME | Container with auto-layout or absolute |
| `text` | TEXT | Text element |
| `rect` | RECTANGLE | Rectangle shape |
| `ellipse` | ELLIPSE | Circle/ellipse shape |
| `img` | IMAGE | Image placeholder |
| `vector` | VECTOR | SVG/icon |
| `instance` | INSTANCE | Component instance |
| `group` | GROUP | Group container |

---

## Common Node Properties

### Identity
| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `id` | string | Figma node ID | `"123:456"` |
| `n` | string | Layer name | `"Button"` |
| `t` | string | Node type code | `"frame"` |

### Dimensions
| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `w` | number/string | Width in px or "fill"/"hug" | `320`, `"fill"` |
| `h` | number/string | Height in px or "fill"/"hug" | `48`, `"hug"` |
| `minW` | number | Min width | `100` |
| `maxW` | number | Max width | `500` |
| `minH` | number | Min height | `40` |
| `maxH` | number | Max height | `200` |

### Layout (Auto Layout)
| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `l` | string | flex direction | `"row"`, `"col"` |
| `g` | number | Gap between children | `16` |
| `p` | number/array | Padding [top,right,bottom,left] or single | `16`, `[16,24,16,24]` |
| `j` | string | Main axis alignment | `"start"`, `"center"`, `"end"`, `"between"` |
| `al` | string | Cross axis alignment | `"start"`, `"center"`, `"end"`, `"stretch"` |
| `wr` | boolean | Flex wrap | `true` |

### Positioning (Absolute)
| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `ps` | string | Position type | `"abs"` (absolute) |
| `x` | number | X position | `100` |
| `y` | number | Y position | `50` |
| `cn` | object | Responsive constraints | `{"h":"left","v":"top"}` |

### Appearance
| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `bg` | string | Background color/gradient | `"$c0"`, `"#FF0000"` |
| `o` | number | Opacity 0-1 | `0.8` |
| `r` | number/array | Border radius [tl,tr,br,bl] or single | `8`, `[8,8,0,0]` |
| `bd` | object | Border style | `{"w":1,"c":"$c1","style":"solid"}` |
| `sh` | string | Shadow token or value | `"$s1"` |
| `bl` | number | Background blur | `10` |

### Visibility
| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `vs` | boolean | Is visible | `false` |
| `of` | string | Overflow behavior | `"hidden"`, `"scroll"`, `"visible"` |

---

## Text Node Properties

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `c` | string | Text content | `"Hello World"` |
| `f` | string | Font family token | `"$f0"` |
| `s` | number | Font size in px | `16` |
| `wt` | number | Font weight | `400`, `600`, `700` |
| `cl` | string | Text color | `"$c1"` |
| `lh` | number/string | Line height px or multiplier | `24`, `1.5` |
| `ls` | number | Letter spacing | `-0.02` |
| `ta` | string | Horizontal align | `"left"`, `"center"`, `"right"` |
| `td` | string | Decoration | `"underline"`, `"line-through"` |
| `tt` | string | Transform | `"uppercase"`, `"capitalize"` |
| `tr` | boolean/number | Truncate lines | `true`, `2` |

---

## Image Node Properties

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `src` | string | Image reference/placeholder | `"img_hero"` |
| `ft` | string | Object fit | `"cover"`, `"contain"`, `"fill"` |
| `alt` | string | Alt text (from layer name) | `"Hero image"` |

---

## Gradient Background

```json
{
  "bg": {
    "type": "linear",
    "angle": 90,
    "stops": [
      {"pos": 0, "color": "$c2"},
      {"pos": 1, "color": "$c3"}
    ]
  }
}
```

---

## Children

Children are nested in `ch` array:

```json
{
  "t": "frame",
  "l": "col",
  "ch": [
    { "t": "text", "c": "Title" },
    { "t": "frame", "ch": [...] }
  ]
}
```

---

## Complete Example

```json
{
  "v": "1.0",
  "name": "ProductCard",
  "tokens": {
    "colors": {
      "c0": "#FFFFFF",
      "c1": "#111827",
      "c2": "#6B7280",
      "c3": "#4F46E5",
      "c4": "rgba(0,0,0,0.08)"
    },
    "fonts": {
      "f0": "Inter"
    },
    "shadows": {
      "s0": "0 4px 12px rgba(0,0,0,0.08)"
    }
  },
  "tree": {
    "t": "frame",
    "n": "ProductCard",
    "l": "col",
    "w": 280,
    "h": "hug",
    "p": 16,
    "g": 12,
    "r": 16,
    "bg": "$c0",
    "sh": "$s0",
    "ch": [
      {
        "t": "img",
        "n": "ProductImage",
        "w": "fill",
        "h": 180,
        "r": 8,
        "ft": "cover"
      },
      {
        "t": "text",
        "n": "Title",
        "c": "Product Title",
        "f": "$f0",
        "s": 18,
        "wt": 600,
        "cl": "$c1",
        "lh": 1.4
      },
      {
        "t": "text",
        "n": "Price",
        "c": "$99.00",
        "f": "$f0",
        "s": 16,
        "wt": 500,
        "cl": "$c2"
      },
      {
        "t": "frame",
        "n": "Button",
        "l": "row",
        "w": "fill",
        "h": 44,
        "r": 8,
        "bg": "$c3",
        "j": "center",
        "al": "center",
        "ch": [
          {
            "t": "text",
            "c": "Add to Cart",
            "f": "$f0",
            "s": 14,
            "wt": 500,
            "cl": "$c0"
          }
        ]
      }
    ]
  }
}
```

---

## Size Optimization Rules

1. **Omit defaults**: Don't include properties with default values
   - `visible: true` (default) → omit
   - `opacity: 1` (default) → omit
   - `overflow: "visible"` (default) → omit

2. **Use tokens**: Extract repeated colors/fonts to tokens section

3. **Shorthand padding**: Use single number if all sides equal
   - `[16,16,16,16]` → `16`

4. **Shorthand radius**: Use single number if all corners equal
   - `[8,8,8,8]` → `8`

---

## Mapping to CSS

| Format Key | CSS |
|------------|-----|
| `l: "row"` | `display: flex; flex-direction: row` |
| `l: "col"` | `display: flex; flex-direction: column` |
| `g: 16` | `gap: 16px` |
| `p: 16` | `padding: 16px` |
| `p: [16,24,16,24]` | `padding: 16px 24px 16px 24px` |
| `j: "center"` | `justify-content: center` |
| `j: "between"` | `justify-content: space-between` |
| `al: "center"` | `align-items: center` |
| `w: "fill"` | `width: 100%` or `flex: 1` |
| `w: "hug"` | `width: fit-content` |
| `r: 8` | `border-radius: 8px` |
| `tr: true` | `overflow: hidden; text-overflow: ellipsis` |
| `tr: 2` | `-webkit-line-clamp: 2` |
