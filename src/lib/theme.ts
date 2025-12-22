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

const adjustLightness = (hex: string, amount: number): string => {
  const { h, s, l } = hexToHsl(hex);
  return `${h} ${s}% ${clamp(l + amount)}%`;
};

const contrastColor = (hex: string): string => {
  const { l } = hexToHsl(hex);
  return l > 60 ? "#0F172A" : "#FFFFFF";
};

export const themeToCssVars = (theme: BrandTheme): Record<string, string> => {
  const palette = sanitizeTheme(theme);
  const primaryFore = hexToHslString(contrastColor(palette.primary));
  const secondaryFore = hexToHslString(contrastColor(palette.secondary));
  const accentFore = hexToHslString(contrastColor(palette.accent));
  const surfaceForeground = hexToHslString(palette.text);

  return {
    "--background": hexToHslString(palette.background),
    "--foreground": hexToHslString(palette.text),
    "--card": hexToHslString(palette.surface),
    "--card-foreground": surfaceForeground,
    "--popover": hexToHslString(palette.surface),
    "--popover-foreground": surfaceForeground,
    "--primary": hexToHslString(palette.primary),
    "--primary-foreground": primaryFore,
    "--secondary": hexToHslString(palette.secondary),
    "--secondary-foreground": secondaryFore,
    "--accent": hexToHslString(palette.accent),
    "--accent-foreground": accentFore,
    "--muted": adjustLightness(palette.background, -5),
    "--muted-foreground": hexToHslString(palette.text),
    "--border": adjustLightness(palette.surface, -20),
    "--input": adjustLightness(palette.surface, -15),
    "--ring": hexToHslString(palette.primary),
    "--sidebar-background": hexToHslString(palette.surface),
    "--sidebar-foreground": surfaceForeground,
    "--sidebar-primary": hexToHslString(palette.primary),
    "--sidebar-primary-foreground": primaryFore,
    "--sidebar-accent": hexToHslString(palette.accent),
    "--sidebar-accent-foreground": accentFore,
    "--sidebar-border": adjustLightness(palette.surface, -15),
    "--sidebar-ring": hexToHslString(palette.primary),
  };
};

export const THEME_VARIABLES = Object.keys(themeToCssVars(DEFAULT_DASHBOARD_THEME));
