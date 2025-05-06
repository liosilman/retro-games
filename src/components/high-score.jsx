"use client"

import { useState, useEffect } from "react"
import "./high-score.css"

export function HighScore({ gameId }) {
    const [highScores, setHighScores] = useState([])
    const [showScores, setShowScores] = useState(false)

    useEffect(() => {
        // Cargar puntuaciones altas del localStorage
        const loadHighScores = () => {
            try {
                const allScores = JSON.parse(localStorage.getItem("highScores") || "{}")
                const gameScores = allScores[gameId] || []
                setHighScores(gameScores)
            } catch (error) {
                console.error("Error cargando puntuaciones:", error)
                setHighScores([])
            }
        }

        loadHighScores()
    }, [gameId])

    if (highScores.length === 0) {
        return null
    }

    return (
        <div className="high-score-container">
            <button className="high-score-toggle" onClick={() => setShowScores(!showScores)}>
                {showScores ? "Ocultar puntuaciones" : "Ver puntuaciones altas"}
            </button>

            {showScores && (
                <div className="high-score-panel">
                    <h3 className="high-score-title">Mejores puntuaciones</h3>
                    <table className="high-score-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Puntuación</th>
                                <th>Dificultad</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {highScores.map((score, index) => (
                                <tr key={index} className={index === 0 ? "top-score" : ""}>
                                    <td>{index + 1}</td>
                                    <td>{score.score}</td>
                                    <td>{score.difficulty || "normal"}</td>
                                    <td>{new Date(score.date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
