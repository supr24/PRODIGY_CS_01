const messageInput = document.querySelector("#message");
const languageSelect = document.querySelector("#language");
const shiftRange = document.querySelector("#shift");
const shiftNumber = document.querySelector("#shiftNumber");
const encryptButton = document.querySelector("#encryptBtn");
const decryptButton = document.querySelector("#decryptBtn");
const clearButton = document.querySelector("#clearBtn");
const useResultButton = document.querySelector("#useResultBtn");
const copyResultButton = document.querySelector("#copyResult");
const phoneticTyping = document.querySelector("#phoneticTyping");
const guidelinesButton = document.querySelector("#guidelinesButton");
const guidelinesModal = document.querySelector("#guidelinesModal");
const closeGuidelines = document.querySelector("#closeGuidelines");
const themeSelect = document.querySelector("#themeSelect");
const originalText = document.querySelector("#originalText");
const resultText = document.querySelector("#resultText");
const visualization = document.querySelector("#visualization");
const modeLabel = document.querySelector("#modeLabel");
const errorMessage = document.querySelector("#errorMessage");
const processImage = document.querySelector("#processImage");
const imageHoverCard = document.querySelector("#imageHoverCard");
const processSteps = document.querySelector("#processSteps");
const processTabs = document.querySelectorAll("[data-process]");

const vowelMap = {
  aa: { independent: "\u0906", matra: "\u093e" },
  ai: { independent: "\u0910", matra: "\u0948" },
  au: { independent: "\u0914", matra: "\u094c" },
  ee: { independent: "\u0908", matra: "\u0940" },
  ii: { independent: "\u0908", matra: "\u0940" },
  oo: { independent: "\u090a", matra: "\u0942" },
  uu: { independent: "\u090a", matra: "\u0942" },
  a: { independent: "\u0905", matra: "" },
  i: { independent: "\u0907", matra: "\u093f" },
  u: { independent: "\u0909", matra: "\u0941" },
  e: { independent: "\u090f", matra: "\u0947" },
  o: { independent: "\u0913", matra: "\u094b" },
};

const consonantMap = {
  ksh: "\u0915\u094d\u0937",
  chh: "\u091b",
  kh: "\u0916",
  gh: "\u0918",
  ch: "\u091a",
  jh: "\u091d",
  th: "\u0925",
  dh: "\u0927",
  ph: "\u092b",
  bh: "\u092d",
  sh: "\u0936",
  gn: "\u091c\u094d\u091e",
  gy: "\u091c\u094d\u091e",
  tr: "\u0924\u094d\u0930",
  k: "\u0915",
  g: "\u0917",
  c: "\u0915",
  j: "\u091c",
  t: "\u0924",
  d: "\u0926",
  n: "\u0928",
  p: "\u092a",
  b: "\u092c",
  m: "\u092e",
  y: "\u092f",
  r: "\u0930",
  l: "\u0932",
  v: "\u0935",
  w: "\u0935",
  s: "\u0938",
  h: "\u0939",
};

const vowelTokens = Object.keys(vowelMap).sort((a, b) => b.length - a.length);
const consonantTokens = Object.keys(consonantMap).sort((a, b) => b.length - a.length);

const processContent = {
  encrypt: {
    image: "/static/encrypt-process.svg",
    alt: "Encryption process diagram",
    hover: "Encryption shifts each supported letter forward. With shift 3, A becomes D and \u0915 becomes \u0918.",
    steps: [
      "Start with the original readable message.",
      "Move each supported letter forward by the selected shift.",
      "Wrap around the alphabet when the end is reached.",
      "Keep spaces, numbers, punctuation, and Hindi vowel signs unchanged.",
    ],
  },
  decrypt: {
    image: "/static/decrypt-process.svg",
    alt: "Decryption process diagram",
    hover: "Decryption walks backward by the same shift. With shift 3, D returns to A and \u0918 returns to \u0915.",
    steps: [
      "Start with encrypted cipher text.",
      "Move each supported letter backward by the same shift value.",
      "Wrap around to the end of the alphabet when moving before the first letter.",
      "The output returns to the original message when the shift matches.",
    ],
  },
};

let lastRun = null;
let isTransliterating = false;
let romanBuffer = "";
let composingStart = null;

function normalizeShift(value) {
  const shift = Number.parseInt(value, 10);

  if (Number.isNaN(shift)) {
    return 0;
  }

  return Math.min(25, Math.max(0, shift));
}

function displayCharacter(character) {
  if (character === " ") {
    return "space";
  }

  if (character === "\n") {
    return "line";
  }

  return character;
}

