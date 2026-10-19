// File extension → Monaco language id (all of these ship with monaco-editor).
const BY_EXTENSION: Record<string, string> = {
  js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "javascript",
  ts: "typescript", mts: "typescript", cts: "typescript", tsx: "typescript",
  py: "python", pyw: "python",
  c: "c", h: "c",
  cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", hh: "cpp",
  java: "java", kt: "kotlin", kts: "kotlin", scala: "scala",
  cs: "csharp", fs: "fsharp", vb: "vb",
  go: "go", rs: "rust", swift: "swift", dart: "dart",
  rb: "ruby", php: "php", pl: "perl", lua: "lua", r: "r", jl: "julia",
  html: "html", htm: "html", vue: "html", svelte: "html",
  css: "css", scss: "scss", sass: "scss", less: "less",
  json: "json", jsonc: "json", json5: "json",
  md: "markdown", markdown: "markdown", mdx: "markdown",
  sh: "shell", bash: "shell", zsh: "shell",
  ps1: "powershell", bat: "bat", cmd: "bat",
  yaml: "yaml", yml: "yaml", toml: "ini", ini: "ini", cfg: "ini", env: "ini",
  xml: "xml", svg: "xml", sql: "sql", graphql: "graphql", gql: "graphql",
  proto: "protobuf", sol: "solidity", ex: "elixir", exs: "elixir", clj: "clojure",
  hcl: "hcl", tf: "hcl",
};

const BY_FILENAME: Record<string, string> = {
  dockerfile: "dockerfile",
  makefile: "shell",
  ".gitignore": "ini",
  ".env": "ini",
  ".bashrc": "shell",
  ".zshrc": "shell",
};

export function languageFromPath(path: string): string {
  const name = path.split("/").pop()?.toLowerCase() ?? "";
  if (BY_FILENAME[name]) return BY_FILENAME[name];
  const ext = name.includes(".") ? name.split(".").pop()! : "";
  return BY_EXTENSION[ext] ?? "plaintext";
}

const DISPLAY_NAMES: Record<string, string> = {
  javascript: "JavaScript", typescript: "TypeScript", python: "Python", cpp: "C++", c: "C",
  csharp: "C#", fsharp: "F#", html: "HTML", css: "CSS", scss: "SCSS", json: "JSON",
  markdown: "Markdown", shell: "Shell", yaml: "YAML", plaintext: "Plain text", sql: "SQL",
  dockerfile: "Dockerfile", ini: "Config", xml: "XML", go: "Go", rust: "Rust", java: "Java",
};

export function languageLabel(id: string): string {
  return DISPLAY_NAMES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}
