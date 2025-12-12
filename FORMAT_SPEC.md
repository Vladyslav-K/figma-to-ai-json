# Figma Export Format Specification v1.0

## Overview

This format is optimized for Claude to generate pixel-perfect React/Tailwind code from Figma designs.

## Design Principles

1. **Compact** - Short keys to minimize tokens
2. **Unambiguous** - Each property has one clear meaning
3. **Complete** - All data needed for pixel-perfect rendering
4. **Hierarchical** - Mirrors component tree structure

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
| `name` | string | Layer name | `"Button"` |
| `type` | string | Node type code | `"frame"` |

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
| `layout` | string | flex direction | `"row"`, `"col"` |
| `gap` | number | Gap between children | `16` |
| `p` | number/array | Padding [top,right,bottom,left] or single | `16`, `[16,24,16,24]` |
| `justify` | string | Main axis alignment | `"start"`, `"center"`, `"end"`, `"between"` |
| `align` | string | Cross axis alignment | `"start"`, `"center"`, `"end"`, `"stretch"` |
| `wrap` | boolean | Flex wrap | `true` |

### Positioning (Absolute)
| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `pos` | string | Position type | `"abs"` (absolute) |
| `x` | number | X position | `100` |
| `y` | number | Y position | `50` |
| `constraints` | object | Responsive constraints | `{"h":"left","v":"top"}` |

### Appearance
| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `bg` | string | Background color/gradient | `"$c0"`, `"#FF0000"` |
| `opacity` | number | Opacity 0-1 | `0.8` |
| `radius` | number/array | Border radius [tl,tr,br,bl] or single | `8`, `[8,8,0,0]` |
| `border` | object | Border style | `{"w":1,"c":"$c1","style":"solid"}` |
| `shadow` | string | Shadow token or value | `"$s1"` |
| `blur` | number | Background blur | `10` |

### Visibility
| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `visible` | boolean | Is visible | `false` |
| `overflow` | string | Overflow behavior | `"hidden"`, `"scroll"`, `"visible"` |

---

## Text Node Properties

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `content` | string | Text content | `"Hello World"` |
| `font` | string | Font family token | `"$f0"` |
| `size` | number | Font size in px | `16` |
| `weight` | number | Font weight | `400`, `600`, `700` |
| `color` | string | Text color | `"$c1"` |
| `lineH` | number/string | Line height px or multiplier | `24`, `1.5` |
| `letterS` | number | Letter spacing | `-0.02` |
| `textAlign` | string | Horizontal align | `"left"`, `"center"`, `"right"` |
| `textDecor` | string | Decoration | `"underline"`, `"line-through"` |
| `textTransform` | string | Transform | `"uppercase"`, `"capitalize"` |
| `truncate` | boolean/number | Truncate lines | `true`, `2` |

---

## Image Node Properties

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `src` | string | Image reference/placeholder | `"img_hero"` |
| `fit` | string | Object fit | `"cover"`, `"contain"`, `"fill"` |
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
  "type": "frame",
  "layout": "col",
  "ch": [
    { "type": "text", "content": "Title" },
    { "type": "frame", "ch": [...] }
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
    "type": "frame",
    "name": "ProductCard",
    "layout": "col",
    "w": 280,
    "h": "hug",
    "p": 16,
    "gap": 12,
    "radius": 16,
    "bg": "$c0",
    "shadow": "$s0",
    "ch": [
      {
        "type": "img",
        "name": "ProductImage",
        "w": "fill",
        "h": 180,
        "radius": 8,
        "fit": "cover"
      },
      {
        "type": "text",
        "name": "Title",
        "content": "Product Title",
        "font": "$f0",
        "size": 18,
        "weight": 600,
        "color": "$c1",
        "lineH": 1.4
      },
      {
        "type": "text",
        "name": "Price",
        "content": "$99.00",
        "font": "$f0",
        "size": 16,
        "weight": 500,
        "color": "$c2"
      },
      {
        "type": "frame",
        "name": "Button",
        "layout": "row",
        "w": "fill",
        "h": 44,
        "radius": 8,
        "bg": "$c3",
        "justify": "center",
        "align": "center",
        "ch": [
          {
            "type": "text",
            "content": "Add to Cart",
            "font": "$f0",
            "size": 14,
            "weight": 500,
            "color": "$c0"
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

## Mapping to Tailwind/CSS

| Format Key | Tailwind | CSS |
|------------|----------|-----|
| `layout: "row"` | `flex flex-row` | `display: flex; flex-direction: row` |
| `layout: "col"` | `flex flex-col` | `display: flex; flex-direction: column` |
| `gap: 16` | `gap-4` | `gap: 16px` |
| `p: 16` | `p-4` | `padding: 16px` |
| `p: [16,24,16,24]` | `py-4 px-6` | `padding: 16px 24px` |
| `justify: "center"` | `justify-center` | `justify-content: center` |
| `justify: "between"` | `justify-between` | `justify-content: space-between` |
| `align: "center"` | `items-center` | `align-items: center` |
| `w: "fill"` | `w-full` or `flex-1` | `width: 100%` or `flex: 1` |
| `w: "hug"` | `w-fit` | `width: fit-content` |
| `radius: 8` | `rounded-lg` | `border-radius: 8px` |
| `truncate: true` | `truncate` | `overflow: hidden; text-overflow: ellipsis` |
| `truncate: 2` | `line-clamp-2` | `-webkit-line-clamp: 2` |
