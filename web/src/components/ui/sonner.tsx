import { Toaster as Sonner, type ToasterProps } from "sonner"

// Nimbus is dark-only, so the toaster theme is fixed instead of read from next-themes.
const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    className="toaster group"
    richColors
    closeButton
    style={
      {
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      } as React.CSSProperties
    }
    {...props}
  />
)

export { Toaster }
