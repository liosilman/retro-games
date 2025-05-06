"use client"

import { useEffect } from "react"
import { useParams, Navigate } from "react-router-dom"
import { GameFrame } from "../components/game-frame"
import { GameNavigation } from "../components/game-navigation"
import { games } from "../lib/games"
import Snake from "../components/games/snake"
import Tetris from "../components/games/tetris"
import Pong from "../components/games/pong"
import Breakout from "../components/games/breakout"
import Pacman from "../components/games/pacman"
import SpaceInvaders from "../components/games/space-invaders"
import Chess from "../components/games/chess"
import Doom from "../components/games/doom"
import Sudoku from "../components/games/sudoku"
import { useSound } from "../contexts/sound-context"
import "./game-page.css"
import { FullscreenToggle } from "../components/fullscreen-toggle"

export default function GamePage() {
    const { gameId } = useParams()
    const { playSound } = useSound()
    const game = games.find((g) => g.id === gameId)

    useEffect(() => {
        if (game) {
            playSound("start")
        }
    }, [game, playSound])

    if (!game) {
        return <Navigate to="/" />
    }

    // Render the appropriate game component based on the game ID
    const renderGame = () => {
        switch (game.id) {
            case "snake":
                return <Snake />
            case "tetris":
                return <Tetris />
            case "pong":
                return <Pong />
            case "breakout":
                return <Breakout />
            case "pacman":
                return <Pacman />
            case "space-invaders":
                return <SpaceInvaders />
            case "chess":
                return <Chess />
            case "doom":
                return <Doom />
            case "sudoku":
                return <Sudoku />
            default:
                return <div className="game-not-available">Juego no disponible</div>
        }
    }

    return (
        <main className="game-page">
            <GameNavigation />
            <FullscreenToggle />

            <div className="game-container">
                <GameFrame frameType={game.frameType} title={game.name}>
                    {renderGame()}
                </GameFrame>

                <div className="game-info">
                    <h2 className="game-title pixel-text">{game.name}</h2>
                    <p className="game-description">{game.description}</p>
                    <div className="game-meta glow-effect">
                        {game.year} • {game.category}
                    </div>
                </div>
            </div>
        </main>
    )
}
