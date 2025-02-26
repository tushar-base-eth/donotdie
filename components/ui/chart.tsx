"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const Chart = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("relative w-full chart-grid", className)} {...props} />
})
Chart.displayName = "Chart"

const ChartContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("flex h-full items-end gap-2 p-4", className)} {...props} />
  },
)
ChartContainer.displayName = "ChartContainer"

const ChartGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("flex h-full w-full items-end justify-between", className)} {...props} />
  },
)
ChartGroup.displayName = "ChartGroup"

interface ChartBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  maxValue?: number
  onValueChange?: (value: number) => void
  index?: number
}

const ChartBar = React.forwardRef<HTMLDivElement, ChartBarProps>(
  ({ className, value, maxValue = 3200, index = 0, children, ...props }, ref) => {
    const percentage = (value / maxValue) * 100

    return (
      <div className="group relative flex w-full flex-col items-center" ref={ref} {...props}>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={cn("w-full rounded-sm bg-foreground", className)}
        />
        {children}
      </div>
    )
  },
)
ChartBar.displayName = "ChartBar"

const ChartTooltip = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={cn(
          "absolute bottom-full mb-2 hidden rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground shadow-lg group-hover:block dark:bg-secondary/90",
          className,
        )}
        {...props}
      />
    )
  },
)
ChartTooltip.displayName = "ChartTooltip"

export { Chart, ChartContainer, ChartGroup, ChartBar, ChartTooltip }

