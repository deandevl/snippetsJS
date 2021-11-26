'use strict'
//import { WebAudio } from 'Audio/WebAudio';
//export function SineWave() {
function SineWave() {
  var self = this;
  var wa = new WebAudio();

  var x = 0, // Initial sample number
    audioCTX = wa.getAudioContext(),
    sampleRate= audioCTX.sampleRate, //44100,
    frequency = 440,
    nextFrequency = 440,
    volume = .5,
    samples = [],
    node = audioCTX.createJavaScriptNode(1024, 1, 1),
    volumeNode = audioCTX.createGainNode();

  //Set the volume
  volumeNode.gain.value = volume;
  node.onaudioprocess = function(e) {self.process(e)};

  self.process = function(e) {
    var data = e.outputBuffer.getChannelData(0);
    var nextData;
    for (var i = 0; i < data.length; ++i) {
      //data[i] = Math.sin(x++);
      data[i] = Math.sin(x++/(sampleRate/(2 * Math.PI * frequency)));
      samples.push(data[i]);
      // This reduces high-frequency blips while switching frequencies. It works
      // by waiting for the sine wave to hit 0 (on it's way to positive territory)
      // before switching frequencies.
      if(nextFrequency != frequency) {
        // Figure out what the next point is.
        nextData = Math.sin(x/(sampleRate/(2 * Math.PI * frequency)));

        // If the current point approximates 0, and the direction is positive,
        // switch frequencies.
        if(data[i] < 0.001 && data[i] > -0.001 && data[i] < nextData) {
          frequency = nextFrequency;
          x = 0;
        }
      }
    }
  };
  self.play = function() {
    node.connect(volumeNode);
    volumeNode.connect(audioCTX.destination);
  };
  self.pause = function() {
    node.disconnect();
  };
  self.saveToWAV = function() {
    wa.encodeWAV(samples,1,sampleRate,'sine');
  };
  self.setFrequency = function(freq) {
    nextFrequency = freq;
  };
  self.getFrequency = function() {
    return frequency;
  };
  self.setVolume = function(vol) {
    volumeNode.gain.value = vol;
    volume = vol;
  };
  self.getVolume = function() {
    return volume;
  };
}
