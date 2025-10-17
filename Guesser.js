// VARIABLES
const hint = document.querySelector(".hint")
const trial = document.querySelector(".trials")
const number = document.getElementById("number")
const input = document.querySelector(".input")
const submit = document.querySelector(".submit")
const restart = document.querySelector(".restart")
const value = document.querySelector(".value")
const start = document.querySelector(".start")
const body = document.querySelector(".body")
const exit = document.querySelector(".exit")

// GAME INTRO LOGIC
start.addEventListener('click', ()=>{
    body.classList.add("drop")
    start.classList.add("away")
})


// RANDOMIZATION
const options = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20"]

let select = ""

select = Number(options[Math.floor(Math.random() * options.length)])
 
let trialLeft = ['❤','❤','❤']
number.innerHTML = trialLeft.join(' ')


// SUBMIT FUNCTION
submit.addEventListener('click', ()=>{
 
    const guess = Number(input.value)

      if(input.value.trim() === ""){
        value.innerHTML = "No number detected ✋"
        return;
    }
    
      if (guess === select) {
        value.innerHTML = "You won 😁"
        input.disabled = true;
        submit.classList.add("remove")
        restart.classList.add("add")
        return;
    }

     if (guess >= 21 || guess <= 0){
        value.innerHTML = "Your input is beyond the range"
        return;
    }

    trialLeft.pop();
    number.innerHTML = trialLeft.join(' ');
    
    if (trialLeft.length === 0) {
        number.innerHTML = '😖';
        value.innerHTML = "You lose! The number was " + select;
        input.disabled = true;
        submit.classList.add("remove");
        restart.classList.add("add");
    }
    
    else if (guess < select) {
        value.innerHTML = "Your Number is less than mine 🙊";
    }
    
    else { 
        value.innerHTML = "Your Number is greater than mine 👀";
    }
})

// RESTART FUNCTION
restart.addEventListener("click", ()=>{
    value.innerHTML = "Enter a value"

    input.value = ""
    input.disabled = false;
    select = Number(options[Math.ceil(Math.random() * options.length)])
    submit.classList.remove("remove")
    restart.classList.remove("add")

    trialLeft = ['❤','❤','❤']
    number.innerHTML = trialLeft.join(' ')
})
