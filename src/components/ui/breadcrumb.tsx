import * as React from "react"
import { cn } from "@/lib/utils"

export const Breadcrumb = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <nav className={cn("flex", className)}>{children}</nav>
)

export const BreadcrumbList = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <ol className={cn("flex items-center gap-2", className)}>{children}</ol>
)

export const BreadcrumbItem = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <li className={cn("flex items-center gap-2", className)}>{children}</li>
)

export const BreadcrumbLink = ({ children, className }: { children: React.ReactNode, className?: string, asChild?: boolean }) => (
  <span className={cn("hover:text-foreground transition-colors", className)}>{children}</span>
)

export const BreadcrumbPage = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <span onClick={onClick} className={cn("font-medium text-foreground", className)}>{children}</span>
)

export const BreadcrumbSeparator = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
  <li className={cn("text-muted-foreground", className)}>{children || "/"}</li>
)
