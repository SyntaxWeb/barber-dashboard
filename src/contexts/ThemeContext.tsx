import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import {
  BrandTheme,
  DEFAULT_CLIENT_THEME,
  DEFAULT_DASHBOARD_THEME,
  ThemeKind,
  THEME_VARIABLES,
  sanitizeTheme,
  themeToCssVars,
} from "@/lib/theme";

type ThemeMode = "brand" | "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  setPalette: (kind: ThemeKind, palette?: Partial<BrandTheme> | null) => void;
  activatePalette: (kind: ThemeKind) => void;
  palettes: Record<ThemeKind, BrandTheme>;
  activeKind: ThemeKind;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_MODE: ThemeMode = "brand";
const STORAGE_KEY = "barbeiro-theme";

const readStoredMode = (): ThemeMode => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "brand" || stored === "light") {
    return stored as ThemeMode;
  }
  return DEFAULT_MODE;
};

const getDefaultPalettes = () => ({
  dashboard: DEFAULT_DASHBOARD_THEME,
  client: DEFAULT_CLIENT_THEME,
});

const resetCssVariables = () => {
  const root = document.documentElement;
  THEME_VARIABLES.forEach((variable) => root.style.removeProperty(variable));
};

const applyCssVariables = (palette: BrandTheme) => {
  const root = document.documentElement;
  const cssVars = themeToCssVars(palette);
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());
  const [palettes, setPalettes] = useState<Record<ThemeKind, BrandTheme>>(getDefaultPalettes);
  const [activeKind, setActiveKind] = useState<ThemeKind>("dashboard");

  const activePalette = useMemo(() => palettes[activeKind] ?? DEFAULT_DASHBOARD_THEME, [palettes, activeKind]);

  const syncCssVariables = useCallback(() => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
      resetCssVariables();
      return;
    }

    root.classList.remove("dark");
    if (mode === "light") {
      resetCssVariables();
      return;
    }

    applyCssVariables(activePalette);
  }, [mode, activePalette]);

  useEffect(() => {
    syncCssVariables();
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, syncCssVariables]);

  useEffect(() => {
    if (mode === "brand") {
      syncCssVariables();
    }
  }, [activePalette, mode, syncCssVariables]);

  const toggleMode = () => {
    setModeState((prev) => {
      if (prev === "brand") return "dark";
      if (prev === "dark") return "light";
      return "brand";
    });
  };

  const setMode = (next: ThemeMode) => {
    setModeState(next);
  };

  const setPalette = useCallback((kind: ThemeKind, palette?: Partial<BrandTheme> | null) => {
    setPalettes((current) => ({
      ...current,
      [kind]:
        kind === "dashboard"
          ? sanitizeTheme(palette, DEFAULT_DASHBOARD_THEME)
          : sanitizeTheme(palette, DEFAULT_CLIENT_THEME),
    }));
  }, []);

  const activatePalette = useCallback(
    (kind: ThemeKind) => {
      setActiveKind(kind);
      if (mode !== "brand") {
        return;
      }
      requestAnimationFrame(() => {
        const palette = kind === "dashboard" ? palettes.dashboard : palettes.client;
        applyCssVariables(palette);
      });
    },
    [mode, palettes],
  );

  const value = {
    mode,
    toggleMode,
    setMode,
    setPalette,
    activatePalette,
    palettes,
    activeKind,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
