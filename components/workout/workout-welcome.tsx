import { Dumbbell, Flame, Trophy, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WorkoutWelcome() {
  return (
    <div className="space-y-8 py-8">
      {/* Header Section */}
      <div className="space-y-2 text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#4B7BFF] to-[#6B8FFF] dark:from-red-500 dark:to-red-600 bg-clip-text text-transparent animate-gradient">
          Do Not Die Today
        </h1>
        <p className="text-xl text-muted-foreground">Transform yourself, one rep at a time</p>
      </div>

      {/* Motivational Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#4B7BFF]/10 dark:bg-red-500/10 rounded-xl p-4 text-center">
          <Dumbbell className="w-8 h-8 mx-auto mb-2 text-[#4B7BFF] dark:text-red-500" />
          <h3 className="font-semibold">Start Fresh</h3>
          <p className="text-sm text-muted-foreground">New Workout</p>
        </div>
        <div className="bg-[#4B7BFF]/10 dark:bg-red-500/10 rounded-xl p-4 text-center">
          <Flame className="w-8 h-8 mx-auto mb-2 text-[#4B7BFF] dark:text-red-500" />
          <h3 className="font-semibold">Stay Active</h3>
          <p className="text-sm text-muted-foreground">Build Streak</p>
        </div>
        <div className="bg-[#4B7BFF]/10 dark:bg-red-500/10 rounded-xl p-4 text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-[#4B7BFF] dark:text-red-500" />
          <h3 className="font-semibold">Set Goals</h3>
          <p className="text-sm text-muted-foreground">Track Progress</p>
        </div>
        <div className="bg-[#4B7BFF]/10 dark:bg-red-500/10 rounded-xl p-4 text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-[#4B7BFF] dark:text-red-500" />
          <h3 className="font-semibold">Get Stronger</h3>
          <p className="text-sm text-muted-foreground">Beat Records</p>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-card rounded-xl p-6 border shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Ready to crush your workout?</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#4B7BFF]/10 dark:bg-red-500/10 flex items-center justify-center text-[#4B7BFF] dark:text-red-500 font-medium">
              1
            </div>
            <div>
              <h3 className="font-medium">Add Exercises</h3>
              <p className="text-sm text-muted-foreground">Click the + button to choose your exercises</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#4B7BFF]/10 dark:bg-red-500/10 flex items-center justify-center text-[#4B7BFF] dark:text-red-500 font-medium">
              2
            </div>
            <div>
              <h3 className="font-medium">Track Your Sets</h3>
              <p className="text-sm text-muted-foreground">Record your reps and weights</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#4B7BFF]/10 dark:bg-red-500/10 flex items-center justify-center text-[#4B7BFF] dark:text-red-500 font-medium">
              3
            </div>
            <div>
              <h3 className="font-medium">Save and Review</h3>
              <p className="text-sm text-muted-foreground">Keep track of your progress over time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="text-center italic text-muted-foreground">
        "The only bad workout is the one that didn't happen"
      </div>
    </div>
  )
}

