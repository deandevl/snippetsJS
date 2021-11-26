'use strict'
//export function WebAudio() {
function WebAudio() {
  var self = this;

  var audioCTX = getContext(),
      currentURL;

  self.getPlaylist = function(url) {
    if(url) {
      var deferred = Q.defer();
      var req = new XMLHttpRequest();
      req.open('GET',url,true);
      req.onload = function() {
        var that = this;
        if(that.readyState === 4 && that.status === 200) {
          deferred.resolve(that.response);
        }else {
          deferred.reject(that.status);
        }
      };
      req.onerror = function(e) {
        deferred.reject(e);
      };
      req.send();
      return deferred.promise;
    }
  };
  self.loadSound = function(url) {
    if(url) {
      var deferred = Q.defer();
      currentURL = url;
      var req = new XMLHttpRequest();
      req.responseType = 'arraybuffer';
      req.open('GET',url,true);
      req.onload = function() {
        var that = this;
        if(that.readyState === 4 && that.status === 200) {
          deferred.resolve(that.response);
        }else {
          deferred.reject(that.status);
        }
      };
      req.onerror = function(e) {
        deferred.reject(e);
      };
      req.send();
      return deferred.promise;
    }
  };
  self.wireNodes = function() {
    var nodes = {};
    var sourceNode = audioCTX.createBufferSource();
    //Set the volume
    var volumeNode = audioCTX.createGainNode();
    volumeNode.gain.value = 0.5;
    // Wiring
    sourceNode.connect(volumeNode);
    volumeNode.connect(audioCTX.destination);
    nodes.sourceNode = sourceNode;
    nodes.volumnNode = volumeNode;
    return nodes;
  };
  self.playSound = function(audiodata,sourceNode){
    var soundBuffer = audioCTX.createBuffer(audiodata, true); //note that this blocks
    sourceNode.buffer = soundBuffer;
    // play the source now
    sourceNode.noteOn(audioCTX.currentTime);
  };
  self.playSoundViaContext = function(audiodata,sourceNode) {
    var deferred = Q.defer();
    // decode the data
    audioCTX.decodeAudioData(audiodata,   //this is async and does not block
      function(buffer) {
        // when the audio is decoded play the sound
        sourceNode.buffer = buffer;
        sourceNode.noteOn(audioCTX.currentTime);
        deferred.resolve(buffer);
      },
      function(e) {
        deferred.reject(e);
      }
    );
    return deferred.promise;
  };
  self.stopSound = function(sourceNode,canvasCTX) {
    // stop the source now
    sourceNode.noteOff(audioCTX.currentTime);
    if(canvasCTX) {
      canvasCTX.clearRect(0, 0, canvasCTX.canvas.width, canvasCTX.canvas.height);
    }
  };
  self.setVolume = function(vol,volumeNode) {
    volumeNode.gain.value = vol;
  };
  self.startSound = function(sourceNode) {
    // start the source now
    sourceNode.noteOn(audioCTX.currentTime);
  };
  self.getAudioContext = function() {
    return audioCTX;
  };
  self.encodeWAV = function(samples,numChannels,sampleRate,fileName){
    var bitsPerSample = 16;
    var subChunk1Size = 16; //for PCM
    var subChunk2Size = samples.length * numChannels * bitsPerSample/8;
    var chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size);

    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);

    // Chunk identifier
    writeString(view, 0, 'RIFF');
    // Chunk Size
    view.setUint32(4, chunkSize, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    //Sub Chunk 1 identifier
    writeString(view, 12, 'fmt ');
    // Sub Chunk 1 size (16 for PCM)
    view.setUint32(16, subChunk1Size, true);
    // sample format (raw PCM)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * channel count * bitsPerSample/8)
    view.setUint32(28, sampleRate * numChannels * bitsPerSample/8, true);
    // block align (channel count * bitsPerSample/8)
    view.setUint16(32, numChannels * bitsPerSample/8, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // Sub Chunk 2 size (number of samples * channel count * bitsPerSample/8)
    view.setUint32(40, subChunk2Size, true);

    floatTo16BitPCM(view, 44, samples, numChannels);
    var audioBlob = new Blob([view], {type: 'audio/wav'});

    var url = (window.URL || window.webkitURL).createObjectURL(audioBlob);
    var link = window.document.createElement('a');
    link.href = url;
    link.download = fileName + '.wav';
    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    link.dispatchEvent(click);
  };
  //private functions
  function getContext() {
    //get the audio context
    var context = undefined;
    if(typeof AudioContext == "function") {
      context = new AudioContext();
    } else if (typeof webkitAudioContext == "function") {
      context = new webkitAudioContext();
    } else {
      throw new Error('AudioContext not supported.');
    }
    return context;
  }
  function writeString(view, offset, string){
    for (var i = 0; i < string.length; i++){
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  function floatTo16BitPCM(output, offset, input, numChannels){
    for (var i = 0; i < input.length; i++, offset+=2){
      var s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }
}
  
