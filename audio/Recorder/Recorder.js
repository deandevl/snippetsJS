'use strict'
//import { WebAudio } from 'Audio/WebAudio';
//export function Recorder() {
function Recorder() {
  var self = this;

  var currentTime;
  var stopTime;
  var wa = new WebAudio();

  var deferred = Q.defer();
  var audioSource;
  var audioCTX = wa.getAudioContext();
  var recording = false;
  var worker = new Worker('Audio/Recorder/recordWorker.js');
  var processor = audioCTX.createScriptProcessor(4096, 2, 2);
  var config = {};

  config.bufferLen = 4096;
  config.sampleRate = audioCTX.sampleRate;

  processor.onaudioprocess = function(e) {audioprocessor(e)};
  worker.postMessage({
    command: 'init',
    sampleRate: config.sampleRate
  });
  worker.onmessage = function(e) {
    switch(e.data.command) {
      case 'init' :
        var status = e.data.status;
        break;
      case 'rawbuffer' :
        var buffer = e.data.buffer;
        var samples_1 = [];
        var samples_2 = [];
        for(var i = 0; i < 100; i++) {
          samples_1.push(buffer[0][i]);
          samples_2.push(buffer[1][i]);
        }
        break;
      case 'wavblob' :
        deferred.resolve(e.data.blob);
        break;
    }
  };
  self.record = function(audioEle,duration) {
    stopTime = duration;
    recording = true;
    currentTime = 0;
    audioSource = audioCTX.createMediaElementSource(audioEle);
    audioSource.connect(processor);
    processor.connect(audioCTX.destination);
    audioSource.connect(audioCTX.destination);
  //  audioSource.mediaElement.play();
    return deferred.promise;
  };
  self.stop = function() {
    //worker.postMessage({ command: 'getBuffer' });
    worker.postMessage({ command: 'exportWAV',type: 'audio/wav' });
    deferred.resolve(0);
  };
  self.clear = function() {
    recording = false;
    worker.postMessage({ command: 'clear' });
    //worker.terminate();
  };
  self.currentTime = function() {
    return currentTime;
  };
  //private functions
  function audioprocessor(e) {
    var buf1 = e.inputBuffer;
    var buf2 = e.outputBuffer;
    currentTime = currentTime+buf1.duration;

    if(currentTime >= stopTime) {
      self.stop();
    }
    var dur2 = buf2.duration;
    var inputBuffer_1 = e.inputBuffer.getChannelData(0);
    var inputBuffer_2 = e.inputBuffer.getChannelData(1);
    /*
    for(var i = 0; i < config.bufferLen; i++) {
      if(inputBuffer_1[i] > 0 || inputBuffer_2[i] > 0) {
        var pp = 0;
      }
    }
    */

    if(!recording) return;
    worker.postMessage({
      command: 'record',
      buffer: [
        e.inputBuffer.getChannelData(0),
        e.inputBuffer.getChannelData(1)
      ]
    });
    PubSub.emit('updateTime',currentTime);
  }
}