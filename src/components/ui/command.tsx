import * as React from "react"
import { cn } from "@/lib/utils"

export const CommandDialog = ({ children, open, onOpenChange, title, description }: any) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-lg">
        {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        {children}
        <button 
          onClick={() => onOpenChange(false)}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export const CommandInput = ({ className, ...props }: any) => (
  <input
    className={cn(
      "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
)

export const CommandList = ({ children }: any) => (
  <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">{children}</div>
)

export const CommandEmpty = ({ children }: any) => (
  <div className="py-6 text-center text-sm">{children}</div>
)

export const CommandGroup = ({ children, heading }: any) => (
  <div className="overflow-hidden p-1 text-foreground">
    {heading && (
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        {heading}
      </div>
    )}
    {children}
  </div>
)

export const CommandItem = ({ children, onSelect, className }: any) => (
  <div
    onClick={onSelect}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
  >
    {children}
  </div>
)
