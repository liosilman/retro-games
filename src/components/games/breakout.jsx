"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"
import { HighScore } from "../high-score"
import { useSound } from "../../contexts/sound-context"
import { ControlPad } from "../control-pad"
import "../pause-button.css"

export default function BreakoutGame() {
    const canvasRef = useRef(null)
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [lives, setLives] = useState(3)
    const [difficulty, setDifficulty] = useState("normal")
    const [isTouchDevice, setIsTouchDevice] = useState(false)
    const paddleXRef = useRef(0)
    const { playSound } = useSound()

    // Detectar si es un dispositivo táctil
    useEffect(() => {
        const checkTouchDevice = () => {
            setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768)
        }

        checkTouchDevice()
        window.addEventListener("resize", checkTouchDevice)

        return () => {
            window.removeEventListener("resize", checkTouchDevice)
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height

        // Ajustar parámetros según la dificultad
        let ballSpeed
        let paddleWidth
        let initialLives
        let scoreMultiplier

        switch (difficulty) {
            case "easy":
                ballSpeed = 3
                paddleWidth = 85
                initialLives = 5
                scoreMultiplier = 0.8
                break
            case "hard":
                ballSpeed = 6
                paddleWidth = 65
                initialLives = 2
                scoreMultiplier = 1.5
                break
            default: // normal
                ballSpeed = 4
                paddleWidth = 75
                initialLives = 3
                scoreMultiplier = 1
                break
        }

        // Game objects
        const ballRadius = 8
        const paddleHeight = 10

        const brickRowCount = 5
        const brickColumnCount = 8
        const brickWidth = 40
        const brickHeight = 20
        const brickPadding = 10
        const brickOffsetTop = 30
        const brickOffsetLeft = 30

        let x = width / 2
        let y = height - 30
        let dx = ballSpeed
        let dy = -ballSpeed
        let paddleX = (width - paddleWidth) / 2
        paddleXRef.current = paddleX
        let rightPressed = false
        let leftPressed = false
        let gameLoopId
        let currentScore = 0
        let currentLives = initialLives
        setLives(initialLives)

        // Create bricks
        const bricks = []
        const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF"]

        for (let c = 0; c < brickColumnCount; c++) {
            bricks[c] = []
            for (let r = 0; r < brickRowCount; r++) {
                bricks[c][r] = {
                    x: 0,
                    y: 0,
                    status: 1,
                    color: colors[r],
                }
            }
        }

        const drawBall = () => {
            ctx.beginPath()
            ctx.arc(x, y, ballRadius, 0, Math.PI * 2)
            ctx.fillStyle = "#FFFFFF"
            ctx.fill()
            ctx.closePath()
        }

        const drawPaddle = () => {
            ctx.beginPath()
            ctx.rect(paddleX, height - paddleHeight, paddleWidth, paddleHeight)
            ctx.fillStyle = "#0095DD"
            ctx.fill()
            ctx.closePath()
        }

        const drawBricks = () => {
            for (let c = 0; c < brickColumnCount; c++) {
                for (let r = 0; r < brickRowCount; r++) {
                    if (bricks[c][r].status === 1) {
                        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft
                        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop
                        bricks[c][r].x = brickX
                        bricks[c][r].y = brickY
                        ctx.beginPath()
                        ctx.rect(brickX, brickY, brickWidth, brickHeight)
                        ctx.fillStyle = bricks[c][r].color
                        ctx.fill()
                        ctx.closePath()
                    }
                }
            }
        }

        const drawScore = () => {
            ctx.font = "16px Arial"
            ctx.fillStyle = "#FFFFFF"
            ctx.fillText("Score: " + currentScore, 8, 20)
        }

        const drawLives = () => {
            ctx.font = "16px Arial"
            ctx.fillStyle = "#FFFFFF"
            ctx.fillText("Lives: " + currentLives, width - 65, 20)
        }

        const collisionDetection = () => {
            for (let c = 0; c < brickColumnCount; c++) {
                for (let r = 0; r < brickRowCount; r++) {
                    const b = bricks[c][r]
                    if (b.status === 1) {
                        if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                            dy = -dy
                            b.status = 0
                            currentScore += Math.floor(10 * scoreMultiplier)
                            setScore(currentScore)
                            playSound("click")

                            // Check if all bricks are gone
                            let allBroken = true
                            for (let c = 0; c < brickColumnCount; c++) {
                                for (let r = 0; r < brickRowCount; r++) {
                                    if (bricks[c][r].status === 1) {
                                        allBroken = false
                                        break
                                    }
                                }
                                if (!allBroken) break
                            }

                            if (allBroken) {
                                setGameOver(true)
                                playSound("success")
                                saveHighScore(currentScore, currentLives)
                            }
                        }
                    }
                }
            }
        }

        const draw = () => {
            if (gameOver || isPaused) return

            ctx.clearRect(0, 0, width, height)
            drawBricks()
            drawBall()
            drawPaddle()
            drawScore()
            drawLives()
            collisionDetection()

            // Ball collision with walls
            if (x + dx > width - ballRadius || x + dx < ballRadius) {
                dx = -dx
                playSound("click")
            }

            if (y + dy < ballRadius) {
                dy = -dy
                playSound("click")
            } else if (y + dy > height - ballRadius - paddleHeight) {
                if (x > paddleX && x < paddleX + paddleWidth) {
                    // Ball hits paddle
                    dy = -dy

                    // Adjust angle based on where ball hits paddle
                    const hitPos = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2)
                    dx = hitPos * 5
                    playSound("click")
                } else if (y + dy > height - ballRadius) {
                    // Ball hits bottom
                    currentLives--
                    setLives(currentLives)
                    playSound("back")

                    if (currentLives === 0) {
                        setGameOver(true)
                        playSound("gameOver")
                        saveHighScore(currentScore, 0)
                    } else {
                        // Reset ball and paddle
                        x = width / 2
                        y = height - 30
                        dx = ballSpeed * (Math.random() > 0.5 ? 1 : -1)
                        dy = -ballSpeed
                        paddleX = (width - paddleWidth) / 2
                        paddleXRef.current = paddleX
                    }
                }
            }

            // Move paddle
            if (rightPressed && paddleX < width - paddleWidth) {
                paddleX += 7
                paddleXRef.current = paddleX
            } else if (leftPressed && paddleX > 0) {
                paddleX -= 7
                paddleXRef.current = paddleX
            }

            // Move ball
            x += dx
            y += dy

            gameLoopId = requestAnimationFrame(draw)
        }

        const keyDownHandler = (e) => {
            if (e.key === "Right" || e.key === "ArrowRight") {
                rightPressed = true
            } else if (e.key === "Left" || e.key === "ArrowLeft") {
                leftPressed = true
            }
        }

        const keyUpHandler = (e) => {
            if (e.key === "Right" || e.key === "ArrowRight") {
                rightPressed = false
            } else if (e.key === "Left" || e.key === "ArrowLeft") {
                leftPressed = false
            }
        }

        const mouseMoveHandler = (e) => {
            const relativeX = e.clientX - canvas.getBoundingClientRect().left
            if (relativeX > 0 && relativeX < width) {
                paddleX = relativeX - paddleWidth / 2
                paddleXRef.current = paddleX

                // Keep paddle within bounds
                if (paddleX < 0) {
                    paddleX = 0
                    paddleXRef.current = 0
                } else if (paddleX > width - paddleWidth) {
                    paddleX = width - paddleWidth
                    paddleXRef.current = width - paddleWidth
                }
            }
        }

        const touchMoveHandler = (e) => {
            e.preventDefault()
            const relativeX = e.touches[0].clientX - canvas.getBoundingClientRect().left
            if (relativeX > 0 && relativeX < width) {
                paddleX = relativeX - paddleWidth / 2
                paddleXRef.current = paddleX

                // Keep paddle within bounds
                if (paddleX < 0) {
                    paddleX = 0
                    paddleXRef.current = 0
                } else if (paddleX > width - paddleWidth) {
                    paddleX = width - paddleWidth
                    paddleXRef.current = width - paddleWidth
                }
            }
        }

        document.addEventListener("keydown", keyDownHandler)
        document.addEventListener("keyup", keyUpHandler)
        canvas.addEventListener("mousemove", mouseMoveHandler)
        canvas.addEventListener("touchmove", touchMoveHandler, { passive: false })

        gameLoopId = requestAnimationFrame(draw)

        return () => {
            document.removeEventListener("keydown", keyDownHandler)
            document.removeEventListener("keyup", keyUpHandler)
            canvas.removeEventListener("mousemove", mouseMoveHandler)
            canvas.removeEventListener("touchmove", touchMoveHandler)
            cancelAnimationFrame(gameLoopId)
        }
    }, [gameOver, isPaused, difficulty, playSound])

    // Guardar puntuación alta
    const saveHighScore = (finalScore, remainingLives) => {
        const highScores = JSON.parse(localStorage.getItem("highScores") || "{}")
        const gameHighScores = highScores.breakout || []

        // Añadir nueva puntuación
        gameHighScores.push({
            score: finalScore,
            lives: remainingLives,
            date: new Date().toISOString(),
            difficulty,
        })

        // Ordenar y limitar a 5 puntuaciones
        gameHighScores.sort((a, b) => b.score - a.score)
        highScores.breakout = gameHighScores.slice(0, 5)

        // Guardar en localStorage
        localStorage.setItem("highScores", JSON.stringify(highScores))
    }

    const resetGame = () => {
        setGameOver(false)
        setScore(0)
        setIsPaused(false)
        playSound("start")
    }

    // Manejar controles desde el pad
    const handleDirectionChange = (direction) => {
        if (gameOver || isPaused) return

        const canvas = canvasRef.current
        if (!canvas) return

        const width = canvas.width
        const paddleWidth = difficulty === "easy" ? 85 : difficulty === "hard" ? 65 : 75
        let newX = paddleXRef.current

        if (direction === "left") {
            newX -= 15
        } else if (direction === "right") {
            newX += 15
        }

        // Keep paddle within bounds
        if (newX < 0) {
            newX = 0
        } else if (newX > width - paddleWidth) {
            newX = width - paddleWidth
        }

        paddleXRef.current = newX
    }

    const handleButtonPress = (button) => {
        if (gameOver) {
            if (button === "a") {
                resetGame()
            }
            return
        }

        if (button === "b") {
            setIsPaused(!isPaused)
        }
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
            <div className="mb-2 flex justify-between w-full px-2">
                <div className="text-xs bg-gray-800 px-2 py-1 rounded-md shadow-inner border border-gray-700">
                    Score: {score}
                </div>
                <button onClick={() => setIsPaused(!isPaused)} className="pause-button">
                    {isPaused ? "Reanudar" : "Pausa"}
                </button>
                <div className="text-xs bg-gray-800 px-2 py-1 rounded-md shadow-inner border border-gray-700">
                    Lives: {lives}
                </div>
            </div>

            <DifficultySelector difficulty={difficulty} onChange={setDifficulty} gameId="breakout" />

            <canvas ref={canvasRef} width={400} height={320} className="border border-gray-700 bg-black" />

            {/* Control Pad para dispositivos móviles */}
            {isTouchDevice && <ControlPad onDirectionChange={handleDirectionChange} onButtonPress={handleButtonPress} />}

            {/* Componente de puntuaciones altas */}
            <HighScore gameId="breakout" />

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-lg border-2 border-orange-500 shadow-lg max-w-xs w-full">
                        <h3 className="text-xl font-bold mb-2 text-center">Game Over</h3>
                        <p className="mb-4 text-center">
                            {lives > 0 ? "¡Has ganado!" : "Has perdido"}
                            <br />
                            Score: {score}
                        </p>
                        <button
                            onClick={resetGame}
                            className="bg-gradient-to-r from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 
                       text-white px-4 py-2 rounded-md shadow-lg border border-orange-700 
                       transition-all duration-200 w-full"
                        >
                            Jugar de nuevo
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-2 text-xs text-center">
                <p>Mueve el ratón o desliza para controlar la paleta</p>
                <p>Destruye todos los bloques para ganar</p>
                {isTouchDevice && <p className="text-gray-400 text-[10px] mt-1">Usa el pad para mover izquierda y derecha</p>}
            </div>
        </div>
    )
}
