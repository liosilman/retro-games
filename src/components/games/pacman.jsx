"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"
import { ControlPad } from "../control-pad"
import { useSound } from "../../contexts/sound-context"

export default function PacmanGame() {
    const canvasRef = useRef(null)
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [difficulty, setDifficulty] = useState("normal")
    const [currentDirection, setCurrentDirection] = useState(null)
    const { playSound } = useSound()
    const isMobileRef = useRef(false)

    // Referencia para almacenar la dirección solicitada por el pad
    const requestedDirectionRef = useRef(null)

    // Detectar si es dispositivo móvil
    useEffect(() => {
        isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const CELL_SIZE = 20
        const ROWS = 15
        const COLS = 15

        canvas.width = COLS * CELL_SIZE
        canvas.height = ROWS * CELL_SIZE

        // Ajustar parámetros según la dificultad
        let pacmanSpeed
        let ghostSpeed
        let powerModeDuration
        let scoreMultiplier

        switch (difficulty) {
            case "easy":
                pacmanSpeed = 0.15
                ghostSpeed = 0.07
                powerModeDuration = 500 // ~8 segundos
                scoreMultiplier = 0.8
                break
            case "hard":
                pacmanSpeed = 0.08
                ghostSpeed = 0.12
                powerModeDuration = 200 // ~3 segundos
                scoreMultiplier = 1.5
                break
            default: // normal
                pacmanSpeed = 0.1
                ghostSpeed = 0.08
                powerModeDuration = 300 // ~5 segundos
                scoreMultiplier = 1
                break
        }

        // 0 = empty, 1 = wall, 2 = dot, 3 = power pellet
        const maze = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1],
            [1, 3, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 1, 3, 1],
            [1, 2, 2, 2, 2, 1, 2, 1, 2, 1, 2, 2, 2, 2, 1],
            [1, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1],
            [1, 2, 2, 2, 2, 1, 2, 1, 2, 1, 2, 2, 2, 2, 1],
            [1, 2, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1],
            [1, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 1],
            [1, 2, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1],
            [1, 2, 2, 2, 2, 1, 2, 1, 2, 1, 2, 2, 2, 2, 1],
            [1, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1],
            [1, 2, 2, 2, 2, 1, 2, 1, 2, 1, 2, 2, 2, 2, 1],
            [1, 3, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 1, 3, 1],
            [1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ]

        // Player
        const pacman = {
            x: 7,
            y: 7,
            direction: "right",
            nextDirection: "right",
            speed: pacmanSpeed,
            position: 0,
            mouthOpen: 0.2,
            mouthDir: 0.02,
        }

        // Ghosts
        const ghosts = [
            { x: 1, y: 1, color: "#FF0000", direction: "right", speed: ghostSpeed * 1.0 }, // Red
            { x: 13, y: 1, color: "#00FFFF", direction: "left", speed: ghostSpeed * 0.9 }, // Cyan
            { x: 1, y: 13, color: "#FFB8FF", direction: "up", speed: ghostSpeed * 0.8 }, // Pink
            { x: 13, y: 13, color: "#FFB852", direction: "down", speed: ghostSpeed * 0.7 }, // Orange
        ]

        let powerMode = false
        let powerModeTime = 0
        let gameLoopId
        let currentScore = 0
        let dotsRemaining = 0

        // Count dots
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (maze[y][x] === 2 || maze[y][x] === 3) {
                    dotsRemaining++
                }
            }
        }

        const drawMaze = () => {
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const cell = maze[y][x]

                    if (cell === 1) {
                        // Wall
                        ctx.fillStyle = "#0000FF"
                        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
                    } else if (cell === 2) {
                        // Dot
                        ctx.fillStyle = "#FFFFFF"
                        ctx.beginPath()
                        ctx.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 10, 0, Math.PI * 2)
                        ctx.fill()
                    } else if (cell === 3) {
                        // Power pellet
                        ctx.fillStyle = "#FFFFFF"
                        ctx.beginPath()
                        ctx.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 4, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }
            }
        }

        const drawPacman = () => {
            const x = (pacman.x + pacman.position * getDirectionX(pacman.direction)) * CELL_SIZE + CELL_SIZE / 2
            const y = (pacman.y + pacman.position * getDirectionY(pacman.direction)) * CELL_SIZE + CELL_SIZE / 2

            ctx.fillStyle = "#FFFF00"
            ctx.beginPath()

            // Determine mouth angle based on direction
            let startAngle = 0
            let endAngle = Math.PI * 2

            if (pacman.direction === "right") {
                startAngle = pacman.mouthOpen
                endAngle = Math.PI * 2 - pacman.mouthOpen
            } else if (pacman.direction === "left") {
                startAngle = Math.PI + pacman.mouthOpen
                endAngle = Math.PI - pacman.mouthOpen
            } else if (pacman.direction === "up") {
                startAngle = Math.PI * 1.5 + pacman.mouthOpen
                endAngle = Math.PI * 1.5 - pacman.mouthOpen
            } else if (pacman.direction === "down") {
                startAngle = Math.PI * 0.5 + pacman.mouthOpen
                endAngle = Math.PI * 0.5 - pacman.mouthOpen
            }

            ctx.arc(x, y, CELL_SIZE / 2, startAngle, endAngle)
            ctx.lineTo(x, y)
            ctx.fill()

            // Animate mouth
            pacman.mouthOpen += pacman.mouthDir
            if (pacman.mouthOpen > 0.5 || pacman.mouthOpen < 0.05) {
                pacman.mouthDir = -pacman.mouthDir
            }
        }

        const drawGhosts = () => {
            ghosts.forEach((ghost) => {
                const x = (ghost.x + ghost.position * getDirectionX(ghost.direction)) * CELL_SIZE + CELL_SIZE / 2
                const y = (ghost.y + ghost.position * getDirectionY(ghost.direction)) * CELL_SIZE + CELL_SIZE / 2

                // Ghost body
                ctx.fillStyle = powerMode ? "#0000FF" : ghost.color
                ctx.beginPath()
                ctx.arc(x, y - 2, CELL_SIZE / 2, Math.PI, 0, false)
                ctx.lineTo(x + CELL_SIZE / 2, y + CELL_SIZE / 2 - 2)

                // Wavy bottom
                const waveSize = CELL_SIZE / 10
                for (let i = 0; i < 3; i++) {
                    ctx.lineTo(x + CELL_SIZE / 2 - (i + 1) * waveSize * 2, y + CELL_SIZE / 2 - waveSize - 2)
                    ctx.lineTo(x + CELL_SIZE / 2 - (i + 1) * waveSize * 2 - waveSize, y + CELL_SIZE / 2 - 2)
                }

                ctx.lineTo(x - CELL_SIZE / 2, y + CELL_SIZE / 2 - 2)
                ctx.lineTo(x - CELL_SIZE / 2, y - 2)
                ctx.fill()

                // Eyes
                ctx.fillStyle = "#FFFFFF"
                ctx.beginPath()
                ctx.arc(x - CELL_SIZE / 5, y - CELL_SIZE / 5, CELL_SIZE / 6, 0, Math.PI * 2)
                ctx.fill()
                ctx.beginPath()
                ctx.arc(x + CELL_SIZE / 5, y - CELL_SIZE / 5, CELL_SIZE / 6, 0, Math.PI * 2)
                ctx.fill()

                // Pupils
                ctx.fillStyle = "#000000"
                const pupilOffsetX = getDirectionX(ghost.direction) * 2
                const pupilOffsetY = getDirectionY(ghost.direction) * 2
                ctx.beginPath()
                ctx.arc(x - CELL_SIZE / 5 + pupilOffsetX, y - CELL_SIZE / 5 + pupilOffsetY, CELL_SIZE / 12, 0, Math.PI * 2)
                ctx.fill()
                ctx.beginPath()
                ctx.arc(x + CELL_SIZE / 5 + pupilOffsetX, y - CELL_SIZE / 5 + pupilOffsetY, CELL_SIZE / 12, 0, Math.PI * 2)
                ctx.fill()
            })
        }

        const getDirectionX = (direction) => {
            if (direction === "right") return 1
            if (direction === "left") return -1
            return 0
        }

        const getDirectionY = (direction) => {
            if (direction === "down") return 1
            if (direction === "up") return -1
            return 0
        }

        const canMove = (x, y, direction) => {
            const newX = Math.floor(x + getDirectionX(direction))
            const newY = Math.floor(y + getDirectionY(direction))

            if (newX < 0 || newX >= COLS || newY < 0 || newY >= ROWS) {
                return false
            }

            return maze[newY][newX] !== 1
        }

        const getRandomDirection = (x, y, currentDirection) => {
            const possibleDirections = []

            if (currentDirection !== "left" && canMove(x, y, "right")) {
                possibleDirections.push("right")
            }
            if (currentDirection !== "right" && canMove(x, y, "left")) {
                possibleDirections.push("left")
            }
            if (currentDirection !== "up" && canMove(x, y, "down")) {
                possibleDirections.push("down")
            }
            if (currentDirection !== "down" && canMove(x, y, "up")) {
                possibleDirections.push("up")
            }

            if (possibleDirections.length === 0) {
                // If no other direction is possible, try to reverse
                const opposite = {
                    left: "right",
                    right: "left",
                    up: "down",
                    down: "up",
                }
                if (canMove(x, y, opposite[currentDirection])) {
                    return opposite[currentDirection]
                }
                return currentDirection
            }

            return possibleDirections[Math.floor(Math.random() * possibleDirections.length)]
        }

        const movePacman = () => {
            // Verificar si hay una dirección solicitada desde el pad
            if (requestedDirectionRef.current && requestedDirectionRef.current !== pacman.direction) {
                if (canMove(pacman.x, pacman.y, requestedDirectionRef.current)) {
                    pacman.nextDirection = requestedDirectionRef.current
                }
            }

            // Try to change direction if requested
            if (pacman.nextDirection !== pacman.direction && canMove(pacman.x, pacman.y, pacman.nextDirection)) {
                pacman.direction = pacman.nextDirection
                pacman.position = 0
            }

            // Move in current direction
            pacman.position += pacman.speed

            // If reached next cell
            if (pacman.position >= 1) {
                pacman.x += getDirectionX(pacman.direction)
                pacman.y += getDirectionY(pacman.direction)
                pacman.position = 0

                // Check for dot
                if (maze[pacman.y][pacman.x] === 2) {
                    maze[pacman.y][pacman.x] = 0
                    currentScore += Math.floor(10 * scoreMultiplier)
                    setScore(currentScore)
                    dotsRemaining--
                    playSound("click")
                } else if (maze[pacman.y][pacman.x] === 3) {
                    maze[pacman.y][pacman.x] = 0
                    currentScore += Math.floor(50 * scoreMultiplier)
                    setScore(currentScore)
                    dotsRemaining--
                    powerMode = true
                    powerModeTime = 0
                    playSound("success")
                }

                // Check if all dots are collected
                if (dotsRemaining === 0) {
                    setGameOver(true)
                    playSound("success")
                }
            }

            // If can't move in current direction, stop
            if (!canMove(pacman.x, pacman.y, pacman.direction)) {
                pacman.position = 0
            }
        }

        const moveGhosts = () => {
            ghosts.forEach((ghost) => {
                ghost.position += ghost.speed * (powerMode ? 0.5 : 1)

                if (ghost.position >= 1) {
                    ghost.x += getDirectionX(ghost.direction)
                    ghost.y += getDirectionY(ghost.direction)
                    ghost.position = 0

                    // Choose new direction at intersection
                    ghost.direction = getRandomDirection(ghost.x, ghost.y, ghost.direction)
                }

                // If can't move in current direction, choose new direction
                if (!canMove(ghost.x, ghost.y, ghost.direction)) {
                    ghost.direction = getRandomDirection(ghost.x, ghost.y, ghost.direction)
                    ghost.position = 0
                }

                // Check collision with pacman
                const distance = Math.sqrt(
                    Math.pow(
                        ghost.x +
                        ghost.position * getDirectionX(ghost.direction) -
                        (pacman.x + pacman.position * getDirectionX(pacman.direction)),
                        2,
                    ) +
                    Math.pow(
                        ghost.y +
                        ghost.position * getDirectionY(ghost.direction) -
                        (pacman.y + pacman.position * getDirectionY(pacman.direction)),
                        2,
                    ),
                )

                if (distance < 0.8) {
                    if (powerMode) {
                        // Reset ghost
                        ghost.x = Math.floor(Math.random() * (COLS - 2)) + 1
                        ghost.y = Math.floor(Math.random() * (ROWS - 2)) + 1
                        ghost.position = 0
                        currentScore += Math.floor(200 * scoreMultiplier)
                        setScore(currentScore)
                        playSound("success")
                    } else {
                        setGameOver(true)
                        playSound("gameOver")
                    }
                }
            })
        }

        const gameLoop = () => {
            if (gameOver || isPaused) return

            ctx.fillStyle = "#000000"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            drawMaze()
            movePacman()
            moveGhosts()
            drawPacman()
            drawGhosts()

            // Power mode timer - ajustado por dificultad
            if (powerMode) {
                powerModeTime += 1
                if (powerModeTime > powerModeDuration) {
                    powerMode = false
                }
            }

            gameLoopId = requestAnimationFrame(gameLoop)
        }

        const handleKeyDown = (e) => {
            switch (e.key) {
                case "ArrowUp":
                    pacman.nextDirection = "up"
                    break
                case "ArrowDown":
                    pacman.nextDirection = "down"
                    break
                case "ArrowLeft":
                    pacman.nextDirection = "left"
                    break
                case "ArrowRight":
                    pacman.nextDirection = "right"
                    break
                case "p":
                    setIsPaused(!isPaused)
                    break
            }
        }

        // Touch controls
        let touchStartX = 0
        let touchStartY = 0

        const handleTouchStart = (e) => {
            touchStartX = e.touches[0].clientX
            touchStartY = e.touches[0].clientY
        }

        const handleTouchEnd = (e) => {
            const touchEndX = e.changedTouches[0].clientX
            const touchEndY = e.changedTouches[0].clientY

            const diffX = touchEndX - touchStartX
            const diffY = touchEndY - touchStartY

            // Determine swipe direction
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0) {
                    pacman.nextDirection = "right"
                } else {
                    pacman.nextDirection = "left"
                }
            } else {
                if (diffY > 0) {
                    pacman.nextDirection = "down"
                } else {
                    pacman.nextDirection = "up"
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        canvas.addEventListener("touchstart", handleTouchStart)
        canvas.addEventListener("touchend", handleTouchEnd)

        gameLoopId = requestAnimationFrame(gameLoop)

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            canvas.removeEventListener("touchstart", handleTouchStart)
            canvas.removeEventListener("touchend", handleTouchEnd)
            cancelAnimationFrame(gameLoopId)
        }
    }, [gameOver, isPaused, difficulty, playSound])

    // Manejar cambios de dirección desde el pad de control
    const handleDirectionChange = (direction) => {
        if (!direction) {
            requestedDirectionRef.current = null
            return
        }

        setCurrentDirection(direction)
        requestedDirectionRef.current = direction

        // También disparamos un evento de teclado para compatibilidad
        switch (direction) {
            case "up":
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }))
                break
            case "down":
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }))
                break
            case "left":
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))
                break
            case "right":
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))
                break
        }
    }

    // Manejar pulsaciones de botones desde el pad de control
    const handleButtonPress = (button) => {
        if (button === "a") {
            // Botón A - Pausa
            setIsPaused(!isPaused)
        } else if (button === "b") {
            // Botón B - No hace nada en Pacman, pero podría usarse para otra función
        }
    }

    const resetGame = () => {
        setGameOver(false)
        setScore(0)
        setIsPaused(false)
        playSound("start")
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
            <div className="mb-2 flex justify-between w-full px-2">
                <div className="text-xs">Score: {score}</div>
                <button onClick={() => setIsPaused(!isPaused)} className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {isPaused ? "Resume" : "Pause"}
                </button>
            </div>

            <DifficultySelector difficulty={difficulty} onChange={setDifficulty} gameId="pacman" />

            <canvas ref={canvasRef} className="border border-gray-700 bg-black" />

            {/* Control Pad para dispositivos móviles */}
            <ControlPad onDirectionChange={handleDirectionChange} onButtonPress={handleButtonPress} />

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                    <h3 className="text-xl font-bold mb-2">Game Over</h3>
                    <p className="mb-4">Score: {score}</p>
                    <button onClick={resetGame} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                        Play Again
                    </button>
                </div>
            )}

            <div className="mt-2 text-xs text-center">
                <p>Usa las flechas del teclado para mover</p>
                <p>En móvil, usa el pad de control o desliza para cambiar dirección</p>
            </div>
        </div>
    )
}
