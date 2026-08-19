<template>
  <PassportShell
    v-if="session && mission"
    :can-prev="pageIndex > 0"
    :can-next="pageIndex < orderedMissions.length - 1"
    :next-label="nextLabel"
    :prev-label="prevLabel"
    @prev="go(-1)"
    @next="go(1)"
  >
    <PassportPage>
      <p v-if="error" class="error-note">{{ error }}</p>
      <MissionRenderer
        :mission="mission"
        :session="session"
        :progress="progress[mission.id]"
        :all-progress="progress"
        @start="startMission(mission)"
        @complete="complete"
        @skip="skip"
      />
    </PassportPage>
  </PassportShell>

  <main v-else class="app-screen loading-screen">
    <PassportPage>
      <h1>{{ loading ? 'טוען דרכון...' : 'לא נמצא דרכון' }}</h1>
      <p v-if="error" class="error-note">{{ error }}</p>
      <p v-else-if="!loading">הדרכון לא נמצא ב-Firebase.</p>
      <NuxtLink class="primary-button" to="/">חזור</NuxtLink>
    </PassportPage>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const sessionId = String(route.params.sessionId)
const { session, progress, loading, error, orderedMissions, refresh, setPage, startMission, completeMission, skipMission } = usePassportSession(sessionId)
const { playStampSound } = useStamp()

// index אופטימי מקומי: מתעדכן מיד עם השלמת ההיפוך, וכתיבת ה-Firebase רצה ברקע —
// כך שהוויזואל מונע מהאנימציה ולא מהרשת.
const localIndex = ref<number | null>(null)
const pageIndex = computed(() =>
  localIndex.value ?? Math.min(session.value?.currentPageIndex || 0, orderedMissions.value.length - 1)
)
const mission = computed(() => orderedMissions.value[pageIndex.value])
const nextLabel = computed(() => orderedMissions.value[pageIndex.value + 1]?.title || 'סיום')
const prevLabel = computed(() => orderedMissions.value[pageIndex.value - 1]?.title || 'תחילת הדרכון')

onMounted(refresh)

function advanceTo(target: number) {
  localIndex.value = target
  setPage(target)
    .then(() => { if (localIndex.value === target) localIndex.value = null })
    .catch((err) => {
      console.error(err)
      error.value = 'לא הצלחנו לשמור את מיקום העמוד ב-Firebase. בדקו חיבור ונסו שוב.'
    })
}

function go(delta: number) {
  advanceTo(Math.max(0, Math.min(orderedMissions.value.length - 1, pageIndex.value + delta)))
}

async function complete(payload: { attempts: number; answers?: unknown }) {
  if (!mission.value) return
  const currentIndex = pageIndex.value
  try {
    await startMission(mission.value)
    const result = await completeMission(mission.value, payload.attempts, payload.answers as never)
    if (result.stamped) playStampSound()
    if (currentIndex < orderedMissions.value.length - 1) advanceTo(currentIndex + 1)
  } catch (err) {
    console.error(err)
    error.value = 'לא הצלחנו לשמור את ההתקדמות ב-Firebase. בדקו חוקים והרשאות ונסו שוב.'
  }
}

async function skip() {
  if (!mission.value) return
  const currentIndex = pageIndex.value
  try {
    await skipMission(mission.value)
    if (currentIndex < orderedMissions.value.length - 1) advanceTo(currentIndex + 1)
  } catch (err) {
    console.error(err)
    error.value = 'לא הצלחנו לשמור דילוג ב-Firebase. בדקו חוקים והרשאות ונסו שוב.'
  }
}
</script>

<style scoped>
.loading-screen {
  display: grid;
  align-items: center;
}

h1 {
  margin: 0 0 10px;
}

.error-note {
  color: var(--error-text);
  background: rgba(var(--red-rgb), .28);
  border-radius: 8px;
  padding: 10px 12px;
}
</style>
