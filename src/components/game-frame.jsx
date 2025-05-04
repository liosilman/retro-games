import './game-frame.css'

export function GameFrame({ children, frameType, title }) {
    if (frameType === "tv") {
        return (
            <div className="game-frame-container">
                <div className="game-frame-title">
                    <h2 className="pixel-text">{title}</h2>
                </div>
                <div className="tv-frame">
                    <div className="tv-screen">
                        <div className="scanline"></div>
                        <div className="crt-effect"></div>
                        {children}
                    </div>
                    <div className="frame-controls">
                        <div className="control-buttons">
                            <div className="control-button glow-effect"></div>
                            <div className="control-button glow-effect"></div>
                            <div className="control-button glow-effect animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="game-frame-container">
            <div className="game-frame-title">
                <h2 className="pixel-text">{title}</h2>
            </div>
            <div className="gameboy-frame">
                <div className="gameboy-screen">{children}</div>
                <div className="frame-controls">
                    <div className="control-buttons">
                        <div className="control-button glow-effect"></div>
                        <div className="control-button glow-effect"></div>
                    </div>
                </div>
                <div className="control-indicator">
                    <div className="indicator-light"></div>
                    <div className="indicator-light"></div>
                </div>
            </div>
        </div>
    )
}