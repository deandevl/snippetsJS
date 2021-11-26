'use strict'
//export function VolumeGraph(audioCTX,canvasCTX) {
function VolumeGraph(audioCTX,canvasCTX) {
  var self = this;
  var gradient = canvasCTX.createLinearGradient(0,0,0,canvasCTX.canvas.height);
  gradient.addColorStop(1,'#000000');
  gradient.addColorStop(0.75,'#ff0000');
  gradient.addColorStop(0.25,'#ffff00');
  gradient.addColorStop(0,'#ffffff');

  /*
  Parameters:
    audioCTX is the context for audio;
    canvasCTX is the context for an HTML canvas;
    ch is an array specifing one or both sound channels i.e. [0],[1],[0,1];
  */
  self.wireNodes = function(ch) {
    var nodes = {};
    canvasCTX.clearRect(0, 0, canvasCTX.canvas.width, canvasCTX.canvas.height);
    var xspacing = 2;
    var xwidth = 30;
    var totalwidth = xspacing + xwidth;


    //Wire up nodes
    // create a buffer source node
    var sourceNode = audioCTX.createBufferSource();

    //Set the volume
    var volumeNode = audioCTX.createGainNode();
    volumeNode.gain.value = 0.5;

    // setup a javascript node
    var javascriptNode = audioCTX.createScriptProcessor(2048, 1, 1);
    // connect javascriptNode to destination, else it isn't called
    javascriptNode.connect(audioCTX.destination);

    // setup an analyzer
    var analyserNode = audioCTX.createAnalyser();
    analyserNode.smoothingTimeConstant = 0.3;
    analyserNode.fftSize = 512;
    //connect um up
    sourceNode.connect(volumeNode);
    volumeNode.connect(analyserNode);
    analyserNode.connect(javascriptNode);
    /*
    var splitter = audioCTX.createChannelSplitter();
    sourceNode.connect(splitter);
    var analysers = [];

    for(var i = 0; i < ch.length; i++) {
      if(ch[i] > 0) {
        var analyserNode = audioCTX.createAnalyser();
        analyserNode.smoothingTimeConstant = 0.3;
        analyserNode.fftSize = 512;
        splitter.connect(analyserNode,ch[i],0);
        analysers.push(analyserNode);
      }
    }

    // we use the javascript node to draw at a specific interval.
    //only need the first analyser to call the 'onaudioprocess' event
    analysers[0].connect(javascriptNode);
*/
    // connect javascriptNode to destination, else it isn't called
    javascriptNode.connect(audioCTX.destination);
    // and connect to destination, if you want audio
    //sourceNode.connect(audioCTX.destination);
    volumeNode.connect(audioCTX.destination);
    // when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume
    javascriptNode.onaudioprocess = function() {
      // clear the current state
      canvasCTX.clearRect(0, 0, canvasCTX.canvas.width, canvasCTX.canvas.height);
      // set the fill style
      canvasCTX.fillStyle=gradient;

      var array =  new Uint8Array(analyserNode.frequencyBinCount);
      analyserNode.getByteFrequencyData(array);
      var average = getAverageVolume(array);
      canvasCTX.fillRect(totalwidth,canvasCTX.canvas.height-average,xwidth,average);
      /*
      for(var i = 0; i < analysers.length; i++) {
        // get the average for the first channel
        var array =  new Uint8Array(analysers[i].frequencyBinCount);
        analysers[i].getByteFrequencyData(array);
     //   average.push(getAverageVolume(array));  //debug
        canvasCTX.fillRect(ch[i] * totalwidth,canvasCTX.canvas.height-average[i],xwidth,average[i]);
      }
      */

    };
    nodes.sourceNode = sourceNode;
    nodes.volumnNode = volumeNode;
    return nodes;
  };
  //private functions
  var getAverageVolume = function(array) {
    var values = 0;
    var average;
    var length = array.length;

    // get all the frequency amplitudes
    for (var i = 0; i < length; i++) {
      values += array[i];
    }
    average = values / length;
    return average;
  };
}