function isSupportedLetter(character) {
  return /[a-zA-Z]/.test(character) || /[\u0905-\u0939]/.test(character);
}

function matchToken(text, index, tokens) {
  return tokens.find((token) => text.startsWith(token, index));
}

function transliterateWord(word) {
  let output = "";
  let index = 0;

  while (index < word.length) {
    const consonant = matchToken(word, index, consonantTokens);

    if (consonant) {
      const consonantValue = consonantMap[consonant];
      index += consonant.length;

      const vowel = matchToken(word, index, vowelTokens);

      if (vowel) {
        output += consonantValue + vowelMap[vowel].matra;
        index += vowel.length;
      } else {
        const nextConsonant = matchToken(word, index, consonantTokens);
        output += consonantValue + (nextConsonant ? "\u094d" : "");
      }

      continue;
    }

    const vowel = matchToken(word, index, vowelTokens);

    if (vowel) {
      output += vowelMap[vowel].independent;
      index += vowel.length;
      continue;
    }

    output += word[index];
    index += 1;
  }

  return output;
}

function transliterateText(text) {
  return text.replace(/[A-Za-z]+/g, (word) => transliterateWord(word.toLowerCase()));
}

function replaceMessageRange(start, end, value) {
  messageInput.value = `${messageInput.value.slice(0, start)}${value}${messageInput.value.slice(end)}`;
  messageInput.selectionStart = start + value.length;
  messageInput.selectionEnd = start + value.length;
}

function resetPhoneticBuffer() {
  romanBuffer = "";
  composingStart = null;
}

function renderPhoneticBuffer() {
  const start = composingStart ?? messageInput.selectionStart;
  const currentEnd = messageInput.selectionStart;
  const hindiText = transliterateWord(romanBuffer);

  replaceMessageRange(start, currentEnd, hindiText);
  composingStart = start;
}

function setShift(value) {
  const shift = normalizeShift(value);
  shiftRange.value = shift;
  shiftNumber.value = shift;
  return shift;
}

function getTextForMode(mode) {
  if (
    mode === "decrypt" &&
    lastRun?.mode === "encrypt" &&
    lastRun.result &&
    messageInput.value === lastRun.source
  ) {
    return lastRun.result;
  }

  return messageInput.value;
}

