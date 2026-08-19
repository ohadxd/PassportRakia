<template>
  <main class="app-screen onboarding">
    <PassportCover>
      <form class="onboarding-form" @submit.prevent="submit">
        <label>
          שם מלא / שם להצגה
          <input v-model="name" class="field" autocomplete="name" required maxlength="36" />
        </label>

        <section class="photo-box">
          <video v-if="cameraActive && !photoDataUrl" ref="video" autoplay playsinline muted />
          <img v-else-if="photoDataUrl" :src="photoDataUrl" alt="תמונת פספורט" />
          <div v-else class="photo-fallback">תמונת פספורט</div>
        </section>

        <p v-if="cameraError" class="error">{{ cameraError }}</p>
        <p v-if="submitError" class="error">{{ submitError }}</p>

        <div class="control-row cover-controls">
          <button class="secondary-button" type="button" @click="startCamera">פתח מצלמה</button>
          <button class="secondary-button" type="button" :disabled="!cameraActive" @click="capture">צלם</button>
          <button class="secondary-button" type="button" :disabled="!photoDataUrl" @click="retake">צלם מחדש</button>
        </div>

        <label class="upload-label">
          העלאת תמונה במקום מצלמה
          <input type="file" accept="image/*" @change="uploadFile" />
        </label>

        <button class="primary-button" type="submit" :disabled="busy || name.trim().length < 2">
          {{ busy ? 'יוצר פספורט...' : 'מוכן למשימה' }}
        </button>
        <button class="skip-photo-button" type="button" :disabled="busy || name.trim().length < 2" @click="continueWithoutPhoto">
          המשך בלי תמונה
        </button>

        <NuxtLink v-if="existingSessionId" class="resume-link" :to="`/passport/${existingSessionId}`">חזרה לדרכון קיים</NuxtLink>
      </form>
    </PassportCover>
  </main>
</template>

<script setup lang="ts">
const firebase = useFirebase()
const router = useRouter()
const name = ref('')
const photoDataUrl = ref('')
const busy = ref(false)
const cameraActive = ref(false)
const cameraError = ref('')
const submitError = ref('')
const video = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const existingSessionId = ref<string | null>(null)

onMounted(() => {
  existingSessionId.value = firebase.getStoredSessionId()
})

onBeforeUnmount(stopCamera)

async function startCamera() {
  cameraError.value = ''
  submitError.value = ''
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    cameraActive.value = true
    await nextTick()
    if (video.value) video.value.srcObject = stream.value
  } catch {
    cameraError.value = 'לא הצלחנו לפתוח מצלמה. אפשר לנסות שוב, להעלות תמונה או להמשיך בלי תמונה.'
  }
}

function stopCamera() {
  stream.value?.getTracks().forEach((track) => track.stop())
  stream.value = null
  cameraActive.value = false
}

function capture() {
  const el = video.value
  if (!el) return
  if (!el.videoWidth || !el.videoHeight) {
    cameraError.value = 'המצלמה עדיין נטענת. נסו שוב בעוד רגע.'
    return
  }
  const canvas = document.createElement('canvas')
  canvas.width = 720
  canvas.height = 900
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const ratio = Math.max(canvas.width / el.videoWidth, canvas.height / el.videoHeight)
  const width = el.videoWidth * ratio
  const height = el.videoHeight * ratio
  ctx.drawImage(el, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
  photoDataUrl.value = canvas.toDataURL('image/jpeg', .86)
  cameraError.value = ''
  stopCamera()
}

function retake() {
  photoDataUrl.value = ''
  startCamera()
}

function uploadFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  submitError.value = ''
  if (!file.type.startsWith('image/')) {
    submitError.value = 'אפשר להעלות קובץ תמונה בלבד.'
    return
  }
  resizeImageFile(file)
    .then((dataUrl) => {
      photoDataUrl.value = dataUrl
      stopCamera()
    })
    .catch(() => {
      submitError.value = 'לא הצלחנו להכין את התמונה. נסו תמונה אחרת או המשיכו בלי תמונה.'
    })
}

function resizeImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = 720
      canvas.height = 900
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas is not available.'))
        return
      }

      const ratio = Math.max(canvas.width / image.width, canvas.height / image.height)
      const width = image.width * ratio
      const height = image.height * ratio
      ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
      resolve(canvas.toDataURL('image/jpeg', .86))
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image failed to load.'))
    }

    image.src = url
  })
}

function continueWithoutPhoto() {
  photoDataUrl.value = ''
  stopCamera()
  submit()
}

async function submit() {
  if (busy.value) return
  busy.value = true
  submitError.value = ''
  try {
    const session = await firebase.createSession(name.value.trim(), photoDataUrl.value || undefined)
    await router.push(`/passport/${session.id}`)
  } catch (error) {
    console.error(error)
    submitError.value = 'לא הצלחנו ליצור את הדרכון. בדקו שהכניסה האנונימית וכללי Firestore פעילים ואז נסו שוב.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.onboarding {
  display: grid;
  align-items: center;
}

.onboarding-form {
  width: min(430px, 100%);
  display: grid;
  gap: 13px;
  margin-top: auto;
}

label {
  display: grid;
  gap: 6px;
  color: var(--text);
  font-family: var(--font-body);
  font-weight: 500;
  text-align: right;
}

.photo-box {
  width: 160px;
  aspect-ratio: 3 / 4;
  justify-self: center;
  border: 2px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255,255,255,.07);
}

.photo-box video,
.photo-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-weight: 500;
}

.cover-controls {
  justify-content: center;
}

.upload-label input {
  color: var(--text);
}

.resume-link {
  color: var(--accent);
  font-family: var(--font-body);
  font-weight: 500;
}

.skip-photo-button {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-family: var(--font-body);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 4px;
  cursor: pointer;
}

.skip-photo-button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.error {
  margin: 0;
  color: var(--error-text);
}
</style>
