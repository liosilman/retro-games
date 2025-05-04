"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"

export default function TetrisGame() {
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [difficulty, setDifficulty] = useState("normal")

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
    let gameLoopId
    let dropCounter = 0
    let lastTime = 0

    const createPiece = () => {
      const shapeIndex = Math.floor(Math.random() * SHAPES.length)
      currentPiece = {
        shape: SHAPES[shapeIndex],
        color: COLORS[shapeIndex],
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
        y: 0,
      }

      // Check if game over
      if (!isValidMove(0, 0)) {
        setGameOver(true)
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

      // If rotation is not valid, revert
      if (!isValidMove(0, 0)) {
        currentPiece.shape = originalShape
      }
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

      // Update score
      if (rowsCleared > 0) {
        const points = Math.floor([0, 40, 100, 300, 1200][rowsCleared] * scoreMultiplier)
        setScore((prevScore) => prevScore + points)
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
      while (movePiece(0, 1)) { /* empty */ }
      mergePiece()
      dropCounter = 0
    }

    const gameLoop = (time = 0) => {
      if (gameOver || isPaused) return

      const deltaTime = time - lastTime
      lastTime = time

      dropCounter += deltaTime
      if (dropCounter > dropInterval) {
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
          dropPiece()
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

    // Touch controls for mobile
    let touchStartX = 0
    let touchStartY = 0

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }

    const handleTouchEnd = (e) => {
      if (gameOver) return

      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY

      const diffX = touchEndX - touchStartX
      const diffY = touchEndY - touchStartY

      // Determine swipe direction
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > 30) {
          if (diffX > 0) {
            movePiece(1, 0) // Right
          } else {
            movePiece(-1, 0) // Left
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(diffY) > 30) {
          if (diffY > 0) {
            dropPiece() // Down
          } else {
            rotatePiece() // Up
          }
        } else {
          // Tap (rotate)
          rotatePiece()
        }
      }
    }

    const handleDoubleTap = () => {
      hardDrop()
    }

    // Initialize game
    createPiece()
    gameLoopId = requestAnimationFrame(gameLoop)

    window.addEventListener("keydown", handleKeyDown)
    canvas.addEventListener("touchstart", handleTouchStart)
    canvas.addEventListener("touchend", handleTouchEnd)

    let lastTap = 0
    canvas.addEventListener("touchend", (e) => {
      const currentTime = new Date().getTime()
      const tapLength = currentTime - lastTap
      if (tapLength < 300 && tapLength > 0) {
        handleDoubleTap()
        e.preventDefault()
      }
      lastTap = currentTime
    })

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchend", handleTouchEnd)
      cancelAnimationFrame(gameLoopId)
    }
  }, [gameOver, isPaused, difficulty])

  const resetGame = () => {
    setGameOver(false)
    setScore(0)
    setIsPaused(false)
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
      <div className="mb-2 flex justify-between w-full px-2">
        <div className="text-xs">Score: {score}</div>
        <button onClick={() => setIsPaused(!isPaused)} className="text-xs bg-gray-700 px-2 py-1 rounded">
          {isPaused ? "Resume" : "Pause"}
        </button>
      </div>

      <DifficultySelector difficulty={difficulty} onChange={setDifficulty} gameId="tetris" />

      <canvas ref={canvasRef} width={200} height={400} className="border border-gray-700 bg-[#9bbc0f]" />

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
        <p>Flechas: Mover y rotar</p>
        <p>Espacio: Caída rápida</p>
        <p>En móvil: Desliza para mover, toca para rotar</p>
      </div>
    </div>
  )
}
