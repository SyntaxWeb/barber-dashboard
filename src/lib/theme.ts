export type BrandTheme = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
};

export type ThemeKind = "dashboard" | "client";

export const THEME_FIELDS: Array<keyof BrandTheme> = ["primary", "secondary", "background", "surface", "text", "accent"];

export const DEFAULT_DASHBOARD_THEME: BrandTheme = {
  primary: "#0F172A",
  secondary: "#1D4ED8",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  accent: "#F97316",
};

export const DEFAULT_CLIENT_THEME: BrandTheme = {
  primary: "#111827",
  secondary: "#DC2626",
  background: "#FDF2F8",
  surface: "#FFFFFF",
  text: "#111827",
  accent: "#FBBF24",
};

const HEX_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const isValidHexColor = (value?: string | null): value is string => !!value && HEX_REGEX.test(value.trim());

const normalizeHex = (value: string, fallback: string): string => {
  if (!isValidHexColor(value)) {
    return fallback.toUpperCase();
  }
  let hex = value.trim();
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex.toUpperCase();
};

export const sanitizeTheme = (theme?: Partial<BrandTheme> | null, fallback: BrandTheme = DEFAULT_DASHBOARD_THEME): BrandTheme => {
  return {
    primary: normalizeHex(theme?.primary ?? fallback.primary, fallback.primary),
    secondary: normalizeHex(theme?.secondary ?? fallback.secondary, fallback.secondary),
    background: normalizeHex(theme?.background ?? fallback.background, fallback.background),
    surface: normalizeHex(theme?.surface ?? fallback.surface, fallback.surface),
    text: normalizeHex(theme?.text ?? fallback.text, fallback.text),
    accent: normalizeHex(theme?.accent ?? fallback.accent, fallback.accent),
  };
};

type HslColor = { h: number; s: number; l: number };

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const value = normalizeHex(hex, "#000000").replace("#", "");
  const bigint = parseInt(value, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHsl = ({ r, g, b }: { r: number; g: number; b: number }): HslColor => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hexToHsl = (hex: string): HslColor => rgbToHsl(hexToRgb(hex));

export const hexToHslString = (hex: string): string => {
  const { h, s, l } = hexToHsl(hex);
  return `${h} ${s}% ${l}%`;
};

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const hslToString = ({ h, s, l }: HslColor): string => `${h} ${s}% ${l}%`;

const adjustLightness = (hex: string, amount: number): string => {
  const { h, s, l } = hexToHsl(hex);
  return `${h} ${s}% ${clamp(l + amount)}%`;
};

const relativeLuminance = (hex: string): number => {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const contrastRatio = (foreground: string, background: string): number => {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

export const bestReadableColor = (background: string, options = ["#0F172A", "#FFFFFF"]): string => {
  return options.reduce((best, current) =>
    contrastRatio(current, background) > contrastRatio(best, background) ? current : best,
  );
};

export const ensureReadableColor = (foreground: string, background: string, minimumRatio = 4.5): string => {
  const normalizedForeground = normalizeHex(foreground, "#0F172A");
  const normalizedBackground = normalizeHex(background, "#FFFFFF");

  if (contrastRatio(normalizedForeground, normalizedBackground) >= minimumRatio) {
    return normalizedForeground;
  }

  return bestReadableColor(normalizedBackground);
};

const readableMutedColor = (text: string, background: string): string => {
  const readableText = ensureReadableColor(text, background);
  const { h, s, l } = hexToHsl(readableText);
  const bgLightness = hexToHsl(background).l;

  return hslToString({
    h,
    s: clamp(s, 8, 40),
    l: bgLightness > 55 ? clamp(l + 24, 25, 48) : clamp(l - 18, 68, 92),
  });
};

const adaptiveBorder = (surface: string, background: string): string => {
  const surfaceHsl = hexToHsl(surface);
  const backgroundHsl = hexToHsl(background);
  const direction = surfaceHsl.l > 52 ? -16 : 18;
  const amount = Math.abs(surfaceHsl.l - backgroundHsl.l) < 8 ? direction * 1.4 : direction;

  return `${surfaceHsl.h} ${clamp(surfaceHsl.s, 8, 45)}% ${clamp(surfaceHsl.l + amount, 12, 88)}%`;
};

export const getThemeReadabilityIssues = (theme: BrandTheme): string[] => {
  const palette = sanitizeTheme(theme);
  const issues: string[] = [];

  if (contrastRatio(palette.text, palette.background) < 4.5) {
    issues.push("Texto com baixo contraste no fundo principal");
  }
  if (contrastRatio(palette.text, palette.surface) < 4.5) {
    issues.push("Texto com baixo contraste nos cards");
  }
  if (contrastRatio(bestReadableColor(palette.primary), palette.primary) < 4.5) {
    issues.push("Cor primária muito próxima dos tons de texto padrão");
  }
  if (contrastRatio(bestReadableColor(palette.accent), palette.accent) < 3) {
    issues.push("Realce com pouco contraste");
  }

  return issues;
};

export const themeToCssVars = (theme: BrandTheme): Record<string, string> => {
  const palette = sanitizeTheme(theme);
  const foreground = ensureReadableColor(palette.text, palette.background);
  const surfaceForeground = ensureReadableColor(palette.text, palette.surface);
  const primaryFore = bestReadableColor(palette.primary);
  const secondaryFore = bestReadableColor(palette.secondary);
  const accentFore = bestReadableColor(palette.accent);
  const muted = adjustLightness(palette.background, hexToHsl(palette.background).l > 55 ? -5 : 8);
  const border = adaptiveBorder(palette.surface, palette.background);

  return {
    "--background": hexToHslString(palette.background),
    "--foreground": hexToHslString(foreground),
    "--card": hexToHslString(palette.surface),
    "--card-foreground": hexToHslString(surfaceForeground),
    "--popover": hexToHslString(palette.surface),
    "--popover-foreground": hexToHslString(surfaceForeground),
    "--primary": hexToHslString(palette.primary),
    "--primary-foreground": hexToHslString(primaryFore),
    "--secondary": hexToHslString(palette.secondary),
    "--secondary-foreground": hexToHslString(secondaryFore),
    "--accent": hexToHslString(palette.accent),
    "--accent-foreground": hexToHslString(accentFore),
    "--muted": muted,
    "--muted-foreground": readableMutedColor(palette.text, palette.background),
    "--border": border,
    "--input": border,
    "--ring": hexToHslString(palette.primary),
    "--sidebar-background": hexToHslString(palette.surface),
    "--sidebar-foreground": hexToHslString(surfaceForeground),
    "--sidebar-primary": hexToHslString(palette.primary),
    "--sidebar-primary-foreground": hexToHslString(primaryFore),
    "--sidebar-accent": hexToHslString(palette.accent),
    "--sidebar-accent-foreground": hexToHslString(accentFore),
    "--sidebar-border": border,
    "--sidebar-ring": hexToHslString(palette.primary),
  };
};

export const THEME_VARIABLES = Object.keys(themeToCssVars(DEFAULT_DASHBOARD_THEME));
