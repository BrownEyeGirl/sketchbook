/**
 * Variation Jam 
 * Skyla Trousdale
 * 
 * How it works 
 * 
 * 1. Make Chlandi Algorithm (based on content in read me)
    * m = number of nodal lines in one direction (up/down?)
    * n = number of nodal lines in the perpendicular direction (left/right)
    * ψ(x,y)=cos(nπx)cos(mπy)−cos(mπx)cos(nπy) <- equation (find source)
    * 
 * 2. analyze the song’s frequency content  
 * 3. map the song's frequency content to the (m,n) modes (note! this is different than the frequency of the "plate", I am creatively mapping sound onto physical resonance)
 * 
 * Final: add 3 different song options (set different colours/sizes based on my vibes of each song)
 */



"use strict";


/* Particle Handlers */ 
let particles = []; // array holds all particle objects
let num = 60000;  // how many particles to simulate  ADD SLIDER  
let threshold = 0.3; // how close particles must be to a node to “stick”
let particleSpeed = 1; // speed of moving particles  

/* Chladni Numbers */ 
let m = 3, n = 5; // chladni mode numbers (define the pattern shape) 
let minMN = 1, maxMN = 8; // range for picking random modes


/* Particles + Chlandi Numbers Layout */
let margin = 50; // margin for mapping coordinates into chladni space      
let w1, w2, h1, h2; // width and height boundary handlers for mapping the canvas


/* Music Variables */ 
let song1; 
let song2; 
let song3
let song1Playing = false; 
let song2Playing = false; 
let song3Playing = false; 
let bpm1; 
let bpm2; 
let bpm3; 
let currentBPM = 0; 

/* Sound Variables */ 
let fft; 
let amp; 
let lowBassEnergy; 
let bassEnergy; 
let bassThreshold = 1.1; 
let lastBass; 
let midEnergy; 
let trebleEnergy; 
let volume; 
let dominantFreq; 

/* calculate BPM */ 
let lastSpikeTime = 0;
let intervals = [];       // stores Δt between spikes
let maxIntervals = 8;     // averages last 8 intervals
let bpm = 0;
let bpmFound = false; // to keep sand floating until bpm is found
let scatterIntervals = 0; 
let nextTriggerTime = 0;


/* Style Variables */ 
let pinkTheme = false; 
let dotColourR = 0; 
let dotColourG = 0; 
let dotColourB = 0; 
let backgroundColour = 0; 

/* Live Audio In */ 
let mic; 

/**
 * Preload Song 
 * */
function preload() {
  song1 = loadSound('assets/sounds/butterfly.mp3'); // 144 bpm 
  song2 =  loadSound('assets/sounds/mangle11.mp3'); // 95 bpm 
  song3 = loadSound('assets/sounds/prememory.mp3'); // 111 bpm 

}

/**
 * Setup Canvas + Initial Values 
 */
function setup() {

  /* Canvas */ 
  createCanvas(600, 600); // create canvas
  background(0);  // clear the canvas


  /* Assign boundaries */ 
  w1 = margin; //  
  w2 = width - margin;
  h1 = margin; 
  h2 = height - margin;

  /* Create Particles */ 
  for (let i = 0; i < num; i++) { 
    particles.push(new Particle());
  }


  /* Assign BPM (replace w algorithm later) */ 
  bpm1 = 144; 
  bpm2 = 95; 
  bpm3 = 111; 

  /* Music Loaders */
  fft = new p5.FFT(0.6, 1024); // smoothing = 0.9, 1024 frequency bins (recommended)
  amp = new p5.Amplitude(); 
  //song.play(); 

  /* Play Music */ 
  let playButton1 = createButton('Play Song 1');
  let playButton2 = createButton('Play Song 2');
  let playButton3 = createButton('Play Song 3');

  playButton1.mouseClicked(playSong1); 
  playButton2.mouseClicked(playSong2);
  playButton3.mouseClicked(playSong3);

  nextTriggerTime = 1; // how often beat is triggered 


  /* Live Mic Experiment */ 
   // Create an Audio input
  mic = new p5.AudioIn();

  // start the Audio Input.
  // By default, it does not .connect() (to the computer speakers)
  mic.start();


}


/**
 * Draws Each Particle 
 * */ 
