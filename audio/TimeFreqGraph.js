'use strict'
//export function TimeFreqGraph(audioCTX,canvasCTX) {
function TimeFreqGraph(audioCTX,canvasCTX) {
  var self = this;
  var sourceNode;
  var tempCtx;
  var gradient = canvasCTX.createLinearGradient(0,0,0,canvasCTX.canvas.height);
  gradient.addColorStop(1,'#000000');
  gradient.addColorStop(0.75,'#ff0000');
  gradient.addColorStop(0.25,'#ffff00');
  gradient.addColorStop(0,'#ffffff');
  /*
  // used for color distribution
  var hot = new color.ColorScale({
    colors:['#000000', '#ff0000', '#ffff00', '#ffffff'],
    positions:[0, .25, .75, 1],
    mode:'rgb',
    limits:[0, 300]
  });
  */
  self.wireNodes = function() {
    // create a temp canvas we use for copying and scrolling
    var tempCanvas = document.createElement("canvas");
    tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width=800;
    tempCanvas.height=512;

    //Wire up nodes
    // create a buffer source node
    sourceNode = audioCTX.createBufferSource();
    // setup a javascript node
    // we use the javascript node to draw at a specific interval.
    var javascriptNode = audioCTX.createScriptProcessor(2048, 1, 1);

    //set up an analyser
    var analyserNode = audioCTX.createAnalyser();
    analyserNode.smoothingTimeConstant = 0.0;
    analyserNode.fftSize = 1024;

    //connect um up
    sourceNode.connect(analyserNode);
    analyserNode.connect(javascriptNode);
    // connect javascriptNode to destination, else it isn't called
    javascriptNode.connect(audioCTX.destination);
    // and connect to destination, if you want audio
    sourceNode.connect(audioCTX.destination);

    // when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume
    javascriptNode.onaudioprocess = function() {
      var array = new Uint8Array(analyserNode.frequencyBinCount);
      analyserNode.getByteFrequencyData(array);

      // draw the spectrogram
      if(sourceNode.playbackState == sourceNode.PLAYING_STATE) {
        // copy the current canvas onto the temp canvas
        tempCtx.drawImage(canvasCTX.canvas, 0, 0, 800, 512);


        // iterate over the elements from the array
        for (var i = 0; i < array.length; i++) {
          // draw each pixel with the specific color
          var value = array[i];
          //canvasCTX.fillStyle = hot.getColor(value).hex();
         // canvasCTX.fillStyle=gradient;
          // draw the line at the right side of the canvas
          canvasCTX.fillRect(800 - 1, 512 - i, 1, 1);
        }

        // set translate on the canvas
        canvasCTX.translate(-1, 0);
        // draw the copied image
        canvasCTX.drawImage(tempCanvas, 0, 0, 800, 512, 0, 0, 800, 512);

        // reset the transformation matrix
        canvasCTX.setTransform(1, 0, 0, 1, 0, 0);
      }

    };
    return sourceNode;
  }
}