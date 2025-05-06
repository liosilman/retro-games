"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"
import { HighScore } from "../high-score"
import { useSound } from "../../contexts/sound-context"
import "../pause-button.css"

export default function PongGame() {
    const canvasRef = useRef(null)
    const [score, setScore] = useState({ player: 0, cpu: 0 })
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [difficulty, setDifficulty] = useState("normal")
    const [winner, setWinner] = useState(null)
    const { playSound } = useSound()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height

        // Ajustar parámetros según la dificultad
        let ballSpeed
        let cpuSpeed
        let cpuReactionDistance

        switch (difficulty) {
            case "easy":
                ballSpeed = 4
                cpuSpeed = 2.5
                cpuReactionDistance = 60 // CPU reacciona más tarde
                break
            case "hard":
                ballSpeed = 7
                cpuSpeed = 5.5
                cpuReactionDistance = 20 // CPU reacciona más rápido
                break
            default: // normal
                ballSpeed = 5
                cpuSpeed = 4
                cpuReactionDistance = 35
                break
        }

        // Game objects
        const paddleWidth = 10
        const paddleHeight = 60
        const ballSize = 8

        let playerY = height / 2 - paddleHeight / 2
        let cpuY = height / 2 - paddleHeight / 2
        let ballX = width / 2
        let ballY = height / 2
        let ballSpeedX = ballSpeed
        let ballSpeedY = ballSpeed / 2
        let playerScore = 0
        let cpuScore = 0
        let gameLoopId

        // For touch controls
        let touchY = 0

        const drawRect = (x, y, w, h, color) => {
            ctx.fillStyle = color
            ctx.fillRect(x, y, w, h)
        }

        const drawCircle = (x, y, r, color) => {
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(x, y, r, 0, Math.PI * 2, false)
            ctx.fill()
        }

        const drawNet = () => {
            for (let i = 0; i < height; i += 15) {
                drawRect(width / 2 - 1, i, 2, 10, "rgba(255,255,255,0.5)")
            }
        }

        const drawScore = () => {
            ctx.fillStyle = "white"
            ctx.font = "16px monospace"
            ctx.textAlign = "center"
            ctx.fillText(playerScore.toString(), width / 4, 30)
            ctx.fillText(cpuScore.toString(), (3 * width) / 4, 30)
        }

        const update = () => {
            // Move the ball
            ballX += ballSpeedX
            ballY += ballSpeedY

            // CPU AI - ajustado por dificultad
            const cpuCenter = cpuY + paddleHeight / 2
            if (cpuCenter < ballY - cpuReactionDistance) {
                cpuY += cpuSpeed
            } else if (cpuCenter > ballY + cpuReactionDistance) {
                cpuY -= cpuSpeed
            }

            // Ball collision with top and bottom
            if (ballY < 0 || ballY > height) {
                ballSpeedY = -ballSpeedY
            }

            // Determine which paddle to check
            const paddle =
                ballX < width / 2
                    ? { x: 20, y: playerY, width: paddleWidth, height: paddleHeight }
                    : { x: width - 20 - paddleWidth, y: cpuY, width: paddleWidth, height: paddleHeight }

            // Ball collision with paddles
            if (
                ballX - ballSize < paddle.x + paddle.width &&
                ballX + ballSize > paddle.x &&
                ballY - ballSize < paddle.y + paddle.height &&
                ballY + ballSize > paddle.y
            ) {
                // Reverse ball direction
                ballSpeedX = -ballSpeedX

                // Adjust ball angle based on where it hit the paddle
                const hitPos = (ballY - (paddle.y + paddle.height / 2)) / (paddle.height / 2)
                ballSpeedY = hitPos * 5
            }

            // Ball out of bounds
            if (ballX < 0) {
                cpuScore++
                setScore({ player: playerScore, cpu: cpuScore })
                resetBall()
                if (cpuScore >= 5) {
                    setGameOver(true)
                    setWinner("cpu")
                    saveHighScore(playerScore)
                    playSound("gameOver")
                }
            } else if (ballX > width) {
                playerScore++
                setScore({ player: playerScore, cpu: cpuScore })
                resetBall()
                if (playerScore >= 5) {
                    setGameOver(true)
                    setWinner("player")
                    saveHighScore(playerScore)
                    playSound("success")
                }
            }
        }

        const resetBall = () => {
            ballX = width / 2
            ballY = height / 2
            ballSpeedX = -ballSpeedX
            ballSpeedY = Math.random() * 4 - 2
        }

        const draw = () => {
            // Clear canvas
            drawRect(0, 0, width, height, "black")

            // Draw net
            drawNet()

            // Draw paddles
            drawRect(20, playerY, paddleWidth, paddleHeight, "white")
            drawRect(width - 20 - paddleWidth, cpuY, paddleWidth, paddleHeight, "white")

            // Draw ball
            drawCircle(ballX, ballY, ballSize, "white")

            // Draw score
            drawScore()
        }

        const gameLoop = () => {
            if (gameOver || isPaused) return

            update()
            draw()

            gameLoopId = requestAnimationFrame(gameLoop)
        }

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect()
            const mouseY = e.clientY - rect.top
            playerY = mouseY - paddleHeight / 2

            // Keep paddle within bounds
            if (playerY < 0) {
                playerY = 0
            } else if (playerY > height - paddleHeight) {
                playerY = height - paddleHeight
            }
        }

        const handleTouchMove = (e) => {
            e.preventDefault()
            const rect = canvas.getBoundingClientRect()
            touchY = e.touches[0].clientY - rect.top
            playerY = touchY - paddleHeight / 2

            // Keep paddle within bounds
            if (playerY < 0) {
                playerY = 0
            } else if (playerY > height - paddleHeight) {
                playerY = height - paddleHeight
            }
        }

        canvas.addEventListener("mousemove", handleMouseMove)
        canvas.addEventListener("touchmove", handleTouchMove, { passive: false })

        gameLoopId = requestAnimationFrame(gameLoop)

        return () => {
            canvas.removeEventListener("mousemove", handleMouseMove)
            canvas.removeEventListener("touchmove", handleTouchMove)
            cancelAnimationFrame(gameLoopId)
        }
    }, [gameOver, isPaused, difficulty, playSound])

    // Guardar puntuación alta
    const saveHighScore = (playerScore) => {
        if (playerScore > 0) {
            const highScores = JSON.parse(localStorage.getItem("highScores") || "{}")
            const gameHighScores = highScores.pong || []

            // Añadir nueva puntuación
            gameHighScores.push({
                score: playerScore,
                date: new Date().toISOString(),
                difficulty,
            })

            // Ordenar y limitar a 5 puntuaciones
            gameHighScores.sort((a, b) => b.score - a.score)
            highScores.pong = gameHighScores.slice(0, 5)

            // Guardar en localStorage
            localStorage.setItem("highScores", JSON.stringify(highScores))
        }
    }

    const resetGame = () => {
        setGameOver(false)
        setScore({ player: 0, cpu: 0 })
        setIsPaused(false)
        setWinner(null)
        playSound("start")
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
            <div className="mb-2 flex justify-between w-full px-2">
                <div className="text-xs bg-gray-800 px-2 py-1 rounded-md shadow-inner border border-gray-700">
                    Jugador: {score.player}
                </div>
                <button onClick={() => setIsPaused(!isPaused)} className="pause-button">
                    {isPaused ? "Reanudar" : "Pausa"}
                </button>
                <div className="text-xs bg-gray-800 px-2 py-1 rounded-md shadow-inner border border-gray-700">
                    CPU: {score.cpu}
                </div>
            </div>

            <DifficultySelector difficulty={difficulty} onChange={setDifficulty} gameId="pong" />

            <canvas ref={canvasRef} width={400} height={300} className="border border-gray-700 bg-black" />

            {/* Componente de puntuaciones altas */}
            <HighScore gameId="pong" />

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-2 text-yellow-500">Game Over</h3>
                    <p className="mb-4">{winner === "player" ? "¡Has ganado!" : "Has perdido"}</p>
                    <button
                        onClick={resetGame}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-white px-4 py-2 rounded-md shadow-lg border border-yellow-700 transition-all duration-200"
                    >
                        Jugar de nuevo
                    </button>
                </div>
            )}

            <div className="mt-2 text-xs text-center">
                <p>Mueve el ratón o desliza para controlar la paleta</p>
                <p>Primero en llegar a 5 puntos gana</p>
            </div>
        </div>
    )
}
