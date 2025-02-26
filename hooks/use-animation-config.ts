/**
 * Animation Configuration Hook
 * Provides consistent animation settings across the app
 */
export function useAnimationConfig() {
  return {
    spring: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
    transition: {
      duration: 0.2,
      ease: [0.32, 0.72, 0, 1],
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
  }
}