function draw() {

  console.log("vol: ", mic.getLevel()); 


  if(pinkTheme) { backgroundColour = '#FFC9EA'}
  else {backgroundColour = 0}; 
  background(backgroundColour); 

  getFrequencies(); 

  //findSpike(); 
  /* Beat on BPM Intervals */ 

   // findSpike(); 
  //if(!bpmFound) newPattern(); 
 
  /* CODE TO TRIGGER NEW PATTERN ON BPM */ 
    /*if (!isFinite(currentBPM) || currentBPM <= 0) {
      
      return; // cuts program if current bpm is zero 
    }*/

    
  if(currentBPM <= 0) {
    //newPattern(); 
  }

  else {

    let intervalBeat = (60 / currentBPM) * 1000 * 2;  // two beats

    if (millis() >= nextTriggerTime) {
      nextTriggerTime = millis() + intervalBeat;
      newPattern();
    }  

    //rect(width/2, height/2, lowBassEnergy, lowBassEnergy); // rect to show bass energy 

  }

  /* Update and draw each particle */ 
  for (let p of particles) {
    p.update();
    p.display();
  }


  


}


/* Gets Various info from the mic audio input */ 

function audioInFrequencyAnalyzer() {




}



function playSong1() {
  console.log("playing song 1"); 
  if(!song1Playing) {
    song2.stop(); 
    song3.stop(); 

    song1.play(); 
    song1Playing = true; 
    pinkTheme = true; 
    currentBPM = bpm1; 
  }
  else {
    song1.stop(); 
    song1Playing = false; 
    

  }
}

function playSong2() {
  console.log("playing song 2"); 
  if(!song2Playing) {
    song1.stop(); 
    song3.stop(); 
    pinkTheme = false; 

    song2.play(); 
    song2Playing = true; 
    currentBPM = bpm2; 
  }
  else {
    song2.stop(); 
    song2Playing = false; 
  }
}

function playSong3() {

  console.log("playing song 3"); 
  if(!song3Playing) {
    song1.stop(); 
    song2.stop(); 
    pinkTheme = false; 

    song3.play(); 
    song3Playing = true; 
    currentBPM = bpm3; 
  }
  else {
    song3.stop(); 
    song3Playing = false; 
  }
}





/**
 * Chladni Equation:
 * returns a value describing vibration at (x,y)
 * values near zero correspond to nodal lines :)
 */
function chladni(x, y) {
  return cos(n * PI * x) * cos(m * PI * y) 
       - cos(m * PI * x) * cos(n * PI * y);
}


/**
 * Particle Class: Handles Particle Movement, Lines, and Particle Drawing (from particle video tutorial referenced in README.md)
 */
class Particle {

  /* Creates Random Movement */ 
  constructor() {
    this.pos = createVector(random(width), random(height));  // assigns random starting position of each particle 
    this.vel = p5.Vector.random2D().mult(random(0.5, particleSpeed)); // assigns random velocity to each particle 
    this.stuck = false; // allows particle to move
  }

  /* Moves Particles into Nodal Lines with vibration value near zero */ 
  update() {
    if (this.stuck) return; // skip if the particle is in its proper position 
    this.pos.add(this.vel); // move particle by its random velocity amount 

    /* Code To Wrap Particles Arond Canvas */ 
    if (this.pos.x < 0) {this.pos.x = width};
    if (this.pos.x > width) {this.pos.x = 0};
    if (this.pos.y < 0) {this.pos.y = height};
    if (this.pos.y > height) {this.pos.y = 0};

  
    /* Allows Position of Particles to have Playful Variance From The Chladni Lines */
    let x = map(this.pos.x, w1, w2, -1, 1);  
    let y = map(this.pos.y, h1, h2, -1, 1);

    /* Freezes Particles on Nodal Lines*/
    if (abs(chladni(x, y)) < threshold) {
      this.stuck = true; // freeze particle
      this.vel.mult(0); // stop movement
    }
  }


  /* Draws Particle in Position */ 
  display() {
    if(song1Playing) stroke(0); 
    if(song2Playing) stroke(30, 30, trebleEnergy); 
    if(song3Playing) stroke(30, 30, trebleEnergy); 

    strokeWeight(map(bassEnergy, 90, 200, 1, 3));
    point(this.pos.x, this.pos.y);
  }

}



