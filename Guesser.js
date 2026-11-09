const MAX_NUMBER = 20;
const MAX_TRIES = 3;

const ui = {
  startScreen: document.getElementById("start-screen"),
  gameScreen: document.getElementById("game-screen"),
  start: document.querySelector(".start"),
  form: document.querySelector(".guess-form"),
  input: document.querySelector(".input"),
  submit: document.querySelector(".submit"),
  restart: document.querySelector(".restart"),
  value: document.querySelector(".value"),
  hearts: document.getElementById("lives-icons"),
  attemptsLabel: document.getElementById("attempts-label"),
};

const state = {
  select: 0,
  attemptsLeft: MAX_TRIES,
  isGameOver: false,
};

function getRandomNumber() {
  return Math.floor(Math.random() * MAX_NUMBER) + 1;
}

function setStatus(message, status = "default") {
  ui.value.textContent = message;
  ui.value.dataset.state = status;
}

function renderLives() {
  ui.hearts.querySelectorAll(".life-icon").forEach((heart, index) => {
    const isActive = index < state.attemptsLeft;
    heart.classList.toggle("is-active", isActive);
    heart.classList.toggle("is-lost", !isActive);
  });
  ui.attemptsLabel.textContent = `${state.attemptsLeft} ${state.attemptsLeft === 1 ? "try" : "tries"} remaining`;
}

function resetGame() {
  state.select = getRandomNumber();
  state.attemptsLeft = MAX_TRIES;
  state.isGameOver = false;

  ui.input.value = "";
  ui.input.disabled = false;
  ui.input.removeAttribute("aria-invalid");
  ui.submit.disabled = false;
  ui.submit.hidden = false;
  ui.restart.hidden = true;
  setStatus("Enter a whole number from 1 to 20.");
  renderLives();
}

function endGame(won) {
  state.isGameOver = true;
  ui.input.disabled = true;
  ui.submit.disabled = true;
  ui.submit.hidden = true;
  ui.restart.hidden = false;

  if (won) {
    setStatus("YOU GOT IT! Nice shot.", "success");
    return;
  }

  ui.attemptsLabel.textContent = "No tries remaining";
  setStatus(`OUT OF TRIES. The number was ${state.select}.`, "error");
}

function startGame() {
  resetGame();
  ui.startScreen.hidden = true;
  ui.gameScreen.hidden = false;
  ui.input.focus();
}

ui.start.addEventListener("click", startGame);

ui.form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (state.isGameOver) {
    return;
  }

  const rawGuess = ui.input.value.trim();
  const guess = Number(rawGuess);

  if (rawGuess === "" || !Number.isInteger(guess) || guess < 1 || guess > MAX_NUMBER) {
    ui.input.setAttribute("aria-invalid", "true");
    setStatus("Enter a whole number from 1 to 20.", "error");
    ui.input.focus();
    return;
  }

  ui.input.removeAttribute("aria-invalid");

  if (guess === state.select) {
    endGame(true);
    return;
  }

  state.attemptsLeft -= 1;
  renderLives();

  if (state.attemptsLeft === 0) {
    endGame(false);
    return;
  }

  const clue = guess < state.select
    ? "Too low. Try a higher number."
    : "Too high. Try a lower number.";
  setStatus(clue, "clue");
});

ui.restart.addEventListener("click", () => {
  resetGame();
  ui.input.focus();
});
