import { useEffect } from 'react'
import { GameCard } from '../components/game-card'
import { games } from '../lib/games'
import { useSound } from '../contexts/sound-context'
import './home.css'

export default function Home() {
    const { playSound } = useSound()

    // Reproducir sonido de inicio cuando se carga la página
    useEffect(() => {
        playSound("start")
    }, [playSound])

    return (
        <main className="home-main">
            {/* Elementos decorativos de fondo */}
            <div className="background-decorations">
                {/* Grid de fondo */}
                <div className="background-grid"></div>

                {/* Círculos decorativos */}
                <div className="decoration-circle-1"></div>
                <div className="decoration-circle-2"></div>

                {/* Líneas de neón */}
                <div className="decoration-line-top"></div>
                <div className="decoration-line-bottom"></div>
            </div>

            <div className="home-content">
                <div className="home-header">
                    {/* Título con efecto mejorado */}
                    <div className="title-container">
                        <h1 className="home-title retro-text">Retro Games</h1>
                        <div className="title-bg"></div>
                    </div>

                    {/* Línea decorativa */}
                    <div className="decorative-line"></div>

                    <p className="home-description">
                        Una colección de juegos retro de código abierto que puedes jugar directamente en tu navegador.
                        <span className="description-highlight">¡Selecciona un juego para comenzar!</span>
                    </p>

                    {/* Controles decorativos */}
                    <div className="decorative-controls">
                        <div
                            className="control-circle control-circle-blue"
                            onClick={() => playSound("click")}
                            onMouseEnter={() => playSound("hover")}
                        >
                            <div className="control-dot control-dot-blue"></div>
                        </div>
                        <div
                            className="control-circle control-circle-pink"
                            onClick={() => playSound("click")}
                            onMouseEnter={() => playSound("hover")}
                        >
                            <div className="control-dot control-dot-pink"></div>
                        </div>
                        <div
                            className="control-circle control-circle-purple"
                            onClick={() => playSound("click")}
                            onMouseEnter={() => playSound("hover")}
                        >
                            <div className="control-dot control-dot-purple"></div>
                        </div>
                    </div>
                </div>

                <div className="games-grid">
                    {games.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>

                {/* Decoración de píxeles en la parte inferior */}
                <div className="pixel-decoration">
                    <div className="pixel-row">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className={`pixel pixel-${(i % 4) + 1}`}
                                style={{
                                    animationDelay: `${i * 0.2}s`,
                                }}
                            ></div>
                        ))}
                    </div>
                </div>

                <div className="footer">
                    
                </div>
            </div>
        </main>
    )
}