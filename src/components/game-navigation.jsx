"use client"

import { useState } from "react"
import { Menu, X, Home, ChevronUp } from "lucide-react"
import { games } from "../lib/games"
import { useSound } from "../contexts/sound-context"
import { useNavigate } from "react-router-dom"
import "./game-navigation.css"

export function GameNavigation() {
    const [isOpen, setIsOpen] = useState(false)
    const { playSound } = useSound()
    const navigate = useNavigate()

    const handleToggleMenu = () => {
        playSound(isOpen ? "back" : "click")
        setIsOpen(!isOpen)
    }

    const handleNavClick = (e, path) => {
        e.preventDefault()
        playSound("select")

        setTimeout(() => {
            navigate(path)
            setIsOpen(false)
        }, 200)
    }

    const handleHomeClick = (e) => {
        e.preventDefault()
        playSound("back")

        setTimeout(() => {
            navigate("/")
            setIsOpen(false)
        }, 200)
    }

    return (
        <>
            <div className={`game-nav ${isOpen ? "" : "hidden"}`}>
                <div className="nav-container">
                    <div className="nav-header">
                        <a href="/" onClick={handleHomeClick} className="home-link pixel-text">
                            <Home size={20} />
                            Inicio
                        </a>
                        <button
                            onClick={handleToggleMenu}
                            className="close-button glow-effect"
                            onMouseEnter={() => playSound("hover")}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="games-grid">
                        {games.map((game) => (
                            <a
                                key={game.id}
                                href={`/games/${game.id}`}
                                className="game-link glow-effect"
                                onClick={(e) => handleNavClick(e, `/games/${game.id}`)}
                                onMouseEnter={() => playSound("hover")}
                            >
                                <div className="game-icon">
                                    <div className="game-icon-bg"></div>
                                </div>
                                <div className="game-info">
                                    <h3 className="pixel-text">{game.name}</h3>
                                    <p>{game.category}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <button onClick={handleToggleMenu} onMouseEnter={() => playSound("hover")} className="menu-button glow-effect">
                {isOpen ? <ChevronUp size={24} /> : <Menu size={24} />}
            </button>
        </>
    )
}
