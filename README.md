# Pixel Arcade

Pixel Arcade is a solo number-guessing game with a retro arcade cabinet interface. Find the hidden whole number from **1 to 20** in **three tries**.

**Play live:** [pixel-arcade-eta.vercel.app](https://pixel-arcade-eta.vercel.app/)

## How to play

1. Select **Start Game**.
2. Enter a whole number from 1 to 20, then select **Lock In Guess**.
3. Use the higher or lower clue, remaining range, and guess history to narrow down the answer.
4. Guess correctly to win. If all three tries are used, the game reveals the number.
5. Select **Play Again** in the result dialog to start another round.

Repeated guesses are not accepted and do not use a try.

## Features

- Responsive arcade-style interface for desktop and mobile.
- Three attempts per round, with heart indicators and higher/lower clues.
- A shrinking possible range and a history of guesses.
- A result dialog for wins and losses, with the answer and score.
- Best score and consecutive win streak saved in the browser.
- Optional sound effects, off by default.
- Keyboard and screen-reader support, including a focused guess field and an accessible result dialog.
- Reduced-motion support.

The score is based on the number of tries used: a win on the first, second, or third try earns 3, 2, or 1 point, respectively. The best score and win streak are stored in the browser's local storage; they may not be available in private browsing or if browser storage is disabled.

## Run locally

No installation, build step, or package manager is required. Open `index.html` in a modern browser, or serve the project directory with any static web server.

## Deploy

The project is static and can be deployed to any static hosting provider. The root `index.html` is the entry point; no application build command is needed.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Game screens, controls, and result dialog. |
| `Guesser.css` | Arcade styling, responsive layouts, and motion. |
| `Guesser.js` | Game rules, round state, records, and sound effects. |
| `favi.svg` | Browser tab icon. |
| `fonts/Nunito-latin.woff2` | Locally hosted Nunito font. |
| `fonts/OFL.txt` | SIL Open Font License for Nunito. |

## Technologies

- HTML
- CSS
- Vanilla JavaScript and the Web Audio API
