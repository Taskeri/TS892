
let count = 0;
let intervalId = null;
let prevBrightness = null;
let isDetecting = false;

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const countDisplay = document.getElementById("count");
const materialSelect = document.getElementById("materialSelect");

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
  });
  video.srcObject = stream;
}

function calculateBrightness(imageData) {
  let sum = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    sum += brightness;
  }
  return sum / (imageData.data.length / 4);
}

function detectChange() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const avgBrightness = calculateBrightness(imageData);

  if (prevBrightness !== null) {
    const diff = Math.abs(avgBrightness - prevBrightness);
    if (diff > 30) {
      count++;
      countDisplay.textContent = count;
      sendToSheet();
    }
  }
  prevBrightness = avgBrightness;
}

function startDetection() {
  isDetecting = true;
  intervalId = setInterval(detectChange, 2000);
}

function stopDetection() {
  isDetecting = false;
  clearInterval(intervalId);
}

function sendManual() {
  sendToSheet();
}

async function sendToSheet() {
  const timestamp = new Date().toLocaleString("he-IL");
  const material = materialSelect.value;
  try {
    await fetch("/send-to-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timestamp, material })
    });
  } catch (e) {
    console.error("שגיאה בשליחה", e);
  }
}

async function fetchMaterials() {
  const res = await fetch("/materials");
  const data = await res.json();
  materialSelect.innerHTML = "";
  data.materials.forEach((mat) => {
    const option = document.createElement("option");
    option.value = mat;
    option.textContent = mat;
    materialSelect.appendChild(option);
  });
}

setupCamera();
fetchMaterials();
