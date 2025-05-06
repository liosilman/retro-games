"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"
import { HighScore } from "../high-score"
import { useSound } from "../../contexts/sound-context"
import { ControlPad } from "../control-pad"
import "../pause-button.css"

export default function TetrisGame() {
    const canvasRef = useRef(null)
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [difficulty, setDifficulty] = useState("normal")
    const [level, setLevel] = useState(1)
    const [lines, setLines] = useState(0)
    const { playSound } = useSound()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const COLS = 10
        const ROWS = 20
        const BLOCK_SIZE = canvas.width / COLS

        // Ajustar parámetros según la dificultad
        let dropInterval // ms
        let scoreMultiplier

        switch (difficulty) {
            case "easy":
                dropInterval = 1200
                scoreMultiplier = 0.8
                break
            case "hard":
                dropInterval = 600
                scoreMultiplier = 1.5
                break
            default: // normal
                dropInterval = 1000
                scoreMultiplier = 1
                break
        }

        // Tetromino shapes
        const SHAPES = [
            [[1, 1, 1, 1]], // I
            [
                [1, 1],
                [1, 1],
            ], // O
            [
                [1, 1, 1],
                [0, 1, 0],
            ], // T
            [
                [1, 1, 1],
                [1, 0, 0],
            ], // L
            [
                [1, 1, 1],
                [0, 0, 1],
            ], // J
            [
                [0, 1, 1],
                [1, 1, 0],
            ], // S
            [
                [1, 1, 0],
                [0, 1, 1],
            ], // Z
        ]

        const COLORS = [
            "#00FFFF", // I - cyan
            "#FFFF00", // O - yellow
            "#800080", // T - purple
            "#FFA500", // L - orange
            "#0000FF", // J - blue
            "#00FF00", // S - green
            "#FF0000", // Z - red
        ]

        const board = Array(ROWS)
            .fill()
            .map(() => Array(COLS).fill(0))
        let currentPiece = {
            shape: [],
            color: "",
            x: 0,
            y: 0,
        }
        let nextPiece = null
        let gameLoopId
        let dropCounter = 0
        let lastTime = 0
        let currentScore = 0
        let currentLevel = 1
        let linesCleared = 0
        let dropFast = false

        const createPiece = () => {
            if (nextPiece) {
                currentPiece = nextPiece
            } else {
                const shapeIndex = Math.floor(Math.random() * SHAPES.length)
                currentPiece = {
                    shape: SHAPES[shapeIndex],
                    color: COLORS[shapeIndex],
                    x: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
                    y: 0,
                }
            }

            // Create next piece
            const nextShapeIndex = Math.floor(Math.random() * SHAPES.length)
            nextPiece = {
                shape: SHAPES[nextShapeIndex],
                color: COLORS[nextShapeIndex],
                x: Math.floor(COLS / 2) - Math.floor(SHAPES[nextShapeIndex][0].length / 2),
                y: 0,
            }

            // Check if game over
            if (!isValidMove(0, 0)) {
                setGameOver(true)
                playSound("gameOver")
                saveHighScore(currentScore, currentLevel, linesCleared)
            }
        }

        const drawBoard = () => {
            ctx.fillStyle = "#9bbc0f"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Draw the board
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    if (board[y][x]) {
                        ctx.fillStyle = board[y][x]
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
                        ctx.strokeStyle = "#0f380f"
                        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
                    }
                }
            }

            // Draw current piece
            if (currentPiece.shape.length) {
                ctx.fillStyle = currentPiece.color
                for (let y = 0; y < currentPiece.shape.length; y++) {
                    for (let x = 0; x < currentPiece.shape[y].length; x++) {
                        if (currentPiece.shape[y][x]) {
                            ctx.fillRect((currentPiece.x + x) * BLOCK_SIZE, (currentPiece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
                            ctx.strokeStyle = "#0f380f"
                            ctx.strokeRect(
                                (currentPiece.x + x) * BLOCK_SIZE,
                                (currentPiece.y + y) * BLOCK_SIZE,
                                BLOCK_SIZE,
                                BLOCK_SIZE,
                            )
                        }
                    }
                }
            }

            // Draw next piece preview
            if (nextPiece) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
                ctx.fillRect(canvas.width - 80, 10, 70, 70)
                ctx.strokeStyle = "#FFFFFF"
                ctx.strokeRect(canvas.width - 80, 10, 70, 70)

                ctx.fillStyle = "#FFFFFF"
                ctx.font = "12px Arial"
                ctx.fillText("NEXT", canvas.width - 60, 25)

                ctx.fillStyle = nextPiece.color
                const blockSizePreview = 12
                const offsetX = canvas.width - 65
                const offsetY = 35

                for (let y = 0; y < nextPiece.shape.length; y++) {
                    for (let x = 0; x < nextPiece.shape[y].length; x++) {
                        if (nextPiece.shape[y][x]) {
                            ctx.fillRect(
                                offsetX + x * blockSizePreview,
                                offsetY + y * blockSizePreview,
                                blockSizePreview,
                                blockSizePreview,
                            )
                            ctx.strokeStyle = "#0f380f"
                            ctx.strokeRect(
                                offsetX + x * blockSizePreview,
                                offsetY + y * blockSizePreview,
                                blockSizePreview,
                                blockSizePreview,
                            )
                        }
                    }
                }
            }

            // Draw game info
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
            ctx.fillRect(10, 10, 100, 80)

            ctx.fillStyle = "#FFFFFF"
            ctx.font = "12px Arial"
            ctx.fillText(`Score: ${currentScore}`, 20, 30)
            ctx.fillText(`Level: ${currentLevel}`, 20, 50)
            ctx.fillText(`Lines: ${linesCleared}`, 20, 70)
        }

        const isValidMove = (offsetX, offsetY) => {
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x]) {
                        const newX = currentPiece.x + x + offsetX
                        const newY = currentPiece.y + y + offsetY

                        if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
                            return false
                        }
                    }
                }
            }
            return true
        }

        const movePiece = (offsetX, offsetY) => {
            if (isValidMove(offsetX, offsetY)) {
                currentPiece.x += offsetX
                currentPiece.y += offsetY
                return true
            }
            return false
        }

        const rotatePiece = () => {
            // Create a rotated matrix
            const rotated = []
            for (let i = 0; i < currentPiece.shape[0].length; i++) {
                const row = []
                for (let j = currentPiece.shape.length - 1; j >= 0; j--) {
                    row.push(currentPiece.shape[j][i])
                }
                rotated.push(row)
            }

            // Save current shape
            const originalShape = currentPiece.shape

            // Try rotation
            currentPiece.shape = rotated

            // If rotation is not valid, try wall kicks
            if (!isValidMove(0, 0)) {
                // Try to move left if piece is at right edge
                if (isValidMove(-1, 0)) {
                    currentPiece.x -= 1
                }
                // Try to move right if piece is at left edge
                else if (isValidMove(1, 0)) {
                    currentPiece.x += 1
                }
                // If still not valid, revert
                else {
                    currentPiece.shape = originalShape
                }
            }

            playSound("click")
        }

        const mergePiece = () => {
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x]) {
                        const boardY = currentPiece.y + y
                        if (boardY >= 0) {
                            board[boardY][currentPiece.x + x] = currentPiece.color
                        }
                    }
                }
            }

            // Check for completed rows
            let rowsCleared = 0
            for (let y = ROWS - 1; y >= 0; y--) {
                if (board[y].every((cell) => cell !== 0)) {
                    // Remove the row
                    board.splice(y, 1)
                    // Add a new empty row at the top
                    board.unshift(Array(COLS).fill(0))
                    rowsCleared++
                    y++ // Check the same row again
                }
            }

            // Update score and level
            if (rowsCleared > 0) {
                const points = Math.floor([0, 40, 100, 300, 1200][rowsCleared] * scoreMultiplier * currentLevel)
                currentScore += points
                linesCleared += rowsCleared
                setScore(currentScore)
                setLines(linesCleared)

                // Level up every 10 lines
                const newLevel = Math.floor(linesCleared / 10) + 1
                if (newLevel > currentLevel) {
                    currentLevel = newLevel
                    setLevel(currentLevel)
                    playSound("success")
                } else {
                    playSound("click")
                }
            }

            createPiece()
        }

        const dropPiece = () => {
            if (!movePiece(0, 1)) {
                mergePiece()
            }
            dropCounter = 0
        }

        const hardDrop = () => {
            while (movePiece(0, 1)) {
                /* empty */
            }
            mergePiece()
            dropCounter = 0
            playSound("click")
        }

        const gameLoop = (time = 0) => {
            if (gameOver || isPaused) return

            const deltaTime = time - lastTime
            lastTime = time

            // Adjust drop speed based on level
            const adjustedDropInterval = dropInterval / (1 + (currentLevel - 1) * 0.2)

            dropCounter += deltaTime
            if (dropFast) {
                if (dropCounter > adjustedDropInterval / 10) {
                    dropPiece()
                }
            } else if (dropCounter > adjustedDropInterval) {
                dropPiece()
            }

            drawBoard()
            gameLoopId = requestAnimationFrame(gameLoop)
        }

        const handleKeyDown = (e) => {
            if (gameOver) return

            switch (e.key) {
                case "ArrowLeft":
                    movePiece(-1, 0)
                    break
                case "ArrowRight":
                    movePiece(1, 0)
                    break
                case "ArrowDown":
                    dropFast = true
                    break
                case "ArrowUp":
                    rotatePiece()
                    break
                case " ":
                    if (e.target === document.body) {
                        e.preventDefault() // Prevent page scroll
                    }
                    hardDrop()
                    break
                case "p":
                    setIsPaused(!isPaused)
                    break
            }
        }

        const handleKeyUp = (e) => {
            if (e.key === "ArrowDown") {
                dropFast = false
            }
        }

        // Initialize game
        createPiece()
        gameLoopId = requestAnimationFrame(gameLoop)

        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("keyup", handleKeyUp)
            cancelAnimationFrame(gameLoopId)
        }
    }, [gameOver, isPaused, difficulty, playSound])

    // Guardar puntuación alta
    const saveHighScore = (finalScore, finalLevel, finalLines) => {
        const highScores = JSON.parse(localStorage.getItem("highScores") || "{}")
        const gameHighScores = highScores.tetris || []

        // Añadir nueva puntuación
        gameHighScores.push({
            score: finalScore,
            level: finalLevel,
            lines: finalLines,
            date: new Date().toISOString(),
            difficulty,
        })

        // Ordenar y limitar a 5 puntuaciones
        gameHighScores.sort((a, b) => b.score - a.score)
        highScores.tetris = gameHighScores.slice(0, 5)

        // Guardar en localStorage
        localStorage.setItem("highScores", JSON.stringify(highScores))
    }

    const resetGame = () => {
        setGameOver(false)
        setScore(0)
        setLevel(1)
        setLines(0)
        setIsPaused(false)
        playSound("start")
    }

    // Manejar controles desde el pad
    const handleDirectionChange = (direction) => {
        if (gameOver || isPaused) return

        switch (direction) {
            case "left":
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))
                break
            case "right":
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))
                break
            case "down":
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }))
                break
            case "up":
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }))
                break
        }
    }

    const handleButtonPress = (button) => {
        if (gameOver || isPaused) {
            if (button === "a" && gameOver) {
                resetGame()
            } else if (button === "b") {
                setIsPaused(!isPaused)
            }
            return
        }

        if (button === "a") {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: " " })) // Hard drop
        } else if (button === "b") {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" })) // Rotate
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
                    Level: {level}
                </div>
            </div>

            <DifficultySelector difficulty={difficulty} onChange={setDifficulty} gameId="tetris" />

            <canvas
                ref={canvasRef}
                width={200}
                height={400}
                className="border border-gray-700 bg-[#9bbc0f] shadow-lg rounded-md"
            />

            {/* Control Pad para dispositivos móviles */}
            <ControlPad onDirectionChange={handleDirectionChange} onButtonPress={handleButtonPress} />

            {/* Componente de puntuaciones altas */}
            <HighScore gameId="tetris" />

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-lg border-2 border-blue-500 shadow-lg max-w-xs w-full">
                        <h3 className="text-xl font-bold mb-2 text-center">Game Over</h3>
                        <p className="mb-4 text-center">
                            Score: {score}
                            <br />
                            Level: {level}
                            <br />
                            Lines: {lines}
                        </p>
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
                <p>Flechas: Mover y rotar</p>
                <p>Espacio: Caída rápida</p>
                <p>En móvil: Usa el pad de control</p>
                <p className="text-gray-400 text-[10px] mt-1">A: Caída rápida | B: Rotar</p>
            </div>
        </div>
    )
}
