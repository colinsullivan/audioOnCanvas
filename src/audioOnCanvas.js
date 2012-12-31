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
      drawSample, x, me, rms, max, min, samplesPerPixel, prog, max_energy, min_energy;

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
    
    samplesPerPixel = samples.length / canvasWidth;

    // if one px per multiple samples
    if (samplesPerPixel >= 1.0) {
      // for each pixel, draw a vertical line representing an RMS of the signal
      // at that pixel.
      
      /**
       *  Calculate the RMS of the signal at the time pointed at by 
       *  `startSample` and `endSample`.
       **/
      rms = function (startSample) {
        var i, energy = 0, power, result, endSample = startSample + samplesPerPixel;

        for (i = startSample; i < endSample; i++) {
          energy += (Math.abs(samples[i]) * Math.abs(samples[i]));
        }

        power = energy / (endSample - startSample);

        result = Math.sqrt(power);
        
        return result;
      };

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


      for (x = 0; x < canvasWidth; x++) {
        prog = x / canvasWidth;

        // calculate magnitude of line at given point
        /*mag = rms(
          Math.floor(prog * samples.length)
        );
*/
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
      }
    }
  };
}).call(this);
