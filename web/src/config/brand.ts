// Single source of truth for the product name — change it here to rebrand the app.
export const APP_NAME = "Nimbus";
export const APP_TAGLINE = "Your dev environment, in the cloud";

// Hex colours shared by Monaco and xterm (they can't read CSS variables).
// Keep in sync with the --ide-* tokens in index.css.
export const IDE_THEMES = {
  light: {
    surface: "#ffffff",
    bar: "#fafafa",
    foreground: "#1d1d1f",
    accent: "#0071e3",
    muted: "#a1a1a6",
    selection: "#0071e333",
    lineHighlight: "#00000006",
  },
  dark: {
    surface: "#121214",
    bar: "#1a1a1d",
    foreground: "#e8e8ed",
    accent: "#2997ff",
    muted: "#5a5a60",
    selection: "#2997ff40",
    lineHighlight: "#ffffff08",
  },
} as const;
