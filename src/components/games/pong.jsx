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
    const paddleYRef = useRef(0)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height

        let ballSpeed
        let cpuSpeed
        let cpuReactionDistance

        switch (difficulty) {
            case "easy":
                ballSpeed = 4
                cpuSpeed = 2.5
                cpuReactionDistance = 60
                break
            case "hard":
                ballSpeed = 7
                cpuSpeed = 5.5
                cpuReactionDistance = 20
                break
            default:
                ballSpeed = 5
                cpuSpeed = 4
                cpuReactionDistance = 35
                break
        }

        const paddleWidth = 10
        const paddleHeight = 60
        const ballSize = 8

        let playerY = height / 2 - paddleHeight / 2
        paddleYRef.current = playerY
        let cpuY = height / 2 - paddleHeight / 2
        let ballX = width / 2
        let ballY = height / 2
        let ballSpeedX = ballSpeed
        let ballSpeedY = ballSpeed / 2
        let playerScore = 0
        let cpuScore = 0
        let gameLoopId

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
            ballX += ballSpeedX
            ballY += ballSpeedY

            const cpuCenter = cpuY + paddleHeight / 2
            if (cpuCenter < ballY - cpuReactionDistance) {
                cpuY += cpuSpeed
            } else if (cpuCenter > ballY + cpuReactionDistance) {
                cpuY -= cpuSpeed
            }

            if (ballY < 0 || ballY > height) {
                ballSpeedY = -ballSpeedY
                playSound("click")
            }

            const paddle =
                ballX < width / 2
                    ? { x: 20, y: playerY, width: paddleWidth, height: paddleHeight }
                    : { x: width - 20 - paddleWidth, y: cpuY, width: paddleWidth, height: paddleHeight }

            if (
                ballX - ballSize < paddle.x + paddle.width &&
                ballX + ballSize > paddle.x &&
                ballY - ballSize < paddle.y + paddle.height &&
                ballY + ballSize > paddle.y
            ) {
                ballSpeedX = -ballSpeedX
                const hitPos = (ballY - (paddle.y + paddle.height / 2)) / (paddle.height / 2)
                ballSpeedY = hitPos * 5
                playSound("click")
            }

            if (ballX < 0) {
                cpuScore++
                setScore({ player: playerScore, cpu: cpuScore })
                resetBall()
                playSound("back")
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
                playSound("success")
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
            drawRect(0, 0, width, height, "black")
            drawNet()
            drawRect(20, playerY, paddleWidth, paddleHeight, "white")
            drawRect(width - 20 - paddleWidth, cpuY, paddleWidth, paddleHeight, "white")
            drawCircle(ballX, ballY, ballSize, "white")
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
            paddleYRef.current = playerY

            if (playerY < 0) {
                playerY = 0
            } else if (playerY > height - paddleHeight) {
                playerY = height - paddleHeight
            }
        }

        const handleTouchMove = (e) => {
            e.preventDefault()
            const rect = canvas.getBoundingClientRect()
            const touchY = e.touches[0].clientY - rect.top
            playerY = touchY - paddleHeight / 2
            paddleYRef.current = playerY

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

    const saveHighScore = (playerScore) => {
        if (playerScore > 0) {
            const highScores = JSON.parse(localStorage.getItem("highScores") || "{}")
            const gameHighScores = highScores.pong || []
            gameHighScores.push({
                score: playerScore,
                date: new Date().toISOString(),
                difficulty,
            })
            gameHighScores.sort((a, b) => b.score - a.score)
            highScores.pong = gameHighScores.slice(0, 5)
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

            <HighScore gameId="pong" />

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-lg border-2 border-blue-500 shadow-lg max-w-xs w-full">
                        <h3 className="text-xl font-bold mb-2 text-center">Game Over</h3>
                        <p className="mb-4 text-center">{winner === "player" ? "¡Has ganado!" : "Has perdido"}</p>
                        <button
                            onClick={resetGame}
                            className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 
                            text-white px-4 py-2 rounded-md shadow-lg border border-blue-700 
                            transition-all duration-200 w-full"
                        >
                            Jugar de nuevo
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-2 text-xs text-center">
                <p>Mueve el ratón o desliza para controlar la paleta</p>
                <p>Primero en llegar a 5 puntos gana</p>
            </div>
        </div>
    )
}
