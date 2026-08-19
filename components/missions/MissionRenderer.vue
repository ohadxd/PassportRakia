<template>
  <div class="mission">
    <MissionHeader :order="mission.order" :title="mission.title" :subtitle="mission.subtitle" />

    <div v-if="mission.wallContentSummary?.length" class="mission-copy summary-copy">
      <p v-for="line in mission.wallContentSummary" :key="line">{{ line }}</p>
    </div>

    <p v-if="progress?.status === 'skipped'" class="skip-note">אין חותמת לתחנה שדולגה. אפשר להשלים אותה עכשיו ולקבל חותמת.</p>
    <p v-if="savedMessage" class="success-note">{{ savedMessage }}</p>

    <section v-if="mission.type === 'transition'" class="transition-panel">
      <h2>מוכן למשימה?</h2>
      <p>דרכון רקיע שלך נפתח. בכל תחנה תוכל להשלים משימה, לצבור ניקוד ולקבל חותמת.</p>
      <button class="primary-button" type="button" @click="completeNow(1)">המשך</button>
    </section>

    <section v-else-if="mission.type === 'wall-video-confirmation'" class="wall-video-panel">
      <div class="wall-video-callout">
        <strong>הסרטון מוקרן במסך התערוכה</strong>
        <span>צפו בטלוויזיה שעל הקיר, ואז אשרו כאן כדי להמשיך בדרכון.</span>
      </div>
      <button class="primary-button" type="button" @click="completeNow(1)">{{ mission.actionText || 'ראיתי' }}</button>
    </section>

    <section v-else-if="isVideoMission" class="video-panel">
      <video v-if="videoUrl" :key="videoKey" controls playsinline preload="metadata" @play="start" @error="videoError = true">
        <source :key="videoKey" :src="videoUrl" type="video/mp4" />
      </video>
      <div v-else class="video-placeholder">
        <strong>וידאו מאחסון Firebase</strong>
        <span>{{ mission.video?.storagePath }}</span>
        <p>הסרטון נטען לפי נתיב Storage בלבד ואינו כלול בתוך ה-PWA.</p>
      </div>
      <p v-if="videoError" class="error-note">טעינת הסרטון נכשלה. ניתן לנסות שוב או להמשיך בתחנה.</p>
      <QuizBlock
        v-if="mission.type === 'video-quiz'"
        :questions="quizQuestions"
        :started="quizStarted"
        :current-index="quizIndex"
        :message="quizMessage"
        @start="startQuiz"
        @answer="answerQuiz"
      />
      <div v-else class="control-row">
        <button class="primary-button" type="button" @click="completeNow(attempts || 1)">{{ mission.actionText || 'ראיתי' }}</button>
      </div>
    </section>

    <section v-else-if="mission.type === 'ar-confirmation'" class="ar-panel">
      <a class="ar-link" :href="arUrl" target="_blank" rel="noreferrer">{{ arLinkLabel }}</a>
      <button class="primary-button" type="button" @click="completeNow(1)">
        {{ mission.actionText || 'סיימתי' }}
      </button>
    </section>

    <section v-else-if="mission.type === 'quiz' || mission.type === 'confirmation-quiz'" class="quiz-panel">
      <div v-if="mission.type === 'confirmation-quiz'" class="checks">
        <label v-for="check in controlChecks" :key="check">
          <input v-model="checkedControls" type="checkbox" :value="check" />
          {{ check }}
        </label>
      </div>
      <QuizBlock
        :questions="quizQuestions"
        :started="quizStarted"
        :current-index="quizIndex"
        :message="quizMessage"
        :disabled="mission.type === 'confirmation-quiz' && checkedControls.length < controlChecks.length"
        @start="startQuiz"
        @answer="answerQuiz"
      />
    </section>

    <section v-else-if="mission.type === 'sort-game'" class="sort-panel">
      <button v-if="!sortStarted" class="primary-button" type="button" @click="startSort">התחל שאלון</button>
      <template v-else>
        <ol class="sort-list">
          <li v-for="(item, index) in sortOrder" :key="item.id">
            <span>{{ item.label }}</span>
            <div>
              <button type="button" :disabled="index === 0" @click="moveSort(index, -1)">↑</button>
              <button type="button" :disabled="index === sortOrder.length - 1" @click="moveSort(index, 1)">↓</button>
            </div>
          </li>
        </ol>
        <p v-if="gameMessage">{{ gameMessage }}</p>
        <button class="primary-button" type="button" @click="submitSort">סיימתי</button>
      </template>
    </section>

    <section v-else-if="mission.type === 'classification-game'" class="classification-panel">
      <button v-if="!classificationStarted" class="primary-button" type="button" @click="startClassification">התחל שאלון</button>
      <template v-else>
        <div class="class-items">
          <article v-for="item in mission.classificationItems" :key="item.id">
            <strong>{{ item.label }}</strong>
            <div>
              <button
                v-for="category in mission.classificationCategories"
                :key="category.id"
                type="button"
                :class="{ selected: classifications[item.id] === category.id }"
                @click="classifications[item.id] = category.id"
              >
                {{ category.label }}
              </button>
            </div>
          </article>
        </div>
        <p v-if="gameMessage">{{ gameMessage }}</p>
        <button class="primary-button" type="button" @click="submitClassification">סיימתי</button>
      </template>
    </section>

    <section v-else-if="mission.type === 'three-info-quiz'" class="three-panel">
      <ISSScene v-if="mission.id === 'iss-station'" :model-url="mission.model?.url" @ready="sceneReady = true" />
      <EarthWindowScene
        v-else-if="mission.id === 'earth-window'"
        :model-url="mission.model?.url"
        @ready="sceneReady = true"
        @location-question="setDynamicQuestion"
      />
      <LiquidOpticsScene v-else @ready="sceneReady = true" />
      <QuizBlock
        :questions="quizQuestions"
        :started="quizStarted"
        :current-index="quizIndex"
        :message="quizMessage"
        :disabled="!sceneReady"
        @start="startQuiz"
        @answer="answerQuiz"
      />
    </section>

    <section v-else-if="mission.type === 'three-game'" class="three-panel">
      <MicrogravityVelcroScene v-if="mission.id === 'microgravity-velcro'" @ready="sceneReady = true" />
      <AsteroidBlinkingScene v-else @ready="sceneReady = true" />
      <QuizBlock
        :questions="quizQuestions"
        :started="quizStarted"
        :current-index="quizIndex"
        :message="quizMessage"
        :disabled="!sceneReady"
        @start="startQuiz"
        @answer="answerQuiz"
      />
    </section>

    <PatchDesignerMission
      v-else-if="mission.type === 'patch-designer'"
      :user-name="session.name"
      @saved="saveCreation('patch', $event)"
    />

    <JewelryDesignerMission
      v-else-if="mission.type === 'jewelry-designer'"
      @saved="saveCreation('jewelry', $event)"
    />

    <section v-else-if="mission.type === 'dream-input'" class="dream-panel">
      <label>
        כתבו חלום קצר שתרצו להגשים.
        <textarea v-model="dream" class="field" maxlength="120" rows="4" />
      </label>
      <p>{{ dream.length }}/120</p>
      <p v-if="dreamError" class="error-note">{{ dreamError }}</p>
      <button class="primary-button" type="button" :disabled="dream.trim().length < 4" @click="saveDream">סיימתי</button>
    </section>

    <section v-else-if="mission.type === 'summary'" class="summary-panel">
      <div class="id-card">
        <img v-if="session.photoUrl" :src="session.photoUrl" alt="תמונת פספורט" />
        <div v-else class="silhouette">רקיע</div>
        <div>
          <strong>{{ session.name }}</strong>
          <span class="final-score-label">ניקוד סופי</span>
          <span class="final-score">{{ session.totalScore }} נקודות</span>
        </div>
      </div>
      <div class="stamp-grid">
        <span v-for="stampMission in stampMissions" :key="stampMission.id" :class="{ done: allProgress[stampMission.id]?.status === 'completed' }">
          {{ stampMission.order }}
        </span>
      </div>
      <NuxtLink class="primary-button export-link" :to="`/export/${session.id}`">הורדת פספורט</NuxtLink>
    </section>

    <Stamp v-if="progress?.status === 'completed' && mission.baseScore > 0" :seed="mission.order" :animate="animateStamp" />
  </div>
