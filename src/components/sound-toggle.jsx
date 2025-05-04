import { Volume2, VolumeX } from 'lucide-react'
import { useSound } from '../contexts/sound-context'
import './sound-toggle.css'

export function SoundToggle() {
    const { isSoundEnabled, toggleSound, playSound, usingSynthSounds } = useSound()

    const handleToggle = () => {
        // Reproducir sonido antes de cambiar el estado si está activado
        if (isSoundEnabled) {
            playSound("click")
        }

        // Pequeño retraso para asegurar que el sonido se reproduce
        setTimeout(() => {
            toggleSound()
        }, 50)
    }

    return (
        <button
            onClick={handleToggle}
            className={`sound-toggle-button ${usingSynthSounds ? "synth-sounds" : ""}`}
            aria-label={isSoundEnabled ? "Desactivar sonido" : "Activar sonido"}
            title={
                usingSynthSounds
                    ? "Usando sonidos generados (algunos archivos no pudieron cargarse)"
                    : isSoundEnabled
                        ? "Desactivar sonido"
                        : "Activar sonido"
            }
        >
            {isSoundEnabled ? <Volume2 className="sound-icon sound-on" /> : <VolumeX className="sound-icon sound-off" />}
        </button>
    )
}