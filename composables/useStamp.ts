export function useStamp() {
  const applauseSoundUrl = '/audio/freesound_community-claps-44774.mp3'

  function createAudioContext() {
    if (!import.meta.client) return null
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    return AudioContextCtor ? new AudioContextCtor() : null
  }

  function playStampSound() {
    const ctx = createAudioContext()
    if (!ctx) return
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(95, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(42, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.13)
    window.setTimeout(() => void ctx.close(), 240)
  }

  function playChallengeSound(correct: boolean, streak: number) {
    if (correct) {
      const applause = new Audio(applauseSoundUrl)
      applause.volume = streak >= 3 ? 0.9 : 0.78
      void applause.play().catch((error) => {
        console.warn('[useStamp] Applause playback was blocked', error)
      })
      return
    }

    const ctx = createAudioContext()
    if (!ctx) return
    void ctx.resume()
    const startAt = ctx.currentTime

    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(290, startAt)
    oscillator.frequency.exponentialRampToValueAtTime(125, startAt + .55)
    gain.gain.setValueAtTime(.16, startAt)
    gain.gain.exponentialRampToValueAtTime(.001, startAt + .65)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(startAt)
    oscillator.stop(startAt + .68)
    window.setTimeout(() => void ctx.close(), 850)
  }

  return { playStampSound, playChallengeSound }
}
