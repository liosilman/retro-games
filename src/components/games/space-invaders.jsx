"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"

export default function SpaceInvadersGame() {
    const canvasRef = useRef(null)
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [lives, setLives] = useState(3)
    const [hasWon, setHasWon] = useState(false)
    const [difficulty, setDifficulty] = useState("normal")

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height

        // Ajustar parámetros según la dificultad
        let enemySpeed
        let enemyBulletFrequency
        let playerLives
        let scoreMultiplier

        switch (difficulty) {
            case "easy":
                enemySpeed = 0.3
                enemyBulletFrequency = 1500 // ms entre disparos
                playerLives = 5
                scoreMultiplier = 0.8
                break
            case "hard":
                enemySpeed = 0.8
                enemyBulletFrequency = 600
                playerLives = 2
                scoreMultiplier = 1.5
                break
            default: // normal
                enemySpeed = 0.5
                enemyBulletFrequency = 1000
                playerLives = 3
                scoreMultiplier = 1
                break
        }

        // Game objects
        const playerWidth = 30
        const playerHeight = 15
        const bulletWidth = 3
        const bulletHeight = 10
        const enemyWidth = 25
        const enemyHeight = 20
        const enemyGap = 15

        let playerX = width / 2 - playerWidth / 2
        let bullets = []
        const enemies = []
        let enemyBullets = []
        let enemyDirection = 1
        const enemyDropDistance = 20
        let gameLoopId
        let currentScore = 0
        let currentLives = playerLives
        setLives(playerLives)
        let lastEnemyBulletTime = 0

        // Create enemies
        const createEnemies = () => {
            const rows = 5
            const cols = 8
            const startX = (width - (cols * (enemyWidth + enemyGap) - enemyGap)) / 2
            const startY = 50

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    enemies.push({
                        x: startX + col * (enemyWidth + enemyGap),
                        y: startY + row * (enemyHeight + enemyGap),
                        width: enemyWidth,
                        height: enemyHeight,
                        type: row % 3, // 0, 1, or 2 for different enemy types
                    })
                }
            }
        }

        createEnemies()

        const drawPlayer = () => {
            ctx.fillStyle = "#00FF00"
            ctx.fillRect(playerX, height - playerHeight - 10, playerWidth, playerHeight)

            // Draw cannon
            ctx.fillStyle = "#00FF00"
            ctx.fillRect(playerX + playerWidth / 2 - 2, height - playerHeight - 10 - 5, 4, 5)
        }

        const drawBullets = () => {
            ctx.fillStyle = "#FFFFFF"
            bullets.forEach((bullet) => {
                ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight)
            })
        }

        const drawEnemyBullets = () => {
            ctx.fillStyle = "#FF0000"
            enemyBullets.forEach((bullet) => {
                ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight)
            })
        }

        const drawEnemies = () => {
            enemies.forEach((enemy) => {
                // Different colors for different enemy types
                if (enemy.type === 0) {
                    ctx.fillStyle = "#FF0000"
                } else if (enemy.type === 1) {
                    ctx.fillStyle = "#FF00FF"
                } else {
                    ctx.fillStyle = "#FFFF00"
                }

                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)

                // Draw enemy details
                ctx.fillStyle = "#000000"
                ctx.fillRect(enemy.x + 5, enemy.y + 5, 5, 5)
                ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + 5, 5, 5)
                ctx.fillRect(enemy.x + enemy.width / 2 - 2, enemy.y + enemy.height - 5, 4, 2)
            })
        }

        const drawLives = () => {
            ctx.fillStyle = "#FFFFFF"
            ctx.font = "16px Arial"
            ctx.fillText(`Lives: ${currentLives}`, 10, 20)
        }

        const drawScore = () => {
            ctx.fillStyle = "#FFFFFF"
            ctx.font = "16px Arial"
            ctx.fillText(`Score: ${currentScore}`, width - 100, 20)
        }

        const updateBullets = () => {
            // Move player bullets
            bullets = bullets.filter((bullet) => {
                bullet.y -= 5
                return bullet.y > 0
            })

            // Move enemy bullets
            enemyBullets = enemyBullets.filter((bullet) => {
                bullet.y += 3
                return bullet.y < height
            })

            // Check for player bullet collisions with enemies
            bullets.forEach((bullet, bulletIndex) => {
                enemies.forEach((enemy, enemyIndex) => {
                    if (
                        bullet.x < enemy.x + enemy.width &&
                        bullet.x + bulletWidth > enemy.x &&
                        bullet.y < enemy.y + enemy.height &&
                        bullet.y + bulletHeight > enemy.y
                    ) {
                        // Remove bullet and enemy
                        bullets.splice(bulletIndex, 1)
                        enemies.splice(enemyIndex, 1)

                        // Update score - más puntos por enemigos más difíciles y según dificultad
                        currentScore += Math.floor((3 - enemy.type) * 10 * scoreMultiplier)
                        setScore(currentScore)

                        // Increase enemy speed slightly
                        enemySpeed += 0.02
                    }
                })
            })

            // Check for enemy bullet collisions with player
            enemyBullets.forEach((bullet, bulletIndex) => {
                if (
                    bullet.x < playerX + playerWidth &&
                    bullet.x + bulletWidth > playerX &&
                    bullet.y < height - 10 &&
                    bullet.y + bulletHeight > height - playerHeight - 10
                ) {
                    // Remove bullet
                    enemyBullets.splice(bulletIndex, 1)

                    // Lose a life
                    currentLives--
                    setLives(currentLives)

                    if (currentLives <= 0) {
                        setGameOver(true)
                    }
                }
            })
        }

        const updateEnemies = () => {
            let hitEdge = false
            let lowestEnemy = 0

            enemies.forEach((enemy) => {
                enemy.x += enemyDirection * enemySpeed

                // Check if any enemy hit the edge
                if (enemy.x <= 0 || enemy.x + enemy.width >= width) {
                    hitEdge = true
                }

                // Track lowest enemy
                if (enemy.y + enemy.height > lowestEnemy) {
                    lowestEnemy = enemy.y + enemy.height
                }
            })

            // If an enemy hit the edge, change direction and move down
            if (hitEdge) {
                enemyDirection *= -1
                enemies.forEach((enemy) => {
                    enemy.y += enemyDropDistance
                })
            }

            // Game over if enemies reach the bottom
            if (lowestEnemy > height - playerHeight - 30) {
                setGameOver(true)
            }

            // Game over if all enemies are destroyed
            if (enemies.length === 0) {
                setGameOver(true)
                setHasWon(true)
            }

            // Random enemy shooting - frecuencia ajustada por dificultad
            const now = Date.now()
            if (now - lastEnemyBulletTime > enemyBulletFrequency && enemies.length > 0) {
                const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)]
                enemyBullets.push({
                    x: randomEnemy.x + enemyWidth / 2 - bulletWidth / 2,
                    y: randomEnemy.y + enemyHeight,
                })
                lastEnemyBulletTime = now
            }
        }

        const gameLoop = () => {
            if (gameOver || isPaused) return

            // Clear canvas
            ctx.fillStyle = "#000000"
            ctx.fillRect(0, 0, width, height)

            // Draw stars
            ctx.fillStyle = "#FFFFFF"
            for (let i = 0; i < 50; i++) {
                ctx.fillRect(Math.floor(Math.random() * width), Math.floor(Math.random() * height), 1, 1)
            }

            drawPlayer()
            drawBullets()
            drawEnemyBullets()
            drawEnemies()
            drawLives()
            drawScore()

            updateBullets()
            updateEnemies()

            gameLoopId = requestAnimationFrame(gameLoop)
        }

        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft" && playerX > 0) {
                playerX -= 10
            } else if (e.key === "ArrowRight" && playerX < width - playerWidth) {
                playerX += 10
            } else if (e.key === " " || e.key === "ArrowUp") {
                // Shoot
                if (bullets.length < 3) {
                    bullets.push({
                        x: playerX + playerWidth / 2 - bulletWidth / 2,
                        y: height - playerHeight - 10 - bulletHeight,
                    })
                }
            } else if (e.key === "p") {
                setIsPaused(!isPaused)
            }
        }

        // Touch controls
        let touchX = 0

        const handleTouchMove = (e) => {
            e.preventDefault()
            const rect = canvas.getBoundingClientRect()
            touchX = e.touches[0].clientX - rect.left
            playerX = touchX - playerWidth / 2

            // Keep player within bounds
            if (playerX < 0) {
                playerX = 0
            } else if (playerX > width - playerWidth) {
                playerX = width - playerWidth
            }
        }

        const handleTouchEnd = () => {
            // Shoot on touch end
            if (bullets.length < 3) {
                bullets.push({
                    x: playerX + playerWidth / 2 - bulletWidth / 2,
                    y: height - playerHeight - 10 - bulletHeight,
                })
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
        canvas.addEventListener("touchend", handleTouchEnd)

        gameLoopId = requestAnimationFrame(gameLoop)

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            canvas.removeEventListener("touchmove", handleTouchMove)
            canvas.removeEventListener("touchend", handleTouchEnd)
            cancelAnimationFrame(gameLoopId)
        }
    }, [gameOver, isPaused, difficulty])

    const resetGame = () => {
        setGameOver(false)
        setScore(0)
        setIsPaused(false)
        setHasWon(false)
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
            <div className="mb-2 flex justify-between w-full px-2">
                <div className="text-xs">Lives: {lives}</div>
                <button onClick={() => setIsPaused(!isPaused)} className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {isPaused ? "Resume" : "Pause"}
                </button>
                <div className="text-xs">Score: {score}</div>
            </div>

            <DifficultySelector difficulty={difficulty} onChange={setDifficulty} gameId="space-invaders" />

            <canvas ref={canvasRef} width={400} height={400} className="border border-gray-700 bg-black" />

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                    <h3 className="text-xl font-bold mb-2">Game Over</h3>
                    <p className="mb-4">
                        {hasWon ? "¡Has ganado!" : "Has perdido"}
                        <br />
                        Score: {score}
                    </p>
                    <button onClick={resetGame} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                        Play Again
                    </button>
                </div>
            )}

            <div className="mt-2 text-xs text-center">
                <p>Usa las flechas para mover y espacio para disparar</p>
                <p>En móvil, desliza para mover y toca para disparar</p>
            </div>
        </div>
    )
}
