
export interface ThemeConfig {
  name: string;
  colors: {
    bg: string;
    panel: string;
    border: string;
    text: string;
    accent: string;
    success: string;
    danger: string;
    warning: string;
    muted: string;
  };
}

export const THEMES: Record<string, ThemeConfig> = {
  default: {
    name: "SHER PRO",
    colors: {
      bg: "#0B0F14",
      panel: "#111827",
      border: "#1F2937",
      text: "#E5E7EB",
      accent: "#3B82F6",
      success: "#22C55E",
      danger: "#EF4444",
      warning: "#EAB308",
      muted: "#9CA3AF",
    }
  },
  alpha: {
    name: "ALPHA FUND",
    colors: {
      bg: "#05070A",
      panel: "#0F172A",
      border: "#1E293B",
      text: "#F8FAF8",
      accent: "#3B82F6",
      success: "#10B981",
      danger: "#F43F5E",
      warning: "#F59E0B",
      muted: "#94A3B8",
    }
  },
  obsidian: {
    name: "OBSIDIAN HFT",
    colors: {
      bg: "#000000",
      panel: "#0A0A0A",
      border: "#1A1A1A",
      text: "#FAFAFA",
      accent: "#FFFFFF",
      success: "#00FF00",
      danger: "#FF0000",
      warning: "#FFFF00",
      muted: "#666666",
    }
  }
};

export const applyTheme = (theme: ThemeConfig) => {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
};
