import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { IDE_THEMES } from "@/config/brand";

// Use the bundled Monaco (and its language workers) instead of loading a copy from a CDN.
self.MonacoEnvironment = {
  getWorker(_workerId, label) {
    if (label === "json") return new jsonWorker();
    if (label === "css" || label === "scss" || label === "less") return new cssWorker();
    if (label === "html" || label === "handlebars" || label === "razor") return new htmlWorker();
    if (label === "typescript" || label === "javascript") return new tsWorker();
    return new editorWorker();
  },
};

loader.config({ monaco });

// Workspaces have no node_modules type info in the browser, so skip semantic errors like
// "Cannot find module 'react'" and keep syntax checking only.
for (const defaults of [
  monaco.languages.typescript.typescriptDefaults,
  monaco.languages.typescript.javascriptDefaults,
]) {
  defaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
  defaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    jsx: monaco.languages.typescript.JsxEmit.Preserve,
    allowJs: true,
    allowNonTsExtensions: true,
    esModuleInterop: true,
  });
}

export const EDITOR_THEMES = { light: "nimbus-light", dark: "nimbus-dark" } as const;

// Xcode's default syntax palette (matches the marketing visuals).
const SYNTAX = {
  light: { keyword: "ad3da4", string: "c41a16", number: "1c00cf", comment: "5d6c79", type: "0b4f79", fn: "326d74" },
  dark: { keyword: "fc5fa3", string: "fc6a5d", number: "d0bf69", comment: "7f8c98", type: "5dd8ff", fn: "67b7a4" },
} as const;

for (const mode of ["light", "dark"] as const) {
  const c = IDE_THEMES[mode];
  const x = SYNTAX[mode];
  monaco.editor.defineTheme(EDITOR_THEMES[mode], {
    base: mode === "dark" ? "vs-dark" : "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: x.keyword, fontStyle: "bold" },
      { token: "string", foreground: x.string },
      { token: "number", foreground: x.number },
      { token: "comment", foreground: x.comment, fontStyle: "italic" },
      { token: "type", foreground: x.type },
      { token: "type.identifier", foreground: x.type },
      { token: "tag", foreground: x.keyword },
      { token: "attribute.name", foreground: x.fn },
      { token: "attribute.value", foreground: x.string },
    ],
    colors: {
      "editor.background": c.surface,
      "editor.foreground": c.foreground,
      "editor.lineHighlightBackground": c.lineHighlight,
      "editor.lineHighlightBorder": "#00000000",
      "editorLineNumber.foreground": c.muted,
      "editorLineNumber.activeForeground": c.accent,
      "editorCursor.foreground": c.accent,
      "editor.selectionBackground": c.selection,
      "editorWidget.background": c.bar,
      "scrollbarSlider.background": mode === "dark" ? "#ffffff14" : "#0000001a",
      "scrollbarSlider.hoverBackground": mode === "dark" ? "#ffffff24" : "#0000002a",
    },
  });
}

export { monaco };
