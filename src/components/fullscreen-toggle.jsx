"use client"

import { useState, useEffect } from "react"
import { Maximize, Minimize } from "lucide-react"
import { useSound } from "../contexts/sound-context"
import "./fullscreen-toggle.css"

export function FullscreenToggle() {
    const [isFullscreen, setIsFullscreen] = useState(false)
    const { playSound } = useSound()

    // Actualizar estado cuando cambia el modo de pantalla completa
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange)
        }
    }, [])

    const toggleFullscreen = () => {
        playSound("click")

        if (!document.fullscreenElement) {
            // Entrar en pantalla completa
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error al intentar mostrar pantalla completa: ${err.message}`)
            })
        } else {
            // Salir de pantalla completa
            if (document.exitFullscreen) {
                document.exitFullscreen()
            }
        }
    }

    return (
        <button
            onClick={toggleFullscreen}
            className="fullscreen-toggle-button"
            aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            onMouseEnter={() => playSound("hover")}
        >
            {isFullscreen ? <Minimize className="fullscreen-icon" /> : <Maximize className="fullscreen-icon" />}
        </button>
    )
}
