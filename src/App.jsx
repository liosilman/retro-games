import { Routes, Route } from 'react-router-dom'
import { SoundProvider } from './contexts/sound-context'
import { SoundToggle } from './components/sound-toggle'
import { SoundPreloader } from './components/sound-preloader'
import Home from './pages/home'
import GamePage from './pages/game-page'

function App() {
  return (
    <SoundProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/:gameId" element={<GamePage />} />
      </Routes>
      <SoundToggle />
      <SoundPreloader />
    </SoundProvider>
  )
}

export default App 