import type { DreamEntry } from '~/types/mission'

export function useDreamWall() {
  const firebase = useFirebase()
  const dreams = ref<DreamEntry[]>([])
  const loading = ref(true)
  const stop = ref<(() => void) | null>(null)

  async function start() {
    loading.value = true
    stop.value = await firebase.subscribeDreams((items) => {
      dreams.value = items
      loading.value = false
    })
  }

  onBeforeUnmount(() => {
    stop.value?.()
  })

  return { dreams, loading, start }
}
