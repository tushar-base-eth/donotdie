"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Dumbbell, Heart, BarChart } from "lucide-react";

// Define feature data for the landing page
const features = [
  { icon: Dumbbell, title: "Gym", description: "Log your exercises and sets with ease." },
  { icon: Heart, title: "Cardio", description: "Keep track of your heart rate, sleep, and nutrition." },
  { icon: BarChart, title: "Sleep", description: "Visualize your improvement over time with detailed charts." },
];

export default function LandingPage() {
  const { state } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to the home page
  useEffect(() => {
    if (state.status === "authenticated") {
      router.replace("/home");
    }
  }, [state.status, router]);

  // Prevent rendering during loading or for authenticated users
  if (state.status === "authenticated" || state.status === "loading") {
    return null;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-6 pt-12 pb-6 bg-gradient-to-br from-primary/10 via-background to-background w-full text-center"
      >
        <h1 className="text-4xl font-bold mb-2">Do Not Die 😺</h1>
        <p className="text-xl text-muted-foreground mb-8">stay alive!</p>
      </motion.div>

      {/* Features Section */}
      <div className="px-6 py-12 w-full max-w-4xl">
        {/* <h2 className="text-3xl font-bold mb-8 text-center">Features</h2> */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-3xl bg-card shadow-md"
            >
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Call-to-Action Section */}
      <div className="px-6 py-12 text-center w-full">
        <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
        <p className="text-xl text-muted-foreground mb-8">DoNotDie today and Reverse aging!</p>
        <Button
          size="lg"
          className="bg-primary text-primary-foreground px-8 py-4 rounded-xl"
          onClick={() => router.push("/auth")}
        >
          Get Started
        </Button>
      </div>
    </main>
  );
}