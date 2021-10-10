document.addEventListener("DOMContentLoaded", function () {
  var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
      dpr = window.devicePixelRatio || 1,
      bsr =
        ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio ||
        1;

    return dpr / bsr;
  })();

  createHiDPICanvas = function (w, h, ratio) {
    if (!ratio) {
      ratio = PIXEL_RATIO;
    }
    var can = document.createElement("canvas");
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + "px";
    can.style.height = h + "px";
    can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
  };

  const rootElement = document.getElementById("root");
  const canvas = createHiDPICanvas(window.innerWidth, window.innerHeight, 1);
  rootElement.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let isDrawing = false;
  const PENICL = "pencil";
  const ERASER = "eraser";
  let activeTool = PENICL;
  let currentDrawingId = null;

  const btnPencil = document.getElementById("pencil");
  const btnEraser = document.getElementById("eraser");
  const btnPrevious = document.getElementById("previous");
  const btnNext = document.getElementById("next");
  const btnSave = document.getElementById("save");
  const btnLogin = document.getElementById("login");
  const linkDownload = document.getElementById("downloadLnk");

  function loadImage(url) {
    return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
  }

  btnPrevious.addEventListener("click", async function () {
    let fetchUrl = "/api/drawings";
    if (currentDrawingId) {
      fetchUrl += "?beforeId=" + currentDrawingId;
    }
    const res = await fetch(fetchUrl);
    const jsonData = await res.json();
    const drawing = jsonData.data;
    currentDrawingId = drawing._id;
    const url = drawing.signedUrl;

    let img = await loadImage(url);
    ctx.drawImage(img, 0, 0);
  });

  btnLogin.addEventListener("click", function () {
    const username = prompt("Username");
    const password = prompt("Password");

    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
  });

  btnPencil.addEventListener("click", function () {
    setActiveTool(PENICL);
  });

  btnEraser.addEventListener("click", function () {
    setActiveTool(ERASER);
  });

  btnSave.addEventListener("click", function () {
    const base64String = canvas.toDataURL("image/jpeg", 0.8);

    fetch(base64String)
      .then(function (res) {
        return res.blob();
      })
      .then(function (blob) {
        const formData = new FormData();
        const file = new File([blob], "drawing.jpg");
        formData.append("drawing", file);

        fetch("/api/drawings", {
          method: "POST",
          body: formData,
        });
      });
  });

  function downloadImage() {
    var dt = canvas.toDataURL("image/jpeg", 0.8);
    this.href = dt;
  }
  linkDownload.addEventListener("click", downloadImage, false);

  function setActiveTool(tool) {
    activeTool = tool;
    const toolElements = [btnPencil, btnEraser];
    for (const el of toolElements) {
      el.setAttribute("class", "");
    }

    const activeToolElement = activeTool === PENICL ? btnPencil : btnEraser;

    activeToolElement.setAttribute("class", "active");
  }

  function draw(e) {
    if (!ctx || !isDrawing) {
      return;
    }

    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches[0].touchType === "stylus") {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const NAV_HEIGHT = 21;
    clientY -= NAV_HEIGHT;

    ctx.lineCap = "round";

    switch (activeTool) {
      case PENICL:
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000";
        break;
      case ERASER:
        ctx.lineWidth = 20;
        ctx.strokeStyle = "#FFF";
        break;
    }

    ctx.lineTo(clientX, clientY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(clientX, clientY);
  }

  function handleMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    isDrawing = true;
    draw(e);
  }

  function handleMouseUp(e) {
    e.preventDefault();
    e.stopPropagation();
    isDrawing = false;
    draw(e);
    ctx?.beginPath();
  }

  function handleMouseMove(e) {
    e.preventDefault();
    e.stopPropagation();
    draw(e);
  }

  canvas.addEventListener("touchstart", handleMouseDown);
  canvas.addEventListener("touchend", handleMouseUp);
  canvas.addEventListener("touchmove", handleMouseMove);

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mousemove", handleMouseMove);
});
