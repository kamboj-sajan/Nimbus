import {
  Braces,
  File,
  FileCode2,
  FileImage,
  FileJson,
  FileTerminal,
  FileText,
  FileType2,
  Folder,
  FolderOpen,
  Lock,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Array<[RegExp, LucideIcon, string]> = [
  [/\.(ts|tsx|mts|cts)$/, FileCode2, "text-sky-400"],
  [/\.(js|jsx|mjs|cjs)$/, FileCode2, "text-yellow-400"],
  [/\.(py|pyw)$/, FileCode2, "text-blue-400"],
  [/\.(go)$/, FileCode2, "text-cyan-400"],
  [/\.(rs)$/, FileCode2, "text-orange-400"],
  [/\.(c|h|cpp|cc|cxx|hpp|java|kt|cs|rb|php|swift|lua|dart)$/, FileCode2, "text-violet-400"],
  [/\.(html?|vue|svelte)$/, FileType2, "text-orange-400"],
  [/\.(css|scss|sass|less)$/, Braces, "text-pink-400"],
  [/\.(json|jsonc|json5)$/, FileJson, "text-amber-300"],
  [/\.(md|mdx|txt|rst)$/, FileText, "text-slate-300"],
  [/\.(sh|bash|zsh|ps1|bat)$/, FileTerminal, "text-emerald-400"],
  [/\.(png|jpe?g|gif|svg|webp|ico)$/, FileImage, "text-fuchsia-400"],
  [/\.(ya?ml|toml|ini|cfg|env)$|^\.env|^dockerfile$|^makefile$|rc$/, Settings2, "text-slate-400"],
  [/(lock|\.lock)$|lock\.json$/, Lock, "text-slate-500"],
];

export function FileIcon({ name, className }: { name: string; className?: string }) {
  const lower = name.toLowerCase();
  const match = ICONS.find(([pattern]) => pattern.test(lower));
  const [, Icon, color] = match ?? [null, File, "text-slate-400"];
  return <Icon className={cn("size-4 shrink-0", color, className)} />;
}

export function FolderIcon({ open, className }: { open: boolean; className?: string }) {
  const Icon = open ? FolderOpen : Folder;
  return <Icon className={cn("size-4 shrink-0 text-sky-400", className)} />;
}
