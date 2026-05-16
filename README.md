# 🌌 NEXUS MAZE

> A 3D browser-based maze game built with Three.js and Cannon-es. Navigate a sci-fi labyrinth at night, collect all items, avoid deadly obstacles, and reach the exit.

---

## 📸 Overview

NEXUS MAZE is a first/third-person 3D maze game developed as a school group project. The player controls a glowing ball through a large sci-fi maze, collecting scattered items while dodging rotating obstacles, using bounce pads, speed boosts, and teleporters — all rendered in a night environment with a star-filled sky.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo-name.git

# Navigate into the project folder
cd your-repo-name

# Install dependencies
npm install
```

### Running the Game

```bash
npm run dev
```

Then open your browser and go to `http://localhost:5173` (or whichever port Vite outputs).

### Building for Production

```bash
npm run build
```

The output will be in the `dist/` folder and can be deployed to any static hosting provider (Netlify, GitHub Pages, Vercel, etc.).

---

## 🎮 Controls

| Key | Action |
|---|---|
| `W` / `↑` | Move forward |
| `S` / `↓` | Move backward |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `Space` | Jump |
| `V` | Toggle first-person / third-person camera |
| `Escape` | Release mouse (exit pointer lock) |
| **Click on canvas** | Lock mouse to game (enables camera rotation) |

**Camera:** Click the game window to lock your mouse. Move the mouse to rotate the camera around the ball. Press `Escape` to unlock.

---

## 🧩 Features

### Core Gameplay
- **3D maze navigation** with physics-based ball movement (Cannon-es)
- **Collectibles** — 12 glowing red orbs scattered through the maze. Collect all of them to unlock the exit gate
- **Exit gate** — A barrier blocks the finish line until all collectibles are gathered. Once collected, it slides open
- **Win condition** — Reach the target zone at the end of the maze after collecting everything

### Obstacles & Interactive Elements
- **Rotating obstacles** — Red spinning barriers that instantly kill the player on contact (3 placed throughout the maze)
- **Moving platforms** — Green platforms that oscillate between two points, blocking or helping passage (5 platforms)
- **Bounce pads** — Magenta pads that launch the ball upward on contact (3 pads)
- **Speed boosts** — Cyan floor panels that apply a directional velocity boost (4 boosts)
- **Teleporters** — Yellow torus rings; enter one to be instantly transported to its paired exit (3 pairs)

### Camera System
- **Third-person camera** (default) — Follows the ball with smooth lerp, rotates with mouse, and avoids clipping through walls using raycasting
- **First-person camera** — Positions the camera inside the ball looking outward
- **Minimap (PIP)** — A top-down orthographic picture-in-picture view rendered in the top-left corner

### Environment
- Sci-fi themed textures on walls and floor (PBR materials with normal + roughness maps)
- Night sky with 2000 animated stars, a moon, and moon glow
- Emissive lighting on the player ball, collectibles, and all obstacles
- Dynamic point lights attached to the ball and each interactive element

### Game States
- **Death screen** — Triggered by contact with a rotating obstacle. Shows a restart/quit menu
- **Game completed screen** — Shown when the player reaches the exit with all collectibles
- **Collectible counter** — Live HUD display in the top-right corner (`Collectibles: X/12`)

---

## 🗂️ Project Structure

```
/
├── index.html              # Entry point
├── scripts/
│   ├── game.js             # Main game logic (Three.js + Cannon-es)
│   ├── wallsData.js        # Maze wall definitions (position, size, orientation)
│   └── gameOverScreen.html # Game over UI (loaded dynamically)
├── textures/
│   ├── Sci-Fi_Wall_014_SD/ # Floor textures (basecolor, normal, roughness)
│   └── Sci_fi_Metal_Panel_007_SD/ # Wall textures (basecolor, normal, roughness)
├── models/
│   └── symmetrical_abstract_ball.glb  # Decorative ball model (GLTF)
└── package.json
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [Three.js](https://threejs.org/) | 3D rendering (WebGL) |
| [Cannon-es](https://github.com/pmndrs/cannon-es) | Physics simulation |
| [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) | Loading the 3D ball model |
| [Vite](https://vitejs.dev/) | Dev server and build tool |

---

## ⚠️ Known Issues & Limitations

- **Performance** — Textures are currently loaded once per wall rather than cached, leading to redundant GPU uploads on scenes with many walls. This is a known issue and is being addressed in a refactor.
- **`showWall()` runs every frame** — The hidden wall animation function is called inside the main `animate()` loop, which spawns a new `setInterval` on every frame until the wall slides down. This is a bug that causes erratic behaviour and will be fixed.
- **Restart does not fully reset** — On death and restart, a new ball and model are created without fully removing the previous physics body from the world, which can cause ghost collisions.
- **Minimap renders full scene twice** — The PIP camera renders the entire scene again each frame, doubling draw calls. A future optimisation will reduce scene complexity for this pass.
- **No mobile support** — The game is keyboard and mouse only. No touch controls are implemented.
- **No audio** — Sound effects and background music are not yet implemented.

---

## 🔮 Planned Improvements

- [ ] Texture caching — load each texture once, share across all walls
- [ ] Fix `showWall()` animation loop bug
- [ ] Full game state reset on restart (clean physics world)
- [ ] Reduced-fidelity minimap rendering
- [ ] Sound effects (collect, death, boost, teleport)
- [ ] A timer / leaderboard
- [ ] Mobile touch controls
- [ ] Additional maze levels

---

## 👥 Credits

Built as a school group project.

- **Three.js** — [threejs.org](https://threejs.org/)
- **Cannon-es** — Physics by [pmndrs](https://github.com/pmndrs/cannon-es)
- **Textures** — Sci-Fi Wall 014 and Metal Panel 007 from [ambientcg.com](https://ambientcg.com) / [cgbookcase.com](https://cgbookcase.com) *(update this with your actual source)*
- **3D Model** — `symmetrical_abstract_ball.glb` *(update with actual credit/source)*

---

## 📄 License

This project was created for educational purposes. No license is applied — all rights reserved by the original authors unless otherwise stated.
