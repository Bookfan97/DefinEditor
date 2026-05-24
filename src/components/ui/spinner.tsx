import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} {...props}>
        <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
      </div>
    )
  }
)
Spinner.displayName = "Spinner"
