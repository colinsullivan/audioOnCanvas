
window.onload = function () {

  var audioCtx = new webkitAudioContext();
  var xhr = new XMLHttpRequest();

  var buf, source, processNode, i;

  xhr.open(
    "GET",
    "../test_wavs/Air_EndingKeys.wav",
    true
  );
  xhr.responseType = "arraybuffer";
  xhr.onload = function(e) {

    // buffer for incoming audio
    buf = audioCtx.createBuffer(xhr.response, false);

    // simple custom node that will just pass through signal.
    // buffer size = 1024, outputs = 1, inputs = 1
    processNode = audioCtx.createJavaScriptNode(1024, 1, 1);

    i = 0;

    // called for each audio buffer
    processNode.onaudioprocess = function (e) {
      i++;

      // for each channel
      for (var c=0; c < e.inputBuffer.numberOfChannels; c++) {
        var inputChannelData = e.inputBuffer.getChannelData(c);
        var outputChannelData = e.outputBuffer.getChannelData(c);
        // for each sample
        for (var s=0; s < inputChannelData.length; s++) {
          outputChannelData[s] = inputChannelData[s];
        }
      }

      if (source.playbackState === source.FINISHED_STATE) {
        console.log("finished");
      }
    };
    
    source = audioCtx.createBufferSource();
    source.buffer = buf;
   
    source.connect(processNode);
    processNode.connect(audioCtx.destination);
    
    source.noteOn(0);

  }
  if (window.waitToSend) {
    setTimeout(function() {
      xhr.send();
    }, 2000);
  }
  else {
    xhr.send();
  }

};
