var Through = require('through')
var keycode = require('keycode')
var _ = require('lodash')
var KeyStream = require('./key_stream')

module.exports = function(options){
  var BLACK_KEYS = "QWERTYUIOP".toLowerCase().split('')
  var WHITE_KEYS = "ASDFGHJKL;".toLowerCase().split('')
  var WHITE_VALS = [0, 2, 4, 5, 7, 9, 11]
  var BLACK_VALS = [1, 3, 6, 8, 10]
  options = options || {}

  var currentOffset = options.offset || 0
  var currentVelocity = options.velocity || 127
  var chan = options.channel || 0

  var modes = {
    'piano': {
      notes: "AWSEDFTGYHUJKOLP;['".toLowerCase().split(''),
      offsetBy: 12,
      offset: ['z', 'x'],
      velocity: ['c', 'v']
    },
    'grid': {
      notes: 'QWERTYUIASDFGHJKZXCVBNM,'.toLowerCase().split(''),
      offsetBy: 8,
      offset: ['-', '='],
      velocity: ['[', ']']
    },
    'middle': {
      notes: "QWERTYUIOP".toLowerCase().split(''),
      offsetBy: 10,
      offset: ['z', 'x'],
      velocity: ['c', 'v']
    }
  }

  var commands = {}

  var mode = modes[options.mode || 'keys']
  var isMiddleMode = options.mode === 'middle';

  commands[mode.offset[0]] = function octDown(){
    currentOffset = Math.max(-mode.offsetBy, currentOffset - mode.offsetBy)
  }

  commands[mode.offset[1]] = function octUp(){
    currentOffset = Math.min(127-mode.notes.length, currentOffset + mode.offsetBy)
  }

  commands[mode.velocity[0]] = function velDown(){
    currentVelocity = Math.max(0, currentVelocity - 16)
  }

  commands[mode.velocity[1]] = function velUp(){
    currentVelocity = Math.min(127, currentVelocity + 16)
  }
  
  var notes = mode.notes

  var keyboard = Through(function(e){
    var note = getNote(e)
    if (note){
      this.queue(note)
    } else {
      command(e)
    }
  })

  if (global.document && global.document.addEventListener && options.bind !== false){
    KeyStream().pipe(keyboard)
  }

  var ups = {}

  function getNote(e){
    var id;
    if(isMiddleMode){
      id = getMiddleNote(e)
    }
    else{
      id = notes.indexOf(keycode(e.keyCode))
    }
    
    if (~id){
      if (e.type == 'keyup'){
        var up = ups[id]
        ups[id] = null
        return up
      } else {
        if (!ups[id]){
          ups[id] = [144+chan||0, id+currentOffset, 0]
          return [144+chan||0, id+currentOffset, currentVelocity]
        }
      }
    }
  }

  function command(e){
    if (e.type == 'keydown'){
      var command = commands[keycode(e.keyCode)]
      if (typeof command === 'function'){
        command()
      }
    }
  }

  function getMiddleNote(e){
    var char = keycode(e.keyCode)
    var isBlack = !_.includes(WHITE_KEYS, char);
    var arrayKeys = isBlack ? BLACK_KEYS : WHITE_KEYS;
    var arrayVals = isBlack ? BLACK_VALS : WHITE_VALS;
    var result = arrayVals[arrayKeys.indexOf(char)]
    return result;
  }
  // function indexOfReplicatedArray(array, val){ // say val = 14 white
  //   let modIndex = _.indexOf(array, val % 12); // modIndex = 1
  //   let numLoops = Math.floor(val / 12); // numLoops = 1
  //   return numLoops * array.length + modIndex; // return 8
  // }

  // function valueOfReplicatedArray(array, index){
  //   let n = array.length;
  //   let i = index;
  //   let posResult = 12 * Math.floor(i / n) + array[i % n];
  //   let negResult = 12 * Math.ceil((i + 1) / n - 1) + array[((i % n) + n) % n];
  //   let result = i >= 0 ? posResult : negResult;
  //   return result;
  // }

  return keyboard
}