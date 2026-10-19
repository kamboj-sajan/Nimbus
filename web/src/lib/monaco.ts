import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { IDE_COLORS } from "@/config/brand";

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

export const EDITOR_THEME = "nimbus-dark";

monaco.editor.defineTheme(EDITOR_THEME, {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": IDE_COLORS.surface,
    "editor.foreground": IDE_COLORS.foreground,
    "editor.lineHighlightBackground": "#ffffff08",
    "editor.lineHighlightBorder": "#00000000",
    "editorLineNumber.foreground": IDE_COLORS.muted,
    "editorLineNumber.activeForeground": IDE_COLORS.accent,
    "editorCursor.foreground": IDE_COLORS.accent,
    "editor.selectionBackground": "#6366f140",
    "editorIndentGuide.background1": "#ffffff0d",
    "editorWidget.background": IDE_COLORS.bar,
    "scrollbarSlider.background": "#ffffff14",
    "scrollbarSlider.hoverBackground": "#ffffff24",
  },
});

export { monaco };
