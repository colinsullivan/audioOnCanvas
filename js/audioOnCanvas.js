// Generated by CoffeeScript 1.3.1

/*
#  @file    audioOnCanvas.coffee
#
#  @author  Colin Sullivan <colinsul [at] gmail.com>
#
#           Copyright (c) 2012 Colin Sullivan
#           Licensed under the MIT license.
*/


(function() {
  var audioOnCanvas,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  audioOnCanvas = (typeof exports !== "undefined" && exports !== null) && this || (this.audioOnCanvas = {});

  /*
  #   @class  Base class for rendering an audio file on a canvas element.
  */


  audioOnCanvas.Renderer = (function() {

    Renderer.name = 'Renderer';

    /*
      # @constructor
      #
      # @param  canvasElement   The canvas element to draw the waveform on.
      # @param  buffer          The `AudioBuffer` instance to render.
    */


    function Renderer(options) {
      if (options == null) {
        options = {};
      }
      this.canvasElement = options.canvasElement;
      this.buffer = options.buffer;
      if (!(this.canvasElement != null)) {
        throw new Error("this.canvasElement is undefined");
      }
      if (!(this.buffer != null)) {
        throw new Error("this.buffer is undefined");
      }
      this.canvasCtx = this.canvasElement.getContext("2d");
      this.render();
    }

    /*
      # Should be overridden in subclasses to render audio plot.
    */


    Renderer.prototype.render = function() {
      return this;
    };

    return Renderer;

  })();

  /*
  #   @class    Used for generating a waveform inside a canvas
  #             element.
  #   @extends  audioOnCanvas.Renderer
  */


  audioOnCanvas.WaveformRenderer = (function(_super) {

    __extends(WaveformRenderer, _super);

    WaveformRenderer.name = 'WaveformRenderer';

    function WaveformRenderer() {
      return WaveformRenderer.__super__.constructor.apply(this, arguments);
    }

    WaveformRenderer.prototype.render = function() {
      var canvasHeight, canvasWidth, drawSample, midHeight, prevSamplePosition, samples, x, _i, _results,
        _this = this;
      WaveformRenderer.__super__.render.call(this);
      canvasHeight = this.canvasCtx.canvas.clientHeight;
      canvasWidth = this.canvasCtx.canvas.clientWidth;
      midHeight = canvasHeight / 2.0;
      prevSamplePosition = {
        x: 0,
        y: midHeight
      };
      samples = this.buffer.getChannelData(0);
      drawSample = function(x) {
        var newSamplePosition, sampleValue;
        sampleValue = samples[Math.floor((x / canvasWidth) * samples.length)];
        newSamplePosition = {
          x: x,
          y: midHeight - midHeight * sampleValue
        };
        _this.canvasCtx.beginPath();
        _this.canvasCtx.moveTo(prevSamplePosition.x, prevSamplePosition.y);
        _this.canvasCtx.lineTo(newSamplePosition.x, newSamplePosition.y);
        _this.canvasCtx.stroke();
        prevSamplePosition.x = newSamplePosition.x;
        return prevSamplePosition.y = newSamplePosition.y;
      };
      _results = [];
      for (x = _i = 0; 0 <= canvasWidth ? _i <= canvasWidth : _i >= canvasWidth; x = _i += 0.01) {
        _results.push(drawSample(x));
      }
      return _results;
    };

    return WaveformRenderer;

  })(audioOnCanvas.Renderer);

}).call(this);