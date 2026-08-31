const resultDisplay = document.querySelector("#result");
const expressionDisplay = document.querySelector("#expression");
const keypad = document.querySelector(".keypad");

let displayValue = "0";
let firstOperand = null;
let operator = null;
let waitingForOperand = false;
let expression = "";

const operatorSymbols = { "/": "÷", "*": "×", "-": "−", "+": "+" };

function formatValue(value) {
  if (!Number.isFinite(Number(value))) return "Error";
  const number = Number(value);
  if (Math.abs(number) >= 1e10 || (Math.abs(number) < 1e-7 && number !== 0)) {
    return number.toExponential(7).replace(/\.0+e/, "e");
  }
  return String(Number(number.toPrecision(12)));
}

function updateDisplay() {
  resultDisplay.value = displayValue;
  resultDisplay.textContent = displayValue;
  expressionDisplay.textContent = expression || "\u00a0";
  document.querySelectorAll("[data-operator]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.operator === operator && waitingForOperand);
  });
}

function inputDigit(digit) {
  if (displayValue === "Error" || waitingForOperand) {
    displayValue = digit;
    waitingForOperand = false;
  } else if (displayValue === "0") {
    displayValue = digit;
  } else if (displayValue.replace(/[.-]/g, "").length < 11) {
    displayValue += digit;
  }
}

function inputDecimal() {
  if (displayValue === "Error" || waitingForOperand) {
    displayValue = "0.";
    waitingForOperand = false;
  } else if (!displayValue.includes(".")) {
    displayValue += ".";
  }
}

function calculate(left, right, selectedOperator) {
  if (selectedOperator === "+") return left + right;
  if (selectedOperator === "-") return left - right;
  if (selectedOperator === "*") return left * right;
  if (selectedOperator === "/") return right === 0 ? NaN : left / right;
  return right;
}

function chooseOperator(nextOperator) {
  const inputValue = Number(displayValue);
  if (!Number.isFinite(inputValue)) return clear();

  if (operator && waitingForOperand) {
    operator = nextOperator;
    expression = `${formatValue(firstOperand)} ${operatorSymbols[nextOperator]}`;
    return;
  }

  if (firstOperand === null) {
    firstOperand = inputValue;
  } else if (operator) {
    firstOperand = calculate(firstOperand, inputValue, operator);
    displayValue = formatValue(firstOperand);
    if (displayValue === "Error") return resetAfterError();
  }

  operator = nextOperator;
  waitingForOperand = true;
  expression = `${formatValue(firstOperand)} ${operatorSymbols[operator]}`;
}

function equals() {
  if (operator === null || waitingForOperand) return;
  const rightOperand = Number(displayValue);
  const previousExpression = `${formatValue(firstOperand)} ${operatorSymbols[operator]} ${formatValue(rightOperand)} =`;
  displayValue = formatValue(calculate(firstOperand, rightOperand, operator));
  expression = previousExpression;
  firstOperand = null;
  operator = null;
  waitingForOperand = true;
}

function clear() {
  displayValue = "0";
  firstOperand = null;
  operator = null;
  waitingForOperand = false;
  expression = "";
}

function resetAfterError() {
  firstOperand = null;
  operator = null;
  waitingForOperand = true;
  expression = "Cannot divide by zero";
}

function runAction(action) {
  if (action === "clear") clear();
  if (action === "decimal") inputDecimal();
  if (action === "equals") equals();
  if (action === "sign" && displayValue !== "0" && displayValue !== "Error") displayValue = String(-Number(displayValue));
  if (action === "percent" && displayValue !== "Error") displayValue = formatValue(Number(displayValue) / 100);
  updateDisplay();
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.number) inputDigit(button.dataset.number);
  if (button.dataset.operator) chooseOperator(button.dataset.operator);
  if (button.dataset.action) runAction(button.dataset.action);
  updateDisplay();
});

document.addEventListener("keydown", (event) => {
  const key = event.key;
  const matchingKey = document.querySelector(
    `[data-number="${key}"], [data-operator="${key}"], ${key === "." ? '[data-action="decimal"]' : key === "Enter" || key === "=" ? '[data-action="equals"]' : key === "Escape" ? '[data-action="clear"]' : ".key-that-does-not-exist"}`
  );

  if (/^\d$/.test(key)) inputDigit(key);
  else if (["+", "-", "*", "/"].includes(key)) chooseOperator(key);
  else if (key === ".") inputDecimal();
  else if (key === "Enter" || key === "=") equals();
  else if (key === "Escape" || key === "Delete") clear();
  else if (key === "Backspace" && !waitingForOperand) displayValue = displayValue.length > 1 ? displayValue.slice(0, -1) : "0";
  else return;

  event.preventDefault();
  matchingKey?.classList.add("is-pressed");
  window.setTimeout(() => matchingKey?.classList.remove("is-pressed"), 100);
  updateDisplay();
});

updateDisplay();
