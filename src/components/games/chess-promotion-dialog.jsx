"use client"

export function PromotionDialog({ color, onSelect, onCancel }) {
    const pieces = ["Q", "R", "B", "N"] // Reina, Torre, Alfil, Caballo

    return (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-black text-lg font-bold mb-3 text-center">Elige una pieza</h3>
                <div className="flex justify-center gap-4">
                    {pieces.map((piece) => (
                        <button
                            key={piece}
                            onClick={() => onSelect(piece)}
                            className="w-16 h-16 flex items-center justify-center text-4xl bg-gray-200 hover:bg-gray-300 rounded"
                        >
                            {piece === "Q" && (color === "w" ? "♕" : "♛")}
                            {piece === "R" && (color === "w" ? "♖" : "♜")}
                            {piece === "B" && (color === "w" ? "♗" : "♝")}
                            {piece === "N" && (color === "w" ? "♘" : "♞")}
                        </button>
                    ))}
                </div>
                <button onClick={onCancel} className="mt-3 w-full py-2 bg-red-500 text-white rounded hover:bg-red-600">
                    Cancelar
                </button>
            </div>
        </div>
    )
}