</template>

<script setup lang="ts">
import type { CreationRecord, MissionConfig, MissionProgress, PassportSession, QuizQuestion } from '~/types/mission'
import { missions } from '~/data/missions'
import QuizBlock from './QuizBlock.vue'

const props = defineProps<{
  mission: MissionConfig
  session: PassportSession
  progress?: MissionProgress
  allProgress: Record<string, MissionProgress>
}>()

const emit = defineEmits<{
  start: []
  complete: [{ attempts: number; answers?: MissionProgress['answers'] }]
  skip: []
  creation: [CreationRecord]
  dream: [unknown]
}>()

const firebase = useFirebase()
const profanity = useProfanityFilter()
const runtime = useRuntimeConfig()
const IOS_RAKIA_APP_URL = 'https://apps.apple.com/fi/app/rakia/id6504777792'

const videoUrl = ref('')
const videoError = ref(false)
const isIosDevice = ref(false)
const quizStarted = ref(false)
const quizIndex = ref(0)
const selectedAnswers = ref<MissionProgress['answers']>([])
const attempts = ref(0)
const quizMessage = ref('')
const gameMessage = ref('')
const sortStarted = ref(false)
const classificationStarted = ref(false)
const sortOrder = ref([...(props.mission.sortItems || [])].sort((a, b) => b.correctOrder - a.correctOrder))
const classifications = reactive<Record<string, string>>({})
const sceneReady = ref(false)
const dynamicQuestions = ref<QuizQuestion[] | null>(null)
const dream = ref('')
const dreamError = ref('')
const savedMessage = ref('')
const animateStamp = ref(false)
const checkedControls = ref<string[]>([])
const controlChecks = ['תקשורת תקינה', 'מיקום ידוע', 'צוות כשיר למשימה']

