"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"
import { ControlPad } from "../control-pad"
import { useSound } from "../../contexts/sound-context"

export default function DoomGame() {
    const canvasRef = useRef(null)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [difficulty, setDifficulty] = useState("normal")
    const [score, setScore] = useState(0)
    const [health, setHealth] = useState(100)
    const [ammo, setAmmo] = useState(50)
    const { playSound } = useSound()

    // Referencias para el estado del juego
    const gameLoopRef = useRef(null)
    const playerRef = useRef({
        x: 2.5,
        y: 2.5,
        angle: 0,
        speed: 0.05,
    })
    const keysRef = useRef({})
    const enemiesRef = useRef([])
    const lastShotTimeRef = useRef(0)
    const weaponFrameRef = useRef(0)

    // Mapa del nivel (1 = pared, 0 = espacio vacío)
    const MAP = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]

    // Colores para las paredes
    const WALL_COLORS = [
        "#8B0000", // Rojo oscuro
        "#A52A2A", // Marrón
        "#B22222", // Rojo fuego
        "#CD5C5C", // Rojo indio
    ]

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
        // Reiniciar estado del jugador
        playerRef.current = {
            x: 2.5,
            y: 2.5,
            angle: 0,
            speed: difficulty === "easy" ? 0.04 : difficulty === "hard" ? 0.06 : 0.05,
        }

        // Reiniciar enemigos
        enemiesRef.current = [
            { x: 5.5, y: 5.5, health: difficulty === "easy" ? 80 : difficulty === "hard" ? 120 : 100, type: 0 },
            { x: 10.5, y: 5.5, health: difficulty === "easy" ? 80 : difficulty === "hard" ? 120 : 100, type: 0 },
            { x: 5.5, y: 10.5, health: difficulty === "easy" ? 80 : difficulty === "hard" ? 120 : 100, type: 0 },
            { x: 10.5, y: 10.5, health: difficulty === "easy" ? 80 : difficulty === "hard" ? 120 : 100, type: 0 },
        ]

        // Reiniciar puntuación y salud
        setScore(0)
        setHealth(difficulty === "easy" ? 120 : difficulty === "hard" ? 80 : 100)
        setAmmo(difficulty === "easy" ? 60 : difficulty === "hard" ? 40 : 50)

        // Reiniciar estado del juego
        setGameOver(false)
        setIsPaused(false)
        weaponFrameRef.current = 0

        // Iniciar el bucle del juego
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current)
        }
        gameLoop()
    }

    // Función para comprobar si una posición es una pared
    const isWall = (x, y) => {
        const mapX = Math.floor(x)
        const mapY = Math.floor(y)

        if (mapX < 0 || mapX >= MAP[0].length || mapY < 0 || mapY >= MAP.length) {
            return true
        }

        return MAP[mapY][mapX] > 0
    }

    // Función para disparar
    const shoot = () => {
        if (ammo <= 0) return

        // Comprobar tiempo desde el último disparo
        const now = Date.now()
        if (now - lastShotTimeRef.current < 500) return

        lastShotTimeRef.current = now
        setAmmo((prev) => prev - 1)

        // Animar arma
        weaponFrameRef.current = 1
        setTimeout(() => {
            weaponFrameRef.current = 0
        }, 150)

        playSound("click")

        // Comprobar si hay enemigos en la línea de visión
        const player = playerRef.current
        const enemies = enemiesRef.current

        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i]
            const dx = enemy.x - player.x
            const dy = enemy.y - player.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 5) {
                const angle = Math.atan2(dy, dx)
                const angleDiff = Math.abs(angle - player.angle)

                if (angleDiff < 0.3 || angleDiff > Math.PI * 2 - 0.3) {
                    // Daño al enemigo
                    enemy.health -= 25

                    // Comprobar si el enemigo ha muerto
                    if (enemy.health <= 0) {
                        enemies.splice(i, 1)
                        setScore((prev) => prev + 100)
                        playSound("success")

                        // Comprobar victoria
                        if (enemies.length === 0) {
                            setGameOver(true)
                            playSound("success")
                        }
                    }
                    break
                }
            }
        }
    }

    // Bucle principal del juego
    const gameLoop = () => {
        if (gameOver || isPaused) {
            gameLoopRef.current = requestAnimationFrame(gameLoop)
            return
        }

        // Actualizar estado del juego
        updateGame()

        // Renderizar juego
        renderGame()

        gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    // Actualizar estado del juego
    const updateGame = () => {
        const player = playerRef.current
        const keys = keysRef.current
        const enemies = enemiesRef.current

        // Mover jugador
        if (keys["ArrowUp"] || keys["w"]) {
            const newX = player.x + Math.cos(player.angle) * player.speed
            const newY = player.y + Math.sin(player.angle) * player.speed

            // Comprobar colisión con paredes
            if (!isWall(newX, player.y)) player.x = newX
            if (!isWall(player.x, newY)) player.y = newY
        }

        if (keys["ArrowDown"] || keys["s"]) {
            const newX = player.x - Math.cos(player.angle) * player.speed
            const newY = player.y - Math.sin(player.angle) * player.speed

            if (!isWall(newX, player.y)) player.x = newX
            if (!isWall(player.x, newY)) player.y = newY
        }

        if (keys["ArrowLeft"] || keys["a"]) {
            player.angle -= 0.03
        }

        if (keys["ArrowRight"] || keys["d"]) {
            player.angle += 0.03
        }

        // Mover enemigos hacia el jugador
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i]
            const dx = player.x - enemy.x
            const dy = player.y - enemy.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            // Si el enemigo está cerca, atacar al jugador
            if (distance < 0.5) {
                setHealth((prev) => {
                    const newHealth = prev - 1
                    if (newHealth <= 0) {
                        setGameOver(true)
                        playSound("gameOver")
                    }
                    return newHealth
                })
            }
            // Si el enemigo está a distancia media, moverse hacia el jugador
            else if (distance < 8) {
                const angle = Math.atan2(dy, dx)
                const speed = 0.02

                const newX = enemy.x + Math.cos(angle) * speed
                const newY = enemy.y + Math.sin(angle) * speed

                // Comprobar colisión con paredes
                if (!isWall(newX, enemy.y)) enemy.x = newX
                if (!isWall(enemy.x, newY)) enemy.y = newY
            }
        }
    }

    // Renderizar juego
    const renderGame = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height
        const player = playerRef.current

        // Limpiar canvas
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, width, height)

        // Dibujar cielo
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height / 2)
        skyGradient.addColorStop(0, "#000033")
        skyGradient.addColorStop(1, "#660000")
        ctx.fillStyle = skyGradient
        ctx.fillRect(0, 0, width, height / 2)

        // Dibujar suelo
        const floorGradient = ctx.createLinearGradient(0, height / 2, 0, height)
        floorGradient.addColorStop(0, "#330000")
        floorGradient.addColorStop(1, "#000000")
        ctx.fillStyle = floorGradient
        ctx.fillRect(0, height / 2, width, height)

        // Raycasting para renderizar paredes
        const FOV = Math.PI / 3 // 60 grados
        const rayCount = width
        const rayStep = FOV / rayCount

        for (let i = 0; i < rayCount; i++) {
            const rayAngle = player.angle - FOV / 2 + rayStep * i
            const [distance, wallType] = castRay(player.x, player.y, rayAngle)

            // Corregir efecto ojo de pez
            const correctedDistance = distance * Math.cos(rayAngle - player.angle)

            // Calcular altura de la pared
            const wallHeight = Math.min((height / correctedDistance) * 0.5, height)
            const wallTop = (height - wallHeight) / 2

            // Dibujar columna de pared
            const brightness = 1 - Math.min(distance / 10, 0.8)
            const wallColor = WALL_COLORS[wallType - 1] || WALL_COLORS[0]

            // Aplicar sombreado basado en la distancia
            const r = Number.parseInt(wallColor.slice(1, 3), 16) * brightness
            const g = Number.parseInt(wallColor.slice(3, 5), 16) * brightness
            const b = Number.parseInt(wallColor.slice(5, 7), 16) * brightness
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
            ctx.fillRect(i, wallTop, 1, wallHeight)
        }

        // Dibujar enemigos
        drawEnemies(ctx, width, height)

        // Dibujar arma
        drawWeapon(ctx, width, height)

        // Dibujar HUD
        drawHUD(ctx, width, height)
    }

    // Función para lanzar un rayo y detectar paredes
    const castRay = (x, y, angle) => {
        const rayDirX = Math.cos(angle)
        const rayDirY = Math.sin(angle)
        let distance = 0
        let wallType = 0

        // Incrementar distancia hasta encontrar una pared
        while (distance < 20) {
            distance += 0.05
            const testX = x + rayDirX * distance
            const testY = y + rayDirY * distance

            // Comprobar si el rayo golpea una pared
            const mapX = Math.floor(testX)
            const mapY = Math.floor(testY)

            if (mapX >= 0 && mapX < MAP[0].length && mapY >= 0 && mapY < MAP.length) {
                if (MAP[mapY][mapX] > 0) {
                    wallType = MAP[mapY][mapX]
                    break
                }
            } else {
                break
            }
        }

        return [distance, wallType]
    }

    // Dibujar enemigos
    const drawEnemies = (ctx, width, height) => {
        const player = playerRef.current
        const enemies = enemiesRef.current

        // Ordenar enemigos por distancia (de más lejano a más cercano)
        const sortedEnemies = [...enemies].sort((a, b) => {
            const distA = Math.hypot(a.x - player.x, a.y - player.y)
            const distB = Math.hypot(b.x - player.x, b.y - player.y)
            return distB - distA
        })

        // Renderizar cada enemigo
        for (const enemy of sortedEnemies) {
            // Calcular posición relativa al jugador
            const dx = enemy.x - player.x
            const dy = enemy.y - player.y

            // Calcular ángulo y distancia
            const distance = Math.sqrt(dx * dx + dy * dy)
            const angle = Math.atan2(dy, dx)

            // Comprobar si el enemigo está en el campo de visión
            const relativeAngle = (angle - player.angle + Math.PI * 2) % (Math.PI * 2)
            const normalizedAngle = relativeAngle > Math.PI ? relativeAngle - Math.PI * 2 : relativeAngle

            if (Math.abs(normalizedAngle) < Math.PI / 3) {
                // Calcular tamaño y posición en pantalla
                const size = Math.min((height / distance) * 0.5, height)
                const x = width / 2 + (normalizedAngle / (Math.PI / 3)) * (width / 2) - size / 2
                const y = (height - size) / 2

                // Dibujar enemigo
                ctx.fillStyle = "#FF0000"
                ctx.globalAlpha = 1 - Math.min(distance / 10, 0.8)
                ctx.fillRect(x, y, size, size)
                ctx.globalAlpha = 1.0
            }
        }
    }

    // Dibujar arma
    const drawWeapon = (ctx, width, height) => {
        const weaponWidth = width / 3
        const weaponHeight = height / 4
        const weaponX = (width - weaponWidth) / 2
        const weaponY = height - weaponHeight

        // Dibujar pistola
        ctx.fillStyle = "#333"
        ctx.fillRect(weaponX, weaponY, weaponWidth, weaponHeight / 2)

        // Si está disparando, dibujar destello
        if (weaponFrameRef.current === 1) {
            ctx.fillStyle = "#FF0"
            ctx.beginPath()
            ctx.arc(width / 2, weaponY - 10, 10, 0, Math.PI * 2)
            ctx.fill()
        }
    }

    // Dibujar HUD
    const drawHUD = (ctx, width, height) => {
        // Fondo semitransparente
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.fillRect(10, height - 60, 150, 50)

        // Texto
        ctx.font = "12px monospace"
        ctx.fillStyle = "#FFF"
        ctx.fillText(`Salud: ${health}`, 20, height - 40)
        ctx.fillText(`Munición: ${ammo}`, 20, height - 25)
        ctx.fillText(`Puntuación: ${score}`, 20, height - 10)
    }

    // Eventos de teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            keysRef.current[e.key] = true

            if (e.key === " ") {
                shoot()
            }
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
    }, [ammo])

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
            shoot()
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
                <div className="text-xs">Salud: {health}</div>
                <button onClick={() => setIsPaused(!isPaused)} className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {isPaused ? "Reanudar" : "Pausa"}
                </button>
                <div className="text-xs">Munición: {ammo}</div>
            </div>

            <DifficultySelector difficulty={difficulty} onChange={setDifficulty} gameId="doom" />

            <canvas ref={canvasRef} width={320} height={240} className="border border-gray-700 bg-black" />

            {/* Control Pad para dispositivos móviles */}
            <ControlPad onDirectionChange={handleDirectionChange} onButtonPress={handleButtonPress} />

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                    <h3 className="text-xl font-bold mb-2">Game Over</h3>
                    <p className="mb-4">
                        {enemiesRef.current.length === 0 ? "¡Victoria!" : "Has sido derrotado"}
                        <br />
                        Puntuación: {score}
                    </p>
                    <button onClick={resetGame} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                        Jugar de nuevo
                    </button>
                </div>
            )}

            <div className="mt-2 text-xs text-center">
                <p>WASD o flechas para moverte, Espacio para disparar</p>
                <p>En móvil, usa el pad de control</p>
            </div>
        </div>
    )
}
