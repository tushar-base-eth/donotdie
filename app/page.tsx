"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  Heart,
  BarChart,
  ArrowRight,
  Moon,
  Sun,
  Zap,
  Trophy,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

const features = [
  {
    icon: Dumbbell,
    title: "Gym Tracking",
    description:
      "Log your exercises and sets with ease. Track your progress and see your strength improve over time.",
    color:
      "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30",
  },
  {
    icon: Heart,
    title: "Health Monitoring",
    description:
      "Keep track of your heart rate, sleep patterns, and nutrition to maintain optimal health.",
    color: "bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500/30",
  },
  {
    icon: BarChart,
    title: "Progress Analytics",
    description:
      "Visualize your improvement over time with detailed charts and personalized insights.",
    color:
      "bg-gradient-to-br from-green-500/20 to-teal-500/20 border-green-500/30",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("hero");
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});
  const [scrollY, setScrollY] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Determine which section is currently in view
      const sectionIds = Object.keys(sectionsRef.current);
      for (const id of sectionIds) {
        const section = sectionsRef.current[id];
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    sectionsRef.current[id]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={`min-h-screen bg-background ${isDarkMode ? "dark" : ""}`}>
      {/* Floating navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300"
        initial={{ y: -100 }}
        animate={{
          y: 0,
          backgroundColor:
            scrollY > 50 ? "rgba(var(--background), 0.8)" : "transparent",
          backdropFilter: scrollY > 50 ? "blur(10px)" : "none",
          boxShadow: scrollY > 50 ? "0 4px 20px rgba(0, 0, 0, 0.1)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              ZeroNow 😺
            </span>
          </motion.div>

          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => router.push("/auth/login")}
                className="bg-primary text-primary-foreground rounded-full px-6"
              >
                Get Started
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section
        ref={(el) => {
          sectionsRef.current.hero = el;
        }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      >
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              <span>Your journey to better health starts here</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Simple way to{" "}
              <span className="relative">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  not die!
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-primary rounded-full"
                  initial={{ width: 0, left: "50%" }}
                  animate={{ width: "100%", left: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                ></motion.span>
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mt-6">
              Things changes when you start from zero.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          >
            <Button
              size="lg"
              onClick={() => router.push("/auth/login")}
              className="bg-primary text-primary-foreground rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 btn-glow"
            >
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => scrollToSection("features")}
              className="rounded-full px-8 py-6 text-lg border-2 hover:bg-primary/10 transition-all"
            >
              Explore Features
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"
        >
          <button
            onClick={() => scrollToSection("features")}
            aria-label="Scroll down"
            className="p-2 rounded-full bg-muted/50 hover:bg-muted"
          >
            <ChevronDown className="h-6 w-6" />
          </button>
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        ref={(el) => {
          sectionsRef.current.features = el;
        }}
        className="py-24 px-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/30"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-3xl md:text-5xl font-bold">
              Everything you need to{" "}
              <span className="text-primary">stay ALIVE</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              ZeroNow combines powerful tracking tools with intuitive analytics
              to help you achieve your health and fitness goals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{
                  y: -5,
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                }}
                className={`p-8 rounded-2xl border backdrop-blur-sm ${feature.color} transition-all duration-300`}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-20 grid md:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Zap className="h-4 w-4 mr-2" />
                <span>Powerful Analytics</span>
              </div>
              <h3 className="text-2xl md:text-4xl font-bold">
                Visualize your progress over time
              </h3>
              <p className="text-muted-foreground text-lg">
                ZeroNow's powerful analytics engine transforms your data into
                actionable insights, helping you understand your body better and
                make informed decisions about your health.
              </p>
              <ul className="space-y-3">
                {[
                  "Personalized health score",
                  "Trend analysis",
                  "Goal tracking",
                  "Custom reports",
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                    </div>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur-xl opacity-70"></div>
              <div className="relative bg-card rounded-2xl overflow-hidden border shadow-xl">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  width={600}
                  height={400}
                  alt="Analytics Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section
        ref={(el) => {
          sectionsRef.current.about = el;
        }}
        className="py-24 px-6 relative overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
          <div className="absolute bottom-1/4 -left-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold">
                  About ZeroNow
                </h2>
                <p className="text-lg text-muted-foreground">
                  ZeroNow is a simple way to not die! We provide tools and
                  resources to help you stay safe and healthy.
                </p>
                <Button variant="outline" className="mt-4">
                  Learn More
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-2xl blur-xl opacity-70"></div>
              <div className="relative bg-card rounded-2xl overflow-hidden border shadow-xl">
                <Image
                  src="/placeholder.svg?height=500&width=500"
                  width={500}
                  height={500}
                  alt="Team working"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto text-center bg-gradient-to-r from-primary/10 to-purple-500/10 p-12 rounded-3xl border relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of users who trust ZeroNow to help them stay safe
              and healthy.
            </p>
            <Button size="lg">Get Started</Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
