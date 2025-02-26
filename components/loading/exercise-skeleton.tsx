"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export function ExerciseSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="space-y-2 pl-4">
              {[1, 2].map((j) => (
                <Skeleton key={j} className="h-10 w-[calc(100%-1rem)] rounded-xl" />
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

