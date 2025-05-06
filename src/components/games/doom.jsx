"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"
import { HighScore } from "../high-score"
import { useSound } from "../../contexts/sound-context"
import "../pause-button.css"
import { ControlPad } from "../control-pad"

export default function DoomGame() {
    const canvasRef = useRef(null)
    const [score, setScore] = useState(0)
    const [health, setHealth] = useState(100)
    const [ammo, setAmmo] = useState(50)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [difficulty, setDifficulty] = useState("normal")
    const [level, setLevel] = useState(1)
    const [enemiesKilled, setEnemiesKilled] = useState(0)
    const [message, setMessage] = useState("")
    const { playSound } = useSound()

    // Referencias para el estado del juego
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
    const gameLoopRef = useRef(null)
    const messageTimeoutRef = useRef(null)

    // Mapa del nivel (1 = pared, 0 = espacio vacío)
    const MAPS = [
        // Nivel 1
        [
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
        ],
        // Nivel 2
        [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
            [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
            [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ],
        // Nivel 3
        [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ],
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
            if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current)
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

        // Reiniciar nivel
        setLevel(1)

        // Reiniciar enemigos
        createEnemies(1)

        // Reiniciar puntuación y salud
        setScore(0)
        setHealth(difficulty === "easy" ? 120 : difficulty === "hard" ? 80 : 100)
        setAmmo(difficulty === "easy" ? 60 : difficulty === "hard" ? 40 : 50)
        setEnemiesKilled(0)

        // Reiniciar estado del juego
        setGameOver(false)
        setIsPaused(false)
        weaponFrameRef.current = 0

        // Mostrar mensaje de inicio
        showMessage("¡Bienvenido a DOOM! Nivel 1")

        // Iniciar el bucle del juego
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current)
        }

        // Pequeño retraso para asegurar que los estados se hayan actualizado
        setTimeout(() => {
            gameLoop()
        }, 50)
    }

    // Crear enemigos según el nivel
    const createEnemies = (currentLevel) => {
        const enemyCount = Math.min(4 + currentLevel, 10)
        const enemyHealth = difficulty === "easy" ? 80 : difficulty === "hard" ? 120 : 100

        enemiesRef.current = []

        // Posiciones predefinidas para evitar que aparezcan en paredes
        const positions = [
            { x: 5.5, y: 5.5 },
            { x: 10.5, y: 5.5 },
            { x: 5.5, y: 10.5 },
            { x: 10.5, y: 10.5 },
            { x: 8.0, y: 8.0 },
            { x: 3.5, y: 12.5 },
            { x: 12.5, y: 3.5 },
            { x: 12.5, y: 12.5 },
            { x: 3.5, y: 3.5 },
            { x: 8.0, y: 3.5 },
        ]

        for (let i = 0; i < enemyCount; i++) {
            if (i < positions.length) {
                enemiesRef.current.push({
                    x: positions[i].x,
                    y: positions[i].y,
                    health: enemyHealth + currentLevel * 10,
                    type: Math.floor(Math.random() * 3),
                    speed: (0.01 + currentLevel * 0.002) * (difficulty === "easy" ? 0.8 : difficulty === "hard" ? 1.2 : 1),
                })
            }
        }
    }

    // Mostrar mensaje temporal
    const showMessage = (msg) => {
        setMessage(msg)
        if (messageTimeoutRef.current) {
            clearTimeout(messageTimeoutRef.current)
        }
        messageTimeoutRef.current = setTimeout(() => {
            setMessage("")
        }, 3000)
    }

    // Función para comprobar si una posición es una pared
    const isWall = (x, y) => {
        const mapX = Math.floor(x)
        const mapY = Math.floor(y)
        const currentMap = MAPS[level - 1] || MAPS[0]

        if (mapX < 0 || mapX >= currentMap[0].length || mapY < 0 || mapY >= currentMap.length) {
            return true
        }

        return currentMap[mapY][mapX] > 0
    }

    // Función para disparar
    const shoot = () => {
        if (ammo <= 0) return

        // Comprobar tiempo desde el último disparo
        const now = Date.now()
        if (now - lastShotTimeRef.current < 500) return

        lastShotTimeRef.current = now
        setAmmo((prev) => Math.max(0, prev - 1))

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
                        setEnemiesKilled((prev) => prev + 1)
                        playSound("success")

                        // Comprobar victoria del nivel
                        if (enemies.length === 0) {
                            if (level < MAPS.length) {
                                // Avanzar al siguiente nivel
                                setLevel((prev) => {
                                    const newLevel = prev + 1
                                    createEnemies(newLevel)
                                    showMessage(`¡Nivel ${newLevel} completado!`)

                                    // Recargar munición y dar bonus de salud
                                    setAmmo((prev) => Math.min(prev + 30, 99))
                                    setHealth((prev) => Math.min(prev + 20, 100))

                                    // Reposicionar jugador
                                    playerRef.current.x = 2.5
                                    playerRef.current.y = 2.5

                                    return newLevel
                                })
                            } else {
                                // Victoria final
                                setGameOver(true)
                                showMessage("¡Has completado el juego!")
                                playSound("success")
                                saveHighScore()
                            }
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

        // Sincronizar estados de React con las referencias
        setAmmo(Math.max(0, ammo))
        setEnemiesKilled(enemiesKilled)

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
                    const damage = difficulty === "easy" ? 0.5 : difficulty === "hard" ? 2 : 1
                    const newHealth = prev - damage
                    if (newHealth <= 0) {
                        setGameOver(true)
                        playSound("gameOver")
                        saveHighScore()
                    }
                    return newHealth > 0 ? newHealth : 0
                })
            }
            // Si el enemigo está a distancia media, moverse hacia el jugador
            else if (distance < 8) {
                const angle = Math.atan2(dy, dx)
                const speed = enemy.speed || 0.02

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
        const currentMap = MAPS[level - 1] || MAPS[0]

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
            const [distance, wallType] = castRay(player.x, player.y, rayAngle, currentMap)

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

            // Dibujar textura de pared
            ctx.fillRect(i, wallTop, 1, wallHeight)

            // Añadir efecto de líneas horizontales para simular textura
            if (Math.floor(wallTop + wallHeight / 2) % 4 === 0) {
                ctx.fillStyle = `rgba(0, 0, 0, 0.3)`
                ctx.fillRect(i, wallTop, 1, wallHeight)
            }
        }

        // Dibujar enemigos
        drawEnemies(ctx, width, height)

        // Dibujar arma
        drawWeapon(ctx, width, height)

        // Dibujar HUD
        drawHUD(ctx, width, height)

        // Dibujar mensaje
        if (message) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
            ctx.fillRect(width / 2 - 150, height / 2 - 25, 300, 50)
            ctx.fillStyle = "#FFF"
            ctx.font = "16px Arial"
            ctx.textAlign = "center"
            ctx.fillText(message, width / 2, height / 2 + 5)
        }
    }

    // Función para lanzar un rayo y detectar paredes
    const castRay = (x, y, angle, map) => {
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

            if (mapX >= 0 && mapX < map[0].length && mapY >= 0 && mapY < map.length) {
                if (map[mapY][mapX] > 0) {
                    wallType = map[mapY][mapX]
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
                ctx.globalAlpha = 1 - Math.min(distance / 10, 0.8)

                // Diferentes tipos de enemigos
                if (enemy.type === 0) {
                    // Demonio rojo
                    ctx.fillStyle = "#FF0000"
                    ctx.fillRect(x, y, size, size)

                    // Ojos
                    ctx.fillStyle = "#FFFF00"
                    ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.15, size * 0.15)
                    ctx.fillRect(x + size * 0.65, y + size * 0.2, size * 0.15, size * 0.15)

                    // Boca
                    ctx.fillStyle = "#000000"
                    ctx.fillRect(x + size * 0.3, y + size * 0.6, size * 0.4, size * 0.2)
                } else if (enemy.type === 1) {
                    // Soldado
                    ctx.fillStyle = "#00AA00"
                    ctx.fillRect(x, y, size, size)

                    // Casco
                    ctx.fillStyle = "#555555"
                    ctx.fillRect(x, y, size, size * 0.3)

                    // Visor
                    ctx.fillStyle = "#FF0000"
                    ctx.fillRect(x + size * 0.3, y + size * 0.15, size * 0.4, size * 0.1)
                } else {
                    // Cacodemon
                    ctx.fillStyle = "#AA00AA"
                    ctx.beginPath()
                    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
                    ctx.fill()

                    // Ojo
                    ctx.fillStyle = "#FF0000"
                    ctx.beginPath()
                    ctx.arc(x + size / 2, y + size / 3, size / 4, 0, Math.PI * 2)
                    ctx.fill()

                    // Pupila
                    ctx.fillStyle = "#000000"
                    ctx.beginPath()
                    ctx.arc(x + size / 2, y + size / 3, size / 8, 0, Math.PI * 2)
                    ctx.fill()
                }

                ctx.globalAlpha = 1.0

                // Barra de salud
                const healthPercent = enemy.health / (difficulty === "easy" ? 80 : difficulty === "hard" ? 120 : 100)
                ctx.fillStyle = healthPercent > 0.6 ? "#00FF00" : healthPercent > 0.3 ? "#FFFF00" : "#FF0000"
                ctx.fillRect(x, y - 10, size * healthPercent, 5)
                ctx.strokeStyle = "#000"
                ctx.strokeRect(x, y - 10, size, 5)
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
        // Ajustar posición vertical según si está disparando
        const offsetY = weaponFrameRef.current === 1 ? -5 : 0

        // Dibujar arma
        ctx.fillStyle = "#333"
        ctx.fillRect(weaponX, weaponY + offsetY, weaponWidth, weaponHeight / 2)

        // Cañón
        ctx.fillStyle = "#222"
        ctx.fillRect(weaponX + weaponWidth / 2 - 5, weaponY + offsetY - 10, 10, 20)

        // Detalles
        ctx.fillStyle = "#444"
        ctx.fillRect(weaponX + 10, weaponY + offsetY + 10, weaponWidth - 20, 10)

        // Si está disparando, dibujar destello
        if (weaponFrameRef.current === 1) {
            ctx.fillStyle = "#FF0"
            ctx.beginPath()
            ctx.arc(width / 2, weaponY - 10, 10, 0, Math.PI * 2)
            ctx.fill()

            // Rayos del destello
            ctx.strokeStyle = "#FF0"
            ctx.lineWidth = 2
            ctx.beginPath()
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4
                ctx.moveTo(width / 2, weaponY - 10)
                ctx.lineTo(width / 2 + Math.cos(angle) * 15, weaponY - 10 + Math.sin(angle) * 15)
            }
            ctx.stroke()
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
        ctx.fillText(`Salud: ${Math.floor(health)}`, 20, height - 40)
        ctx.fillText(`Munición: ${ammo}`, 20, height - 25)
        ctx.fillText(`Puntuación: ${score}`, 20, height - 10)

        // Nivel y enemigos
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.fillRect(width - 160, height - 60, 150, 50)
        ctx.fillStyle = "#FFF"
        ctx.fillText(`Nivel: ${level}`, width - 150, height - 40)
        ctx.fillText(`Enemigos: ${enemiesRef.current.length}`, width - 150, height - 25)
        ctx.fillText(`Eliminados: ${enemiesKilled}`, width - 150, height - 10)
    }

    // Guardar puntuación alta
    const saveHighScore = () => {
        if (score > 0) {
            const highScores = JSON.parse(localStorage.getItem("highScores") || "{}")
            const gameHighScores = highScores.doom || []

            // Añadir nueva puntuación
            gameHighScores.push({
                score,
                date: new Date().toISOString(),
                difficulty,
                level,
                enemiesKilled,
            })

            // Ordenar y limitar a 5 puntuaciones
            gameHighScores.sort((a, b) => b.score - a.score)
            highScores.doom = gameHighScores.slice(0, 5)

            // Guardar en localStorage
            localStorage.setItem("highScores", JSON.stringify(highScores))
        }
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

    // Añadir un useEffect para sincronizar el estado con las referencias
    useEffect(() => {
        // Esta función se ejecutará después de cada renderizado
        // para asegurarse de que los estados estén sincronizados
        const syncInterval = setInterval(() => {
            if (!gameOver && !isPaused) {
                // Actualizar el estado con los valores actuales de las referencias
                setAmmo((prev) => Math.max(0, prev))
                setEnemiesKilled((prev) => enemiesKilled)
            }
        }, 100) // Actualizar cada 100ms

        return () => clearInterval(syncInterval)
    }, [gameOver, isPaused])

    const resetGame = () => {
        initGame()
        playSound("start")
    }

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

    // Modificar el componente para mostrar correctamente los valores actuales
    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
            <div className="mb-2 flex justify-between w-full px-2">
                <div className="text-xs bg-gray-800 px-2 py-1 rounded-md shadow-inner border border-gray-700">
                    Salud: {Math.floor(health)}
                </div>
                <button onClick={() => setIsPaused(!isPaused)} className="pause-button">
                    {isPaused ? "Reanudar" : "Pausa"}
                </button>
                <div className="text-xs bg-gray-800 px-2 py-1 rounded-md shadow-inner border border-gray-700">
                    Munición: {ammo}
                </div>
            </div>

            <div className="mb-2 flex justify-between w-full px-2">
                <div className="text-xs bg-gray-800 px-2 py-1 rounded-md shadow-inner border border-gray-700">
                    Nivel: {level}
                </div>
                <div className="text-xs bg-gray-800 px-2 py-1 rounded-md shadow-inner border border-gray-700">
                    Enemigos: {enemiesRef.current ? enemiesRef.current.length : 0}
                </div>
            </div>

            <DifficultySelector difficulty={difficulty} onChange={setDifficulty} gameId="doom" />

            <canvas
                ref={canvasRef}
                width={320}
                height={240}
                className="border border-gray-700 bg-black shadow-lg rounded-md"
            />

            {/* Control Pad para dispositivos móviles */}
            <ControlPad onDirectionChange={handleDirectionChange} onButtonPress={handleButtonPress} />

            {/* Componente de puntuaciones altas */}
            <HighScore gameId="doom" />

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-2 text-red-500">Game Over</h3>
                    <p className="mb-4">
                        {enemiesRef.current && enemiesRef.current.length === 0 && level >= MAPS.length
                            ? "¡Victoria!"
                            : "Has sido derrotado"}
                        <br />
                        Puntuación: {score}
                        <br />
                        Nivel: {level}
                        <br />
                        Enemigos eliminados: {enemiesKilled}
                    </p>
                    <button
                        onClick={resetGame}
                        className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white px-4 py-2 rounded-md shadow-lg border border-red-700 transition-all duration-200"
                    >
                        Jugar de nuevo
                    </button>
                </div>
            )}

            <div className="mt-2 text-xs text-center">
                <p>WASD o flechas para moverte, Espacio para disparar</p>
                <p>Elimina a todos los enemigos para avanzar de nivel</p>
            </div>
        </div>
    )
}
