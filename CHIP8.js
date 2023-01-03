var canvas = document.getElementById('myCanvas');

function Setup(){
  const chip8 = new CHIP8();
  //initilize screen
  //load memory into ROM

  //game loop (fetch/deccode/execute)
}

function Render(){

}
class CHIP8{
  constructor(){
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
    //TODO: Load font into memory
  }

  //TODO: Loads program into the memory starting from the memory location 0x200 (512)
  loadROM(){

  } 

  //TODO: update opcode
  fetchOpcode(){

  }

  //decodeOpcode
  decodeOpcode(){

  }

  //return delay timer => Will not be using the getter/setter methods for the class becuase I like accessing the values and not setting them as labels. 
  getDelayTimer(){
    return this.delayTimer;
  }

  //d = delay timer value
  setDelayTimer(d){
    this.delayTimer = d;
  }

  getSoundTimer(){
    return this.soundTimer;
  }

  //s = sound timer value
  setSoundTimer(s){
    this.soundTimer = s;
  }

  //returns the value of the draw flag
  getDrawFlag(){
    return this.drawFlag;
  }

  setDrawFlag(b){
    this.drawFlag = b;
  }

}






window.onload = Setup;