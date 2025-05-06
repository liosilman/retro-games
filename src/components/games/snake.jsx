"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"
import { HighScore } from "../high-score"
import { useSound } from "../../contexts/sound-context"
import "../pause-button.css"

export default function SnakeGame() {
  const canvasRef = useRef(null)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [difficulty, setDifficulty] = useState("normal")
  const { playSound } = useSound()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const gridSize = 20
    const width = canvas.width
    const height = canvas.height

    // Ajustar parámetros según la dificultad
    let gameSpeed
    let foodFrequency
    let growAmount

    switch (difficulty) {
      case "easy":
        gameSpeed = 120 // ms por frame (más lento)
        foodFrequency = 0.9 // probabilidad de que aparezca comida
        growAmount = 1 // cuánto crece la serpiente por comida
        break
      case "hard":
        gameSpeed = 70 // ms por frame (más rápido)
        foodFrequency = 0.7 // menos probabilidad de comida
        growAmount = 3 // crece más rápido, más difícil de manejar
        break
      default: // normal
        gameSpeed = 90
        foodFrequency = 0.8
        growAmount = 2
        break
    }

    const snake = [{ x: 5 * gridSize, y: 5 * gridSize }]
    let food = { x: 10 * gridSize, y: 10 * gridSize }
    let dx = gridSize
    let dy = 0
    let newDx = dx
    let newDy = dy
    let gameLoopId
    let lastUpdateTime = 0

    const generateFood = () => {
      // A veces no genera comida según la dificultad
      if (Math.random() > foodFrequency) {
        return food // Mantener la comida actual
      }

      const x = Math.floor(Math.random() * (width / gridSize)) * gridSize
      const y = Math.floor(Math.random() * (height / gridSize)) * gridSize

      // Check if food is on snake
      for (const segment of snake) {
        if (segment.x === x && segment.y === y) {
          return generateFood()
        }
      }

      return { x, y }
    }

    const drawSnake = () => {
      snake.forEach((segment, index) => {
        if (index === 0) {
          // Draw head with neon glow
          ctx.shadowColor = "#39ff14"
          ctx.shadowBlur = 10
          ctx.fillStyle = "#22c55e"
          ctx.fillRect(segment.x, segment.y, gridSize, gridSize)
          ctx.shadowBlur = 0

          // Draw eyes
          ctx.fillStyle = "#000"
          if (dx > 0) {
            // facing right
            ctx.fillRect(segment.x + gridSize - 5, segment.y + 5, 3, 3)
            ctx.fillRect(segment.x + gridSize - 5, segment.y + gridSize - 8, 3, 3)
          } else if (dx < 0) {
            // facing left
            ctx.fillRect(segment.x + 2, segment.y + 5, 3, 3)
            ctx.fillRect(segment.x + 2, segment.y + gridSize - 8, 3, 3)
          } else if (dy < 0) {
            // facing up
            ctx.fillRect(segment.x + 5, segment.y + 2, 3, 3)
            ctx.fillRect(segment.x + gridSize - 8, segment.y + 2, 3, 3)
          } else {
            // facing down
            ctx.fillRect(segment.x + 5, segment.y + gridSize - 5, 3, 3)
            ctx.fillRect(segment.x + gridSize - 8, segment.y + gridSize - 5, 3, 3)
          }
        } else {
          // Draw body with pixel pattern
          ctx.fillStyle = index % 2 === 0 ? "#4ade80" : "#3bca6d"
          ctx.fillRect(segment.x, segment.y, gridSize, gridSize)
        }
        ctx.strokeStyle = "#166534"
        ctx.strokeRect(segment.x, segment.y, gridSize, gridSize)
      })
    }

    const drawFood = () => {
      // Draw food with pulsating effect
      const pulseSize = Math.sin(Date.now() / 200) * 2

      ctx.shadowColor = "#ff00ff"
      ctx.shadowBlur = 15
      ctx.fillStyle = "#ef4444"
      ctx.beginPath()
      ctx.arc(food.x + gridSize / 2, food.y + gridSize / 2, gridSize / 2 + pulseSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    const moveSnake = () => {
      dx = newDx
      dy = newDy

      const head = { x: snake[0].x + dx, y: snake[0].y + dy }

      // Check wall collision
      if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
        setGameOver(true)
        playSound("gameOver")
        saveHighScore()
        return
      }

      // Check self collision
      for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
          setGameOver(true)
          playSound("gameOver")
          saveHighScore()
          return
        }
      }

      snake.unshift(head)

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        food = generateFood()
        setScore((prevScore) => prevScore + 10)
        playSound("success")

        // En dificultad fácil, la serpiente crece menos
        // En dificultad difícil, crece más rápido
        for (let i = 1; i < growAmount; i++) {
          snake.push({ ...snake[snake.length - 1] })
        }
      } else {
        snake.pop()
      }
    }

    const gameLoop = (timestamp) => {
      if (gameOver || isPaused) return

      // Control de velocidad basado en dificultad
      if (timestamp - lastUpdateTime < gameSpeed) {
        gameLoopId = requestAnimationFrame(gameLoop)
        return
      }

      lastUpdateTime = timestamp

      // Draw background with grid pattern
      ctx.fillStyle = "#9bbc0f"
      ctx.fillRect(0, 0, width, height)

      // Draw grid
      ctx.strokeStyle = "rgba(0, 0, 0, 0.1)"
      ctx.lineWidth = 0.5
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      drawFood()
      moveSnake()
      drawSnake()

      gameLoopId = requestAnimationFrame(gameLoop)
    }

    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowUp":
          if (dy === 0) {
            newDx = 0
            newDy = -gridSize
          }
          break
        case "ArrowDown":
          if (dy === 0) {
            newDx = 0
            newDy = gridSize
          }
          break
        case "ArrowLeft":
          if (dx === 0) {
            newDx = -gridSize
            newDy = 0
          }
          break
        case "ArrowRight":
          if (dx === 0) {
            newDx = gridSize
            newDy = 0
          }
          break
        case " ":
          setIsPaused(!isPaused)
          playSound("click")
          break
      }
    }

    // Touch controls for mobile
    const handleTouchStart = (e) => {
      const touchX = e.touches[0].clientX
      const touchY = e.touches[0].clientY
      const rect = canvas.getBoundingClientRect()
      const canvasX = touchX - rect.left
      const canvasY = touchY - rect.top

      const centerX = width / 2
      const centerY = height / 2

      const diffX = canvasX - centerX
      const diffY = canvasY - centerY

      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0 && dy !== 0) {
          // Right
          newDx = gridSize
          newDy = 0
        } else if (diffX < 0 && dy !== 0) {
          // Left
          newDx = -gridSize
          newDy = 0
        }
      } else {
        // Vertical swipe
        if (diffY > 0 && dx !== 0) {
          // Down
          newDx = 0
          newDy = gridSize
        } else if (diffY < 0 && dx !== 0) {
          // Up
          newDx = 0
          newDy = -gridSize
        }
      }
    }

    canvas.addEventListener("touchstart", handleTouchStart)
    window.addEventListener("keydown", handleKeyDown)

    gameLoopId = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      canvas.removeEventListener("touchstart", handleTouchStart)
      cancelAnimationFrame(gameLoopId)
    }
  }, [gameOver, isPaused, difficulty, playSound])

  // Guardar puntuación alta
  const saveHighScore = () => {
    if (score > 0) {
      const highScores = JSON.parse(localStorage.getItem("highScores") || "{}")
      const gameHighScores = highScores.snake || []

      // Añadir nueva puntuación
      gameHighScores.push({
        score,
        date: new Date().toISOString(),
        difficulty,
      })

      // Ordenar y limitar a 5 puntuaciones
      gameHighScores.sort((a, b) => b.score - a.score)
      highScores.snake = gameHighScores.slice(0, 5)

      // Guardar en localStorage
      localStorage.setItem("highScores", JSON.stringify(highScores))
    }
  }

  const resetGame = () => {
    playSound("click")
    setGameOver(false)
    setScore(0)
    setIsPaused(false)
  }

  const handlePauseToggle = () => {
    playSound("click")
    setIsPaused(!isPaused)
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
      <div className="mb-2 flex justify-between w-full px-2">
        <div className="text-xs pixel-text bg-black/50 px-2 py-1 rounded border border-green-500">Score: {score}</div>
        <button onClick={handlePauseToggle} className="pause-button">
          {isPaused ? "Reanudar" : "Pausa"}
        </button>
      </div>

      <DifficultySelector difficulty={difficulty} onChange={setDifficulty} gameId="snake" />

      <div className="relative">
        <canvas ref={canvasRef} width={320} height={320} className="border-4 border-[#0f380f] bg-[#9bbc0f]" />
        <div className="crt-effect absolute inset-0 pointer-events-none"></div>
      </div>

      {/* Componente de puntuaciones altas */}
      <HighScore gameId="snake" />

      {gameOver && (
        <div className="game-over-screen absolute inset-0 flex flex-col items-center justify-center">
          <h3 className="text-xl font-bold mb-2 pixel-text text-red-500">Game Over</h3>
          <p className="mb-4 pixel-text">Score: {score}</p>
          <button onClick={resetGame} className="retro-button">
            Play Again
          </button>
        </div>
      )}

      <div className="mt-2 text-xs text-center pixel-text">
        <p>Use las flechas del teclado para mover</p>
        <p>En móvil, toca la pantalla para cambiar dirección</p>
      </div>
    </div>
  )
}
