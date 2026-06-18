import type { MissionProgress } from '~/types/mission'

export function useMissionProgress() {
  function isCompleted(progress?: MissionProgress) {
    return progress?.status === 'completed'
  }

  function isSkipped(progress?: MissionProgress) {
    return progress?.status === 'skipped'
  }

  return { isCompleted, isSkipped }
}
