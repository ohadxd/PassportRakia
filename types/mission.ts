export type MissionType =
  | 'transition'
  | 'intro-video'
  | 'quiz'
  | 'video-quiz'
  | 'video-confirmation'
  | 'ar-confirmation'
  | 'sort-game'
  | 'classification-game'
  | 'three-info-quiz'
  | 'three-game'
  | 'patch-designer'
  | 'jewelry-designer'
  | 'dream-input'
  | 'confirmation-quiz'
  | 'summary'

export interface QuizQuestion {
  id: string
  text: string
  answers: string[]
  correctIndex: number
}

export interface SortItem {
  id: string
  label: string
  correctOrder: number
}

export interface ClassificationItem {
  id: string
  label: string
  category: string
}

export interface MissionConfig {
  id: string
  order: number
  title: string
  subtitle?: string
  type: MissionType
  baseScore: number
  allowSkip: boolean
  stampLabel?: string
  estimatedSeconds?: number
  wallContentSummary?: string[]
  actionText?: string
  arSlug?: string
  video?: {
    storagePath: string
    sourceTitle?: string
    sourceReferenceUrl?: string
    loadMode: 'on-demand' | 'preload-next-only'
  }
  questions?: QuizQuestion[]
  sortItems?: SortItem[]
  classificationItems?: ClassificationItem[]
  classificationCategories?: Array<{ id: string; label: string }>
}

export type MissionStatus = 'not-started' | 'started' | 'completed' | 'skipped'

export interface MissionProgress {
  missionId: string
  order: number
  status: MissionStatus
  score: number
  baseScore: number
  speedBonus: number
  attempts: number
  stamped: boolean
  startedAt?: string
  completedAt?: string
  skippedAt?: string
  answers?: Array<{
    questionId: string
    selected: string | number | string[]
    correct: boolean
    attempts: number
  }>
}

export interface PassportSession {
  id: string
  ownerUid?: string
  name: string
  photoUrl?: string
  photoStoragePath?: string
  createdAt: string
  updatedAt: string
  currentPageIndex: number
  totalScore: number
  rank: string
  completedCount: number
  skippedCount: number
  lastActiveAt: string
}

export interface CreationRecord {
  id: string
  sessionId: string
  type: 'patch' | 'jewelry'
  imageUrl: string
  storagePath: string
  data: unknown
  createdAt: string
}

export interface DreamEntry {
  id: string
  sessionId: string
  name: string
  photoUrl?: string
  dream: string
  scoreAtSubmit: number
  approved: boolean
  rejectedReason?: string
  createdAt: string
}
