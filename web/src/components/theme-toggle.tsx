import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setThemePreference, useTheme, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/** Light / Dark / System switcher. */
export default function ThemeToggle({ className }: { className?: string }) {
  const { preference, resolved } = useTheme();
  const Icon = resolved === "dark" ? Moon : Sun;
  // After a mouse pick, don't move focus back to the trigger (avoids a stray focus ring);
  // keyboard users still get focus returned.
  const pickedWithPointer = useRef(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Theme: ${preference}. Change theme`}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground",
            className
          )}
        >
          <Icon className="size-[18px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40"
        onPointerDown={() => (pickedWithPointer.current = true)}
        onCloseAutoFocus={(event) => {
          if (pickedWithPointer.current) event.preventDefault();
          pickedWithPointer.current = false;
        }}
      >
        {OPTIONS.map(({ value, label, icon: OptionIcon }) => (
          <DropdownMenuItem key={value} onClick={() => setThemePreference(value)}>
            <OptionIcon className="size-4" />
            {label}
            {preference === value && <Check className="ml-auto size-4 text-link" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
