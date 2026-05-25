import * as React from "react"
import { cn } from "@/lib/utils"

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const Tooltip = ({ children }: { children: React.ReactNode }) => <div className="relative group">{children}</div>
export const TooltipTrigger = ({ children }: { children: React.ReactNode, asChild?: boolean }) => <>{children}</>
export const TooltipContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2 rounded shadow-md z-50 whitespace-nowrap", className)}>
    {children}
  </div>
)
