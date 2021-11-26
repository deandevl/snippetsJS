'use strict'
//export function FrequencyGraph(audioCTX,canvasCTX) {
function FrequencyGraph(audioCTX,canvasCTX) {
  var self = this;

  self.wireNodes = function() {
    canvasCTX.clearRect(0, 0, canvasCTX.canvas.width, canvasCTX.canvas.height);
    var xspacing = 2;
    var xwidth = (canvasCTX.canvas.width - (256 * xspacing))/256;
    var totalwidth = xspacing + xwidth;
    var gradient = canvasCTX.createLinearGradient(0,0,0,canvasCTX.canvas.height);
    gradient.addColorStop(1,'#000000');
    gradient.addColorStop(0.75,'#ff0000');
    gradient.addColorStop(0.25,'#ffff00');
    gradient.addColorStop(0,'#ffffff');

    //Wire up nodes
    // create a buffer source node
    var sourceNode = audioCTX.createBufferSource();

    // setup a javascript node
    // we use the javascript node to draw at a specific interval.
    var javascriptNode = audioCTX.createScriptProcessor(2048, 1, 1);

    //set up an analyser
    var analyserNode = audioCTX.createAnalyser();
    analyserNode.smoothingTimeConstant = 0.3;
    analyserNode.fftSize = 512;

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
      var array =  new Uint8Array(analyserNode.frequencyBinCount);
      analyserNode.getByteFrequencyData(array);

      // clear the current state
      canvasCTX.clearRect(0, 0, canvasCTX.canvas.width, canvasCTX.canvas.height);

      // set the fill style
      canvasCTX.fillStyle=gradient;
      //draw the bins
      for(var i = 0; i < array.length; i++ ){
        canvasCTX.fillRect(i * totalwidth,canvasCTX.canvas.height-array[i],xwidth,array[i]);
      }
    };
    return sourceNode;
  };
}