###
#  @file    audioOnCanvas.coffee
#
#  @author  Colin Sullivan <colinsul [at] gmail.com>
#
#           Copyright (c) 2012 Colin Sullivan
#           Licensed under the MIT license.
###

audioOnCanvas = exports? and @ or @audioOnCanvas = {}

###
#   @class  Base class for rendering an audio file on a canvas element.
###
class audioOnCanvas.Renderer
  ###
  # @constructor
  #
  # @param  canvasElement   The canvas element to draw the waveform on.
  # @param  buffer          The `AudioBuffer` instance to render.
  ###
  constructor: (options={}) ->

    @canvasElement = options.canvasElement
    @buffer = options.buffer

    if not @canvasElement?
      throw new Error "this.canvasElement is undefined"

    if not @buffer?
      throw new Error "this.buffer is undefined"

    @canvasCtx = @canvasElement.getContext("2d")
    
    @render()

  ###
  # Should be overridden in subclasses to render audio plot.
  ###
  render: () ->
    return @

###
#   @class    Used for generating a waveform inside a canvas
#             element.
#   @extends  audioOnCanvas.Renderer
###
class audioOnCanvas.WaveformRenderer extends audioOnCanvas.Renderer


  render: () ->

    super()

    canvasHeight = @canvasCtx.canvas.clientHeight
    canvasWidth = @canvasCtx.canvas.clientWidth
    midHeight = canvasHeight/2.0
    
    prevSamplePosition =
      x: 0
      y: midHeight


    # for now just do mono
    samples = @buffer.getChannelData 0

    ##
    # Draw a line from the previous audio sample represented in the
    # image to the next one.
    #
    # @param  x  x-coordinate of next audio sample to represent.
    ##
    drawSample = (x) =>

      # value of audio at this point
      sampleValue = samples[Math.floor(
        (x / canvasWidth)*samples.length
      )]

      # new position
      newSamplePosition =
        x: x
        y: midHeight - midHeight*sampleValue

      @canvasCtx.beginPath()
      @canvasCtx.moveTo(prevSamplePosition.x, prevSamplePosition.y)
      @canvasCtx.lineTo(newSamplePosition.x, newSamplePosition.y)
      @canvasCtx.stroke()

      prevSamplePosition.x = newSamplePosition.x
      prevSamplePosition.y = newSamplePosition.y
      

    # For each fraction of a pixel, draw audio sample as necessary
    drawSample(x) for x in [0..canvasWidth] by 0.01

###
#   @class  Used for generating a spectrum inside a canvas element.
###
class audioOnCanvas.SpectrumRenderer extends audioOnCanvas.Renderer
  render: () ->
    super()

    canvasHeight = @canvasCtx.canvas.clientHeight
    canvasWidth = @canvasCtx.canvas.clientWidth

    # Here we'll create a temporary audio context just to render out
    # the spectrum.
    # TODO: Do this in non-realtime when available.
    temporaryAudioCtx = new webkitAudioContext()

    # to play our source that we're analyzing
    source = temporaryAudioCtx.createBufferSource()
    source.buffer = @buffer

    # spectrum analyzer
    spectrumNode = temporaryAudioCtx.createAnalyser()
    spectrumNode.fftSize = 512
    spectrumNode.smoothingTimeConstant = 0.5
    #    spectrumNode.minDecibels = -100
    #    spectrumNode.maxDecibels = 0
    source.connect(spectrumNode)

    # Dummy process node so we can get grab frequency information at audio
    # rates.
    processNode = temporaryAudioCtx.createJavaScriptNode(
      512,
      @buffer.numberOfChannels,
      1
    )

    frequencyDatum = []

    playTime = null

    finishRendering = () =>
      console.log frequencyDatum
      processNode.disconnect(temporaryAudioCtx.destination)

      freqBinWidth = canvasWidth/frequencyDatum.length

      spectrogram = context.createImageData(canvasWidth, canvasHeight)

      # for each time chunk (horizontal pixel)
      for x in [0..canvasWidth]
        timeChunk = frequencyDatum[Math.floor(x/canvasWidth)]

        # for each frequency bin in the applicable time chunk
        for j in [0..timeChunk.length]

          # Draw pixel
          spectrogram.data[canvasWidth*j*4 + x*4] = 255
          spectrogram.data[canvasWidth*j*4 + x*4 + 1] = 255
          spectrogram.data[canvasWidth*j*4 + x*4 + 2] = 255
          spectrogram.data[canvasWidth*j*4 + x*4 + 3] = 255*timeChunk[j]

          #      for i in [0..frequencyData.length]
          #
          #        newSamplePosition =
          #          x:(i/frequencyData.length)*canvasWidth
          #          y:canvasHeight + (frequencyData[i]/frequencyData[0])*canvasHeight
          #        
          #        @canvasCtx.beginPath()
          #        @canvasCtx.moveTo(prevSamplePosition.x, prevSamplePosition.y)
          #        @canvasCtx.lineTo(newSamplePosition.x, newSamplePosition.y)
          #        @canvasCtx.stroke()
          #        
          #        prevSamplePosition.x = newSamplePosition.x
          #        prevSamplePosition.y = newSamplePosition.y

    prevSamplePosition =
      x:0
      y:canvasHeight

    frequencyData = new Float32Array(512)
    processSpectrumData = (e) =>
      
      spectrumNode.getFloatFrequencyData(frequencyData)

      frequencyDatum.push
        time: temporaryAudioCtx.currentTime
        frequencyData: frequencyData

      
      if temporaryAudioCtx.currentTime+playTime > @buffer.length/@buffer.sampleRate
        finishRendering()

    processNode.onaudioprocess = processSpectrumData
    spectrumNode.connect(processNode)
    
    console.log "Processing"
    processNode.connect(temporaryAudioCtx.destination)

    playTime = temporaryAudioCtx.currentTime
    source.noteOn(0)

