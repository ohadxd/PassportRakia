import type { MissionConfig, MissionProgress } from '~/types/mission'
import { missions } from '~/data/missions'
import { scoreMission, summarizeProgress } from './useScore'

export function usePassportSession(sessionId: string) {
  const firebase = useFirebase()
  const session = useState(`session:${sessionId}`, () => null as Awaited<ReturnType<typeof firebase.getSession>>)
  const progress = useState<Record<string, MissionProgress>>(`progress:${sessionId}`, () => ({}))
  const loading = useState(`loading:${sessionId}`, () => true)
  const error = useState(`session-error:${sessionId}`, () => '')

  async function refresh() {
    loading.value = true
    error.value = ''
    try {
      session.value = await firebase.getSession(sessionId)
      progress.value = session.value ? await firebase.getAllProgress(sessionId) : {}
    } catch (err) {
      console.error(err)
      session.value = null
      progress.value = {}
      error.value = 'לא הצלחנו לטעון את הדרכון מ-Firebase. בדקו שהכניסה האנונימית וכללי Firestore פעילים.'
    } finally {
      loading.value = false
    }
    return { session: session.value, progress: progress.value }
  }

  async function setPage(index: number) {
    if (!session.value) return
    session.value = await firebase.updateSession(sessionId, { currentPageIndex: index })
  }

  async function recordChallengeOutcome(correct: boolean) {
    if (!session.value) return 0
    const current = Math.max(0, session.value.currentCorrectStreak || 0)
    const nextStreak = correct ? Math.min(200, current + 1) : 0
    session.value = await firebase.updateSession(sessionId, { currentCorrectStreak: nextStreak })
    return nextStreak
  }

  function buildProgress(mission: MissionConfig, patch: Partial<MissionProgress>): MissionProgress {
    const current = progress.value[mission.id]
    const defaults: MissionProgress = {
      missionId: mission.id,
      order: mission.order,
      status: 'not-started',
      score: 0,
      baseScore: mission.baseScore,
      speedBonus: 0,
      attempts: 0,
      stamped: false
    }
    return {
      ...defaults,
      ...current,
      ...patch
    }
  }

  async function saveProgress(item: MissionProgress) {
    progress.value = { ...progress.value, [item.missionId]: item }
    await firebase.saveMissionProgress(sessionId, item)
    const summary = summarizeProgress(progress.value)
    session.value = await firebase.updateSession(sessionId, {
      totalScore: summary.totalScore,
      rank: summary.rank,
      completedCount: summary.completedCount,
      skippedCount: summary.skippedCount
    })
  }

  async function startMission(mission: MissionConfig) {
    const current = progress.value[mission.id]
    if (current?.status === 'completed') return current
    const next = buildProgress(mission, {
      status: 'started',
      startedAt: current?.startedAt || new Date().toISOString()
    })
    await saveProgress(next)
    return next
  }

  async function completeMission(mission: MissionConfig, attempts = 1, answers?: MissionProgress['answers']) {
    const started = progress.value[mission.id]?.startedAt
    const startedAtMs = started ? new Date(started).getTime() : Date.now()
    const score = scoreMission(mission, startedAtMs, attempts)
    const next = buildProgress(mission, {
      status: 'completed',
      score: score.score,
      baseScore: score.baseScore,
      speedBonus: score.speedBonus,
      attempts,
      stamped: mission.baseScore > 0,
      completedAt: new Date().toISOString(),
      answers
    })
    await saveProgress(next)
    return next
  }

  async function skipMission(mission: MissionConfig) {
    const next = buildProgress(mission, {
      status: 'skipped',
      score: 0,
      speedBonus: 0,
      attempts: progress.value[mission.id]?.attempts || 0,
      stamped: false,
      skippedAt: new Date().toISOString()
    })
    await saveProgress(next)
    return next
  }

  const orderedMissions = computed(() => missions)
  const summary = computed(() => summarizeProgress(progress.value))

  return {
    session,
    progress,
    loading,
    error,
    orderedMissions,
    summary,
    refresh,
    setPage,
    recordChallengeOutcome,
    startMission,
    completeMission,
    skipMission
  }
}
