<template>
  <div class="quiz-block">
    <div v-if="!started" class="quiz-actions">
      <button class="primary-button" type="button" :disabled="disabled || locked" @click="$emit('start')">
        התחל שאלון
      </button>
    </div>

    <template v-else-if="currentQuestion">
      <h2>{{ currentQuestion.text }}</h2>
      <div class="choice-grid quiz-actions">
        <button
          v-for="(answer, answerIndex) in currentQuestion.answers"
          :key="`${currentQuestion.id}-${answerIndex}`"
          class="choice-button"
          type="button"
          :disabled="locked"
          @click="$emit('answer', answerIndex)"
        >
          {{ answer }}
        </button>
      </div>
      <p v-if="message" class="quiz-message">{{ message }}</p>
    </template>

    <p v-else class="quiz-message">השאלון עדיין לא מוגדר.</p>
  </div>
</template>

<script setup lang="ts">
import type { QuizQuestion } from '~/types/mission'

const props = withDefaults(defineProps<{
  questions?: QuizQuestion[]
  started: boolean
  currentIndex?: number
  message?: string
  disabled?: boolean
  locked?: boolean
}>(), {
  questions: () => [],
  currentIndex: 0,
  message: '',
  disabled: false,
  locked: false
})

defineEmits<{
  start: []
  answer: [index: number]
}>()

const currentQuestion = computed(() => props.questions[props.currentIndex])
</script>

<style scoped>
.quiz-block {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
}

h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.2rem;
  line-height: 1.35;
}

.quiz-message {
  margin: 0;
  color: var(--text-muted);
  font-weight: 800;
}

.quiz-actions {
  position: sticky;
  z-index: 30;
  bottom: max(10px, env(safe-area-inset-bottom));
  width: 100%;
  display: grid;
  gap: 10px;
  margin: auto 0 0;
  border: 1px solid var(--surface-border);
  border-radius: 14px;
  padding: 12px;
  background: rgba(var(--bg-rgb), .96);
  box-shadow: 0 -10px 36px rgba(var(--bg-deep-rgb), .5);
  backdrop-filter: blur(12px);
}

.quiz-actions .primary-button { width: 100%; }
</style>
