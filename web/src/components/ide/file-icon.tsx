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
  [/\.(ts|tsx|mts|cts)$/, FileCode2, "text-[#0071e3] dark:text-[#64d2ff]"],
  [/\.(js|jsx|mjs|cjs)$/, FileCode2, "text-[#b25000] dark:text-[#ffd60a]"],
  [/\.(py|pyw)$/, FileCode2, "text-[#0040dd] dark:text-[#409cff]"],
  [/\.(go)$/, FileCode2, "text-[#0071a4] dark:text-[#70d7ff]"],
  [/\.(rs)$/, FileCode2, "text-[#c93400] dark:text-[#ff9f0a]"],
  [/\.(c|h|cpp|cc|cxx|hpp|java|kt|cs|rb|php|swift|lua|dart)$/, FileCode2, "text-[#8944ab] dark:text-[#bf5af2]"],
  [/\.(html?|vue|svelte)$/, FileType2, "text-[#c93400] dark:text-[#ff9f0a]"],
  [/\.(css|scss|sass|less)$/, Braces, "text-[#d30f45] dark:text-[#ff375f]"],
  [/\.(json|jsonc|json5)$/, FileJson, "text-[#a05a00] dark:text-[#ffd426]"],
  [/\.(md|mdx|txt|rst)$/, FileText, "text-muted-foreground"],
  [/\.(sh|bash|zsh|ps1|bat)$/, FileTerminal, "text-[#248a3d] dark:text-[#30d158]"],
  [/\.(png|jpe?g|gif|svg|webp|ico)$/, FileImage, "text-[#8944ab] dark:text-[#da8fff]"],
  [/\.(ya?ml|toml|ini|cfg|env)$|^\.env|^dockerfile$|^makefile$|rc$/, Settings2, "text-muted-foreground"],
  [/(lock|\.lock)$|lock\.json$/, Lock, "text-muted-foreground"],
];

export function FileIcon({ name, className }: { name: string; className?: string }) {
  const lower = name.toLowerCase();
  const match = ICONS.find(([pattern]) => pattern.test(lower));
  const [, Icon, color] = match ?? [null, File, "text-muted-foreground"];
  return <Icon className={cn("size-4 shrink-0", color, className)} />;
}

export function FolderIcon({ open, className }: { open: boolean; className?: string }) {
  const Icon = open ? FolderOpen : Folder;
  return <Icon className={cn("size-4 shrink-0 text-[#0071e3] dark:text-[#2997ff]", className)} />;
}
