<img width="959" height="511" alt="Screenshot 2026-11-09 205030" src="https://github.com/user-attachments/assets/63560ad9-ebfd-442e-8208-7d2f1fbd9491" />
# Pixel Arcade

Pixel Arcade is a solo number-guessing game with a clean, mobile-friendly puzzle interface. Choose a difficulty and find the hidden number before your tries run out.

**Play live:** [pixel-arcade-eta.vercel.app](https://pixel-arcade-eta.vercel.app/)

## How to play

1. Choose **Easy**, **Normal**, or **Hard** from the custom difficulty menu on the start screen.
2. Select **Start Game**.
3. Enter a whole number in the selected range, then select **Lock In Guess**.
4. Use the clue (which says whether the hidden number is higher or lower than your guess), remaining range, and guess history to narrow down the answer.
5. Guess correctly to win. If you run out of tries, the game reveals the number.
6. Choose the next round's difficulty from the custom menu in the result dialog, then select **Play Again**.

Repeated guesses are not accepted and do not use a try.

## Features

- Responsive green-and-white puzzle interface for desktop and mobile.
- Three difficulty modes:

  | Mode | Number range | Tries | Points per try | Best possible score |
  | --- | ---: | ---: | ---: | ---: |
  | Easy | 1–20 | 4 | 1 | 4 |
  | Normal | 1–30 | 3 | 2 | 6 |
  | Hard | 1–60 | 3 | 5 | 15 |

  No mode can be won by rote: every range is wider than a perfect binary search can cover in the tries given, so even ideal play can miss.

- Heart indicators and higher/lower clues.
- A shrinking possible range and a history of guesses.
- A result dialog for wins and losses, with the answer and score.
- Matching custom difficulty menus on the start screen and result dialog; both support keyboard navigation.
- Best score and consecutive win streak saved in the browser.
- Optional sound effects, off by default, with the on/off preference saved in the browser.
- Keyboard and screen-reader support, including a focused guess field and an accessible result dialog.
- Reduced-motion support.

The score is based on the number of tries used: a win is worth one point per unused try, including the winning guess, multiplied by the mode's point value (Easy 1, Normal 2, Hard 5). A round costs the same points whether you win or lose, so the harder modes are the only place to build a big best score. The best score and win streak are tracked separately for each difficulty in the browser's local storage. Older records are migrated to Normal mode and to the new score scale. Records may not be available in private browsing or if browser storage is disabled.

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
