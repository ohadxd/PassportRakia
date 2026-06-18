import type { MissionConfig, MissionProgress } from '~/types/mission'
import { missions } from '~/data/missions'

export const RANKS = [
  { min: 0, title: 'צוער רקיע' },
  { min: 700, title: 'חוקר תחנת חלל' },
  { min: 1400, title: 'מומחה משימה' },
  { min: 2200, title: 'מהנדס טיסה' },
  { min: 3000, title: 'מפקד משימת רקיע' }
]

export function getRank(score: number) {
  return [...RANKS].reverse().find((rank) => score >= rank.min)?.title || RANKS[0].title
}

export function calculateSpeedBonus(baseScore: number, startedAt?: number, estimatedSeconds = 90, attempts = 1) {
  if (!startedAt || baseScore <= 0) return 0
  const elapsed = Math.max(1, (Date.now() - startedAt) / 1000)
  const speedRatio = Math.max(0, 1 - elapsed / Math.max(20, estimatedSeconds * 1.8))
  const attemptPenalty = Math.max(0.35, 1 - (attempts - 1) * 0.22)
  return Math.round(baseScore * 0.3 * speedRatio * attemptPenalty)
}

export function scoreMission(mission: MissionConfig, startedAt?: number, attempts = 1) {
  const speedBonus = calculateSpeedBonus(mission.baseScore, startedAt, mission.estimatedSeconds, attempts)
  return {
    baseScore: mission.baseScore,
    speedBonus,
    score: mission.baseScore + speedBonus
  }
}

export function summarizeProgress(progress: Record<string, MissionProgress>) {
  const values = Object.values(progress)
  const stampableIds = new Set(missions.filter((mission) => mission.baseScore > 0).map((mission) => mission.id))
  const totalScore = values.reduce((sum, item) => sum + (item.status === 'completed' ? item.score : 0), 0)
  const completedCount = values.filter((item) => stampableIds.has(item.missionId) && item.status === 'completed').length
  const skippedCount = values.filter((item) => stampableIds.has(item.missionId) && item.status === 'skipped').length
  return {
    totalScore,
    rank: getRank(totalScore),
    completedCount,
    skippedCount,
    stampableCount: missions.filter((mission) => mission.baseScore > 0).length
  }
}
