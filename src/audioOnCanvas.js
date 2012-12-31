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
   *  @param  Boolean       options.renderAsync     Wether or not to render
   *  asynchronously (waveform loads in pieces).  Defaults to true.
   **/
  audioOnCanvas.Renderer = function (options) {
    options = options || {};

    this.canvasElement = options.canvasElement;
    this.buffer = options.buffer;
    this.renderAsync = options.renderAsync || true;

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

  audioOnCanvas.WaveformRenderer.prototype.render_block = function (x, samples, samplesPerPixel) {
    var prog, max, min, midHeight = this.midHeight, max_energy, min_energy;

    prog = x / this.canvasWidth;

    // calculate magnitude of line at given point
    /*mag = rms(
      Math.floor(prog * samples.length)
    );
*/
    /**
     *  Calculate the maximum amplitude of the signal at the time pointed at
     *  by `startSample` and `endSample`.
     **/
    max_energy = function (startSample) {
      var i, energy, maxEnergy = -1.0, endSample = startSample + samplesPerPixel;

      for (i = startSample; i < endSample; i++) {
        if (samples[i] > maxEnergy) {
          maxEnergy = samples[i];
        }
      }

      return maxEnergy;
    };

    min_energy = function (startSample) {
      var i, energy, minEnergy = 1.0, endSample = startSample + samplesPerPixel;

      for (i = startSample; i < endSample; i++) {
        if (samples[i] < minEnergy) {
          minEnergy = samples[i];
        }
      }

      return minEnergy;
    };
    max = max_energy(Math.floor(prog * samples.length));
    min = min_energy(Math.floor(prog * samples.length));

    //// draw vertical line at given magnitude
    //this.canvasCtx.moveTo(x + 0.5, midHeight + mag * canvasHeight);
    //this.canvasCtx.lineTo(x + 0.5, midHeight - mag * canvasHeight);
    
    this.canvasCtx.beginPath();
    this.canvasCtx.moveTo(x + 0.5, midHeight);
    this.canvasCtx.lineTo(x + 0.5, midHeight - max * midHeight);
    this.canvasCtx.stroke();
    
    this.canvasCtx.beginPath();
    this.canvasCtx.moveTo(x + 0.5, midHeight);
    this.canvasCtx.lineTo(x + 0.5, midHeight - min * midHeight);
    this.canvasCtx.stroke();
  };

  /**
   *  Render an audio amplitude waveform.
   **/
  audioOnCanvas.WaveformRenderer.prototype.render = function () {
    audioOnCanvas.Renderer.prototype.render.call(this);

    var samples,
      render_block_async,
      x,
      samplesPerPixel;
    
    this.canvasHeight = this.canvasCtx.canvas.clientHeight;
    this.canvasWidth = this.canvasCtx.canvas.clientWidth;
    this.midHeight = this.canvasHeight / 2.0;

    // for now, just do mono
    samples = this.buffer.getChannelData(0);
    
    samplesPerPixel = samples.length / this.canvasWidth;

    // if one px per multiple samples
    if (samplesPerPixel >= 1.0) {
      render_block_async = function (me) {
        return function (x) {
          setTimeout(function () {
            me.render_block(x, samples, samplesPerPixel);
          }, 1);
        };
      }(this);

      for (x = 0; x < this.canvasWidth; x++) {
        if (this.renderAsync) {
          render_block_async(x);
        } else {
          this.render_block(x, samples, samplesPerPixel);
        }
      }
    }
  };
}).call(this);