const stampMissions = computed(() => missions.filter((mission) => mission.baseScore > 0))
const isVideoMission = computed(() => ['intro-video', 'video-quiz', 'video-confirmation'].includes(props.mission.type))
const webArUrl = computed(() => `${runtime.public.rakiaArBaseUrl.replace(/\/$/, '')}/${props.mission.arSlug || props.mission.id}`)
const arUrl = computed(() => isIosDevice.value ? IOS_RAKIA_APP_URL : webArUrl.value)
const arLinkLabel = computed(() => isIosDevice.value ? 'פתחו באפליקציית רקיע לאייפון' : 'פתחו את אפליקציית רקיע')
const videoKey = computed(() => `${props.mission.id}:${videoUrl.value || props.mission.video?.storagePath || ''}`)
const quizQuestions = computed(() => {
  const questions = props.mission.questions || []
  if (props.mission.id === 'earth-window' && dynamicQuestions.value?.length) {
    return [...questions, ...dynamicQuestions.value]
  }
  if (props.mission.id === 'rakia-numbers') return questions.slice(0, 4)
  return questions
})

onMounted(() => {
  isIosDevice.value = detectIosDevice()
})

watch(() => props.mission.id, resetState, { immediate: true })
watch(() => props.progress?.status, (status) => {
  if (status === 'completed') {
    animateStamp.value = true
    window.setTimeout(() => { animateStamp.value = false }, 700)
  }
})

async function resetState() {
  const missionId = props.mission.id
  videoUrl.value = ''
  videoError.value = false
  quizStarted.value = false
  quizIndex.value = 0
  selectedAnswers.value = []
  attempts.value = 0
  quizMessage.value = ''
  gameMessage.value = ''
  sortStarted.value = false
  classificationStarted.value = false
  sortOrder.value = [...(props.mission.sortItems || [])].sort((a, b) => ((a.correctOrder * 7) % 11) - ((b.correctOrder * 7) % 11))
  Object.keys(classifications).forEach((key) => delete classifications[key])
  sceneReady.value = false
  dynamicQuestions.value = null
  dream.value = ''
  dreamError.value = ''
  savedMessage.value = ''
  checkedControls.value = []
  const video = props.mission.video
  if (video?.url) {
    videoUrl.value = video.url
  } else if (video?.storagePath) {
    const resolvedUrl = await firebase.getStorageUrl(video.storagePath)
    if (props.mission.id === missionId) videoUrl.value = resolvedUrl
  }
}