function newPattern() {
  // choose new random mode numbers
  //m = floor(random(minMN, maxMN)); // between 1 and 8
  //n = floor(random(minMN, maxMN));

  //let centerPoint =6; 
  //let complexityLevel = map(dominantFreq, 255, 0, 1,4); 

 // m = centerPoint + random(complexityLevel, complexityLevel+1); 
 // n = centerPoint - random(complexityLevel, complexityLevel-1); 

  // map based on dominant frequency 

  if(20 < dominantFreq <=85) {
    m = floor(random(1, 2));
    n = floor(random(1, 2));

  }

  if(85 < dominantFreq <= 170) {
    m = floor(random(4, 6));
    n = floor(random(4, 6));
  }

  if(170 < dominantFreq <= 255) {
    m = floor(random(6, 12));
    n = floor(random(6, 12)); 

  }

  //console.log(m,n); 

  //m = floor(random(1, map(dominantFreq, 10, 500, 1, 20))); 
  //n = floor(random(1, map(dominantFreq, 10, 500, 1, 20))); 



 // console.log(dominantFreq); 
 console.log(volume); 

  //m = map(bassEnergy, 0, 200)  //if()

  // makes sure program doesn't freeze (prevents error in chlandi numbers when both are zero) 
  if (m === n) {
    m++;
}

  // resets all particles to fluid state 
  for (let p of particles) {
    p.stuck = false;
    p.vel = p5.Vector.random2D().mult(random(0.5, particleSpeed));
  }
  
}






/* Calculates frequency of a song */ 
function getFrequencies() {
  
  let spectrum = fft.analyze(); // array amplitude values (0-255) https://p5js.org/reference/p5.FFT/analyze/

  lowBassEnergy = fft.getEnergy(10, 50); 
  bassEnergy = fft.getEnergy(90, 200);
  //console.log(bassEnergy);  
  midEnergy = fft.getEnergy(200, 2000); 
  trebleEnergy = fft.getEnergy(2000, 8000);
  volume = amp.getLevel(); 
  console.log("Vol: " + volume); 

  //console.log(topEnergy); 

  
  /* Find dominant frequency */ 
  let maxAmp = 0;
  dominantFreq = 0;
  for (let i = 0; i < spectrum.length; i++) {
    if (spectrum[i] > maxAmp) {
      maxAmp = spectrum[i];
      dominantFreq = fft.getFreq(i); // frequency corresponding to bin i
    }
  }

  //console.log("dominant frequency:", dominantFreq); 


}



function bassSpiked() {
  //console.log("BASS SPIKE!", bassEnergy);
}


function showStats() {
  fill(255);
  text('hi', 50, 50);
}


/**
 * Finds Spike in Bass and Triggers newPattern()  
 */
function findSpike() {
  /* Bass Spike Direction */ 
  let spike = false;
  if (bassEnergy > lastBass * bassThreshold && bassEnergy > 30) {
    spike = true;
    bpmFound = true; 
   
  }
  lastBass = bassEnergy;

  /* If Bass Spike Detected */ 
  if (spike) {
    let now = millis();
    console.log("spike!");
    newPattern(); 

    if (lastSpikeTime > 100) {
      let interval = now - lastSpikeTime; // ms between spikes
      intervals.push(interval);

      // keep number of intervals small
      if (intervals.length > maxIntervals) {
        intervals.shift();
      }

      // average the intervals
      let avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      // convert ms interval → BPM
      bpm = 60000 / avg;
    }

    lastSpikeTime = now;
  }
}

/**
 * Finds Volume Spike and Triggers newPattern()   (not in use)
 */
function findVolumeSpike() {
  /* Bass Spike Direction */ 
  let spike = false;
  if (bassEnergy > lastBass * bassThreshold && bassEnergy > 30) {
    spike = true;
    bpmFound = true; 
   
  }
  lastBass = bassEnergy;

  /* If Bass Spike Detected */ 
  if (spike) {
    let now = millis();
    console.log("spike!");
    newPattern(); 

    if (lastSpikeTime > 100) {
      let interval = now - lastSpikeTime; // ms between spikes
      intervals.push(interval);

      // keep number of intervals small
      if (intervals.length > maxIntervals) {
        intervals.shift();
      }

      // average the intervals
      let avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      // convert ms interval → BPM
      bpm = 60000 / avg;
    }

    lastSpikeTime = now;
  }
}