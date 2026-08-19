<template>
  <div class="quiz-block">
    <button v-if="!started" class="primary-button" type="button" :disabled="disabled" @click="$emit('start')">
      התחל שאלון
    </button>

    <template v-else-if="currentQuestion">
      <h2>{{ currentQuestion.text }}</h2>
      <div class="choice-grid">
        <button
          v-for="(answer, answerIndex) in currentQuestion.answers"
          :key="`${currentQuestion.id}-${answerIndex}`"
          class="choice-button"
          type="button"
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
}>(), {
  questions: () => [],
  currentIndex: 0,
  message: '',
  disabled: false
})

defineEmits<{
  start: []
  answer: [index: number]
}>()

const currentQuestion = computed(() => props.questions[props.currentIndex])
</script>

<style scoped>
.quiz-block {
  display: grid;
  gap: 12px;
}

h2 {
  margin: 0;
  color: #12243b;
  font-size: 1.2rem;
  line-height: 1.35;
}

.quiz-message {
  margin: 0;
  color: #314665;
  font-weight: 800;
}
</style>
