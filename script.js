
const display = document.getElementById("display");
const previous = document.getElementById("previous");
const historyList = document.getElementById("historyList");
const themeBtn = document.getElementById("themeBtn");

let expression = "";
let lastAnswer = 0;
let justCalculated = false;

const math = window.math;

// Scientific functions use degrees for sin, cos and tan.
const scope = {
    sin: x => Math.sin(x * Math.PI / 180),
    cos: x => Math.cos(x * Math.PI / 180),
    tan: x => {
        const radians = x * Math.PI / 180;
        if (Math.abs(Math.cos(radians)) < 1e-12) {
            throw new Error("Undefined tangent");
        }
        return Math.tan(radians);
    },
    log10: x => Math.log10(x),
    ln: x => Math.log(x),
    sqrt: x => Math.sqrt(x),
    pi: Math.PI,
    e: Math.E,
    Ans: 0
};

function updateDisplay() {
    display.value = expression || "0";
}

function appendValue(value) {
    if (justCalculated) {
        if (/^[0-9.]$/.test(value) ||
            value === "pi" || value === "e" ||
            value.endsWith("(")) {
            expression = "";
            previous.textContent = "";
        }
        justCalculated = false;
    }

    if (value === "Ans") {
        expression += "Ans";
    } else {
        expression += value;
    }

    updateDisplay();
}

function clearDisplay() {
    expression = "";
    previous.textContent = "";
    justCalculated = false;
    updateDisplay();
}

function deleteLast() {
    if (justCalculated) {
        clearDisplay();
        return;
    }

    expression = expression.slice(0, -1);
    updateDisplay();
}

function calculate() {
    if (!expression.trim()) return;

    try {
        // Parse and evaluate with math.js instead of JavaScript eval.
        const node = math.parse(expression);
        const result = node.evaluate({
            ...scope,
            Ans: lastAnswer
        });

        if (typeof result !== "number" ||
            !Number.isFinite(result)) {
            throw new Error("Invalid result");
        }

        const answer = Number(result.toPrecision(12));
        const originalExpression = expression;

        previous.textContent = originalExpression + " =";
        expression = String(answer);
        lastAnswer = answer;
        justCalculated = true;
        updateDisplay();

        saveHistory(originalExpression, answer);
    } catch (error) {
        previous.textContent = "Invalid calculation";
        display.value = "Error";
        expression = "";
        justCalculated = false;
    }
}

function saveHistory(expr, answer) {
    let history = [];

    try {
        history = JSON.parse(
            localStorage.getItem("calculatorHistory") || "[]"
        );
        if (!Array.isArray(history)) history = [];
    } catch {
        history = [];
    }

    history.unshift({
        expression: expr,
        result: String(answer)
    });

    history = history.slice(0, 20);

    try {
        localStorage.setItem(
            "calculatorHistory",
            JSON.stringify(history)
        );
    } catch {
        // The calculator still works if storage is unavailable.
    }

    renderHistory();
}

function renderHistory() {
    let history = [];

    try {
        history = JSON.parse(
            localStorage.getItem("calculatorHistory") || "[]"
        );
        if (!Array.isArray(history)) history = [];
    } catch {
        history = [];
    }

    historyList.replaceChildren();

    if (history.length === 0) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "Your calculations will appear here.";
        historyList.appendChild(li);
        return;
    }

    history.forEach(item => {
        const li = document.createElement("li");
        li.className = "history-item";

        const equation = document.createElement("span");
        equation.textContent = item.expression + " =";

        const result = document.createElement("span");
        result.className = "result";
        result.textContent = item.result;

        li.append(equation, result);

        // Click a past result to reuse it.
        li.addEventListener("click", () => {
            expression = item.result;
            previous.textContent = item.expression + " =";
            justCalculated = true;
            updateDisplay();
        });

        historyList.appendChild(li);
    });
}

document.querySelectorAll("[data-value]").forEach(button => {
    button.addEventListener("click", () => {
        appendValue(button.dataset.value);
    });
});

document.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => {
        const action = button.dataset.action;

        if (action === "clear") clearDisplay();
        if (action === "delete") deleteLast();
        if (action === "calculate") calculate();
    });
});

document.getElementById("clearHistory")
    .addEventListener("click", () => {
        localStorage.removeItem("calculatorHistory");
        renderHistory();
    });

// Keyboard support
document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const key = event.key;

    if (/^[0-9.+\-*/%()]$/.test(key)) {
        event.preventDefault();
        appendValue(key);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "Backspace") {
        event.preventDefault();
        deleteLast();
    } else if (key === "Escape") {
        clearDisplay();
    }
});

// Dark/light theme
function setTheme(isLight) {
    document.body.classList.toggle("light", isLight);
    themeBtn.textContent = isLight ? "🌙" : "☀️";

    try {
        localStorage.setItem(
            "calculatorTheme",
            isLight ? "light" : "dark"
        );
    } catch {
        // Theme switching still works without storage.
    }
}

themeBtn.addEventListener("click", () => {
    setTheme(!document.body.classList.contains("light"));
});

// Restore saved preferences and history
try {
    setTheme(localStorage.getItem("calculatorTheme") === "light");
} catch {
    setTheme(false);
}

renderHistory();
updateDisplay();
