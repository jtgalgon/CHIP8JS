
function Setup(){
  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  const chip8 = new CHIP8(canvas, context);
}

class Display{ 
  constructor(canvas, context){
    this.cols = 64;
    this.rows = 32;
    this.scale = 12;
    this.canvas = canvas;
    this.context = context;
    this.screen = new Array(this.cols * this.rows);
    this.context.fillStyle = '#000'; //black pixel fill
  }

  //sets pixel => if the pixel is poisitioned outside of the
  //display it will then wrap around to the opposite side
  setPixel(x, y){
    if(x > this.cols){
      x-= this.cols;
    }else if (x < 0){
      x += this.cols;
    }

    if(y > this.rows){
      y -= this.rows;
    }else if (x < 0){
      y += this.rows;
    }
    //calculate pixel in screen and XOR in array
    let pixelLocation = x + (y * this.cols);
    this.screen[pixelLocation] ^= 1;
    return !this.screen[pixelLocation];
  }

  //clears display
  clear(){
    this.screen = new Array(this.cols * this.rows)
  }

  render(){
    //clear screen to be redrawn
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //loop through screen array and fill black rectangles depending on 
    //its value (if screen[i] == 1)
    for (let i =0; i < this.screen.length; i++){
      let x = (i % this.cols) * this.scale;
      let y = Math.floor(i / this.cols) * this.scale;

      if(this.screen[i] == 1){
        this.context.fillRect(x, y, this.scale, this.scale);
      }
    }
  }
}

class Keyboard{
  constructor(){
    this.keypressed = [];
    this.onNextKeyPress = null;
    this.KEYMAP = {
      49: 0x1, // 1
      50: 0x2, // 2
      51: 0x3, // 3
      52: 0xc, // 4
      81: 0x4, // Q
      87: 0x5, // W
      69: 0x6, // E
      82: 0xD, // R
      65: 0x7, // A
      83: 0x8, // S
      68: 0x9, // D
      70: 0xE, // F
      90: 0xA, // Z
      88: 0x0, // X
      67: 0xB, // C
      86: 0xF  // V
  }

    window.addEventListener('keydown', this.onKeyDown.bind(this), false);
    window.addEventListener('keyup', this.onKeyUp.bind(this), false);
  }

  isKeyPressed(keyCode){
    return this.keyPressed[keyCode];
  }

  onKeyDown(event){
  }
}

class CHIP8{
  constructor(canvas, context){
    //initialize all values
    this.pc = 0x200;
    this.opcode = 0;
    this.index = 0;
    this.sp = 0;
    this.memory = new Uint8Array(4096);
    this.register = new Uint8Array(16);
    this.stack = new Uint16Array(16);
    this.drawFlag = false;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.display = new Display(canvas, context);
    //TODO: Load font into memory
  }

  //TODO: Loads program into the memory starting from the memory location 0x200 (512)
  loadProgram(program){
    for(let i =0; i < program.length; i++){
      this.memory[0x200 + i] = program[i];
    }
  } 

  loadROM(romName){
    var request = new XMLHttpRequest;

    request.onload = function(){
      if (request.response){
        let program = new Uint8Array(request.response);
        this.loadProgram(program); //may have to change if error
      }
    }
    //gets ROM from roms file
    request.open('GET', 'roms/' + romName);
    request.responseType = 'arraybuffer'
    //send request to load.
    request.send();
  }
  

  //TODO: update opcode
  fetchOpcode(){

  }

  //decodeOpcode
  decodeOpcode(){

  }
}

window.onload = Setup;