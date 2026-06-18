<template>
  <main class="app-screen export-screen">
    <PassportPage v-if="session">
      <MissionHeader :order="25" title="הורדת פספורט" />
      <PassportPdfDocument :session="session" />
      <PdfStampGrid :progress="progress" />
      <PdfCreationPage title="פאץ׳ אישי" :src="creations.patch?.imageUrl" />
      <PdfCreationPage title="תכשיט חלל" :src="creations.jewelry?.imageUrl" />
      <p v-if="dream">חלום: {{ dream.dream }}</p>
      <div class="control-row">
        <button class="primary-button" type="button" :disabled="busy" @click="download">{{ busy ? 'מפיק PDF...' : 'הורדת פספורט' }}</button>
        <NuxtLink class="secondary-button back-link" :to="`/passport/${session.id}`">חזור</NuxtLink>
      </div>
      <p v-if="error" class="error-note">{{ error }}</p>
    </PassportPage>
    <PassportPage v-else>
      <h1>טוען פספורט...</h1>
    </PassportPage>
  </main>
</template>

<script setup lang="ts">
import type { DreamEntry, PassportSession } from '~/types/mission'

const route = useRoute()
const firebase = useFirebase()
const { generatePassportPdf } = usePdfExport()
const sessionId = String(route.params.sessionId)
const session = ref<PassportSession | null>(null)
const progress = ref({})
const creations = ref({})
const dream = ref<DreamEntry | undefined>()
const busy = ref(false)
const error = ref('')

onMounted(async () => {
  session.value = await firebase.getSession(sessionId)
  progress.value = await firebase.getAllProgress(sessionId)
  creations.value = firebase.getLocalCreations(sessionId)
  const dreams = await firebase.getDreams()
  dream.value = dreams.find((item) => item.sessionId === sessionId)
})

async function download() {
  if (!session.value) return
  busy.value = true
  error.value = ''
  try {
    await generatePassportPdf({
      session: session.value,
      progress: progress.value,
      creations: creations.value,
      dream: dream.value
    })
  } catch {
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
</style>
