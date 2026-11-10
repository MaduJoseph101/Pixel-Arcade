# Pixel Arcade

Pixel Arcade is a solo number-guessing game with a clean, mobile-friendly puzzle interface. Choose a difficulty and find the hidden number before your tries run out.

**Play live:** [pixel-arcade-eta.vercel.app](https://pixel-arcade-eta.vercel.app/)

## How to play

1. Choose **Easy**, **Normal**, or **Hard** on the start screen.
2. Select **Start Game**.
3. Enter a whole number in the selected range, then select **Lock In Guess**.
4. Use the higher or lower clue, remaining range, and guess history to narrow down the answer.
5. Guess correctly to win. If you run out of tries, the game reveals the number.
6. Choose the next round's difficulty from the custom menu in the result dialog, then select **Play Again**.

Repeated guesses are not accepted and do not use a try.

## Features

- Responsive green-and-white puzzle interface for desktop and mobile.
- Three difficulty modes:

  | Mode | Number range | Tries |
  | --- | ---: | ---: |
  | Easy | 1–10 | 5 |
  | Normal | 1–20 | 3 |
  | Hard | 1–50 | 3 |

- Heart indicators and higher/lower clues.
- A shrinking possible range and a history of guesses.
- A result dialog for wins and losses, with the answer and score.
- A custom difficulty menu in the result dialog for choosing the next round's mode; it supports keyboard navigation.
- Best score and consecutive win streak saved in the browser.
- Optional sound effects, off by default, with the on/off preference saved in the browser.
- Keyboard and screen-reader support, including a focused guess field and an accessible result dialog.
- Reduced-motion support.

The score is based on the number of tries used: each mode awards one point per unused try, plus one. The best score and win streak are tracked separately for each difficulty in the browser's local storage. Existing records are migrated to Normal mode. Records may not be available in private browsing or if browser storage is disabled.

## Run locally

No installation, build step, or package manager is required. Open `index.html` in a modern browser, or serve the project directory with any static web server.

## Deploy

The project is static and can be deployed to any static hosting provider. The root `index.html` is the entry point; no application build command is needed.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Game screens, controls, and result dialog. |
| `Guesser.css` | Visual styling, responsive layouts, and motion. |
| `Guesser.js` | Game rules, round state, records, and sound effects. |
| `favi.svg` | Browser tab icon. |
| `fonts/Nunito-latin.woff2` | Locally hosted Nunito font. |
| `fonts/OFL.txt` | SIL Open Font License for Nunito. |

## Technologies

- HTML
- CSS
- Vanilla JavaScript and the Web Audio API
