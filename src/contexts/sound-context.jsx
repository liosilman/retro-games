import { createContext, useContext, useState, useEffect } from 'react'
import { SOUND_GENERATORS } from '../utils/sound-generator'

// Contexto para gestionar los sonidos
const SoundContext = createContext({
    isSoundEnabled: true,
    toggleSound: () => { },
    playSound: () => { },
})

// Intentar cargar desde archivos
const SOUND_PATHS = {
    hover: "/sounds/hover.mp3",
    click: "/sounds/click.mp3",
    select: "/sounds/select.mp3",
    start: "/sounds/start.mp3",
    back: "/sounds/back.mp3",
    success: "/sounds/success.mp3",
    gameOver: "/sounds/game-over.mp3",
}

export function SoundProvider({ children }) {
    // Estado para controlar si el sonido está activado
    const [isSoundEnabled, setIsSoundEnabled] = useState(true)
    // Caché de objetos de audio para mejor rendimiento
    const [audioCache, setAudioCache] = useState({})
    // Estado para controlar si el sistema está listo (después de interacción del usuario)
    const [isReady, setIsReady] = useState(false)
    // Estado para rastrear si estamos usando sonidos generados
    const [usingSynthSounds, setUsingSynthSounds] = useState(false)

    // Inicializar la caché de audio
    useEffect(() => {
        const cache = {}
        let failedSounds = 0

        // Función para intentar cargar un archivo de audio
        const tryLoadAudio = async (key, path) => {
            return new Promise((resolve) => {
                try {
                    const audio = new Audio()

                    // Configurar eventos para detectar éxito o fracaso
                    const onSuccess = () => {
                        audio.removeEventListener("canplaythrough", onSuccess)
                        audio.removeEventListener("error", onError)
                        resolve({ success: true, audio })
                    }

                    const onError = () => {
                        audio.removeEventListener("canplaythrough", onSuccess)
                        audio.removeEventListener("error", onError)
                        resolve({ success: false })
                    }

                    audio.addEventListener("canplaythrough", onSuccess, { once: true })
                    audio.addEventListener("error", onError, { once: true })

                    // Intentar cargar el audio
                    audio.src = path
                    audio.load()

                    // Establecer un tiempo límite para la carga
                    setTimeout(() => {
                        audio.removeEventListener("canplaythrough", onSuccess)
                        audio.removeEventListener("error", onError)
                        resolve({ success: false })
                    }, 3000)
                } catch (error) {
                    console.warn(`Error loading audio ${key}:`, error)
                    resolve({ success: false })
                }
            })
        }

        // Inicializar todos los sonidos
        const initSounds = async () => {
            for (const [key, path] of Object.entries(SOUND_PATHS)) {
                // Intentar cargar el archivo
                const { success, audio } = await tryLoadAudio(key, path)

                if (success) {
                    // Si se cargó correctamente, usarlo
                    audio.volume = 0.5
                    cache[key] = {
                        type: "audio",
                        play: () => {
                            const clone = audio.cloneNode()
                            clone.volume = 0.5
                            return clone.play().catch((err) => {
                                // Silenciar errores
                            })
                        },
                    }
                } else {
                    // Si falló, marcar para usar sonidos generados
                    failedSounds++
                    cache[key] = {
                        type: "synth",
                        play: () => {
                            if (SOUND_GENERATORS[key]) {
                                return SOUND_GENERATORS[key]()
                            }
                            return Promise.resolve()
                        },
                    }
                }
            }

            // Actualizar el estado si estamos usando sonidos generados
            if (failedSounds > 0) {
                console.log(`Using ${failedSounds} synthesized sounds`)
                setUsingSynthSounds(true)
            }

            setAudioCache(cache)
        }

        initSounds()

        // Verificar si el usuario ya había configurado una preferencia
        const savedSoundPreference = localStorage.getItem("retro-games-sound")
        if (savedSoundPreference !== null) {
            setIsSoundEnabled(savedSoundPreference === "true")
        }

        // Función para marcar el sistema como listo después de interacción
        const markAsReady = () => {
            setIsReady(true)
            document.removeEventListener("click", markAsReady)
        }

        document.addEventListener("click", markAsReady)

        return () => {
            document.removeEventListener("click", markAsReady)
        }
    }, [])

    // Guardar preferencia de sonido cuando cambia
    useEffect(() => {
        localStorage.setItem("retro-games-sound", isSoundEnabled.toString())
    }, [isSoundEnabled])

    // Función para reproducir un sonido
    const playSound = (soundName) => {
        if (!isSoundEnabled || !isReady) return

        try {
            // Si no existe el sonido en la caché, no hacer nada
            if (!audioCache[soundName]) {
                return
            }

            // Reproducir el sonido según su tipo
            audioCache[soundName].play()
        } catch (error) {
            // Capturar cualquier error sin interrumpir la experiencia
        }
    }

    // Función para activar/desactivar el sonido
    const toggleSound = () => {
        setIsSoundEnabled((prev) => !prev)
    }

    return (
        <SoundContext.Provider value={{ isSoundEnabled, toggleSound, playSound, usingSynthSounds }}>
            {children}
        </SoundContext.Provider>
    )
}

// Hook personalizado para usar el contexto de sonido
export function useSound() {
    const context = useContext(SoundContext)
    if (context === undefined) {
        throw new Error("useSound must be used within a SoundProvider")
    }
    return context
}