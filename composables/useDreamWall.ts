import type { DreamEntry } from '~/types/mission'

export function useDreamWall() {
  const firebase = useFirebase()
  const dreams = ref<DreamEntry[]>([])
  const loading = ref(true)
  const error = ref('')
  const stop = ref<(() => void) | null>(null)

  async function start() {
    loading.value = true
    error.value = ''
    stop.value?.()
    try {
      stop.value = await firebase.subscribeDreams(
        (items) => {
          dreams.value = items
          loading.value = false
        },
        (err) => {
          console.error(err)
          error.value = 'לא הצלחנו לטעון חלומות בזמן אמת. בדקו Firebase והרשאות.'
          loading.value = false
        }
      )
    } catch (err) {
      console.error(err)
      error.value = 'לא הצלחנו להתחבר לקיר החלומות.'
      loading.value = false
    }
  }

  onBeforeUnmount(() => {
    stop.value?.()
  })

  return { dreams, loading, error, start }
}
