import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider max-w-full truncate shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-zinc-300/80 bg-zinc-100 text-zinc-900 font-bold shadow-2xs",
        secondary: "border-zinc-200 bg-zinc-100/90 text-zinc-800",
        destructive: "border-zinc-300 bg-zinc-900 text-white font-mono",
        outline: "text-zinc-800 border-zinc-200 bg-white",
        dark: "border-zinc-800 bg-zinc-900 text-zinc-100",
        alert: "border-rose-600 bg-rose-600 text-white font-black animate-pulse",
        success: "border-emerald-600 bg-emerald-700 text-white font-mono",
        danger: "border-rose-600 bg-rose-700 text-white font-mono",
        warning: "border-amber-600 bg-amber-700 text-white font-mono"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge: React.FC<BadgeProps> = ({ className, variant, children, ...props }) => {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}

export { badgeVariants }
