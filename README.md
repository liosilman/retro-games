# Retro Games

![Retro Games Banner](https://cdn.pixabay.com/photo/2021/02/11/15/40/arcade-game-6005337_960_720.jpg)

## 📝 Descripción

Retro Games es una colección de juegos clásicos recreados con tecnologías web modernas. El proyecto ofrece una experiencia nostálgica con una interfaz visual inspirada en la estética de los años 80 y 90, permitiendo a los usuarios disfrutar de títulos legendarios como Snake, Tetris, Pong, Breakout, Pac-Man y Space Invaders directamente desde el navegador.

## 🎮 Juegos Incluidos

- **Snake**: El clásico juego de la serpiente que crece al comer frutas.
- **Tetris**: Organiza las piezas que caen para completar líneas.
- **Pong**: El primer videojuego exitoso comercialmente. Rebota la pelota con tu paleta.
- **Breakout**: Destruye todos los bloques con una pelota rebotando.
- **Pac-Man**: Come todos los puntos del laberinto mientras evitas a los fantasmas.
- **Space Invaders**: Defiende la Tierra disparando a los invasores alienígenas.

## 🛠️ Tecnologías Utilizadas

- **React**: Biblioteca para construir interfaces de usuario
- **Vite**: Herramienta de compilación que proporciona un entorno de desarrollo más rápido
- **JavaScript (ES6+)**: Para la lógica de los juegos y la interactividad
- **CSS3**: Para los estilos y animaciones
- **HTML5 Canvas**: Para renderizar los gráficos de los juegos
- **React Router**: Para la navegación entre páginas
- **Context API**: Para gestionar el estado global (como el sonido)

## ✨ Características

- Diseño retro con efectos visuales nostálgicos (scanlines, efectos CRT, píxeles)
- Sistema de sonido con efectos retro
- Diferentes niveles de dificultad para cada juego
- Controles adaptados tanto para teclado como para dispositivos táctiles
- Interfaz responsiva que funciona en dispositivos móviles y de escritorio
- Sistema de puntuación para cada juego

## 🧩 Dificultades durante el desarrollo

### Desafíos técnicos:

1. **Implementación del sistema de colisiones**: Especialmente en juegos como Breakout y Pong, fue necesario crear un sistema preciso de detección de colisiones que funcionara de manera consistente.

2. **Optimización para dispositivos móviles**: Adaptar los controles para pantallas táctiles sin perder la esencia de los juegos originales requirió múltiples iteraciones.

3. **Compatibilidad con diferentes navegadores**: Asegurar que los juegos funcionaran correctamente en diferentes navegadores, especialmente con las APIs de audio.

4. **Rendimiento del Canvas**: Mantener un rendimiento fluido en dispositivos de gama baja mientras se renderizaban múltiples elementos en movimiento.

### Desafíos de diseño:

1. **Equilibrio entre autenticidad y jugabilidad moderna**: Mantener la esencia retro mientras se incorporaban mejoras de usabilidad modernas.

2. **Creación de efectos visuales retro**: Implementar efectos como scanlines, distorsión CRT y paletas de colores limitadas que evocaran la era de los juegos clásicos.

3. **Diseño responsivo**: Adaptar la experiencia para diferentes tamaños de pantalla sin comprometer la jugabilidad.

## 🚀 Instalación y Uso

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/retro-games.git
   cd retro-games
