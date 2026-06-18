<template>
  <div class="mission">
    <MissionHeader :order="mission.order" :title="mission.title" :subtitle="mission.subtitle" />

    <div v-if="mission.wallContentSummary?.length" class="mission-copy summary-box">
      <ul>
        <li v-for="line in mission.wallContentSummary" :key="line">{{ line }}</li>
      </ul>
    </div>

    <p v-if="progress?.status === 'skipped'" class="skip-note">אין חותמת לתחנה שדולגה. אפשר להשלים אותה עכשיו ולקבל חותמת.</p>
    <p v-if="savedMessage" class="success-note">{{ savedMessage }}</p>

    <section v-if="mission.type === 'transition'" class="transition-panel">
      <h2>מוכן למשימה?</h2>
      <p>דרכון רקיע שלך נפתח. בכל תחנה תוכל להשלים משימה, לצבור ניקוד ולקבל חותמת.</p>
      <button class="primary-button" type="button" @click="completeNow(1)">המשך</button>
    </section>

    <section v-else-if="isVideoMission" class="video-panel">
      <video v-if="videoUrl" :src="videoUrl" controls playsinline preload="metadata" @play="start" @error="videoError = true" />
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
        :message="quizMessage"
        @start="startQuiz"
        @answer="answerQuiz"
      />
      <div v-else class="control-row">
        <button class="primary-button" type="button" @click="completeNow(attempts || 1)">{{ mission.actionText || 'ראיתי' }}</button>
      </div>
    </section>

    <section v-else-if="mission.type === 'ar-confirmation'" class="ar-panel">
      <a class="ar-link" :href="arUrl" target="_blank" rel="noreferrer">פתחו את אפליקציית רקיע</a>
      <div v-if="mission.id === 'countdown-ar'" class="countdown">
        <button type="button" @click="tickCountdown">{{ countdown > 0 ? countdown : 'שיגור!' }}</button>
      </div>
      <button class="primary-button" type="button" :disabled="mission.id === 'countdown-ar' && countdown > 0" @click="completeNow(1)">
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
      <ISSScene v-if="mission.id === 'iss-station'" @ready="sceneReady = true" />
      <EarthWindowScene v-else-if="mission.id === 'earth-window'" @ready="sceneReady = true" />
      <LiquidOpticsScene v-else @ready="sceneReady = true" />
      <QuizBlock
        :questions="quizQuestions"
        :started="quizStarted"
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
          <span>{{ session.rank }}</span>
          <span>{{ session.totalScore }} נקודות</span>
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

    <footer v-if="mission.allowSkip && progress?.status !== 'completed'" class="mission-footer">
      <SkipButton @click="$emit('skip')" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { CreationRecord, MissionConfig, MissionProgress, PassportSession } from '~/types/mission'
import { missions } from '~/data/missions'

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

const videoUrl = ref('')
const videoError = ref(false)
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
const countdown = ref(10)
const dream = ref('')
const dreamError = ref('')
const savedMessage = ref('')
const animateStamp = ref(false)
const checkedControls = ref<string[]>([])
const controlChecks = ['תקשורת תקינה', 'מיקום ידוע', 'צוות כשיר למשימה']

const stampMissions = computed(() => missions.filter((mission) => mission.baseScore > 0))
const isVideoMission = computed(() => ['intro-video', 'video-quiz', 'video-confirmation'].includes(props.mission.type))
const arUrl = computed(() => `${runtime.public.rakiaArBaseUrl.replace(/\/$/, '')}/${props.mission.arSlug || props.mission.id}`)
const quizQuestions = computed(() => {
  const questions = props.mission.questions || []
  if (props.mission.id === 'rakia-mission') return questions.slice(0, 3)
  if (props.mission.id === 'rakia-numbers') return questions.slice(0, 4)
  return questions
})

watch(() => props.mission.id, resetState, { immediate: true })
watch(() => props.progress?.status, (status) => {
  if (status === 'completed') {
    animateStamp.value = true
    window.setTimeout(() => { animateStamp.value = false }, 700)
  }
})

async function resetState() {
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
  countdown.value = 10
  dream.value = ''
  dreamError.value = ''
  savedMessage.value = ''
  checkedControls.value = []
  if (props.mission.video?.storagePath) {
    videoUrl.value = await firebase.getStorageUrl(props.mission.video.storagePath)
  }
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

function tickCountdown() {
  start()
  countdown.value = Math.max(0, countdown.value - 1)
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

<script lang="ts">
export default {
  components: {
    QuizBlock: {
      props: ['questions', 'started', 'message', 'disabled'],
      emits: ['start', 'answer'],
      computed: {
        question() {
          return this.questions?.[0]
        }
      },
      data() {
        return { index: 0 }
      },
      watch: {
        questions() { this.index = 0 }
      },
      template: `
        <div class="quiz-block">
          <button v-if="!started" class="primary-button" type="button" :disabled="disabled" @click="$emit('start')">התחל שאלון</button>
          <template v-else>
            <h2>{{ questions[index]?.text }}</h2>
            <div class="choice-grid">
              <button v-for="(answer, answerIndex) in questions[index]?.answers" :key="answer" class="choice-button" type="button" @click="$emit('answer', answerIndex); if (answerIndex === questions[index]?.correctIndex && index < questions.length - 1) setTimeout(() => index++, 430)">
                {{ answer }}
              </button>
            </div>
            <p v-if="message">{{ message }}</p>
          </template>
        </div>
      `
    }
  }
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

.summary-box {
  border: 1px solid rgba(18, 36, 59, .12);
  border-radius: 8px;
  padding: 10px 12px;
  background: rgba(255, 251, 236, .64);
}

.transition-panel,
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

.countdown {
  display: grid;
  place-items: center;
  min-height: 160px;
  border-radius: 8px;
  background: radial-gradient(circle, rgba(214,184,102,.23), rgba(7,23,47,.08));
}

.countdown button {
  width: 118px;
  height: 118px;
  border-radius: 50%;
  color: #061126;
  background: #e7cf83;
  font-size: 2rem;
  font-weight: 900;
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

.mission-footer {
  position: absolute;
  right: 0;
  bottom: 0;
}
</style>
