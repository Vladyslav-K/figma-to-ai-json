import type { DesignTokens } from './types';

export class TokenExtractor {
  private colors: Map<string, string> = new Map();
  private fonts: Map<string, string> = new Map();
  private shadows: Map<string, string> = new Map();

  private colorCounter = 0;
  private fontCounter = 0;
  private shadowCounter = 0;

  addColor(color: string): string {
    const normalized = color.toUpperCase();

    if (this.colors.has(normalized)) {
      return this.colors.get(normalized)!;
    }

    const token = `$c${this.colorCounter++}`;
    this.colors.set(normalized, token);
    return token;
  }

  addFont(fontFamily: string): string {
    const normalized = fontFamily.trim();

    if (this.fonts.has(normalized)) {
      return this.fonts.get(normalized)!;
    }

    const token = `$f${this.fontCounter++}`;
    this.fonts.set(normalized, token);
    return token;
  }

  addShadow(shadow: string): string {
    const normalized = shadow.trim();

    if (this.shadows.has(normalized)) {
      return this.shadows.get(normalized)!;
    }

    const token = `$s${this.shadowCounter++}`;
    this.shadows.set(normalized, token);
    return token;
  }

  getTokens(): DesignTokens {
    const colors: Record<string, string> = {};
    const fonts: Record<string, string> = {};
    const shadows: Record<string, string> = {};

    this.colors.forEach((token, value) => {
      colors[token.substring(1)] = value;
    });

    this.fonts.forEach((token, value) => {
      fonts[token.substring(1)] = value;
    });

    this.shadows.forEach((token, value) => {
      shadows[token.substring(1)] = value;
    });

    return { colors, fonts, shadows };
  }
}

export function optimizeTokens(tokens: DesignTokens): DesignTokens {
  const optimized: DesignTokens = {
    colors: {},
    fonts: {},
    shadows: {},
  };

  if (Object.keys(tokens.colors).length > 0) {
    optimized.colors = tokens.colors;
  }

  if (Object.keys(tokens.fonts).length > 0) {
    optimized.fonts = tokens.fonts;
  }

  if (Object.keys(tokens.shadows).length > 0) {
    optimized.shadows = tokens.shadows;
  }

  return optimized;
}
