import { useEffect } from 'react'

export function SoundPreloader() {
  useEffect(() => {
    // Lista de sonidos a precargar
    const soundFiles = [
      "/sounds/hover.mp3",
      "/sounds/click.mp3",
      "/sounds/select.mp3",
      "/sounds/start.mp3",
      "/sounds/back.mp3",
      "/sounds/success.mp3",
      "/sounds/game-over.mp3",
      // Fallbacks
      "/sounds/hover.wav",
      "/sounds/click.wav",
      "/sounds/select.wav",
      "/sounds/start.wav",
      "/sounds/back.wav",
      "/sounds/success.wav",
      "/sounds/game-over.wav",
    ]

    // Precargar todos los sonidos
    const preloadPromises = soundFiles.map((src) => {
      return new Promise((resolve) => {
        const audio = new Audio()

        audio.addEventListener(
          "canplaythrough",
          () => {
            resolve(true)
          },
          { once: true },
        )

        audio.addEventListener(
          "error",
          () => {
            console.warn(`Failed to preload: ${src}`)
            resolve(false)
          },
          { once: true },
        )

        audio.src = src
        audio.load()
      })
    })

    // Ejecutar todas las promesas de precarga
    Promise.all(preloadPromises).then((results) => {
      const successCount = results.filter(Boolean).length
      console.log(`Preloaded ${successCount}/${soundFiles.length} sound files`)
    })
  }, [])

  return null
}