(function () {
  "use strict";

  var video = document.getElementById("video");
  var stage = document.getElementById("stage");
  var canvas = document.getElementById("snapshotCanvas");
  var startBtn = document.getElementById("startBtn");
  var startLabel = document.getElementById("startBtnLabel");
  var snapshotBtn = document.getElementById("snapshotBtn");
  var fullscreenBtn = document.getElementById("fullscreenBtn");
  var cameraSelect = document.getElementById("cameraSelect");
  var idleOverlay = document.getElementById("idleOverlay");
  var errorOverlay = document.getElementById("errorOverlay");
  var errorTitle = document.getElementById("errorTitle");
  var errorMessage = document.getElementById("errorMessage");
  var retryBtn = document.getElementById("retryBtn");
  var liveBadge = document.getElementById("liveBadge");
  var micBar = document.getElementById("micBar");

  var statResolution = document.getElementById("statResolution");
  var statFps = document.getElementById("statFps");
  var statAspect = document.getElementById("statAspect");
  var statStatus = document.getElementById("statStatus");

  var stream = null;
  var audioCtx = null;
  var analyser = null;
  var micRaf = null;
  var fpsRaf = null;
  var frameCount = 0;
  var fpsLast = 0;
  var running = false;

  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

  function setStatus(text) { statStatus.textContent = text; }

  function showOverlay(which) {
    idleOverlay.hidden = which !== "idle";
    errorOverlay.hidden = which !== "error";
  }

  function showError(title, message) {
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    showOverlay("error");
    video.classList.remove("active");
    liveBadge.hidden = true;
    setStatus("Error");
  }

  function stopStream() {
    if (fpsRaf) { cancelAnimationFrame(fpsRaf); fpsRaf = null; }
    if (micRaf) { cancelAnimationFrame(micRaf); micRaf = null; }
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (audioCtx) { audioCtx.close().catch(function () {}); audioCtx = null; analyser = null; }
    micBar.style.width = "0%";
    running = false;
  }

  function resetUI() {
    video.classList.remove("active");
    liveBadge.hidden = true;
    snapshotBtn.disabled = true;
    fullscreenBtn.disabled = true;
    startLabel.textContent = "Test my webcam";
    statResolution.textContent = "–";
    statFps.textContent = "–";
    statAspect.textContent = "–";
    setStatus("Idle");
    showOverlay("idle");
  }

  function updateVideoStats() {
    var w = video.videoWidth, h = video.videoHeight;
    if (w && h) {
      statResolution.textContent = w + "×" + h;
      var g = gcd(w, h);
      statAspect.textContent = (w / g) + ":" + (h / g);
    }
  }

  function measureFps(now) {
    frameCount++;
    if (!fpsLast) fpsLast = now;
    if (now - fpsLast >= 1000) {
      statFps.textContent = Math.round((frameCount * 1000) / (now - fpsLast)) + " FPS";
      frameCount = 0;
      fpsLast = now;
    }
    fpsRaf = requestAnimationFrame(measureFps);
  }

  function startFpsMeter() {
    frameCount = 0; fpsLast = 0;
    if (typeof video.requestVideoFrameCallback === "function") {
      var last = 0, count = 0;
      var cb = function (now) {
        count++;
        if (!last) last = now;
        if (now - last >= 1000) {
          statFps.textContent = Math.round((count * 1000) / (now - last)) + " FPS";
          count = 0; last = now;
        }
        if (running) video.requestVideoFrameCallback(cb);
      };
      video.requestVideoFrameCallback(cb);
    } else {
      fpsRaf = requestAnimationFrame(measureFps);
    }
  }

  function startMicMeter() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC || !stream.getAudioTracks().length) return;
      audioCtx = new AC();
      var src = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      var data = new Uint8Array(analyser.frequencyBinCount);
      var tick = function () {
        analyser.getByteFrequencyData(data);
        var sum = 0;
        for (var i = 0; i < data.length; i++) sum += data[i];
        var level = Math.min(100, Math.round((sum / data.length) * 1.6));
        micBar.style.width = level + "%";
        micRaf = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) { /* audio metering optional */ }
  }

  function populateCameras() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
      var cams = devices.filter(function (d) { return d.kind === "videoinput"; });
      cameraSelect.innerHTML = "";
      if (!cams.length) {
        cameraSelect.innerHTML = "<option>No camera found</option>";
        cameraSelect.disabled = true;
        return;
      }
      var current = stream && stream.getVideoTracks()[0] ? stream.getVideoTracks()[0].getSettings().deviceId : null;
      cams.forEach(function (cam, i) {
        var opt = document.createElement("option");
        opt.value = cam.deviceId;
        opt.textContent = cam.label || ("Camera " + (i + 1));
        if (cam.deviceId === current) opt.selected = true;
        cameraSelect.appendChild(opt);
      });
      cameraSelect.disabled = false;
    }).catch(function () {});
  }

  function start(deviceId) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError("Not supported", "Your browser does not support camera access. Try the latest Chrome, Edge, Firefox or Safari.");
      return;
    }
    if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
      showError("Secure connection needed", "Camera access requires an HTTPS connection. Please open this page over https://.");
      return;
    }

    stopStream();
    setStatus("Requesting…");
    startLabel.textContent = "Starting…";
    startBtn.disabled = true;

    var videoConstraint = deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } };

    navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: true })
      .then(function (s) {
        stream = s;
        running = true;
        video.srcObject = s;
        return video.play().catch(function () {});
      })
      .then(function () {
        showOverlay(null);
        video.classList.add("active");
        liveBadge.hidden = false;
        snapshotBtn.disabled = false;
        fullscreenBtn.disabled = false;
        startBtn.disabled = false;
        startLabel.textContent = "Restart camera";
        setStatus("Working ✓");
        statFps.textContent = "measuring…";
        updateVideoStats();
        startFpsMeter();
        startMicMeter();
        populateCameras();
      })
      .catch(function (err) {
        startBtn.disabled = false;
        startLabel.textContent = "Test my webcam";
        handleError(err);
      });
  }

  function handleError(err) {
    var name = err && err.name ? err.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") {
      showError("Permission blocked", "You denied camera access. Click the camera or lock icon in the address bar, set it to Allow, then reload the page.");
    } else if (name === "NotFoundError" || name === "OverconstrainedError") {
      showError("No camera found", "We couldn't find a camera. Make sure one is connected and not disabled in your system settings.");
    } else if (name === "NotReadableError" || name === "AbortError") {
      showError("Camera in use", "Your camera is being used by another app. Close Zoom, Teams, Skype or OBS, then try again.");
    } else {
      showError("Camera unavailable", "Something went wrong accessing your camera. Please reload the page and try again.");
    }
  }

  function takeSnapshot() {
    if (!video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    var ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "webcam-snapshot-" + Date.now() + ".png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }, "image/png");
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      (stage.requestFullscreen || stage.webkitRequestFullscreen || function () {}).call(stage);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    }
  }

  // --- Event wiring ---
  startBtn.addEventListener("click", function () { start(cameraSelect.value && !cameraSelect.disabled ? cameraSelect.value : null); });
  retryBtn.addEventListener("click", function () { start(null); });
  snapshotBtn.addEventListener("click", takeSnapshot);
  fullscreenBtn.addEventListener("click", toggleFullscreen);
  cameraSelect.addEventListener("change", function () { if (running) start(cameraSelect.value); });
  video.addEventListener("loadedmetadata", updateVideoStats);
  window.addEventListener("beforeunload", stopStream);

  // --- Theme toggle ---
  var themeToggle = document.getElementById("themeToggle");
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("wt-theme", t); } catch (e) {}
  }
  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem("wt-theme"); } catch (e) {}
    if (saved) applyTheme(saved);
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) applyTheme("dark");
  })();
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(cur);
    });
  }

  // --- Footer year ---
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  resetUI();
})();
