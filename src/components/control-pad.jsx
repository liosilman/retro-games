"use client"

import { useState, useEffect } from "react"
import "./control-pad.css"
import { useSound } from "../contexts/sound-context"

export function ControlPad({ onDirectionChange, onButtonPress }) {
    const { playSound } = useSound()
    const [activeDirection, setActiveDirection] = useState(null)
    const [activeButton, setActiveButton] = useState(null)

    // Función para manejar pulsación de dirección
    const handleDirectionPress = (direction) => {
        setActiveDirection(direction)
        playSound("click")
        if (onDirectionChange) {
            onDirectionChange(direction)
        }
    }

    // Función para manejar liberación de dirección
    const handleDirectionRelease = () => {
        setActiveDirection(null)
        if (onDirectionChange) {
            onDirectionChange(null)
        }
    }

    // Función para manejar pulsación de botón de acción
    const handleButtonPress = (button) => {
        setActiveButton(button)
        playSound("select")
        if (onButtonPress) {
            onButtonPress(button)
        }
    }

    // Función para manejar liberación de botón de acción
    const handleButtonRelease = () => {
        setActiveButton(null)
    }

    // Limpiar estados al desmontar
    useEffect(() => {
        return () => {
            setActiveDirection(null)
            setActiveButton(null)
        }
    }, [])

    return (
        <div className="control-pad-container">
            {/* D-Pad para direcciones */}
            <div className="d-pad">
                <button
                    className={`d-pad-button d-pad-up ${activeDirection === "up" ? "active" : ""}`}
                    onTouchStart={() => handleDirectionPress("up")}
                    onTouchEnd={handleDirectionRelease}
                    onMouseDown={() => handleDirectionPress("up")}
                    onMouseUp={handleDirectionRelease}
                    onMouseLeave={handleDirectionRelease}
                    aria-label="Arriba"
                >
                    ▲
                </button>
                <button
                    className={`d-pad-button d-pad-right ${activeDirection === "right" ? "active" : ""}`}
                    onTouchStart={() => handleDirectionPress("right")}
                    onTouchEnd={handleDirectionRelease}
                    onMouseDown={() => handleDirectionPress("right")}
                    onMouseUp={handleDirectionRelease}
                    onMouseLeave={handleDirectionRelease}
                    aria-label="Derecha"
                >
                    ▶
                </button>
                <button
                    className={`d-pad-button d-pad-down ${activeDirection === "down" ? "active" : ""}`}
                    onTouchStart={() => handleDirectionPress("down")}
                    onTouchEnd={handleDirectionRelease}
                    onMouseDown={() => handleDirectionPress("down")}
                    onMouseUp={handleDirectionRelease}
                    onMouseLeave={handleDirectionRelease}
                    aria-label="Abajo"
                >
                    ▼
                </button>
                <button
                    className={`d-pad-button d-pad-left ${activeDirection === "left" ? "active" : ""}`}
                    onTouchStart={() => handleDirectionPress("left")}
                    onTouchEnd={handleDirectionRelease}
                    onMouseDown={() => handleDirectionPress("left")}
                    onMouseUp={handleDirectionRelease}
                    onMouseLeave={handleDirectionRelease}
                    aria-label="Izquierda"
                >
                    ◀
                </button>
            </div>

            {/* Botones de acción */}
            <div className="action-buttons">
                <button
                    className={`action-button action-a ${activeButton === "a" ? "active" : ""}`}
                    onTouchStart={() => handleButtonPress("a")}
                    onTouchEnd={handleButtonRelease}
                    onMouseDown={() => handleButtonPress("a")}
                    onMouseUp={handleButtonRelease}
                    onMouseLeave={handleButtonRelease}
                    aria-label="Botón A"
                >
                    A
                </button>
                <button
                    className={`action-button action-b ${activeButton === "b" ? "active" : ""}`}
                    onTouchStart={() => handleButtonPress("b")}
                    onTouchEnd={handleButtonRelease}
                    onMouseDown={() => handleButtonPress("b")}
                    onMouseUp={handleButtonRelease}
                    onMouseLeave={handleButtonRelease}
                    aria-label="Botón B"
                >
                    B
                </button>
            </div>
        </div>
    )
}