function detectIosDevice() {
  if (typeof navigator === 'undefined') return false
  const agent = navigator.userAgent || ''
  const platform = navigator.platform || ''
  return /iPad|iPhone|iPod/i.test(agent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function setDynamicQuestion(question: QuizQuestion) {
  if (quizStarted.value) return
  dynamicQuestions.value = [question]
  quizStarted.value = false
  quizIndex.value = 0
  selectedAnswers.value = []
  attempts.value = 0
  quizMessage.value = ''
}

function start() {
  emit('start')
}

function completeNow(attemptCount = 1) {
  start()
  emit('complete', { attempts: attemptCount, answers: selectedAnswers.value })
}

function startQuiz() {
  start()
  quizStarted.value = true
  quizMessage.value = ''
}

function answerQuiz(index: number) {
  const question = quizQuestions.value[quizIndex.value]
  if (!question) return
  attempts.value += 1
  const correct = index === question.correctIndex
  selectedAnswers.value = [
    ...(selectedAnswers.value || []),
    { questionId: question.id, selected: index, correct, attempts: attempts.value }
  ]
  if (!correct) {
    quizMessage.value = 'תשובה לא נכונה, נסו שוב.'
    return
  }
  quizMessage.value = 'נכון.'
  if (quizIndex.value < quizQuestions.value.length - 1) {
    window.setTimeout(() => {
      quizIndex.value += 1
      quizMessage.value = ''
    }, 420)
  } else {
    window.setTimeout(() => completeNow(Math.max(1, attempts.value)), 420)
  }
}

function startSort() {
  start()
  sortStarted.value = true
}

function moveSort(index: number, delta: number) {
  const next = [...sortOrder.value]
  const target = index + delta
  ;[next[index], next[target]] = [next[target], next[index]]
  sortOrder.value = next
}

function submitSort() {
  attempts.value += 1
  const correct = sortOrder.value.every((item, index) => item.correctOrder === index + 1)
  if (!correct) {
    gameMessage.value = 'הסדר עדיין לא מדויק. אפשר לנסות שוב.'
    return
  }
  completeNow(attempts.value)
}

function startClassification() {
  start()
  classificationStarted.value = true
}

function submitClassification() {
  attempts.value += 1
  const items = props.mission.classificationItems || []
  const allAnswered = items.every((item) => classifications[item.id])
  if (!allAnswered) {
    gameMessage.value = 'יש למיין את כל הפריטים.'
    return
  }
  const correct = items.every((item) => classifications[item.id] === item.category)
  if (!correct) {
    gameMessage.value = 'חלק מהפריטים עדיין לא במקום הנכון. נסו שוב.'
    return
  }
  completeNow(attempts.value)
}

async function saveCreation(type: 'patch' | 'jewelry', event: { imageDataUrl: string; data: Record<string, unknown> }) {
  start()
  const creation = await firebase.saveCreation({
    sessionId: props.session.id,
    type,
    imageDataUrl: event.imageDataUrl,
    data: event.data
  })
  savedMessage.value = type === 'patch' ? 'הפאץ׳ נשמר.' : 'התכשיט נשמר.'
  emit('creation', creation)
  completeNow(1)
}

async function saveDream() {
  start()
  dreamError.value = ''
  const filter = profanity.check(dream.value)
  if (!filter.approved) {
    dreamError.value = 'החלום לא מתאים לתצוגה ציבורית. נסחו מחדש בנימוס.'
    await firebase.saveDream({
      sessionId: props.session.id,
      name: props.session.name,
      photoUrl: props.session.photoUrl,
      dream: dream.value,
      scoreAtSubmit: props.session.totalScore,
      approved: false,
      rejectedReason: filter.rejectedReason
    })
    return
  }
  const saved = await firebase.saveDream({
    sessionId: props.session.id,
    name: props.session.name,
    photoUrl: props.session.photoUrl,
    dream: dream.value.trim(),
    scoreAtSubmit: props.session.totalScore,
    approved: true
  })
  emit('dream', saved)
  savedMessage.value = 'החלום נשמר ויופיע במסך הטלוויזיה.'
  completeNow(1)
}
</script>

<style scoped>
.mission {
  min-height: 100%;
  position: relative;
  display: grid;
  align-content: start;
  gap: 13px;
  padding-bottom: 54px;
}

.summary-copy {
  display: grid;
  gap: 7px;
  padding: 2px 0;
  padding-inline-start: 12px;
  border-inline-start: 3px solid rgba(201, 164, 90, .72);
}

.summary-copy p {
  margin: 0;
  color: #314665;
  font-weight: 700;
  line-height: 1.45;
}

.transition-panel,
.wall-video-panel,
.video-panel,
.ar-panel,
.quiz-panel,
.sort-panel,
.classification-panel,
.three-panel,
.dream-panel,
.summary-panel {
  display: grid;
  gap: 12px;
}

.transition-panel h2 {
  margin: 0;
  font-size: clamp(1.8rem, 9vw, 3.2rem);
  color: #12243b;
}

.wall-video-callout {
  display: grid;
  gap: 6px;
  border-radius: 8px;
  padding: 14px 16px;
  color: #f5e5b7;
  background: linear-gradient(135deg, #07172f, #132f55);
  box-shadow: inset 0 0 0 1px rgba(214,184,102,.26);
}

.wall-video-callout strong {
  font-size: 1.05rem;
}

.wall-video-callout span {
  color: rgba(245, 229, 183, .8);
}

video,
.video-placeholder {
  width: 100%;
  min-height: 210px;
  border-radius: 8px;
  background: linear-gradient(135deg, #07172f, #132f55);
  color: #f4e5b8;
}

.video-placeholder {
  display: grid;
  place-items: center;
  padding: 24px;
  text-align: center;
}

.video-placeholder span {
  direction: ltr;
  color: rgba(244, 229, 184, .74);
}

.ar-link,
.export-link {
  display: inline-grid;
  place-items: center;
  text-decoration: none;
}

.ar-link {
  min-height: 52px;
  border-radius: 8px;
  color: #f5e5b7;
  background: #0b2345;
  border: 1px solid rgba(214,184,102,.38);
  font-weight: 800;
}

.checks {
  display: grid;
  gap: 8px;
}

.checks label {
  min-height: 42px;
  display: flex;
  gap: 8px;
  align-items: center;
  border-radius: 8px;
  padding: 0 10px;
  background: rgba(255,250,232,.7);
}

.sort-list {
  list-style: none;
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.sort-list li,
.class-items article {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  border: 1px solid rgba(18,36,59,.15);
  border-radius: 8px;
  padding: 10px;
  background: rgba(255,250,232,.78);
}

.sort-list button,
.class-items button {
  min-width: 38px;
  min-height: 36px;
  border-radius: 8px;
  color: #10233d;
  background: rgba(214,184,102,.24);
  font-weight: 800;
}

.class-items {
  display: grid;
  gap: 8px;
}

.class-items article {
  align-items: stretch;
  flex-direction: column;
}

.class-items div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.class-items button.selected {
  background: #e4c46d;
}

.dream-panel label {
  display: grid;
  gap: 8px;
  color: #263a5a;
  font-weight: 800;
}

.id-card {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 14px;
  align-items: center;
  border: 1px solid rgba(18,36,59,.14);
  border-radius: 8px;
  padding: 12px;
  background: rgba(255,250,232,.72);
}

.id-card img,
.silhouette {
  width: 96px;
  height: 118px;
  border-radius: 7px;
  object-fit: cover;
  background: #d5c397;
}

.silhouette {
  display: grid;
  place-items: center;
  color: #6a5a37;
  font-weight: 900;
}

.id-card strong,
.id-card span {
  display: block;
}

.final-score-label {
  margin-top: 7px;
  color: #896b2c;
  font-size: .82rem;
  font-weight: 800;
}

.final-score {
  color: #10233d;
  font-size: 1.25rem;
  font-weight: 900;
}

.stamp-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.stamp-grid span {
  display: grid;
  place-items: center;
  min-height: 42px;
  border-radius: 50%;
  border: 1px dashed rgba(18,36,59,.24);
  color: rgba(18,36,59,.45);
  font-weight: 900;
}

.stamp-grid span.done {
  border: 2px solid #0b7d4f;
  color: #0b7d4f;
}

.skip-note,
.error-note,
.success-note {
  margin: 0;
  border-radius: 8px;
  padding: 9px 10px;
}

.skip-note { color: #674717; background: rgba(214,184,102,.2); }
.error-note { color: #852d2d; background: rgba(155,47,47,.12); }
.success-note { color: #0b6a43; background: rgba(11,125,79,.12); }

</style>
