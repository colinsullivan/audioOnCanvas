/**
 *  @file       audioOnCanvas.js
 *
 *  @author     Colin Sullivan <colinsul [at] gmail.com>
 *
 *              Copyright (c) 2012 Colin Sullivan
 *              Licensed under the MIT license.
 **/

/**
 *  @namespace  audioOnCanvas   Some classes for rendering visual 
 *  representations of audio data on a canvas element.
 **/
(function () {
  "use strict";
  

  var audioOnCanvas = (typeof exports !== "undefined" && exports !== null) && this || (this.audioOnCanvas = {});

  
  /**
   *  @constructor
   *
   *  @param  CanvasElement options.canvasElement   The canvas element to draw
   *  the image on.
   *  @param  AudioBuffer   options.buffer          The buffer instance to
   *  render.
   **/
  audioOnCanvas.Renderer = function (options) {
    options = options || {};

    this.canvasElement = options.canvasElement;
    this.buffer = options.buffer;

    if (typeof this.canvasElement === "undefined" || this.canvasElement === null) {
      throw new Error("this.canvasElement is undefined");
    }

    if (typeof this.buffer === "undefined" || this.buffer === null) {
      throw new Error("this.buffer is undefined");
    }

    this.canvasCtx = this.canvasElement.getContext("2d");
    this.render();
  };

  /**
   *  Should be overridden in subclasses to render audio plots.
   **/
  audioOnCanvas.Renderer.prototype.render = function () {
    return this;
  };


  /**
   *  @class    Used for generating a waveform inside a canvas element.
   *  @extends  audioOnCanvas.Renderer
   **/
  audioOnCanvas.WaveformRenderer = function (options) {
   
    audioOnCanvas.Renderer.call(this, options);

  };
  audioOnCanvas.WaveformRenderer.prototype = Object.create(audioOnCanvas.Renderer.prototype);

  /**
   *  Render an audio amplitude waveform.
   **/
  audioOnCanvas.WaveformRenderer.prototype.render = function () {
    audioOnCanvas.Renderer.prototype.render.call(this);

    var canvasHeight, canvasWidth, midHeight, prevSamplePosition, samples,
      drawSample, x, me;

    me = this;

    canvasHeight = this.canvasCtx.canvas.clientHeight;
    canvasWidth = this.canvasCtx.canvas.clientWidth;
    midHeight = canvasHeight / 2.0;
    prevSamplePosition = {
      x: 0,
      y: midHeight
    };
    // for now, just do mono
    samples = this.buffer.getChannelData(0);

    /**
     *  Draw a line from the previous audio sample represented in the image
     *  to the next one.
     *
     *  @param  number  x   x-coordinate of the next audio sample to represent
     **/
    drawSample = function (x) {
      var sampleValue, newSamplePosition;
      
      // value of audio at this point
      sampleValue = samples[Math.floor(
        (x / canvasWidth) * samples.length
      )];

      // new position
      newSamplePosition = {
        x: x,
        y: midHeight - midHeight * sampleValue
      };

      me.canvasCtx.beginPath();
      me.canvasCtx.moveTo(prevSamplePosition.x, prevSamplePosition.y);
      me.canvasCtx.lineTo(newSamplePosition.x, newSamplePosition.y);
      me.canvasCtx.stroke();

      prevSamplePosition.x = newSamplePosition.x;
      prevSamplePosition.y = newSamplePosition.y;
    };

    // for each fraction of a pixel, draw audio sample as necessary
    // TODO: better waveform rendering algorithm.
    for (x = 0; x < canvasWidth; x += 0.01) {
      drawSample(x);
    }
  };


  /**
   *  @class  Used for generating a spectrogram of an audio signal inside a 
   *  canvas element.
   *  @extends  audioOnCanvas.Renderer
   **/
  audioOnCanvas.SpectrumRenderer = function (options) {
    audioOnCanvas.Renderer.call(this, options);
  };
  audioOnCanvas.SpectrumRenderer.prototype = Object.create(audioOnCanvas.Renderer.prototype);

  /**
   *  Render the spectrogram using the provided audio data.
   **/
  audioOnCanvas.SpectrumRenderer.prototype.render = function () {
    var canvasHeight, canvasWidth, temporaryAudioCtx, source, fftsize,
      spectrumNode, frequencyDatum, playTime, finishedAnalyzing,
      processSpectrumData, processNode;

    canvasHeight = this.canvasCtx.canvas.clientHeight;
    canvasWidth = this.canvasCtx.canvas.clientWidth;

    /**
     *  Here we'll create a temporary audio context just to render out the 
     *  spectrum.  TODO: non-realtime when available.
     **/
    temporaryAudioCtx = new webkitAudioContext();

    // to play our source we're currently analyzing
    source = temporaryAudioCtx.createBufferSource();
    source.buffer = this.buffer;

    fftsize = 1024;

    // spectrum analyzer
    //spectrumNode = temporaryAudioCtx.createAnalyser();
    //spectrumNode.fftSize = fftsize;
    //spectrumNode.smoothingTimeConstant = 0.5;
    // will analyze our source
    //source.connect(spectrumNode);

    // dummy process node so we can grab frequency information at audio rates
    processNode = temporaryAudioCtx.createJavaScriptNode(
      fftsize,
      1,
      1
    );

    frequencyDatum = [];

    playTime = null;

    var i = 0;
    
    // called when entire audio buffer has been analyzed
    finishedAnalyzing = function () {
      console.log("finished processing");
      console.log("frequencyDatum");
      console.log(frequencyDatum);
      console.log("i");
      console.log(i);
    };

    // called for each audio buffer
    processSpectrumData = function (e) {
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
        finishedAnalyzing();
      }
    };

    processNode.onaudioprocess = processSpectrumData;
    // will come after spectrumNode in signal chain.
    //spectrumNode.connect(processNode);
    source.connect(processNode);
    //source.connect(temporaryAudioCtx.destination);
    processNode.connect(temporaryAudioCtx.destination);
    console.log("note on");
    source.noteOn(0);
  }
}).call(this);
