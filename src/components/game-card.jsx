"use client"

import { useSound } from "../contexts/sound-context"
import { useNavigate } from "react-router-dom"
import "./game-card.css"

export function GameCard({ game }) {
  const { playSound } = useSound()
  const navigate = useNavigate()

  const handleMouseEnter = () => {
    playSound("hover")
  }

  const handleClick = (e) => {
    e.preventDefault()
    playSound("select")

    // Pequeño retraso para que se escuche el sonido antes de navegar
    setTimeout(() => {
      navigate(`/games/${game.id}`)
    }, 200)
  }

  return (
    <a href={`/games/${game.id}`} onClick={handleClick} className="game-card-link">
      <div
        className="game-card"
        onMouseEnter={handleMouseEnter}
        style={{ "--game-color": game.color || "var(--neon-pink)" }}
      >
        <div className="game-card-image">
          <img
            src={game.image || "/placeholder.svg"}
            alt={game.name}
            className="pixel-effect"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "https://placehold.co/400x225/666666/FFFFFF?text=Error"
            }}
          />
          <div className="image-overlay"></div>
          <div className="top-highlight"></div>
        </div>
        <div className="game-card-content">
          <h2 className="game-title pixel-text" style={{ color: game.color || "var(--neon-yellow)" }}>
            {game.name}
          </h2>
          <p className="game-description">{game.description}</p>
          <div className="game-meta">
            <span className="game-year">{game.year}</span>
            <span
              className="game-category glow-effect"
              style={{
                background: game.color || "var(--neon-purple)",
                boxShadow: `0 0 8px ${game.color || "var(--neon-purple)"}`,
              }}
            >
              {game.category}
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}
