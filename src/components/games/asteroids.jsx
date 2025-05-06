"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"
import { HighScore } from "../high-score"
import { useSound } from "../../contexts/sound-context"
import "../pause-button.css"
import { ControlPad } from "../control-pad"

export default function AsteroidsGame() {
    const canvasRef = useRef(null)
    const [score, setScore] = useState(0)
    const [lives, setLives] = useState(3)
    const [level, setLevel] = useState(1)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [difficulty, setDifficulty] = useState("normal")
    const { playSound } = useSound()

    // Referencias para el estado del juego
    const shipRef = useRef({
        x: 0,
        y: 0,
        radius: 10,
        angle: 0,
        rotation: 0,
        thrusting: false,
        thrust: {
            x: 0,
            y: 0,
        },
        exploding: false,
        explodeTime: 0,
    })
    const asteroidsRef = useRef([])
    const bulletsRef = useRef([])
    const keysRef = useRef({})
    const gameLoopRef = useRef(null)
    const lastTimeRef = useRef(0)

    // Constantes del juego
    const FPS = 60
    const FRICTION = 0.7
    const SHIP_SIZE = 20
    const SHIP_THRUST = 0.5
    const TURN_SPEED = 360
    const BULLET_SPEED = 500
    const BULLET_MAX = 10
    const BULLET_LIFE = 2
    const ASTEROID_JAG = 0.4
    const ASTEROID_SPEED = 50
    const ASTEROID_POINTS = {
        large: 20,
        medium: 50,
        small: 100,
    }
    const TEXT_FADE_TIME = 2.5
    const TEXT_SIZE = 40
    const GAME_LIVES = 3
    const SAVE_KEY_SCORE = "highscore_asteroids"
    const SHIP_BLINK_DUR = 0.1
    const SHIP_INV_DUR = 3
    const SHIP_EXPLODE_DUR = 0.3

    // Inicializar el juego
    useEffect(() => {
        initGame()
        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current)
            }
        }
    }, [difficulty])

    // Función para inicializar el juego
    const initGame = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Inicializar nave
        shipRef.current = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: SHIP_SIZE / 2,
            angle: (90 / 180) * Math.PI, // convertir a radianes
            rotation: 0,
            thrusting: false,
            thrust: {
                x: 0,
                y: 0,
            },
            exploding: false,
            explodeTime: 0,
            blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
            blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
            canShoot: true,
            dead: false,
        }

        // Crear asteroides
        createAsteroidBelt()

        // Reiniciar balas
        bulletsRef.current = []

        // Reiniciar estado del juego
        setScore(0)
        setLives(GAME_LIVES)
        setLevel(1)
        setGameOver(false)
        setIsPaused(false)

        // Iniciar el bucle del juego
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current)
        }
        lastTimeRef.current = performance.now()
        gameLoop()
    }

    // Crear cinturón de asteroides
    const createAsteroidBelt = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        asteroidsRef.current = []
        let asteroidCount = 3 + Math.floor(level * 0.5)

        // Ajustar por dificultad
        if (difficulty === "easy") {
            asteroidCount = Math.max(2, asteroidCount - 1)
        } else if (difficulty === "hard") {
            asteroidCount = asteroidCount + 2
        }

        // Crear asteroides
        for (let i = 0; i < asteroidCount; i++) {
            const x = Math.random() * canvas.width
            const y = Math.random() * canvas.height

            // Asegurar que los asteroides no aparezcan muy cerca de la nave
            if (
                distBetweenPoints(shipRef.current.x, shipRef.current.y, x, y) <
                SHIP_SIZE * 4 + (difficulty === "easy" ? 50 : difficulty === "hard" ? 20 : 30)
            ) {
                i--
                continue
            }

            asteroidsRef.current.push(newAsteroid(x, y, Math.ceil(SHIP_SIZE / 2) * 3, "large"))
        }
    }

    // Crear un nuevo asteroide
    const newAsteroid = (x, y, radius, size) => {
        const speedMultiplier = difficulty === "easy" ? 0.8 : difficulty === "hard" ? 1.3 : 1
        const asteroid = {
            x,
            y,
            xv: ((Math.random() * ASTEROID_SPEED) / FPS) * (Math.random() < 0.5 ? 1 : -1) * speedMultiplier,
            yv: ((Math.random() * ASTEROID_SPEED) / FPS) * (Math.random() < 0.5 ? 1 : -1) * speedMultiplier,
            radius,
            angle: Math.random() * Math.PI * 2,
            vert: Math.floor(Math.random() * 7) + 7,
            offs: [],
            size,
        }

        // Crear vértices irregulares
        for (let i = 0; i < asteroid.vert; i++) {
            asteroid.offs.push(Math.random() * ASTEROID_JAG * 2 + 1 - ASTEROID_JAG)
        }

        return asteroid
    }

    // Calcular distancia entre dos puntos
    const distBetweenPoints = (x1, y1, x2, y2) => {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
    }

    // Bucle principal del juego
    const gameLoop = (time) => {
        if (gameOver) {
            gameLoopRef.current = requestAnimationFrame(gameLoop)
            return
        }

        // Calcular delta time
        const deltaTime = (time - lastTimeRef.current) / 1000
        lastTimeRef.current = time

        if (!isPaused) {
            update(deltaTime)
        }

        render()
        gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    // Actualizar estado del juego
    const update = (deltaTime) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ship = shipRef.current
        const bullets = bulletsRef.current
        const asteroids = asteroidsRef.current

        // Rotar nave
        if (keysRef.current["ArrowLeft"] || keysRef.current["a"]) {
            ship.rotation = ((TURN_SPEED / 180) * Math.PI) / FPS // convertir a radianes
        } else if (keysRef.current["ArrowRight"] || keysRef.current["d"]) {
            ship.rotation = ((-TURN_SPEED / 180) * Math.PI) / FPS // convertir a radianes
        } else {
            ship.rotation = 0
        }

        // Empujar nave
        if (keysRef.current["ArrowUp"] || keysRef.current["w"]) {
            ship.thrusting = true
        } else {
            ship.thrusting = false
        }

        // Disparar
        if ((keysRef.current[" "] || keysRef.current["Control"]) && ship.canShoot && !ship.dead) {
            if (bullets.length < BULLET_MAX) {
                bullets.push({
                    x: ship.x + (4 / 3) * ship.radius * Math.cos(ship.angle),
                    y: ship.y - (4 / 3) * ship.radius * Math.sin(ship.angle),
                    xv: (BULLET_SPEED * Math.cos(ship.angle)) / FPS,
                    yv: (-BULLET_SPEED * Math.sin(ship.angle)) / FPS,
                    timer: 0,
                })
                playSound("click")
            }
            ship.canShoot = false
        } else if (!keysRef.current[" "] && !keysRef.current["Control"]) {
            ship.canShoot = true
        }

        // Actualizar nave si no está explotando
        if (!ship.exploding) {
            // Actualizar ángulo
            ship.angle += ship.rotation

            // Actualizar velocidad con empuje
            if (ship.thrusting && !ship.dead) {
                ship.thrust.x += (SHIP_THRUST * Math.cos(ship.angle)) / FPS
                ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.angle)) / FPS
            } else {
                // Aplicar fricción
                ship.thrust.x *= FRICTION
                ship.thrust.y *= FRICTION
            }

            // Actualizar posición
            ship.x += ship.thrust.x
            ship.y += ship.thrust.y

            // Mantener la nave en la pantalla
            if (ship.x < 0 - ship.radius) {
                ship.x = canvas.width + ship.radius
            } else if (ship.x > canvas.width + ship.radius) {
                ship.x = 0 - ship.radius
            }
            if (ship.y < 0 - ship.radius) {
                ship.y = canvas.height + ship.radius
            } else if (ship.y > canvas.height + ship.radius) {
                ship.y = 0 - ship.radius
            }
        } else {
            // Manejar explosión
            ship.explodeTime += deltaTime

            if (ship.explodeTime > SHIP_EXPLODE_DUR) {
                ship.exploding = false
                ship.explodeTime = 0
                ship.dead = false
                ship.x = canvas.width / 2
                ship.y = canvas.height / 2
                ship.thrust.x = 0
                ship.thrust.y = 0
                ship.blinkNum = Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR)
                ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS)
            }
        }

        // Manejar parpadeo de invulnerabilidad
        if (ship.blinkNum > 0) {
            ship.blinkTime--
            if (ship.blinkTime === 0) {
                ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS)
                ship.blinkNum--
            }
        }

        // Actualizar asteroides
        for (let i = 0; i < asteroids.length; i++) {
            const asteroid = asteroids[i]

            // Mover asteroide
            asteroid.x += asteroid.xv
            asteroid.y += asteroid.yv

            // Mantener asteroide en pantalla
            if (asteroid.x < 0 - asteroid.radius) {
                asteroid.x = canvas.width + asteroid.radius
            } else if (asteroid.x > canvas.width + asteroid.radius) {
                asteroid.x = 0 - asteroid.radius
            }
            if (asteroid.y < 0 - asteroid.radius) {
                asteroid.y = canvas.height + asteroid.radius
            } else if (asteroid.y > canvas.height + asteroid.radius) {
                asteroid.y = 0 - asteroid.radius
            }

            // Detectar colisión con nave
            if (
                !ship.exploding &&
                !ship.dead &&
                ship.blinkNum === 0 &&
                distBetweenPoints(ship.x, ship.y, asteroid.x, asteroid.y) < ship.radius + asteroid.radius
            ) {
                ship.exploding = true
                ship.explodeTime = 0
                setLives((prev) => {
                    const newLives = prev - 1
                    if (newLives <= 0) {
                        ship.dead = true
                        setTimeout(() => {
                            setGameOver(true)
                            playSound("gameOver")

                            // Guardar puntuación
                            const highScores = JSON.parse(localStorage.getItem("highScores") || "{}")
                            const gameHighScores = highScores.asteroids || []

                            // Añadir nueva puntuación
                            gameHighScores.push({
                                score,
                                date: new Date().toISOString(),
                                difficulty,
                            })

                            // Ordenar y limitar a 5 puntuaciones
                            gameHighScores.sort((a, b) => b.score - a.score)
                            highScores.asteroids = gameHighScores.slice(0, 5)

                            // Guardar en localStorage
                            localStorage.setItem("highScores", JSON.stringify(highScores))
                        }, 1000)
                    }
                    return newLives
                })
                playSound("gameOver")
            }
        }

        // Actualizar balas
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i]

            // Mover bala
            bullet.x += bullet.xv
            bullet.y += bullet.yv

            // Contar tiempo de vida
            bullet.timer += deltaTime

            // Eliminar balas viejas
            if (bullet.timer > BULLET_LIFE) {
                bullets.splice(i, 1)
                continue
            }

            // Mantener bala en pantalla
            if (bullet.x < 0) {
                bullet.x = canvas.width
            } else if (bullet.x > canvas.width) {
                bullet.x = 0
            }
            if (bullet.y < 0) {
                bullet.y = canvas.height
            } else if (bullet.y > canvas.height) {
                bullet.y = 0
            }

            // Detectar colisión con asteroides
            for (let j = asteroids.length - 1; j >= 0; j--) {
                const asteroid = asteroids[j]

                if (distBetweenPoints(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.radius) {
                    // Eliminar bala
                    bullets.splice(i, 1)

                    // Destruir asteroide
                    destroyAsteroid(j)

                    // Salir del bucle de balas
                    break
                }
            }
        }

        // Comprobar si se han destruido todos los asteroides
        if (asteroids.length === 0) {
            setLevel((prev) => prev + 1)
            createAsteroidBelt()
            playSound("success")
        }
    }

    // Destruir asteroide
    const destroyAsteroid = (index) => {
        const asteroid = asteroidsRef.current[index]
        const x = asteroid.x
        const y = asteroid.y
        const radius = asteroid.radius
        const size = asteroid.size

        // Actualizar puntuación
        const points = ASTEROID_POINTS[size]
        setScore((prev) => prev + points)
        playSound("success")

        // Crear asteroides más pequeños
        if (size === "large") {
            asteroidsRef.current.push(newAsteroid(x, y, Math.ceil(radius / 2), "medium"))
            asteroidsRef.current.push(newAsteroid(x, y, Math.ceil(radius / 2), "medium"))
        } else if (size === "medium") {
            asteroidsRef.current.push(newAsteroid(x, y, Math.ceil(radius / 2), "small"))
            asteroidsRef.current.push(newAsteroid(x, y, Math.ceil(radius / 2), "small"))
        }

        // Eliminar asteroide
        asteroidsRef.current.splice(index, 1)
    }

    // Renderizar juego
    const render = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const ship = shipRef.current
        const bullets = bulletsRef.current
        const asteroids = asteroidsRef.current

        // Limpiar canvas
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Dibujar nave
        if (!ship.dead) {
            if (ship.blinkNum % 2 === 0 || ship.blinkNum === 0) {
                // Dibujar nave
                ctx.strokeStyle = "white"
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(
                    ship.x + (4 / 3) * ship.radius * Math.cos(ship.angle),
                    ship.y - (4 / 3) * ship.radius * Math.sin(ship.angle),
                )
                ctx.lineTo(
                    ship.x - ship.radius * ((2 / 3) * Math.cos(ship.angle) + Math.sin(ship.angle)),
                    ship.y + ship.radius * ((2 / 3) * Math.sin(ship.angle) - Math.cos(ship.angle)),
                )
                ctx.lineTo(
                    ship.x - ship.radius * ((2 / 3) * Math.cos(ship.angle) - Math.sin(ship.angle)),
                    ship.y + ship.radius * ((2 / 3) * Math.sin(ship.angle) + Math.cos(ship.angle)),
                )
                ctx.closePath()
                ctx.stroke()

                // Dibujar empuje
                if (ship.thrusting) {
                    ctx.fillStyle = "red"
                    ctx.beginPath()
                    ctx.moveTo(
                        ship.x - ship.radius * ((2 / 3) * Math.cos(ship.angle)),
                        ship.y + ship.radius * ((2 / 3) * Math.sin(ship.angle)),
                    )
                    ctx.lineTo(
                        ship.x - ((ship.radius * 6) / 3) * Math.cos(ship.angle),
                        ship.y + ((ship.radius * 6) / 3) * Math.sin(ship.angle),
                    )
                    ctx.lineTo(
                        ship.x - ship.radius * ((2 / 3) * Math.cos(ship.angle) + 0.5 * Math.sin(ship.angle)),
                        ship.y + ship.radius * ((2 / 3) * Math.sin(ship.angle) - 0.5 * Math.cos(ship.angle)),
                    )
                    ctx.closePath()
                    ctx.fill()
                }
            }

            // Dibujar explosión
            if (ship.exploding) {
                ctx.fillStyle = "red"
                ctx.beginPath()
                ctx.arc(ship.x, ship.y, ship.radius * 1.5, 0, Math.PI * 2)
                ctx.fill()
                ctx.fillStyle = "orange"
                ctx.beginPath()
                ctx.arc(ship.x, ship.y, ship.radius * 1.2, 0, Math.PI * 2)
                ctx.fill()
                ctx.fillStyle = "yellow"
                ctx.beginPath()
                ctx.arc(ship.x, ship.y, ship.radius * 0.8, 0, Math.PI * 2)
                ctx.fill()
                ctx.fillStyle = "white"
                ctx.beginPath()
                ctx.arc(ship.x, ship.y, ship.radius * 0.4, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        // Dibujar asteroides
        ctx.strokeStyle = "slategrey"
        ctx.lineWidth = 2
        for (let i = 0; i < asteroids.length; i++) {
            const asteroid = asteroids[i]

            // Dibujar polígono
            ctx.beginPath()
            ctx.moveTo(
                asteroid.x + asteroid.radius * asteroid.offs[0] * Math.cos(asteroid.angle),
                asteroid.y + asteroid.radius * asteroid.offs[0] * Math.sin(asteroid.angle),
            )

            for (let j = 1; j < asteroid.vert; j++) {
                ctx.lineTo(
                    asteroid.x +
                    asteroid.radius * asteroid.offs[j] * Math.cos(asteroid.angle + (j * Math.PI * 2) / asteroid.vert),
                    asteroid.y +
                    asteroid.radius * asteroid.offs[j] * Math.sin(asteroid.angle + (j * Math.PI * 2) / asteroid.vert),
                )
            }

            ctx.closePath()
            ctx.stroke()
        }

        // Dibujar balas
        ctx.fillStyle = "lime"
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i]
            ctx.beginPath()
            ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2)
            ctx.fill()
        }

        // Dibujar HUD
        ctx.fillStyle = "white"
        ctx.font = "20px Arial"
        ctx.textAlign = "right"
        ctx.fillText(`Score: ${score}`, canvas.width - 20, 30)
        ctx.textAlign = "left"
        ctx.fillText(`Level: ${level}`, 20, 30)

        // Dibujar vidas
        for (let i = 0; i < lives; i++) {
            const x = 20 + i * 30
            const y = 60

            ctx.strokeStyle = "white"
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(x + 10, y - 10)
            ctx.lineTo(x, y + 10)
            ctx.lineTo(x + 20, y + 10)
            ctx.closePath()
            ctx.stroke()
        }
    }

    // Eventos de teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            keysRef.current[e.key] = true
        }

        const handleKeyUp = (e) => {
            keysRef.current[e.key] = false
        }

        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("keyup", handleKeyUp)
        }
    }, [])

    // Manejar controles desde el pad
    const handleDirectionChange = (direction) => {
        if (!direction) {
            keysRef.current["ArrowUp"] = false
            keysRef.current["ArrowDown"] = false
            keysRef.current["ArrowLeft"] = false
            keysRef.current["ArrowRight"] = false
            keysRef.current["w"] = false
            keysRef.current["s"] = false
            keysRef.current["a"] = false
            keysRef.current["d"] = false
            return
        }

        // Establecer nueva dirección
        switch (direction) {
            case "up":
                keysRef.current["ArrowUp"] = true
                keysRef.current["w"] = true
                break
            case "down":
                keysRef.current["ArrowDown"] = true
                keysRef.current["s"] = true
                break
            case "left":
                keysRef.current["ArrowLeft"] = true
                keysRef.current["a"] = true
                break
            case "right":
                keysRef.current["ArrowRight"] = true
                keysRef.current["d"] = true
                break
        }
    }

    const handleButtonPress = (button) => {
        if (button === "a") {
            keysRef.current[" "] = true
            setTimeout(() => {
                keysRef.current[" "] = false
            }, 100)
        } else if (button === "b") {
            setIsPaused(!isPaused)
        }
    }

    const resetGame = () => {
        initGame()
        playSound("start")
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
            <div className="mb-2 flex justify-between w-full px-2">
                <div className="text-xs bg-gray-800 px-2 py-1 rounded-md shadow-inner border border-gray-700">
                    Vidas: {lives}
                </div>
                <button onClick={() => setIsPaused(!isPaused)} className="pause-button">
                    {isPaused ? "Reanudar" : "Pausa"}
                </button>
                <div className="text-xs bg-gray-800 px-2 py-1 rounded-md shadow-inner border border-gray-700">
                    Nivel: {level}
                </div>
            </div>

            <DifficultySelector difficulty={difficulty} onChange={setDifficulty} gameId="asteroids" />

            <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="border border-gray-700 bg-black shadow-lg rounded-md"
            />

            {/* Control Pad para dispositivos móviles */}
            <ControlPad onDirectionChange={handleDirectionChange} onButtonPress={handleButtonPress} />

            {/* Componente de puntuaciones altas */}
            <HighScore gameId="asteroids" />

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-2 text-yellow-500">Game Over</h3>
                    <p className="mb-4">
                        Puntuación final: {score}
                        <br />
                        Nivel alcanzado: {level}
                    </p>
                    <button
                        onClick={resetGame}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-white px-4 py-2 rounded-md shadow-lg border border-yellow-700 transition-all duration-200"
                    >
                        Jugar de nuevo
                    </button>
                </div>
            )}

            <div className="mt-2 text-xs text-center">
                <p>Flechas o WASD para mover, Espacio para disparar</p>
                <p>En móvil, usa el pad de control</p>
            </div>
        </div>
    )
}
