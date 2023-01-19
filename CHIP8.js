
function Setup(){
  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  CHIP8(canvas, context);
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

  //clears the display array to re-calculate the next pixels that need to be drawn
  //when the frame is called.
  clear(){
    this.screen = new Array(this.cols * this.rows)
  }

  //called to render all the pixels on the display
  render(){
    //clear the entire screen
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
  
  //sets the given event key down.
  onKeyDown(event){
    let key = this.KEYMAP[event.which];
    this.keysPressed[key] = tru
    // Make sure onNextKeyPress is initialized and the pressed key is actually mapped to a Chip-8 key
    if (this.onNextKeyPress !== null && key) {
      this.onNextKeyPress(parseInt(key));
      this.onNextKeyPress = null;
    }
}

  //sets the given event key up.
  onKeyUp(event) {
    let key = this.KEYMAP[event.which];
    this.keysPressed[key] = false;
}
}

class CPU{
  //initializes the CPU with a given display and keyboard
  constructor(display, keyboard){
    this.display = display;
    this.keyboard = keyboard;

    //initializes all the other required variables stated in the techincal reference
    this.pc = 0x200;
    this.memory = new Uint8Array(4096);
    this.registers = new Uint8Array(16);
    this.stack = new Uint16Array();
    this.index = 0;
    this.delayTimer = 0;
    this.speed = 10;
    this.drawFlag = false;
    this.SPRITES = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    ];
  }

  //from technical reference, take the hex for each sprite value and load it into the beginning of
  //the memory
  loadSprites(){
    for (let i = 0; i < this.SPRITES.length; i++){
      this.memory[i] = this.SPRITES[i];
    }
  }
  
  //Gets ROM from files and calls loadProgram() to store it into the memory (0x200)
  loadROM(romName){
    var request = new XMLHttpRequest;
    var self = this;
    request.onload = function(){
      if (request.response){
        let program = new Uint8Array(request.response);
        self.loadProgram(program);
      }
    }
    //gets ROM from roms file
    request.open('GET', 'roms/' + romName);
    request.responseType = 'arraybuffer'
    //send request to load.
    request.send();
  }

  //Loads program into the memory starting from the memory location 0x200 (512)
  loadProgram(program){
    for(let i=0; i < program.length; i++){
      this.memory[0x200 + i] = program[i];
    }
  } 

  //updates the given timers. Delay timer keeps track of where certain events occur
  updateTimers(){
    if (this.delayTimer > 0) {
      this.delayTimer -= 1;
    }
  }

  //cpu cycle of fetching, decoding, and executing the given opcode
  //called in the step function inside CHIP8 (step is called 60 times/sec)
  cycle(){
    for(let i =0; i < this.speed; i++){
      if(!this.drawFlag){
        let opcode = (this.memory[this.pc] << 8 | this.memory[this.pc + 1]);
        this.executeInstruction(opcode);
      }
    }

    if(!this.drawFlag){
      this.updateTimers();
    }

    this.display.render();
  }
  
  executeInstruction(opcode){
    this.pc += 2;
    let x = (opcode & 0x0F00) >> 8;
    let y = (opcode & 0x00F0) >> 4;
  
    switch (opcode & 0xF000) {

      //SYS addr
      case 0x0000:
        switch (opcode) {

          //clears display
          case 0x00E0:
            this.display.clear();
            break;

            //pop last element of stack from array and store in pc
          case 0x00EE:
            this.pc = this.stack.pop();
            break;
        }
        break;

      //set pc to value stored in 0x1(nnn)
      case 0x1000:
        this.pc = (opcode & 0xFFF);
        break;

      //push pc to stack and set pc to value stores in 0x1(nnn)
      case 0x2000:
        this.stack.push(this.pc);
        this.pc = (opcode & 0xFFF)
        break;

      //compares the value stored in the x register to 0x3(nn) and incements the pc by two if
      //they are the same
      case 0x3000:
        if(this.registers[x] === (opcode & 0xFF)){
          this.pc += 2;
        }
        break;

      //compares the value stored in the x register to 0x3(nn) and incements the pc by two if
      //they are different
      case 0x4000:
        if(this.registers[x] !== (opcode & 0xFF)){
          this.pc += 2;
        }
        break;

      //compares values stored in the x register to the y register and increments the pc by two if
      //they are the same
      case 0x5000:
        if (this.v[x] === this.v[y]) {
          this.pc += 2;
        }
        break;

      //Sets the value of the x register to be the two least significant bits of the opcode
      case 0x6000:
        this.registers[x] = (opcode & 0xFF);
        break;

      //adds the two least significant bits of opcode to the value stored in register x
      case 0x7000:
      this.registers[x] += (opcode & 0xFF);
        break;
      //8XY0
      case 0x8000:
        switch (opcode & 0xF) {
          //x register assigned to value in y register
          case 0x0:
            this.registers[x] = this.registers[y];
            break;
          //x register value OR y register and stored back into x register
          case 0x1:
            this.registers[x] |= this.registers[y];
            break;
          //x register value AND y register and stored back into x register
          case 0x2:
            this.registers[x] &= this.registers[y];
            break;
          //x register value XOR y register and stored back into x register
          case 0x3:
            this.registers[x] ^= this.registers[y];
            break;
          //Add register x to register y and store resulting 8 bits back into register x
          case 0x4:
            let sum = (this.registers[x] += this.registers[y]);
            this.registers[0xF] = 0;
            if(sum > 0xFF){
              this.registers[0xF] = 1;
            }

            this.registers[x] = sum;
            break;
          //Subtract register y from register x and handles underflow
          case 0x5:
            this.registers[0xF] = 0;

            if(this.registers[x] > this.registers[y]){
              this.registers[0xF] = 1;
            }

            this.registers[x] -= this.registers[y];
            break;
          //set register F to be the least significant bit in register x and remove the bit in register x
          case 0x6:
            this.registers[0xF] = (this.registers[x] & 0x1);
            this.registers[x] >>= 1;
            break;
          //Subtracts register x from register y (stores value back into x) and changes the value in register F depending on if register x or y is bigger
          case 0x7:
          this.registers[0xF] = 0;

          if(this.registers[y] > this.registers[x]){
            this.registers[0xF] = 1;
          }

          this.registers[x] = this.register[y] - this.register[x]; 
            break;
          //Change register F if condition is met and bitshift register x by 1
          case 0xE:
            this.registers[0xF] = (this.registers[x] & 0x80);
            this.registers[x] <<= 1;
            break;
        }
        break;

      //increment pc by two if register x != register y
      case 0x9000:
      if(this.registers[x] !== this.registers[y]){
        this.pc += 2;
      }
        break;
      
      //set the index register the the three lsb of the opcode
      case 0xA000:
        this.index = (opcode & 0xFFF);
        break;
      
      //Set the pc to the 3 lsb of the opcode + value of register 0
      case 0xB000:
        this.pc = (opcode & 0xFFF) + this.registers[0];
        break;

      //generate a random number between 0-255 AND with the two lsb of the opcode and store in register x
      case 0xC000:
        let num = Math.floor(Math.random() * 0xFF); //TODO: 0xFF = 255 but im not sure if it will mess up  
        this.registers[x] = num & (opcode & 0xFF);
        break;
      
      //Draws/erases pixels on the screen
      case 0xD000:
        let width = 8;
        let height = (opcode & 0xF);
        this.registers[0xF] = 0;

        for(let i = 0; i < height; i++){
          let sprite = this.memory[this.index + row];

          for(let j = 0; j < width; j++){
            //if sprite is not 0, render/erase the pixel
            if((sprite & 0x80) > 0){
              //If setPixel returns 1 (pixel erased), set register F to 1
              if(this.display.setPixel(this.registers[x] + j, this.registers[y] + i)){
                this.registers[0xF] = 1;
              }
            }

            //shift sprite bit left by 1 to move to next sprite in memory
            sprite <<= 1;
          }
        }
        break;
      case 0xE000:
        switch (opcode & 0xFF) {
          //if the key stored in register x is pressed then skip the next instruction
          case 0x9E:
            if(this.keyboard.isKeyPressed(this.registers[x])){
              this.pc += 2;
            }
            break;
          //if the key stored in register x is NOT pressed then skip the next instruction
          case 0xA1:
            if(!this.keyboard.isKeyPressed(this.registers[x])){
              this.pc += 2;
            }
            break;
        }
        break;
      case 0xF000:
        switch (opcode & 0xFF) {
          //set register x to the value stored in the delay timer
          case 0x07:
            this.registers[x] = this.delayTimer;
            break;
          //pause the emulator until a key is pressed
          case 0x0A:
            this.drawFlag = true;
            this.keyboard.onNextKeyPress = function(key){
              this.register[x] = key;
              this.drawFlag = false;
            }.bind(this);
            break;
          //set the delay timer to the value stored in register x
          case 0x15:
            this.delayTimer = this.v[x];
            break;
          case 0x18:
            //not working with sound so nothing
            break;
            //add the value of register x to the index
          case 0x1E:
            this.index += this.registers[x];
            break;
          //set the index to the value in register x * 5
          case 0x29:
            this.index = this.registers[x] * 5;
            break;
          //stores hundreds, tens, and ones digits of register x and store them in index to index+2
          case 0x33:
            this.memory[this.index] = parseInt(this.registers[x] / 100);
            this.memory[this.index + 1] = parseInt((this.registers[x] % 100) / 10);
            this.memory[this.index + 2] = parseInt(this.registers[x] % 10);
            break;
          //loop through registers 0 to x and store its value in memory starting at the index value
          case 0x55:
            for(let i = 0; i <= x; i++){
              this.memory[this.index + i] = this.registers[i];
            }
            break;
          //loops through memory staring at the index and stores it into registers 0 to x
          case 0x65:
            for(let i =0; i < x; i++){
              this.registers[i] = this.memory[this.index + i];
            }
            break;
        }
        break;

    default:
      throw new Error('Unknown opcode ' + opcode);
    }
  } 
}

function CHIP8(canvas, context){
  const display = new Display(canvas, context);
  const keyboard = new Keyboard();
  const cpu = new CPU(display, keyboard);

  let loop, fpsInterval, startTime, now, then, elapsed;
  function init(){
    fpsInterval = 1000 / 60;
    then = Date.now();
    startTime = then;

    cpu.loadSprites();
    cpu.loadROM('BLITZ');
    loop = requestAnimationFrame(step);
  }

  function step(){
    now = Date.now;
    elapsed = now - then;

    if(elapsed > fpsInterval){
      cpu.cycle();
    }
    loop = requestAnimationFrame(step);
  }

  init();
}

window.onload = Setup;