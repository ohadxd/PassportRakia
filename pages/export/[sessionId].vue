<template>
  <main class="app-screen export-screen">
    <PassportPage v-if="session">
      <MissionHeader :order="26" title="שיתוף פספורט" />
      <PassportPdfDocument :session="session" />
      <PdfStampGrid :progress="progress" />
      <PdfCreationPage title="פאץ׳ אישי" :src="creations.patch?.imageDataUrl || creations.patch?.imageUrl" />
      <PdfCreationPage title="תכשיט חלל" :src="creations.jewelry?.imageDataUrl || creations.jewelry?.imageUrl" />
      <p v-if="dream">חלום: {{ dream.dream }}</p>
      <div class="control-row">
        <button class="primary-button" type="button" :disabled="busy" @click="downloadPdf">{{ busy ? 'מכין PDF...' : 'הורדה למכשיר' }}</button>
        <button class="secondary-button" type="button" :disabled="busy" @click="sharePdf">שיתוף לוואטסאפ / מייל</button>
        <NuxtLink class="secondary-button back-link" :to="`/passport/${session.id}`">חזור</NuxtLink>
      </div>
      <p v-if="message" class="success-note">{{ message }}</p>
      <p v-if="error" class="error-note">{{ error }}</p>
    </PassportPage>
    <PassportPage v-else>
      <h1>טוען פספורט...</h1>
    </PassportPage>
  </main>
</template>

<script setup lang="ts">
import type { CreationRecord, DreamEntry, MissionProgress, PassportSession } from '~/types/mission'

const route = useRoute()
const firebase = useFirebase()
const { downloadPassportPdf, sharePassportPdf } = usePdfExport()
const sessionId = String(route.params.sessionId)
const session = ref<PassportSession | null>(null)
const progress = ref<Record<string, MissionProgress>>({})
const creations = ref<Record<string, CreationRecord>>({})
const dream = ref<DreamEntry | undefined>()
const busy = ref(false)
const error = ref('')
const message = ref('')

onMounted(async () => {
  session.value = await firebase.getSession(sessionId)
  progress.value = await firebase.getAllProgress(sessionId)
  creations.value = await firebase.getCreations(sessionId)
  const dreams = await firebase.getDreams()
  dream.value = dreams.find((item) => item.sessionId === sessionId)
})

async function downloadPdf() {
  if (!session.value) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    await downloadPassportPdf({
      session: session.value,
      progress: progress.value,
      creations: creations.value,
      dream: dream.value
    })
    message.value = 'ה-PDF ירד למכשיר.'
  } catch {
    error.value = 'יצירת ה-PDF נכשלה. נסו שוב.'
  } finally {
    busy.value = false
  }
}

async function sharePdf() {
  if (!session.value) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const result = await sharePassportPdf({
      session: session.value,
      progress: progress.value,
      creations: creations.value,
      dream: dream.value
    })
    message.value = result === 'shared' ? 'חלון השיתוף נפתח.' : 'המכשיר לא תומך בשיתוף קבצים, לכן ה-PDF ירד למכשיר.'
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return
    error.value = 'יצירת ה-PDF נכשלה. נסו שוב.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.export-screen {
  display: grid;
  align-items: start;
}

.back-link {
  display: inline-grid;
  place-items: center;
  text-decoration: none;
}

.error-note {
  color: #852d2d;
  background: rgba(155,47,47,.12);
  border-radius: 8px;
  padding: 9px 10px;
}

.success-note {
  color: #0b6a43;
  background: rgba(11,125,79,.12);
  border-radius: 8px;
  padding: 9px 10px;
}
</style>
