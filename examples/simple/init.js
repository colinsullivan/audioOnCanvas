(function () {
  "use strict";

  window.onload = function() {

    var audioCtx = new window.webkitAudioContext(),
      xhr = new window.XMLHttpRequest(),
      buf,
      waveformRenderer,
      containerElement;

    xhr.open(
      "GET",
      //"/examples/test_wavs/Air_EndingKeys.wav",
      "/examples/test_wavs/MC100510_BR_dry.wav",
      true
    );
    xhr.responseType = "arraybuffer";
    xhr.onload = function(e) {
      // buffer for incoming audio
      buf = audioCtx.createBuffer(xhr.response, false);

      containerElement = document.getElementById("waveform_container");

      waveformRenderer = new audioOnCanvas.WaveformRenderer({
        container: containerElement,
        buffer: buf,
        ctx: audioCtx
      });

      containerElement.onclick = function () {

        waveformRenderer.playPause();
        
      };

    };
    xhr.send();

  };
}).call(this);
  
