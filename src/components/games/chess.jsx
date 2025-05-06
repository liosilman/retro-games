"use client"

import { useEffect, useRef, useState } from "react"
import { DifficultySelector } from "../difficulty-selector"
import { useSound } from "../../contexts/sound-context"
// Importar el componente de diálogo de promoción
import { PromotionDialog } from "./chess-promotion-dialog"

export default function ChessGame() {
    const canvasRef = useRef(null)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [difficulty, setDifficulty] = useState("normal")
    const [selectedPiece, setSelectedPiece] = useState(null)
    const [turn, setTurn] = useState("white") // white o black
    const [board, setBoard] = useState(null)
    const [playAgainstAI, setPlayAgainstAI] = useState(true)
    const [winner, setWinner] = useState(null)
    const [validMoves, setValidMoves] = useState([])
    const { playSound } = useSound()

    // Añadir estos estados al componente ChessGame
    const [showPromotionDialog, setShowPromotionDialog] = useState(false)
    const [promotionPosition, setPromotionPosition] = useState(null)
    const [pendingBoard, setPendingBoard] = useState(null)

    // Estado para rastrear si las piezas se han movido (para el enroque)
    const [castlingState, setCastlingState] = useState({
        whiteKingMoved: false,
        whiteRookKingSideMoved: false,
        whiteRookQueenSideMoved: false,
        blackKingMoved: false,
        blackRookKingSideMoved: false,
        blackRookQueenSideMoved: false,
    })

    // Inicializar el tablero
    useEffect(() => {
        resetGame()
    }, [])

    // Renderizar el tablero
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !board) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Tamaño del tablero
        const BOARD_SIZE = canvas.width
        const CELL_SIZE = BOARD_SIZE / 8

        // Limpiar canvas
        ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE)

        // Dibujar el tablero
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                // Alternar colores del tablero
                ctx.fillStyle = (row + col) % 2 === 0 ? "#f0d9b5" : "#b58863"
                ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE)

                // Dibujar pieza si existe
                if (board[row][col]) {
                    drawPiece(ctx, board[row][col], col, row, CELL_SIZE)
                }
            }
        }

        // Resaltar casilla seleccionada
        if (selectedPiece) {
            ctx.strokeStyle = "#3b82f6"
            ctx.lineWidth = 3
            ctx.strokeRect(selectedPiece.col * CELL_SIZE, selectedPiece.row * CELL_SIZE, CELL_SIZE, CELL_SIZE)

            // Resaltar movimientos válidos
            ctx.fillStyle = "rgba(59, 130, 246, 0.3)"
            for (const move of validMoves) {
                ctx.beginPath()
                ctx.arc((move.col + 0.5) * CELL_SIZE, (move.row + 0.5) * CELL_SIZE, CELL_SIZE / 4, 0, Math.PI * 2)
                ctx.fill()
            }
        }
    }, [board, selectedPiece, validMoves])

    // Dibujar una pieza
    const drawPiece = (ctx, piece, col, row, cellSize) => {
        const color = piece.charAt(0) === "w" ? "white" : "black"
        const type = piece.charAt(1)

        // Usar emojis para representar piezas
        let emoji = ""
        switch (type) {
            case "P":
                emoji = color === "white" ? "♙" : "♟"
                break
            case "R":
                emoji = color === "white" ? "♖" : "♜"
                break
            case "N":
                emoji = color === "white" ? "♘" : "♞"
                break
            case "B":
                emoji = color === "white" ? "♗" : "♝"
                break
            case "Q":
                emoji = color === "white" ? "♕" : "♛"
                break
            case "K":
                emoji = color === "white" ? "♔" : "♚"
                break
        }

        ctx.font = `${cellSize * 0.7}px Arial`
        ctx.fillStyle = color === "white" ? "#ffffff" : "#000000"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(emoji, col * cellSize + cellSize / 2, row * cellSize + cellSize / 2)
    }

    // Obtener movimientos válidos para una pieza
    const getValidMoves = (row, col) => {
        const piece = board[row][col]
        if (!piece) return []

        const pieceColor = piece.charAt(0)
        const pieceType = piece.charAt(1)
        const moves = []

        // Función para verificar si una posición está dentro del tablero
        const isValidPosition = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8

        // Función para verificar si una posición está vacía o tiene una pieza enemiga
        const canMoveTo = (r, c) => {
            if (!isValidPosition(r, c)) return false
            if (!board[r][c]) return true
            return board[r][c].charAt(0) !== pieceColor
        }

        // Función para añadir un movimiento si es válido
        const addMove = (r, c) => {
            if (canMoveTo(r, c)) {
                moves.push({ row: r, col: c })
            }
        }

        // Movimientos según el tipo de pieza
        switch (pieceType) {
            case "P": // Peón
                const direction = pieceColor === "w" ? -1 : 1

                // Movimiento hacia adelante (solo si la casilla está vacía)
                if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
                    addMove(row + direction, col)

                    // Doble movimiento desde la posición inicial (solo si ambas casillas están vacías)
                    if ((pieceColor === "w" && row === 6) || (pieceColor === "b" && row === 1)) {
                        if (isValidPosition(row + 2 * direction, col) && !board[row + 2 * direction][col]) {
                            addMove(row + 2 * direction, col)
                        }
                    }
                }

                // Capturas en diagonal (solo si hay una pieza enemiga)
                if (
                    isValidPosition(row + direction, col - 1) &&
                    board[row + direction][col - 1] &&
                    board[row + direction][col - 1].charAt(0) !== pieceColor
                ) {
                    addMove(row + direction, col - 1)
                }

                if (
                    isValidPosition(row + direction, col + 1) &&
                    board[row + direction][col + 1] &&
                    board[row + direction][col + 1].charAt(0) !== pieceColor
                ) {
                    addMove(row + direction, col + 1)
                }
                break

            case "R": // Torre
                // Movimientos horizontales y verticales
                for (let r = row + 1; r < 8; r++) {
                    if (!canMoveTo(r, col)) break
                    addMove(r, col)
                    if (board[r][col]) break
                }

                for (let r = row - 1; r >= 0; r--) {
                    if (!canMoveTo(r, col)) break
                    addMove(r, col)
                    if (board[r][col]) break
                }

                for (let c = col + 1; c < 8; c++) {
                    if (!canMoveTo(row, c)) break
                    addMove(row, c)
                    if (board[row][c]) break
                }

                for (let c = col - 1; c >= 0; c--) {
                    if (!canMoveTo(row, c)) break
                    addMove(row, c)
                    if (board[row][c]) break
                }
                break

            case "N": // Caballo
                const knightMoves = [
                    { r: -2, c: -1 },
                    { r: -2, c: 1 },
                    { r: -1, c: -2 },
                    { r: -1, c: 2 },
                    { r: 1, c: -2 },
                    { r: 1, c: 2 },
                    { r: 2, c: -1 },
                    { r: 2, c: 1 },
                ]

                for (const move of knightMoves) {
                    addMove(row + move.r, col + move.c)
                }
                break

            case "B": // Alfil
                // Movimientos diagonales
                for (let i = 1; i < 8; i++) {
                    if (!canMoveTo(row + i, col + i)) break
                    addMove(row + i, col + i)
                    if (board[row + i][col + i]) break
                }

                for (let i = 1; i < 8; i++) {
                    if (!canMoveTo(row + i, col - i)) break
                    addMove(row + i, col - i)
                    if (board[row + i][col - i]) break
                }

                for (let i = 1; i < 8; i++) {
                    if (!canMoveTo(row - i, col + i)) break
                    addMove(row - i, col + i)
                    if (board[row - i][col + i]) break
                }

                for (let i = 1; i < 8; i++) {
                    if (!canMoveTo(row - i, col - i)) break
                    addMove(row - i, col - i)
                    if (board[row - i][col - i]) break
                }
                break

            case "Q": // Reina (combinación de torre y alfil)
                // Movimientos horizontales y verticales (como la torre)
                for (let r = row + 1; r < 8; r++) {
                    if (!canMoveTo(r, col)) break
                    addMove(r, col)
                    if (board[r][col]) break
                }

                for (let r = row - 1; r >= 0; r--) {
                    if (!canMoveTo(r, col)) break
                    addMove(r, col)
                    if (board[r][col]) break
                }

                for (let c = col + 1; c < 8; c++) {
                    if (!canMoveTo(row, c)) break
                    addMove(row, c)
                    if (board[row][c]) break
                }

                for (let c = col - 1; c >= 0; c--) {
                    if (!canMoveTo(row, c)) break
                    addMove(row, c)
                    if (board[row][c]) break
                }

                // Movimientos diagonales (como el alfil)
                for (let i = 1; i < 8; i++) {
                    if (!canMoveTo(row + i, col + i)) break
                    addMove(row + i, col + i)
                    if (board[row + i][col + i]) break
                }

                for (let i = 1; i < 8; i++) {
                    if (!canMoveTo(row + i, col - i)) break
                    addMove(row + i, col - i)
                    if (board[row + i][col - i]) break
                }

                for (let i = 1; i < 8; i++) {
                    if (!canMoveTo(row - i, col + i)) break
                    addMove(row - i, col + i)
                    if (board[row - i][col + i]) break
                }

                for (let i = 1; i < 8; i++) {
                    if (!canMoveTo(row - i, col - i)) break
                    addMove(row - i, col - i)
                    if (board[row - i][col - i]) break
                }
                break

            case "K": // Rey
                const kingMoves = [
                    { r: -1, c: -1 },
                    { r: -1, c: 0 },
                    { r: -1, c: 1 },
                    { r: 0, c: -1 },
                    { r: 0, c: 1 },
                    { r: 1, c: -1 },
                    { r: 1, c: 0 },
                    { r: 1, c: 1 },
                ]

                for (const move of kingMoves) {
                    addMove(row + move.r, col + move.c)
                }

                // Añadir movimientos de enroque
                if (pieceColor === "w") {
                    // Enroque corto (lado del rey) para blancas
                    if (!castlingState.whiteKingMoved && !castlingState.whiteRookKingSideMoved) {
                        if (!board[7][5] && !board[7][6] && board[7][7] === "wR") {
                            // Verificar que el rey no esté en jaque y que no pase por casillas atacadas
                            if (!isSquareAttacked(7, 4, "b") && !isSquareAttacked(7, 5, "b") && !isSquareAttacked(7, 6, "b")) {
                                moves.push({ row: 7, col: 6, castling: "kingside" })
                            }
                        }
                    }

                    // Enroque largo (lado de la reina) para blancas
                    if (!castlingState.whiteKingMoved && !castlingState.whiteRookQueenSideMoved) {
                        if (!board[7][1] && !board[7][2] && !board[7][3] && board[7][0] === "wR") {
                            // Verificar que el rey no esté en jaque y que no pase por casillas atacadas
                            if (!isSquareAttacked(7, 4, "b") && !isSquareAttacked(7, 3, "b") && !isSquareAttacked(7, 2, "b")) {
                                moves.push({ row: 7, col: 2, castling: "queenside" })
                            }
                        }
                    }
                } else {
                    // Enroque corto (lado del rey) para negras
                    if (!castlingState.blackKingMoved && !castlingState.blackRookKingSideMoved) {
                        if (!board[0][5] && !board[0][6] && board[0][7] === "bR") {
                            // Verificar que el rey no esté en jaque y que no pase por casillas atacadas
                            if (!isSquareAttacked(0, 4, "w") && !isSquareAttacked(0, 5, "w") && !isSquareAttacked(0, 6, "w")) {
                                moves.push({ row: 0, col: 6, castling: "kingside" })
                            }
                        }
                    }

                    // Enroque largo (lado de la reina) para negras
                    if (!castlingState.blackKingMoved && !castlingState.blackRookQueenSideMoved) {
                        if (!board[0][1] && !board[0][2] && !board[0][3] && board[0][0] === "bR") {
                            // Verificar que el rey no esté en jaque y que no pase por casillas atacadas
                            if (!isSquareAttacked(0, 4, "w") && !isSquareAttacked(0, 3, "w") && !isSquareAttacked(0, 2, "w")) {
                                moves.push({ row: 0, col: 2, castling: "queenside" })
                            }
                        }
                    }
                }
                break
        }

        return moves
    }

    // Verificar si una casilla está siendo atacada por el color especificado
    const isSquareAttacked = (row, col, attackingColor) => {
        // Verificar ataques de peones
        const pawnDirection = attackingColor === "w" ? -1 : 1
        if (isValidPosition(row + pawnDirection, col - 1) && board[row + pawnDirection][col - 1] === `${attackingColor}P`) {
            return true
        }
        if (isValidPosition(row + pawnDirection, col + 1) && board[row + pawnDirection][col + 1] === `${attackingColor}P`) {
            return true
        }

        // Verificar ataques de caballos
        const knightMoves = [
            { r: -2, c: -1 },
            { r: -2, c: 1 },
            { r: -1, c: -2 },
            { r: -1, c: 2 },
            { r: 1, c: -2 },
            { r: 1, c: 2 },
            { r: 2, c: -1 },
            { r: 2, c: 1 },
        ]
        for (const move of knightMoves) {
            const r = row + move.r
            const c = col + move.c
            if (isValidPosition(r, c) && board[r][c] === `${attackingColor}N`) {
                return true
            }
        }

        // Verificar ataques en línea recta (torre y reina)
        const directions = [
            { r: 1, c: 0 },
            { r: -1, c: 0 },
            { r: 0, c: 1 },
            { r: 0, c: -1 },
        ]
        for (const dir of directions) {
            let r = row + dir.r
            let c = col + dir.c
            while (isValidPosition(r, c)) {
                if (board[r][c]) {
                    if (board[r][c] === `${attackingColor}R` || board[r][c] === `${attackingColor}Q`) {
                        return true
                    }
                    break
                }
                r += dir.r
                c += dir.c
            }
        }

        // Verificar ataques en diagonal (alfil y reina)
        const diagonals = [
            { r: 1, c: 1 },
            { r: 1, c: -1 },
            { r: -1, c: 1 },
            { r: -1, c: -1 },
        ]
        for (const dir of diagonals) {
            let r = row + dir.r
            let c = col + dir.c
            while (isValidPosition(r, c)) {
                if (board[r][c]) {
                    if (board[r][c] === `${attackingColor}B` || board[r][c] === `${attackingColor}Q`) {
                        return true
                    }
                    break
                }
                r += dir.r
                c += dir.c
            }
        }

        // Verificar ataques del rey
        const kingMoves = [
            { r: -1, c: -1 },
            { r: -1, c: 0 },
            { r: -1, c: 1 },
            { r: 0, c: -1 },
            { r: 0, c: 1 },
            { r: 1, c: -1 },
            { r: 1, c: 0 },
            { r: 1, c: 1 },
        ]
        for (const move of kingMoves) {
            const r = row + move.r
            const c = col + move.c
            if (isValidPosition(r, c) && board[r][c] === `${attackingColor}K`) {
                return true
            }
        }

        return false
    }

    // Función auxiliar para verificar si una posición es válida
    const isValidPosition = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8

    // Manejar clic en el tablero
    const handleClick = (e) => {
        if (!board || gameOver || (turn === "black" && playAgainstAI)) return

        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const CELL_SIZE = canvas.width / 8
        const col = Math.floor(x / CELL_SIZE)
        const row = Math.floor(y / CELL_SIZE)

        // Si ya hay una pieza seleccionada, intentar moverla
        if (selectedPiece) {
            // Verificar si el movimiento es válido
            const isValidMove = validMoves.some((move) => move.row === row && move.col === col)

            if (isValidMove) {
                // Crear una copia del tablero para modificarlo
                const newBoard = JSON.parse(JSON.stringify(board))
                const piece = newBoard[selectedPiece.row][selectedPiece.col]

                // Obtener el movimiento específico (para enroque)
                const move = validMoves.find((m) => m.row === row && m.col === col)

                // Actualizar estado de enroque si se mueve el rey o las torres
                const newCastlingState = { ...castlingState }

                if (piece === "wK") {
                    newCastlingState.whiteKingMoved = true
                } else if (piece === "bK") {
                    newCastlingState.blackKingMoved = true
                } else if (piece === "wR") {
                    if (selectedPiece.row === 7 && selectedPiece.col === 0) {
                        newCastlingState.whiteRookQueenSideMoved = true
                    } else if (selectedPiece.row === 7 && selectedPiece.col === 7) {
                        newCastlingState.whiteRookKingSideMoved = true
                    }
                } else if (piece === "bR") {
                    if (selectedPiece.row === 0 && selectedPiece.col === 0) {
                        newCastlingState.blackRookQueenSideMoved = true
                    } else if (selectedPiece.row === 0 && selectedPiece.col === 7) {
                        newCastlingState.blackRookKingSideMoved = true
                    }
                }

                setCastlingState(newCastlingState)

                // Manejar enroque
                if (move && move.castling) {
                    // Mover el rey
                    newBoard[row][col] = piece
                    newBoard[selectedPiece.row][selectedPiece.col] = ""

                    // Mover la torre correspondiente
                    if (move.castling === "kingside") {
                        if (piece === "wK") {
                            newBoard[7][5] = "wR" // Mover torre blanca del lado del rey
                            newBoard[7][7] = ""
                        } else {
                            newBoard[0][5] = "bR" // Mover torre negra del lado del rey
                            newBoard[0][7] = ""
                        }
                        playSound("select")
                    } else if (move.castling === "queenside") {
                        if (piece === "wK") {
                            newBoard[7][3] = "wR" // Mover torre blanca del lado de la reina
                            newBoard[7][0] = ""
                        } else {
                            newBoard[0][3] = "bR" // Mover torre negra del lado de la reina
                            newBoard[0][0] = ""
                        }
                        playSound("select")
                    }
                } else {
                    // Movimiento normal
                    newBoard[row][col] = piece
                    newBoard[selectedPiece.row][selectedPiece.col] = ""
                }

                // Verificar coronación de peones
                const isPromotion = handlePawnPromotion(newBoard, row, col, piece)

                // Solo continuar si no hay promoción pendiente
                if (!isPromotion) {
                    // Actualizar el tablero
                    setBoard(newBoard)

                    // Cambiar turno
                    setTurn(turn === "white" ? "black" : "white")
                    playSound("click")

                    // Verificar si hay jaque mate
                    if (isCheckmate(newBoard, turn === "white" ? "b" : "w")) {
                        setGameOver(true)
                        setWinner(turn)
                        playSound("success")
                    } else {
                        // Si juega contra la IA y es turno de la IA
                        if (playAgainstAI && turn === "white") {
                            setTimeout(() => makeAIMove(newBoard), 500)
                        }
                    }
                }
            }

            setSelectedPiece(null)
            setValidMoves([])
        } else {
            // Seleccionar pieza si hay una en la casilla
            if (board[row][col]) {
                const pieceColor = board[row][col].charAt(0) === "w" ? "white" : "black"

                // Solo permitir seleccionar piezas del turno actual
                if (pieceColor === turn) {
                    const moves = getValidMoves(row, col)
                    setSelectedPiece({ row, col })
                    setValidMoves(moves)
                    playSound("hover")
                }
            }
        }
    }

    // Verificar y manejar la coronación de peones
    const handlePawnPromotion = (newBoard, row, col, piece) => {
        const pieceColor = piece.charAt(0)

        // Verificar si es un peón que ha llegado a la última fila
        if (piece.charAt(1) === "P" && ((pieceColor === "w" && row === 0) || (pieceColor === "b" && row === 7))) {
            // Guardar el estado actual para cuando el usuario elija una pieza
            setPendingBoard(newBoard)
            setPromotionPosition({ row, col, color: pieceColor })
            setShowPromotionDialog(true)
            return true // Indica que hay una promoción pendiente
        }
        return false // No hay promoción
    }

    // Añadir esta función para manejar la selección de promoción
    const handlePromotionSelect = (pieceType) => {
        if (!pendingBoard || !promotionPosition) return

        const { row, col, color } = promotionPosition
        const newBoard = JSON.parse(JSON.stringify(pendingBoard))

        // Reemplazar el peón con la pieza seleccionada
        newBoard[row][col] = `${color}${pieceType}`

        // Actualizar el tablero
        setBoard(newBoard)

        // Cambiar turno
        setTurn(turn === "white" ? "black" : "white")
        playSound("success")

        // Si juega contra la IA y es turno de la IA
        if (playAgainstAI && turn === "white") {
            setTimeout(() => makeAIMove(newBoard), 500)
        }

        // Limpiar el estado de promoción
        setShowPromotionDialog(false)
        setPendingBoard(null)
        setPromotionPosition(null)
    }

    // Añadir esta función para cancelar la promoción
    const handlePromotionCancel = () => {
        setShowPromotionDialog(false)
        setPendingBoard(null)
        setPromotionPosition(null)

        // Restaurar la selección de pieza para permitir otro movimiento
        if (selectedPiece) {
            const moves = getValidMoves(selectedPiece.row, selectedPiece.col)
            setValidMoves(moves)
        }
    }

    // Verificar si hay jaque mate
    const isCheckmate = (board, color) => {
        // Simplificación: verificar si quedan piezas del color
        let hasKing = false

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === `${color}K`) {
                    hasKing = true
                    break
                }
            }
            if (hasKing) break
        }

        return !hasKing
    }

    // Hacer movimiento de la IA
    const makeAIMove = (currentBoard) => {
        // Implementación mejorada de IA para dificultad difícil
        const possibleMoves = []

        // Recopilar todas las piezas negras y sus movimientos posibles
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (currentBoard[row][col] && currentBoard[row][col].charAt(0) === "b") {
                    const piece = currentBoard[row][col]
                    const moves = getValidMoves(row, col)

                    for (const move of moves) {
                        // Crear una copia del tablero para simular el movimiento
                        const newBoard = JSON.parse(JSON.stringify(currentBoard))
                        newBoard[move.row][move.col] = piece
                        newBoard[row][col] = ""

                        // Evaluar el movimiento
                        let value = 0

                        // Valor de la captura
                        if (currentBoard[move.row][move.col]) {
                            value += getPieceValue(currentBoard[move.row][move.col]) * 10
                        }

                        // En dificultad difícil, evaluar la posición resultante
                        if (difficulty === "hard") {
                            // Evaluar control del centro
                            if ((move.row === 3 || move.row === 4) && (move.col === 3 || move.col === 4)) {
                                value += 3
                            }

                            // Evaluar desarrollo de piezas (mover piezas de su posición inicial)
                            if (piece.charAt(1) !== "P" && (row === 0 || row === 7)) {
                                value += 2
                            }

                            // Evaluar protección del rey
                            if (piece.charAt(1) === "K") {
                                // Penalizar mover el rey al centro en apertura/medio juego
                                if ((move.row === 3 || move.row === 4) && (move.col === 3 || move.col === 4)) {
                                    value -= 5
                                }
                            }

                            // Evaluar avance de peones
                            if (piece.charAt(1) === "P") {
                                // Valorar avance de peones hacia promoción
                                value += (7 - move.row) / 2

                                // Valorar peones pasados (que pueden llegar a promocionar)
                                let isPassed = true
                                for (let r = move.row - 1; r >= 0; r--) {
                                    if (currentBoard[r][move.col] && currentBoard[r][move.col].charAt(1) === "P") {
                                        isPassed = false
                                        break
                                    }
                                }
                                if (isPassed) value += 5
                            }

                            // Evaluar ataques
                            for (let r = 0; r < 8; r++) {
                                for (let c = 0; c < 8; c++) {
                                    if (currentBoard[r][c] && currentBoard[r][c].charAt(0) === "w") {
                                        // Verificar si la pieza blanca está atacada después del movimiento
                                        if (isSquareAttacked(r, c, "b", newBoard)) {
                                            value += getPieceValue(currentBoard[r][c]) / 2
                                        }
                                    }
                                }
                            }
                        }

                        possibleMoves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col,
                            piece: piece,
                            value: value,
                            castling: move.castling,
                        })
                    }
                }
            }
        }

        if (possibleMoves.length === 0) {
            setGameOver(true)
            setWinner("white")
            playSound("success")
            return
        }

        // Ordenar movimientos por valor (capturas primero)
        possibleMoves.sort((a, b) => b.value - a.value)

        // Elegir un movimiento basado en la dificultad
        let selectedMove

        if (difficulty === "easy") {
            // En fácil, movimiento aleatorio
            selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
        } else if (difficulty === "hard") {
            // En difícil, elegir entre los 3 mejores movimientos con mayor probabilidad para el mejor
            const randomValue = Math.random()
            if (randomValue < 0.7 && possibleMoves.length > 0) {
                selectedMove = possibleMoves[0] // 70% de probabilidad para el mejor movimiento
            } else if (randomValue < 0.9 && possibleMoves.length > 1) {
                selectedMove = possibleMoves[1] // 20% para el segundo mejor
            } else if (possibleMoves.length > 2) {
                selectedMove = possibleMoves[2] // 10% para el tercer mejor
            } else {
                selectedMove = possibleMoves[0]
            }
        } else {
            // En normal, 70% de probabilidad de elegir uno de los 3 mejores movimientos
            if (Math.random() < 0.7 && possibleMoves.length >= 3) {
                selectedMove = possibleMoves[Math.floor(Math.random() * 3)]
            } else {
                selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
            }
        }

        // Realizar el movimiento
        const newBoard = JSON.parse(JSON.stringify(currentBoard))

        // Actualizar estado de enroque si se mueve el rey o las torres
        const newCastlingState = { ...castlingState }

        if (selectedMove.piece === "bK") {
            newCastlingState.blackKingMoved = true
        } else if (selectedMove.piece === "bR") {
            if (selectedMove.fromRow === 0 && selectedMove.fromCol === 0) {
                newCastlingState.blackRookQueenSideMoved = true
            } else if (selectedMove.fromRow === 0 && selectedMove.fromCol === 7) {
                newCastlingState.blackRookKingSideMoved = true
            }
        }

        setCastlingState(newCastlingState)

        // Manejar enroque
        if (selectedMove.castling) {
            // Mover el rey
            newBoard[selectedMove.toRow][selectedMove.toCol] = selectedMove.piece
            newBoard[selectedMove.fromRow][selectedMove.fromCol] = ""

            // Mover la torre correspondiente
            if (selectedMove.castling === "kingside") {
                newBoard[0][5] = "bR" // Mover torre negra del lado del rey
                newBoard[0][7] = ""
                playSound("select")
            } else if (selectedMove.castling === "queenside") {
                newBoard[0][3] = "bR" // Mover torre negra del lado de la reina
                newBoard[0][0] = ""
                playSound("select")
            }
        } else {
            // Movimiento normal
            newBoard[selectedMove.toRow][selectedMove.toCol] = selectedMove.piece
            newBoard[selectedMove.fromRow][selectedMove.fromCol] = ""
        }

        // Para la IA, promocionar automáticamente a reina
        const pieceColor = selectedMove.piece.charAt(0)
        if (
            selectedMove.piece.charAt(1) === "P" &&
            ((pieceColor === "w" && selectedMove.toRow === 0) || (pieceColor === "b" && selectedMove.toRow === 7))
        ) {
            newBoard[selectedMove.toRow][selectedMove.toCol] = `${pieceColor}Q`
            playSound("success")
        }

        // Actualizar el tablero
        setBoard(newBoard)

        // Cambiar turno
        setTurn("white")
        playSound("click")

        // Verificar si hay jaque mate
        if (isCheckmate(newBoard, "w")) {
            setGameOver(true)
            setWinner("black")
            playSound("success")
        }
    }

    // Obtener valor de una pieza para la IA
    const getPieceValue = (piece) => {
        const type = piece.charAt(1)
        switch (type) {
            case "P":
                return 1
            case "N":
                return 3
            case "B":
                return 3
            case "R":
                return 5
            case "Q":
                return 9
            case "K":
                return 100
            default:
                return 0
        }
    }

    const resetGame = () => {
        // Estado inicial del tablero
        const initialBoard = [
            ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
            ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["", "", "", "", "", "", "", ""],
            ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
            ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
        ]

        setBoard(initialBoard)
        setGameOver(false)
        setIsPaused(false)
        setSelectedPiece(null)
        setValidMoves([])
        setTurn("white")
        setWinner(null)
        setCastlingState({
            whiteKingMoved: false,
            whiteRookKingSideMoved: false,
            whiteRookQueenSideMoved: false,
            blackKingMoved: false,
            blackRookKingSideMoved: false,
            blackRookQueenSideMoved: false,
        })
        playSound("start")
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
            <div className="mb-2 flex justify-between w-full px-2">
                <div className="text-xs">Turno: {turn === "white" ? "Blancas" : "Negras"}</div>
                <button onClick={() => setIsPaused(!isPaused)} className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {isPaused ? "Reanudar" : "Pausa"}
                </button>
                <div className="text-xs">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={playAgainstAI}
                            onChange={() => setPlayAgainstAI(!playAgainstAI)}
                            className="mr-1"
                        />
                        Jugar vs IA
                    </label>
                </div>
            </div>

            <DifficultySelector difficulty={difficulty} onChange={setDifficulty} gameId="chess" />

            <canvas ref={canvasRef} width={320} height={320} className="border border-gray-700" onClick={handleClick} />

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                    <h3 className="text-xl font-bold mb-2">Game Over</h3>
                    <p className="mb-4">Ganador: {winner === "white" ? "Blancas" : "Negras"}</p>
                    <button onClick={resetGame} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                        Jugar de nuevo
                    </button>
                </div>
            )}

            <div className="mt-2 text-xs text-center">
                <p>Haz clic en una pieza para seleccionarla</p>
                <p>Los círculos azules muestran los movimientos válidos</p>
                <p>Puedes hacer enroque moviendo el rey dos casillas</p>
            </div>
            {showPromotionDialog && (
                <PromotionDialog
                    color={promotionPosition?.color}
                    onSelect={handlePromotionSelect}
                    onCancel={handlePromotionCancel}
                />
            )}
        </div>
    )
}
