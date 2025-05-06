"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"
import { useSound } from "../../contexts/sound-context"

export default function SudokuGame() {
    const canvasRef = useRef(null)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [difficulty, setDifficulty] = useState("normal")
    const [selectedCell, setSelectedCell] = useState(null)
    const [mistakes, setMistakes] = useState(0)
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [board, setBoard] = useState([])
    const [solution, setSolution] = useState([])
    const [originalBoard, setOriginalBoard] = useState([])
    const { playSound } = useSound()
    const [showNumpad, setShowNumpad] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Detectar si es un dispositivo móvil
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window || navigator.maxTouchPoints > 0)
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)

        return () => {
            window.removeEventListener("resize", checkMobile)
        }
    }, [])

    // Inicializar el tablero
    useEffect(() => {
        generateNewGame()
    }, [difficulty])

    // Temporizador
    useEffect(() => {
        let interval
        if (!isPaused && !gameOver) {
            interval = setInterval(() => {
                setTimeElapsed((prev) => prev + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isPaused, gameOver])

    // Generar un nuevo juego
    const generateNewGame = () => {
        // Crear un tablero resuelto
        const solvedBoard = createSolvedBoard()
        setSolution(JSON.parse(JSON.stringify(solvedBoard)))

        // Eliminar números según la dificultad
        let cellsToRemove
        switch (difficulty) {
            case "easy":
                cellsToRemove = 30
                break
            case "hard":
                cellsToRemove = 55
                break
            default: // normal
                cellsToRemove = 45
                break
        }

        const gameBoard = JSON.parse(JSON.stringify(solvedBoard))
        removeNumbers(gameBoard, cellsToRemove)

        setBoard(JSON.parse(JSON.stringify(gameBoard)))
        setOriginalBoard(JSON.parse(JSON.stringify(gameBoard)))
        setMistakes(0)
        setTimeElapsed(0)
        setGameOver(false)
        setSelectedCell(null)
        setShowNumpad(false)
    }

    // Crear un tablero resuelto
    const createSolvedBoard = () => {
        // Crear un tablero vacío 9x9
        const board = Array(9)
            .fill()
            .map(() => Array(9).fill(0))

        // Llenar el tablero con una solución válida
        if (!solveSudoku(board)) {
            console.error("No se pudo generar un tablero válido")
        }

        return board
    }

    // Resolver el sudoku usando backtracking
    const solveSudoku = (board) => {
        const emptyCell = findEmptyCell(board)
        if (!emptyCell) return true // Tablero resuelto

        const [row, col] = emptyCell
        const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])

        for (const num of nums) {
            if (isValidPlacement(board, row, col, num)) {
                board[row][col] = num

                if (solveSudoku(board)) {
                    return true
                }

                board[row][col] = 0 // Backtrack
            }
        }

        return false
    }

    // Encontrar una celda vacía
    const findEmptyCell = (board) => {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    return [row, col]
                }
            }
        }
        return null
    }

    // Verificar si un número es válido en una posición
    const isValidPlacement = (board, row, col, num) => {
        // Verificar fila
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false
        }

        // Verificar columna
        for (let y = 0; y < 9; y++) {
            if (board[y][col] === num) return false
        }

        // Verificar cuadrante 3x3
        const boxRow = Math.floor(row / 3) * 3
        const boxCol = Math.floor(col / 3) * 3

        for (let y = boxRow; y < boxRow + 3; y++) {
            for (let x = boxCol; x < boxCol + 3; x++) {
                if (board[y][x] === num) return false
            }
        }

        return true
    }

    // Mezclar array (algoritmo Fisher-Yates)
    const shuffleArray = (array) => {
        const newArray = [...array]
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
        }
        return newArray
    }

    // Eliminar números del tablero
    const removeNumbers = (board, count) => {
        let removed = 0
        while (removed < count) {
            const row = Math.floor(Math.random() * 9)
            const col = Math.floor(Math.random() * 9)

            if (board[row][col] !== 0) {
                board[row][col] = 0
                removed++
            }
        }
    }

    // Renderizar el tablero en el canvas
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || board.length === 0) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const cellSize = canvas.width / 9

        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Dibujar fondo
        ctx.fillStyle = "#f8fafc"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Dibujar líneas de la cuadrícula
        ctx.strokeStyle = "#cbd5e1"
        ctx.lineWidth = 1

        for (let i = 0; i <= 9; i++) {
            // Líneas más gruesas para los bordes de los cuadrantes 3x3
            ctx.lineWidth = i % 3 === 0 ? 2 : 1
            ctx.strokeStyle = i % 3 === 0 ? "#64748b" : "#cbd5e1"

            // Líneas horizontales
            ctx.beginPath()
            ctx.moveTo(0, i * cellSize)
            ctx.lineTo(canvas.width, i * cellSize)
            ctx.stroke()

            // Líneas verticales
            ctx.beginPath()
            ctx.moveTo(i * cellSize, 0)
            ctx.lineTo(i * cellSize, canvas.height)
            ctx.stroke()
        }

        // Dibujar números
        ctx.font = `${cellSize * 0.6}px Arial`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = board[row][col]
                if (value !== 0) {
                    // Determinar si es un número original o añadido por el jugador
                    const isOriginal = originalBoard[row][col] !== 0

                    // Resaltar celda seleccionada
                    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                        ctx.fillStyle = "#bfdbfe"
                        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
                    }

                    // Color del número según si es original o añadido
                    ctx.fillStyle = isOriginal ? "#1e293b" : "#3b82f6"
                    ctx.fillText(value.toString(), col * cellSize + cellSize / 2, row * cellSize + cellSize / 2)
                } else if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                    // Resaltar celda vacía seleccionada
                    ctx.fillStyle = "#bfdbfe"
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
                }
            }
        }
    }, [board, selectedCell, originalBoard])

    // Manejar clics en el tablero
    const handleCanvasClick = (e) => {
        if (gameOver) return

        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const cellSize = canvas.width / 9
        const col = Math.floor(x / cellSize)
        const row = Math.floor(y / cellSize)

        // No permitir seleccionar celdas originales
        if (originalBoard[row][col] !== 0) {
            playSound("click")
            return
        }

        setSelectedCell({ row, col })
        if (isMobile) {
            setShowNumpad(true) // Mostrar teclado numérico en móviles
        }
        playSound("hover")
    }

    // Manejar entrada de teclado
    const handleKeyDown = (e) => {
        if (gameOver || !selectedCell) return

        const { row, col } = selectedCell

        // Verificar si la celda es editable (no es original)
        if (originalBoard[row][col] !== 0) return

        if (e.key >= "1" && e.key <= "9") {
            const num = Number.parseInt(e.key)
            handleNumberInput(num)
        } else if (e.key === "Backspace" || e.key === "Delete") {
            // Borrar número
            const newBoard = [...board]
            newBoard[row][col] = 0
            setBoard(newBoard)
            playSound("click")
        }
    }

    // Manejar entrada de número (desde teclado físico o virtual)
    const handleNumberInput = (num) => {
        if (!selectedCell) return

        const { row, col } = selectedCell
        const newBoard = [...board]

        // Verificar si el número es correcto
        if (num === solution[row][col]) {
            newBoard[row][col] = num
            setBoard(newBoard)
            playSound("success")

            // Verificar si el tablero está completo
            if (isBoardComplete(newBoard)) {
                setGameOver(true)
                playSound("success")
            }
        } else {
            // Número incorrecto
            setMistakes(mistakes + 1)
            playSound("click")

            // Game over después de 3 errores
            if (mistakes + 1 >= 3) {
                setGameOver(true)
                playSound("gameOver")
            }
        }
    }

    // Borrar número de la celda seleccionada
    const handleClearCell = () => {
        if (!selectedCell) return

        const { row, col } = selectedCell
        const newBoard = [...board]
        newBoard[row][col] = 0
        setBoard(newBoard)
        playSound("click")
    }

    // Verificar si el tablero está completo
    const isBoardComplete = (board) => {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) return false
            }
        }
        return true
    }

    // Formatear tiempo
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    // Configurar eventos
    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown)
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [selectedCell, board, mistakes, solution, originalBoard, gameOver])

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
            <div className="mb-2 flex justify-between w-full px-2">
                <div className="text-xs">Tiempo: {formatTime(timeElapsed)}</div>
                <button onClick={() => setIsPaused(!isPaused)} className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {isPaused ? "Reanudar" : "Pausa"}
                </button>
                <div className="text-xs">Errores: {mistakes}/3</div>
            </div>

            <DifficultySelector
                difficulty={difficulty}
                onChange={(newDifficulty) => {
                    setDifficulty(newDifficulty)
                    // No regeneramos el juego aquí, solo actualizamos la dificultad
                }}
                gameId="sudoku"
            />

            <button
                onClick={generateNewGame}
                className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
            >
                Nuevo juego
            </button>

            <canvas
                ref={canvasRef}
                width={360}
                height={360}
                className="border border-gray-700 bg-white shadow-md"
                onClick={handleCanvasClick}
            />

            {/* Teclado numérico para dispositivos móviles */}
            {showNumpad && selectedCell && (
                <div className="mt-4 grid grid-cols-3 gap-2 w-full max-w-xs">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberInput(num)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleClearCell}
                        className="col-span-3 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded"
                    >
                        Borrar
                    </button>
                </div>
            )}

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                    <h3 className="text-xl font-bold mb-2">{isBoardComplete(board) ? "¡Felicidades!" : "Game Over"}</h3>
                    <p className="mb-4">
                        {isBoardComplete(board) ? `Has completado el Sudoku en ${formatTime(timeElapsed)}` : "Demasiados errores"}
                    </p>
                    <button onClick={generateNewGame} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                        Jugar de nuevo
                    </button>
                </div>
            )}

            <div className="mt-2 text-xs text-center">
                <p>Haz clic para seleccionar una celda</p>
                <p>Usa los números del teclado o el teclado en pantalla</p>
            </div>
        </div>
    )
}
