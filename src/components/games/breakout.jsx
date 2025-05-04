"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"

export default function BreakoutGame() {
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lives, setLives] = useState(3)
  const [difficulty, setDifficulty] = useState("normal")

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
      }

      if (y + dy < ballRadius) {
        dy = -dy
      } else if (y + dy > height - ballRadius - paddleHeight) {
        if (x > paddleX && x < paddleX + paddleWidth) {
          // Ball hits paddle
          dy = -dy

          // Adjust angle based on where ball hits paddle
          const hitPos = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2)
          dx = hitPos * 5
        } else if (y + dy > height - ballRadius) {
          // Ball hits bottom
          currentLives--
          setLives(currentLives)

          if (currentLives === 0) {
            setGameOver(true)
          } else {
            // Reset ball and paddle
            x = width / 2
            y = height - 30
            dx = ballSpeed * (Math.random() > 0.5 ? 1 : -1)
            dy = -ballSpeed
            paddleX = (width - paddleWidth) / 2
          }
        }
      }

      // Move paddle
      if (rightPressed && paddleX < width - paddleWidth) {
        paddleX += 7
      } else if (leftPressed && paddleX > 0) {
        paddleX -= 7
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

        // Keep paddle within bounds
        if (paddleX < 0) {
          paddleX = 0
        } else if (paddleX > width - paddleWidth) {
          paddleX = width - paddleWidth
        }
      }
    }

    const touchMoveHandler = (e) => {
      e.preventDefault()
      const relativeX = e.touches[0].clientX - canvas.getBoundingClientRect().left
      if (relativeX > 0 && relativeX < width) {
        paddleX = relativeX - paddleWidth / 2

        // Keep paddle within bounds
        if (paddleX < 0) {
          paddleX = 0
        } else if (paddleX > width - paddleWidth) {
          paddleX = width - paddleWidth
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
        <div className="text-xs">Lives: {lives}</div>
      </div>

      <DifficultySelector difficulty={difficulty} onChange={setDifficulty} gameId="breakout" />

      <canvas ref={canvasRef} width={400} height={320} className="border border-gray-700 bg-black" />

      {gameOver && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
          <h3 className="text-xl font-bold mb-2">Game Over</h3>
          <p className="mb-4">
            {lives > 0 ? "¡Has ganado!" : "Has perdido"}
            <br />
            Score: {score}
          </p>
          <button onClick={resetGame} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            Play Again
          </button>
        </div>
      )}

      <div className="mt-2 text-xs text-center">
        <p>Mueve el ratón o desliza para controlar la paleta</p>
        <p>Destruye todos los bloques para ganar</p>
      </div>
    </div>
  )
}
