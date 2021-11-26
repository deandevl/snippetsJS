/**
 * Developer: Rick Dean
 * Date: 2/19/13
 * Time: 8:52 AM
 */
var recLength = 0,
    recBuffersL = [],
    recBuffersR = [],
    sampleRate;

this.onmessage = function(e){
  switch(e.data.command){
    case 'init':
      init(e.data.sampleRate);
      break;
    case 'record':
      record(e.data.buffer);
      break;
    case 'exportWAV':
      exportWAV(e.data.type);
      break;
    case 'getBuffer':
      getBuffer();
      break;
    case 'clear':
      clear();
      break;
  }
};
function init(samplerate){
  sampleRate = samplerate;
  this.postMessage(
    {command: 'init',
      status: 'Sample Rate Received: '+ sampleRate
    }
  );
}
function record(inputBuffer){
  recBuffersL.push(inputBuffer[0]);
  recBuffersR.push(inputBuffer[1]);
  recLength += inputBuffer[0].length;
}
function exportWAV(type){
  var bufferL = mergeBuffers(recBuffersL, recLength);

  var bufferR = mergeBuffers(recBuffersR, recLength);
  var interleaved = interleave(bufferL, bufferR);
  var dataview = encodeWAV(interleaved,2);

  //var dataview = encodeWAV(bufferL,1);
  var audioBlob = new Blob([dataview], { type: type });
  this.postMessage(
      {command: 'wavblob',
       blob: audioBlob
      }
  );
}
function getBuffer() {
  var buffers = [];
  buffers.push( mergeBuffers(recBuffersL, recLength) );
  buffers.push( mergeBuffers(recBuffersR, recLength) );
  this.postMessage(
      {command: 'rawbuffer',
       buffer: buffers
      }
  );
}
function clear(){
  recLength = 0;
  recBuffersL = [];
  recBuffersR = [];
}
function mergeBuffers(recBuffers, recLength){
  var result = new Float32Array(recLength);
  var offset = 0;
  for (var i = 0; i < recBuffers.length; i++){
    result.set(recBuffers[i], offset);
    offset += recBuffers[i].length;
  }
  return result;
}
function interleave(inputL, inputR){
  var length = inputL.length + inputR.length;
  var result = new Float32Array(length);

  var index = 0,
      inputIndex = 0;

  while (index < length){
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}
function encodeWAV(samples,numChannels){
  var bitsPerSample = 16;
  var subChunk1Size = 16; //for PCM
  var subChunk2Size = samples.length * numChannels * bitsPerSample/8;
  var chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size);

  var buffer = new ArrayBuffer(44 + samples.length * numChannels);
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

  floatTo16BitPCM(view, 44, samples);

  return view;
}
function writeString(view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
function floatTo16BitPCM(output, offset, input){
  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}
