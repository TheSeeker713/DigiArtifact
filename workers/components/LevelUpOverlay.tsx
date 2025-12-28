'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LevelDefinition } from '@shared/constants'

interface LevelUpOverlayProps {
  isVisible: boolean
  newLevel: LevelDefinition
  onClose: () => void
}

/**
 * Level Up Overlay Component
 * 
 * Features:
 * - Shattered glass effect using CSS filters and transforms
 * - Glitch animation matching dashboard texture
 * - Smooth entrance/exit animations
 * - Respects reduced motion preferences
 */
export default function LevelUpOverlay({ isVisible, newLevel, onClose }: LevelUpOverlayProps) {
  // Auto-close after animation completes
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000) // 4 seconds total
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  // Glitch animation variants
  const glitchVariants = {
    initial: { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1], // Custom easing for dramatic effect
      },
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      filter: 'blur(5px)',
      transition: {
        duration: 0.4,
        ease: 'easeIn',
      },
    },
  }

  // Shattered glass pieces animation
  const glassPieceVariants = {
    initial: { opacity: 0, scale: 0, rotate: 0 },
    animate: (i: number) => ({
      opacity: [0, 1, 0.8, 0],
      scale: [0, 1.2, 1, 0.8],
      rotate: [0, (i % 2 === 0 ? 1 : -1) * 45, (i % 2 === 0 ? 1 : -1) * 90],
      x: (i % 3 - 1) * 50,
      y: (Math.floor(i / 3) - 1) * 50,
      transition: {
        delay: i * 0.05,
        duration: 1.5,
        ease: 'easeOut',
      },
    }),
  }

  // Text glitch effect
  const textGlitchVariants = {
    animate: {
      x: [0, -2, 2, -1, 1, 0],
      y: [0, 1, -1, 0.5, -0.5, 0],
      transition: {
        duration: 0.3,
        repeat: 3,
        repeatDelay: 0.1,
        ease: 'easeInOut',
      },
    },
  }

  // Background pulse
  const backgroundVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: [0, 0.95, 0.9],
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.4,
      },
    },
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop with noise texture */}
          <motion.div
            variants={backgroundVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-[100] bg-obsidian/95 backdrop-blur-sm"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
              mixBlendMode: 'overlay',
              opacity: 0.1,
            }}
            onClick={onClose}
          />

          {/* Main overlay content */}
          <motion.div
            variants={glitchVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none"
            style={{
              filter: 'drop-shadow(0 0 40px rgba(204, 164, 59, 0.8))',
            }}
          >
            {/* Shattered glass pieces */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 9 }).map((_, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={glassPieceVariants}
                  initial="initial"
                  animate="animate"
                  className="absolute top-1/2 left-1/2 w-32 h-32"
                  style={{
                    background: `linear-gradient(135deg, ${newLevel.color}40, ${newLevel.color}20)`,
                    clipPath: `polygon(${50 + (i % 3 - 1) * 10}% ${50 + (Math.floor(i / 3) - 1) * 10}%, ${55 + (i % 3 - 1) * 10}% ${50 + (Math.floor(i / 3) - 1) * 10}%, ${52 + (i % 3 - 1) * 10}% ${55 + (Math.floor(i / 3) - 1) * 10}%)`,
                    border: `1px solid ${newLevel.color}60`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}
            </div>

            {/* Main content card */}
            <motion.div
              variants={textGlitchVariants}
              animate="animate"
              className="relative bg-obsidian/98 border-2 rounded-2xl p-12 text-center pointer-events-auto"
              style={{
                borderColor: newLevel.color,
                boxShadow: `0 0 60px ${newLevel.color}80, inset 0 0 40px ${newLevel.color}20`,
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Glitch overlay effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${newLevel.color}40 50%, transparent 100%)`,
                  animation: 'glitch-sweep 0.5s ease-in-out',
                  mixBlendMode: 'screen',
                }}
              />

              {/* Level number with glow */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="text-8xl font-heading font-bold mb-4"
                style={{
                  color: newLevel.color,
                  textShadow: `0 0 30px ${newLevel.color}, 0 0 60px ${newLevel.color}60`,
                }}
              >
                {newLevel.level}
              </motion.div>

              {/* Level up text */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-4xl font-heading font-bold mb-2 text-relic-gold"
                style={{
                  textShadow: '0 0 20px rgba(204, 164, 59, 0.8)',
                }}
              >
                LEVEL UP!
              </motion.h2>

              {/* Level title */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-2xl font-body text-sand mb-6"
                style={{ color: newLevel.color }}
              >
                {newLevel.title}
              </motion.p>

              {/* Decorative elements */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="h-1 mx-auto mb-4"
                style={{
                  width: '200px',
                  background: `linear-gradient(90deg, transparent, ${newLevel.color}, transparent)`,
                  boxShadow: `0 0 10px ${newLevel.color}`,
                }}
              />

              {/* Close hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-sm text-text-slate mt-6"
              >
                Click anywhere to continue
              </motion.p>
            </motion.div>

            {/* Particle effects */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 0,
                    x: '50%',
                    y: '50%',
                    scale: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: `${50 + (Math.random() - 0.5) * 100}%`,
                    y: `${50 + (Math.random() - 0.5) * 100}%`,
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    delay: 0.3 + i * 0.05,
                    duration: 2,
                    ease: 'easeOut',
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: newLevel.color,
                    boxShadow: `0 0 10px ${newLevel.color}`,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* CSS Animation for glitch sweep */}
          <style jsx>{`
            @keyframes glitch-sweep {
              0% {
                transform: translateX(-100%);
              }
              50% {
                transform: translateX(0%);
              }
              100% {
                transform: translateX(100%);
              }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  )
}

