/**
 *  @file       audioOnCanvas.js
 *
 *  @author     Colin Sullivan <colinsul [at] gmail.com>
 *
 *              Copyright (c) 2012 Colin Sullivan
 *              Licensed under the MIT license.
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
    for (x = 0; x < canvasWidth; x += 0.01) {
      drawSample(x);
    }


  };

}).call(this);