async function runCipher(mode) {
  const text = getTextForMode(mode);
  const shift = setShift(shiftNumber.value);
  const language = languageSelect.value;

  if (!text.trim()) {
    errorMessage.textContent = "Please enter a message first.";
    return;
  }

  errorMessage.textContent = "";
  resultText.textContent = "Working...";
  originalText.textContent = text;
  visualization.innerHTML = "";
  modeLabel.textContent = `${mode === "encrypt" ? "Encrypt" : "Decrypt"} shift ${mode === "encrypt" ? "+" : "-"}${shift}`;
  setProcessTab(mode);

  try {
    const response = await fetch(`/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, shift, language }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    resultText.textContent = data.result;
    renderVisualization(text, data.result, shift, mode);
    lastRun = {
      mode,
      source: mode === "decrypt" ? messageInput.value : text,
      inputUsed: text,
      result: data.result,
      shift,
      language,
    };
  } catch (error) {
    resultText.textContent = "-";
    errorMessage.textContent = error.message;
  }
}

function renderVisualization(source, result, shift, mode) {
  visualization.innerHTML = "";

  [...source].forEach((character, index) => {
    const outputCharacter = [...result][index] || "";
    const card = document.createElement("article");
    card.className = "letter-card";
    card.style.animationDelay = `${index * 55}ms`;
    card.dataset.tip = isSupportedLetter(character)
      ? `${displayCharacter(character)} ${mode === "encrypt" ? "moves forward" : "moves backward"} ${shift} places to become ${displayCharacter(outputCharacter)}`
      : `${displayCharacter(character)} is not shifted`;

    const flow = document.createElement("div");
    flow.className = "letter-flow";

    const from = document.createElement("span");
    from.className = "from";
    from.textContent = displayCharacter(character);

    const arrow = document.createElement("span");
    arrow.className = `arrow ${mode}`;
    arrow.textContent = mode === "encrypt" ? "->" : "<-";

    const to = document.createElement("span");
    to.className = `to ${mode}`;
    to.textContent = displayCharacter(outputCharacter);

    const note = document.createElement("span");
    note.className = "shift-note";
    note.textContent = isSupportedLetter(character)
      ? `${mode === "encrypt" ? "forward" : "back"} ${shift}`
      : "unchanged";

    flow.append(from, arrow, to);
    card.append(flow, note);
    visualization.append(card);
  });
}

function setProcessTab(mode) {
  const content = processContent[mode];

  processTabs.forEach((tab) => {
    const isActive = tab.dataset.process === mode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  processImage.src = content.image;
  processImage.alt = content.alt;
  imageHoverCard.textContent = content.hover;
  processSteps.innerHTML = "";

  content.steps.forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    processSteps.append(item);
  });
}

function setTheme(theme) {
  document.body.classList.remove("dark", "eye-care");

  if (theme !== "light") {
    document.body.classList.add(theme);
  }

  if (themeSelect) {
    themeSelect.value = theme;
  }

  localStorage.setItem("easencrypt-theme", theme);
}

function openGuidelines() {
  guidelinesModal.classList.add("open");
  guidelinesModal.setAttribute("aria-hidden", "false");
  closeGuidelines.focus();
}

function closeGuidelinesModal() {
  guidelinesModal.classList.remove("open");
  guidelinesModal.setAttribute("aria-hidden", "true");
  guidelinesButton.focus();
}

messageInput.addEventListener("input", () => {
  if (!phoneticTyping.checked || isTransliterating) {
    return;
  }

  isTransliterating = true;
  const transformed = transliterateText(messageInput.value);
  messageInput.value = transformed;
  messageInput.selectionStart = transformed.length;
  messageInput.selectionEnd = transformed.length;
  isTransliterating = false;
});

messageInput.addEventListener("keydown", (event) => {
  if (!phoneticTyping.checked || event.ctrlKey || event.metaKey || event.altKey) {
    resetPhoneticBuffer();
    return;
  }

  if (/^[a-zA-Z]$/.test(event.key)) {
    event.preventDefault();

    if (composingStart === null || messageInput.selectionStart !== messageInput.selectionEnd) {
      composingStart = messageInput.selectionStart;
      romanBuffer = "";
    }

    romanBuffer += event.key.toLowerCase();
    renderPhoneticBuffer();
    return;
  }

  if (event.key === "Backspace" && romanBuffer) {
    event.preventDefault();
    romanBuffer = romanBuffer.slice(0, -1);

    if (!romanBuffer) {
      replaceMessageRange(composingStart, messageInput.selectionStart, "");
      resetPhoneticBuffer();
      return;
    }

    renderPhoneticBuffer();
    return;
  }

  if (event.key === " " || event.key === "Enter" || event.key.length === 1) {
    resetPhoneticBuffer();
  }
});

phoneticTyping.addEventListener("change", () => {
  resetPhoneticBuffer();

  if (phoneticTyping.checked) {
    languageSelect.value = "hindi";
    messageInput.placeholder = "Type namaste, bharat, shanti...";
  } else {
    messageInput.placeholder = "Enter English or Hindi text";
  }
});

shiftRange.addEventListener("input", () => {
  setShift(shiftRange.value);
});

shiftNumber.addEventListener("input", () => {
  setShift(shiftNumber.value);
});

encryptButton.addEventListener("click", () => runCipher("encrypt"));
decryptButton.addEventListener("click", () => runCipher("decrypt"));

useResultButton.addEventListener("click", () => {
  if (!resultText.textContent || resultText.textContent === "-") {
    return;
  }

  messageInput.value = resultText.textContent;
});

clearButton.addEventListener("click", () => {
  messageInput.value = "";
  originalText.textContent = "-";
  resultText.textContent = "-";
  visualization.innerHTML = "";
  errorMessage.textContent = "";
  lastRun = null;
});

copyResultButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(resultText.textContent);
  copyResultButton.textContent = "Copied";

  window.setTimeout(() => {
    copyResultButton.textContent = "Copy Result";
  }, 1200);
});

guidelinesButton.addEventListener("click", openGuidelines);
closeGuidelines.addEventListener("click", closeGuidelinesModal);

guidelinesModal.addEventListener("click", (event) => {
  if (event.target === guidelinesModal) {
    closeGuidelinesModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && guidelinesModal.classList.contains("open")) {
    closeGuidelinesModal();
  }
});

if (themeSelect) {
  themeSelect.addEventListener("change", () => setTheme(themeSelect.value));
}

processTabs.forEach((tab) => {
  tab.addEventListener("click", () => setProcessTab(tab.dataset.process));
});

setTheme(localStorage.getItem("easencrypt-theme") || "light");
setProcessTab("encrypt");
renderVisualization("Attack at dawn!", "Dwwdfn dw gdzq!", 3, "encrypt");
lastRun = {
  mode: "encrypt",
  source: "Attack at dawn!",
  inputUsed: "Attack at dawn!",
  result: "Dwwdfn dw gdzq!",
  shift: 3,
  language: "auto",
};
