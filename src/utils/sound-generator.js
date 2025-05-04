/**
 * Genera un sonido de tono simple
 * @param {number} frequency - Frecuencia del tono en Hz
 * @param {number} duration - Duración en segundos
 * @param {number} volume - Volumen entre 0 y 1
 * @param {string} type - Tipo de onda: 'sine', 'square', 'sawtooth', 'triangle'
 * @returns {Promise} - Promesa que se resuelve cuando el sonido termina
 */
export function generateTone(frequency = 440, duration = 0.3, volume = 0.5, type = "sine") {
    return new Promise((resolve) => {
        try {
            // Crear contexto de audio
            const AudioContext = window.AudioContext || window.webkitAudioContext
            if (!AudioContext) {
                console.warn("AudioContext no soportado")
                resolve()
                return
            }

            const audioCtx = new AudioContext()

            // Crear oscilador
            const oscillator = audioCtx.createOscillator()
            oscillator.type = type
            oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime)

            // Crear nodo de ganancia para controlar el volumen
            const gainNode = audioCtx.createGain()
            gainNode.gain.setValueAtTime(volume, audioCtx.currentTime)

            // Conectar nodos
            oscillator.connect(gainNode)
            gainNode.connect(audioCtx.destination)

            // Iniciar oscilador
            oscillator.start()

            // Programar fade out y detener
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
            oscillator.stop(audioCtx.currentTime + duration)

            // Resolver promesa cuando termine
            oscillator.onended = () => {
                audioCtx.close().then(() => resolve())
            }
        } catch (error) {
            console.warn("Error generando tono:", error)
            resolve()
        }
    })
}

/**
 * Genera un sonido de "hover" (tono agudo corto)
 */
export function generateHoverSound() {
    return generateTone(880, 0.1, 0.2, "sine")
}

/**
 * Genera un sonido de "click" (tono medio corto)
 */
export function generateClickSound() {
    return generateTone(660, 0.1, 0.3, "square")
}

/**
 * Genera un sonido de "selección" (tono ascendente)
 */
export function generateSelectSound() {
    return new Promise(async (resolve) => {
        try {
            await generateTone(440, 0.1, 0.3, "square")
            await generateTone(660, 0.1, 0.3, "square")
            resolve()
        } catch (error) {
            resolve()
        }
    })
}

/**
 * Genera un sonido de "inicio" (fanfarria corta)
 */
export function generateStartSound() {
    return new Promise(async (resolve) => {
        try {
            await generateTone(523, 0.1, 0.3, "square") // C5
            await generateTone(659, 0.1, 0.3, "square") // E5
            await generateTone(784, 0.2, 0.3, "square") // G5
            resolve()
        } catch (error) {
            resolve()
        }
    })
}

/**
 * Genera un sonido de "retroceso" (tono descendente)
 */
export function generateBackSound() {
    return new Promise(async (resolve) => {
        try {
            await generateTone(660, 0.1, 0.3, "square")
            await generateTone(440, 0.1, 0.3, "square")
            resolve()
        } catch (error) {
            resolve()
        }
    })
}

/**
 * Genera un sonido de "éxito" (melodía ascendente)
 */
export function generateSuccessSound() {
    return new Promise(async (resolve) => {
        try {
            await generateTone(523, 0.1, 0.3, "square") // C5
            await generateTone(659, 0.1, 0.3, "square") // E5
            await generateTone(784, 0.1, 0.3, "square") // G5
            await generateTone(1047, 0.2, 0.3, "square") // C6
            resolve()
        } catch (error) {
            resolve()
        }
    })
}

/**
 * Genera un sonido de "game over" (melodía descendente)
 */
export function generateGameOverSound() {
    return new Promise(async (resolve) => {
        try {
            await generateTone(493, 0.1, 0.3, "square") // B4
            await generateTone(392, 0.1, 0.3, "square") // G4
            await generateTone(329, 0.1, 0.3, "square") // E4
            await generateTone(261, 0.3, 0.3, "square") // C4
            resolve()
        } catch (error) {
            resolve()
        }
    })
}

// Mapeo de nombres de sonidos a funciones generadoras
export const SOUND_GENERATORS = {
    hover: generateHoverSound,
    click: generateClickSound,
    select: generateSelectSound,
    start: generateStartSound,
    back: generateBackSound,
    success: generateSuccessSound,
    gameOver: generateGameOverSound,
}