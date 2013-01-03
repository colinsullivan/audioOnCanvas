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
   *  @class  audioOnCanvas.AudioPlayer   Audio player functionality using
   *  Web Audio API.
   *
   *  @param  AudioBuffer   options.buffer    The buffer instance to play and
   *  render.
   *  @param  webkitAudioContext  options.ctx  The audio context.
   *  @param  Function            options.playhead_update_callback  Callback used when playhead position is updated.
   **/
  audioOnCanvas.AudioPlayer = function (options) {
    options = options || {};
    
    this.buffer = options.buffer;
    this.ctx = options.ctx;
    this.playhead_update_callback = options.playhead_update_callback || function () {};
    
    if (typeof this.buffer === "undefined" || this.buffer === null) {
      throw new Error("this.buffer is undefined");
    }

    if (typeof this.ctx === "undefined" || this.ctx === null) {
      throw new Error("this.ctx is undefined");
    }

    this.lastStartTime = null;
    this.playheadPosition = 0;
    this.playheadProgress = 0.0;

    this.playbackNode = null;

    this.isPlaying = false;

    this.playhead_update_interval = null;

    this.prepare_to_play();

  };

  audioOnCanvas.AudioPlayer.prototype.prepare_to_play = function () {
    this.playbackNode = this.ctx.createBufferSource();
    this.playbackNode.buffer = this.buffer;
    this.playbackNode.connect(this.ctx.destination);
  };

  /**
   *  Playback of audio.
   **/
  audioOnCanvas.AudioPlayer.prototype.play = function () {
    var me = this;

    this.lastStartTime = this.ctx.currentTime - this.playheadPosition;
    this.playbackNode.start(this.ctx.currentTime, this.playheadPosition);

    this.playhead_update_interval = setInterval(function () {
      me.update_playhead();
    }, 50);

    this.isPlaying = true;
    
  };

  audioOnCanvas.AudioPlayer.prototype.reset_playhead = function () {
    this.playheadPosition = 0;
    this.playheadProgress = 0.0;
  };

  audioOnCanvas.AudioPlayer.prototype.update_playhead = function () {
    this.playheadPosition = this.ctx.currentTime - this.lastStartTime;
    this.playheadProgress = this.playheadPosition / this.buffer.duration;
    
    // if audio is finished playing
    if (this.playheadProgress >= 1.0) {

      // send out final update
      this.playheadProgress = 1.0;
      this.playheadPosition = this.buffer.duration;
      this.playhead_update_callback({
        pos: this.playheadPosition,
        prog: this.playheadProgress 
      });

      this.reset_playhead();
     
      this.pause();
      
    } else {
      this.playhead_update_callback({
        pos: this.playheadPosition,
        prog: this.playheadProgress 
      });
    }

  };

  audioOnCanvas.AudioPlayer.prototype.pause = function () {
    this.playbackNode.stop(this.ctx.currentTime);
    clearInterval(this.playhead_update_interval);

    this.isPlaying = false;

    this.prepare_to_play();
  };

  audioOnCanvas.AudioPlayer.prototype.playPause = function () {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  };
  
  /**
   *  @constructor
   *
   *  @param  HTMLElement   options.container       The container to populate
   *  with canvas elements.
   *  @param  Number        options.width           The width of the image.
   *  Defaults to the current width of the container.
   *  @param  Number        options.height          The height of the image.
   *  Defaults to the current height of the container.
   *  @param  Boolean       options.renderAsync     Wether or not to render
   *  asynchronously (waveform loads in pieces).  Defaults to true.
   **/
  audioOnCanvas.Renderer = function (options) {
    audioOnCanvas.AudioPlayer.apply(this, arguments);

    options = options || {};

    this.container = options.container;
    this.renderAsync = options.renderAsync || true;

    if (typeof this.container === "undefined" || this.container === null) {
      throw new Error("this.container is undefined");
    }

    this.width = options.width || this.container.clientWidth;
    this.height = options.height || this.container.clientHeight;
    this.midHeight = 0.5 * this.height;

    this.waveformCanvasElement = document.createElement("canvas");
    this.waveformCanvasElement.width = this.width;
    this.waveformCanvasElement.height = this.height;
    this.waveformCanvasElement.style.position = "absolute";
    this.container.appendChild(this.waveformCanvasElement);

    this.playheadCanvasElement = document.createElement("canvas");
    this.playheadCanvasElement.width = this.width;
    this.playheadCanvasElement.height = this.height;
    this.playheadCanvasElement.style.position = "absolute";
    this.container.appendChild(this.playheadCanvasElement);

    this.waveformCanvasCtx = this.waveformCanvasElement.getContext("2d");
    this.playheadCanvasCtx = this.playheadCanvasElement.getContext("2d");

    this.render();
  };
  audioOnCanvas.Renderer.prototype = Object.create(audioOnCanvas.AudioPlayer.prototype);

  /**
   *  Should be overridden in subclasses to render audio plots.
   **/
  audioOnCanvas.Renderer.prototype.render = function () {
    var ctx = this.waveformCanvasCtx,
      midHeight = this.midHeight,
      width = this.width,
      height = this.height,
      numVerticalGridLines = 10,
      verticalGridLineSpacing = Math.floor(midHeight / numVerticalGridLines),
      horizontalGridLineSpacing = 35,
      numHorizontalGridLines = Math.ceil(width / horizontalGridLineSpacing),
      i,
      y,
      x;

    // clear canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // render grid

    // zero line style
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = "rgba(100, 100, 100, 0.9)";

    // zero line
    ctx.beginPath();
    ctx.moveTo(0, midHeight + 0.5);
    ctx.lineTo(width, midHeight + 0.5);
    ctx.stroke();

    // grid style
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = "rgba(100, 100, 100, 0.1)";

    // draw grid vertical (positive)
    for (i = 0; i < numVerticalGridLines; i++) {
      ctx.beginPath();
      y = i * verticalGridLineSpacing + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // draw grid vertical (negative)
    // +1 skips the zero line, which was already drawn
    for (i = 1; i < numVerticalGridLines + 1; i++) {
      ctx.beginPath();
      y = midHeight + i * verticalGridLineSpacing - 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // draw horizontal grid
    for (i = 0; i < numHorizontalGridLines; i++) {
      ctx.beginPath();
      x = i * horizontalGridLineSpacing + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    

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
    //this.waveformCanvasCtx.moveTo(x + 0.5, midHeight + mag * canvasHeight);
    //this.waveformCanvasCtx.lineTo(x + 0.5, midHeight - mag * canvasHeight);
    
    this.waveformCanvasCtx.beginPath();
    this.waveformCanvasCtx.moveTo(x + 0.5, midHeight);
    this.waveformCanvasCtx.lineTo(x + 0.5, midHeight - max * midHeight);
    this.waveformCanvasCtx.stroke();
    
    this.waveformCanvasCtx.beginPath();
    this.waveformCanvasCtx.moveTo(x + 0.5, midHeight);
    this.waveformCanvasCtx.lineTo(x + 0.5, midHeight - min * midHeight);
    this.waveformCanvasCtx.stroke();
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
    
    this.canvasHeight = this.waveformCanvasCtx.canvas.clientHeight;
    this.canvasWidth = this.waveformCanvasCtx.canvas.clientWidth;
    this.midHeight = this.canvasHeight / 2.0;

    // waveform style
    this.waveformCanvasCtx.strokeStyle = "#000000";
    this.waveformCanvasCtx.lineWidth = 1.0;

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

    // move playhead to current position
    this.render_playhead();
  };

  audioOnCanvas.WaveformRenderer.prototype.render_playhead = function () {
    var x, ctx = this.playheadCanvasCtx;
    
    // current position of playhead
    x = this.playheadProgress * this.width;

    ctx.clearRect(0, 0, this.width, this.height);

    // draw
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, this.height);
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = "#aa5500";
    ctx.stroke();
  };

  audioOnCanvas.WaveformRenderer.prototype.update_playhead = function () {
    audioOnCanvas.Renderer.prototype.update_playhead.apply(this, arguments);

    this.render_playhead();
  };
}).call(this);
