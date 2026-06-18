<template>
  <PassportShell
    v-if="session && mission"
    :score="summary.totalScore"
    :completed="summary.completedCount"
    :total="summary.stampableCount"
    :rank="summary.rank"
    :can-prev="pageIndex > 0"
    :can-next="pageIndex < orderedMissions.length - 1"
    :under-label="nextLabel"
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
const { session, progress, loading, error, orderedMissions, summary, refresh, setPage, startMission, completeMission, skipMission } = usePassportSession(sessionId)
const { playStampSound } = useStamp()

const pageIndex = computed(() => Math.min(session.value?.currentPageIndex || 0, orderedMissions.value.length - 1))
const mission = computed(() => orderedMissions.value[pageIndex.value])
const nextLabel = computed(() => orderedMissions.value[pageIndex.value + 1]?.title || 'סיום')

onMounted(refresh)

async function go(delta: number) {
  const target = Math.max(0, Math.min(orderedMissions.value.length - 1, pageIndex.value + delta))
  await setPage(target)
}

async function complete(payload: { attempts: number; answers?: unknown }) {
  if (!mission.value) return
  const currentIndex = pageIndex.value
  try {
    await startMission(mission.value)
    const result = await completeMission(mission.value, payload.attempts, payload.answers as never)
    if (result.stamped) playStampSound()
    if (currentIndex < orderedMissions.value.length - 1) await setPage(currentIndex + 1)
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
    if (currentIndex < orderedMissions.value.length - 1) await setPage(currentIndex + 1)
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
  color: #852d2d;
  background: rgba(155,47,47,.12);
  border-radius: 8px;
  padding: 10px 12px;
}
</style>
