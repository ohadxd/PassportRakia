import type { CreationRecord, DreamEntry, MissionProgress, PassportSession } from '~/types/mission'

type FirebaseServices = {
  app: unknown
  auth: import('firebase/auth').Auth
  db: import('firebase/firestore').Firestore
  storage: import('firebase/storage').FirebaseStorage
}

let servicesPromise: Promise<FirebaseServices | null> | null = null

const SESSION_KEY = 'rakia-passport-session-id'
const LOCAL_PREFIX = 'rakia-passport:'

function nowIso() {
  return new Date().toISOString()
}

function generateId(prefix = 'session') {
  const random = import.meta.client && window.crypto ? window.crypto.randomUUID() : Math.random().toString(36).slice(2)
  return `${prefix}-${random}`
}

function readLocal<T>(key: string, fallback: T): T {
  if (!import.meta.client) return fallback
  try {
    return JSON.parse(localStorage.getItem(`${LOCAL_PREFIX}${key}`) || '') as T
  } catch {
    return fallback
  }
}

function writeLocal<T>(key: string, value: T) {
  if (!import.meta.client) return
  localStorage.setItem(`${LOCAL_PREFIX}${key}`, JSON.stringify(value))
}

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T
}

export function useFirebase() {
  const config = useRuntimeConfig().public

  function hasConfig() {
    return Boolean(config.firebaseApiKey && config.firebaseProjectId && config.firebaseStorageBucket && config.firebaseAppId)
  }

  async function getServices() {
    if (!import.meta.client || !hasConfig()) return null
    if (!servicesPromise) {
      servicesPromise = (async () => {
        const [{ initializeApp, getApps }, { getAuth, signInAnonymously }, { getFirestore }, { getStorage }] = await Promise.all([
          import('firebase/app'),
          import('firebase/auth'),
          import('firebase/firestore'),
          import('firebase/storage')
        ])
        const app = getApps().length
          ? getApps()[0]
          : initializeApp({
              apiKey: config.firebaseApiKey,
              authDomain: config.firebaseAuthDomain,
              projectId: config.firebaseProjectId,
              storageBucket: config.firebaseStorageBucket,
              messagingSenderId: config.firebaseMessagingSenderId,
              appId: config.firebaseAppId,
              measurementId: config.firebaseMeasurementId
            })
        const auth = getAuth(app)
        if (!auth.currentUser) {
          await signInAnonymously(auth)
        }
        return { app, auth, db: getFirestore(app), storage: getStorage(app) }
      })()
    }
    return servicesPromise
  }

  async function requireServices() {
    const services = await getServices()
    if (!services?.auth.currentUser) {
      throw new Error('Firebase anonymous authentication is required.')
    }
    return services
  }

  function getStoredSessionId() {
    return import.meta.client ? localStorage.getItem(SESSION_KEY) : null
  }

  function setStoredSessionId(id: string) {
    if (import.meta.client) localStorage.setItem(SESSION_KEY, id)
  }

  async function createSession(name: string, photoDataUrl?: string) {
    const id = generateId('session')
    const services = await requireServices()
    const ownerUid = services.auth.currentUser!.uid
    let photoUrl: string | undefined
    let photoStoragePath: string | undefined
    const session: PassportSession = {
      id,
      ownerUid,
      name,
      photoUrl,
      photoStoragePath,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      currentPageIndex: 0,
      totalScore: 0,
      rank: 'צוער רקיע',
      completedCount: 0,
      skippedCount: 0,
      lastActiveAt: nowIso()
    }
    const { doc, setDoc } = await import('firebase/firestore')
    await setDoc(doc(services.db, 'sessions', id), withoutUndefined(session))
    if (photoDataUrl) {
      const upload = await uploadDataUrl(`user-photos/${id}/passport-photo.jpg`, photoDataUrl)
      photoUrl = upload.url
      photoStoragePath = upload.path
      session.photoUrl = photoUrl
      session.photoStoragePath = photoStoragePath
      session.updatedAt = nowIso()
      await setDoc(doc(services.db, 'sessions', id), withoutUndefined(session), { merge: true })
    }
    writeLocal(`sessions/${id}`, session)
    setStoredSessionId(id)
    return session
  }

  async function getSession(sessionId: string) {
    const services = await requireServices()
    const { doc, getDoc } = await import('firebase/firestore')
    const snap = await getDoc(doc(services.db, 'sessions', sessionId))
    if (snap.exists()) {
      const session = snap.data() as PassportSession
      writeLocal(`sessions/${sessionId}`, session)
      return session
    }
    return null
  }

  async function updateSession(sessionId: string, patch: Partial<PassportSession>) {
    const current = await getSession(sessionId)
    if (!current) throw new Error(`Session ${sessionId} was not found in Firestore.`)
    const next = { ...current, ...patch, id: sessionId, updatedAt: nowIso(), lastActiveAt: nowIso() } as PassportSession
    const services = await requireServices()
    const { doc, setDoc } = await import('firebase/firestore')
    await setDoc(doc(services.db, 'sessions', sessionId), withoutUndefined(next), { merge: true })
    writeLocal(`sessions/${sessionId}`, next)
    return next
  }

  async function saveMissionProgress(sessionId: string, progress: MissionProgress) {
    const all = readLocal<Record<string, MissionProgress>>(`progress/${sessionId}`, {})
    all[progress.missionId] = progress
    const services = await requireServices()
    const { doc, setDoc } = await import('firebase/firestore')
    await setDoc(doc(services.db, 'sessions', sessionId, 'missionProgress', progress.missionId), withoutUndefined(progress), { merge: true })
    writeLocal(`progress/${sessionId}`, all)
    return progress
  }

  async function getAllProgress(sessionId: string) {
    const services = await requireServices()
    const { collection, getDocs } = await import('firebase/firestore')
    const snapshot = await getDocs(collection(services.db, 'sessions', sessionId, 'missionProgress'))
    const progress = Object.fromEntries(snapshot.docs.map((docSnap) => [docSnap.id, docSnap.data() as MissionProgress]))
    writeLocal(`progress/${sessionId}`, progress)
    return progress
  }

  async function uploadDataUrl(path: string, dataUrl: string) {
    const services = await requireServices()
    const { ref, uploadString, getDownloadURL } = await import('firebase/storage')
    const storageRef = ref(services.storage, path)
    await uploadString(storageRef, dataUrl, 'data_url')
    return { path, url: await getDownloadURL(storageRef) }
  }

  async function getStorageUrl(path: string) {
    const services = await getServices()
    if (!services) return ''
    const { ref, getDownloadURL } = await import('firebase/storage')
    return getDownloadURL(ref(services.storage, path)).catch(() => '')
  }

  async function saveCreation(record: Omit<CreationRecord, 'id' | 'createdAt' | 'imageUrl' | 'storagePath'> & { imageDataUrl: string }) {
    const path = `creations/${record.sessionId}/${record.type}.png`
    const upload = await uploadDataUrl(path, record.imageDataUrl)
    const creation: CreationRecord = {
      id: `${record.sessionId}-${record.type}`,
      sessionId: record.sessionId,
      type: record.type,
      imageUrl: upload.url,
      storagePath: upload.path,
      data: record.data,
      createdAt: nowIso()
    }
    const creations = readLocal<Record<string, CreationRecord>>(`creations/${record.sessionId}`, {})
    creations[record.type] = creation
    const services = await requireServices()
    const { doc, setDoc } = await import('firebase/firestore')
    await setDoc(doc(services.db, 'creations', creation.id), withoutUndefined(creation), { merge: true })
    writeLocal(`creations/${record.sessionId}`, creations)
    return creation
  }

  function getLocalCreations(sessionId: string) {
    return readLocal<Record<string, CreationRecord>>(`creations/${sessionId}`, {})
  }

  async function saveDream(entry: Omit<DreamEntry, 'id' | 'createdAt'>) {
    const dream: DreamEntry = { ...entry, id: generateId('dream'), createdAt: nowIso() }
    const dreams = readLocal<DreamEntry[]>('dreams', [])
    dreams.unshift(dream)
    const services = await requireServices()
    const { doc, setDoc } = await import('firebase/firestore')
    await setDoc(doc(services.db, 'dreams', dream.id), withoutUndefined(dream))
    writeLocal('dreams', dreams)
    return dream
  }

  async function getDreams() {
    const services = await getServices()
    if (services) {
      const { collection, getDocs, limit, orderBy, query, where } = await import('firebase/firestore')
      const q = query(collection(services.db, 'dreams'), where('approved', '==', true), orderBy('createdAt', 'desc'), limit(80))
      const snapshot = await getDocs(q).catch(() => null)
      if (snapshot) return snapshot.docs.map((docSnap) => docSnap.data() as DreamEntry)
    }
    return readLocal<DreamEntry[]>('dreams', []).filter((dream) => dream.approved)
  }

  async function subscribeDreams(callback: (dreams: DreamEntry[]) => void) {
    const services = await getServices()
    if (services) {
      const { collection, limit, onSnapshot, orderBy, query, where } = await import('firebase/firestore')
      const q = query(collection(services.db, 'dreams'), where('approved', '==', true), orderBy('createdAt', 'desc'), limit(80))
      return onSnapshot(q, (snapshot) => callback(snapshot.docs.map((docSnap) => docSnap.data() as DreamEntry)))
    }
    callback(await getDreams())
    return () => undefined
  }

  return {
    hasConfig,
    getServices,
    getStoredSessionId,
    setStoredSessionId,
    createSession,
    getSession,
    updateSession,
    saveMissionProgress,
    getAllProgress,
    uploadDataUrl,
    getStorageUrl,
    saveCreation,
    getLocalCreations,
    saveDream,
    getDreams,
    subscribeDreams
  }
}
