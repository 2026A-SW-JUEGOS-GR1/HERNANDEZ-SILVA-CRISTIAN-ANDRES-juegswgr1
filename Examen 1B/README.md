# Space Shooter

A 2D arcade space shooter built with [Phaser 3](https://phaser.io/).

## Play

Open `index.html` through any static web server (required because the project uses ES modules and loads assets over HTTP). For example, with VS Code's Live Server extension, or:

```bash
npx http-server .
```

Then open the URL printed by the server.

## Controls

| Keys                       | Description                                  |
| -------------------------- | -------------------------------------------- |
| Arrow Keys                 | Move the ship in 8 directions                |
| Spacebar                   | Fire                                         |
| `M`                        | Mute / unmute audio                          |
| `Esc`                      | Pause / resume                               |

## Project Layout

```
src/
  main.js                 # Game bootstrap
  config.js               # Tunable constants
  scenes/                 # Phaser scenes (boot, preload, game, pause)
  components/             # Reusable gameplay components (input, movement, health, ...)
  objects/                # Game objects (player, enemies, ui, audio manager)
  lib/phaser.js           # Phaser re-export for module imports
  types/typedef.js        # Shared JSDoc typedefs
assets/
  images/                 # Sprites and spritesheets
  audio/                  # Sound effects and background music
  data/                   # Asset pack + animation descriptors
```
