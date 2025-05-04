import { useState, useEffect } from 'react'
import { useSound } from '../contexts/sound-context'
import './difficulty-selector.css'

export function DifficultySelector({ difficulty, onChange, gameId }) {
    const [currentDifficulty, setCurrentDifficulty] = useState(difficulty || "normal")
    const { playSound } = useSound()

    // Cargar la dificultad guardada al iniciar
    useEffect(() => {
        const savedDifficulty = localStorage.getItem(`difficulty_${gameId}`)
        if (savedDifficulty) {
            setCurrentDifficulty(savedDifficulty)
            if (onChange) onChange(savedDifficulty)
        }
    }, [gameId, onChange])

    const handleChange = (newDifficulty) => {
        playSound("click")
        setCurrentDifficulty(newDifficulty)
        localStorage.setItem(`difficulty_${gameId}`, newDifficulty)
        if (onChange) onChange(newDifficulty)
    }

    return (
        <div className="difficulty-container">
            <span className="difficulty-label pixel-text">Dificultad:</span>
            <div className="difficulty-selector">
                <button
                    onClick={() => handleChange("easy")}
                    onMouseEnter={() => playSound("hover")}
                    className={`difficulty-button ${currentDifficulty === "easy" ? "selected-easy" : ""}`}
                >
                    Fácil
                </button>
                <button
                    onClick={() => handleChange("normal")}
                    onMouseEnter={() => playSound("hover")}
                    className={`difficulty-button ${currentDifficulty === "normal" ? "selected-normal" : ""}`}
                >
                    Normal
                </button>
                <button
                    onClick={() => handleChange("hard")}
                    onMouseEnter={() => playSound("hover")}
                    className={`difficulty-button ${currentDifficulty === "hard" ? "selected-hard" : ""}`}
                >
                    Difícil
                </button>
            </div>
        </div>
    )
}