'use client'

import { useState } from 'react'
import { useGamification, Achievement } from '@/contexts/GamificationContext'

export default function GamificationWidget() {
  const { data, checkAchievements } = useGamification()
  const [showAchievements, setShowAchievements] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Calculate XP progress percentage
  const xpProgress = data.nextLevelXP > 0 
    ? (data.currentLevelXP / data.nextLevelXP) * 100 
    : 100

  const unlockedCount = data.achievements.filter(a => a.unlocked).length
  const totalAchievements = data.achievements.length

  const filteredAchievements = selectedCategory === 'all'
    ? data.achievements
    : data.achievements.filter(a => a.category === selectedCategory)

  const categories = [
    { id: 'all', label: 'All', icon: '🏆' },
    { id: 'streak', label: 'Streaks', icon: '🔥' },
    { id: 'productivity', label: 'Hours', icon: '⏱️' },
    { id: 'consistency', label: 'Sessions', icon: '📊' },
    { id: 'special', label: 'Special', icon: '✨' },
  ]

  return (
    <>
      <div data-tutorial="gamification-widget" className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg text-sand">Progress</h3>
          <button
            onClick={() => setShowAchievements(true)}
            className="text-xs font-mono text-relic-gold hover:underline"
          >
            View All
          </button>
        </div>

        {/* Level Display */}
        <div className="flex items-center gap-4 mb-6">
          {/* Level Badge */}
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4"
            style={{ 
              borderColor: data.levelColor,
              backgroundColor: `${data.levelColor}20`,
              color: data.levelColor,
            }}
          >
            {data.level}
          </div>
          
          {/* Level Info */}
          <div className="flex-1">
            <p className="text-sand font-heading text-lg">{data.levelTitle}</p>
            <p className="text-text-slate text-xs font-mono mb-2">
              {data.totalXP.toLocaleString()} XP Total
            </p>
            {/* XP Progress Bar */}
            <div className="h-2 bg-obsidian/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${xpProgress}%`,
                  backgroundColor: data.levelColor,
                }}
              />
            </div>
            <p className="text-text-slate/60 text-xs font-mono mt-1">
              {data.currentLevelXP} / {data.nextLevelXP} XP to next level
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-obsidian/30 border border-baked-clay/20">
            <p className="text-relic-gold font-heading text-xl">{data.currentStreak}</p>
            <p className="text-text-slate text-xs font-mono">Day Streak</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-obsidian/30 border border-baked-clay/20">
            <p className="text-green-400 font-heading text-xl">{data.totalHoursWorked.toFixed(0)}</p>
            <p className="text-text-slate text-xs font-mono">Hours</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-obsidian/30 border border-baked-clay/20">
            <p className="text-cyan-400 font-heading text-xl">{data.totalSessions}</p>
            <p className="text-text-slate text-xs font-mono">Sessions</p>
          </div>
        </div>

        {/* Recent Achievements */}
        <div>
          <p className="text-sand text-sm font-mono mb-2">Achievements ({unlockedCount}/{totalAchievements})</p>
          <div className="flex gap-2 flex-wrap">
            {data.achievements
              .filter(a => a.unlocked)
              .slice(0, 6)
              .map((achievement) => (
                <div
                  key={achievement.id}
                  className="w-10 h-10 rounded-lg bg-relic-gold/20 border border-relic-gold flex items-center justify-center text-xl"
                  title={`${achievement.name}: ${achievement.description}`}
                >
                  {achievement.icon}
                </div>
              ))}
            {unlockedCount === 0 && (
              <p className="text-text-slate/60 text-xs">Complete activities to unlock achievements!</p>
            )}
          </div>
        </div>

        {/* Weekly Challenge */}
        {data.weeklyChallenge && (
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-relic-gold/10 to-amber-500/10 border border-relic-gold/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{data.weeklyChallenge.icon}</span>
                <span className="text-sand text-sm font-mono">{data.weeklyChallenge.name}</span>
              </div>
              <span className="text-relic-gold text-xs font-mono">+{data.weeklyChallenge.xpReward} XP</span>
            </div>
            <p className="text-text-slate text-xs mb-2">{data.weeklyChallenge.description}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-obsidian/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-relic-gold transition-all"
                  style={{ width: `${Math.min((data.weeklyChallenge.progress / data.weeklyChallenge.target) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-text-slate">
                {data.weeklyChallenge.progress}/{data.weeklyChallenge.target}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 bg-obsidian/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="font-heading text-xl text-relic-gold">Achievements</h3>
              <button
                onClick={() => setShowAchievements(false)}
                className="p-2 rounded-lg hover:bg-obsidian/50 transition-colors"
              >
                <svg className="w-5 h-5 text-text-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 flex-shrink-0 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-mono whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-relic-gold/30 text-relic-gold border border-relic-gold'
                      : 'bg-obsidian/50 text-text-slate border border-baked-clay/30 hover:border-relic-gold/30'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Achievements Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const progress = Math.min((achievement.progress / achievement.requirement) * 100, 100)
  
  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        achievement.unlocked
          ? 'bg-relic-gold/10 border-relic-gold/50'
          : 'bg-obsidian/30 border-baked-clay/30 opacity-75'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
            achievement.unlocked
              ? 'bg-relic-gold/20 border border-relic-gold'
              : 'bg-obsidian/50 border border-baked-clay/30 grayscale'
          }`}
        >
          {achievement.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-mono text-sm ${achievement.unlocked ? 'text-relic-gold' : 'text-text-slate'}`}>
              {achievement.name}
            </h4>
            {achievement.unlocked && (
              <span className="text-green-400 text-xs">✓</span>
            )}
          </div>
          <p className="text-text-slate/70 text-xs mt-1">{achievement.description}</p>
          
          {/* Progress */}
          {!achievement.unlocked && (
            <div className="mt-2">
              <div className="flex justify-between text-xs font-mono text-text-slate/60 mb-1">
                <span>{achievement.progress} / {achievement.requirement}</span>
                <span>+{achievement.xpReward} XP</span>
              </div>
              <div className="h-1.5 bg-obsidian/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-relic-gold/50 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Unlocked date */}
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-text-slate/50 text-xs mt-2 font-mono">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
