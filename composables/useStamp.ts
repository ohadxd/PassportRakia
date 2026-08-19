export function useStamp() {
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
    const ctx = createAudioContext()
    if (!ctx) return
    void ctx.resume()
    const startAt = ctx.currentTime

    if (!correct) {
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
      return
    }

    // Three short filtered noise bursts read as applause on small phone speakers.
    ;[0, .11, .23].forEach((offset, index) => {
      const duration = .075
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate)
      const samples = buffer.getChannelData(0)
      for (let sample = 0; sample < samples.length; sample += 1) {
        samples[sample] = (Math.random() * 2 - 1) * Math.pow(1 - sample / samples.length, 2)
      }
      const source = ctx.createBufferSource()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      source.buffer = buffer
      filter.type = 'bandpass'
      filter.frequency.value = 1100 + index * 230
      filter.Q.value = .7
      gain.gain.value = .3
      source.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      source.start(startAt + offset)
    })

    if (streak >= 2) {
      const lift = ctx.createOscillator()
      const liftGain = ctx.createGain()
      lift.type = 'sawtooth'
      lift.frequency.setValueAtTime(95, startAt)
      lift.frequency.exponentialRampToValueAtTime(streak >= 3 ? 620 : 410, startAt + .75)
      liftGain.gain.setValueAtTime(.035, startAt)
      liftGain.gain.exponentialRampToValueAtTime(.001, startAt + .82)
      lift.connect(liftGain)
      liftGain.connect(ctx.destination)
      lift.start(startAt)
      lift.stop(startAt + .85)
    }

    window.setTimeout(() => void ctx.close(), 1100)
  }

  return { playStampSound, playChallengeSound }
}
