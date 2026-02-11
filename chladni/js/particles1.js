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
let num = 10000;  // how many particles to simulate  ADD SLIDER  
let threshold = 0.1; // how close particles must be to a node to “stick”
let particleSpeed = 1; // speed of moving particles  

/* Chladni Numbers */ 
let m = 3, n = 5; // chladni mode numbers (define the pattern shape) 
let minMN = 1, maxMN = 8; // range for picking random modes


/* Particles + Chlandi Numbers Layout */
let margin = 50; // margin for mapping coordinates into chladni space      
let w1, w2, h1, h2; // width and height boundary handlers for mapping the canvas


/* Live Audio In */ 
let mic; 
let fft; 

/* Sound Variables */ 
let amp; 
let lowBassEnergy; 
let bassEnergy; 
let bassThreshold = 1.1; 
let lastBass = 0; 
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
let distVal = 1; 


/* Sliders */ 
let container1; 
let label1; 
let bassThresholdSlider; 

let container2; 
let label2; 
let particleSpeedSlider; 


/**
 * Setup Canvas + Initial Values 
 */
function setup() {

  /* Canvas */ 
  createCanvas(600, 600); // create canvas
  background(0);  // clear the canvas


  /* VISUALS */ 
  /* Assign boundaries */ 
  w1 = margin; //  
  w2 = width - margin;
  h1 = margin; 
  h2 = height - margin;


  createParticles(); 
    /*for (let i = 0; i < num; i++) { 
        particles.push(new Particle());
    }*/


  /* SOUND */ 
  /* Music Loaders */
  //fft = new p5.FFT(0.6, 1024); // smoothing = 0.9, 1024 frequency bins (recommended)
  //amp = new p5.Amplitude(); 
  /*mic = new p5.AudioIn(); // initializes audio input 
  mic.start(); // starts reading audio input 
  fft = new p5.FFT(); // new fft frequency analyzer
  fft.setInput(mic); // fft analyzer applied to mic
  */

  userStartAudio();       // 🔑 REQUIRED
  
  if (!mic) {
    mic = new p5.AudioIn();
    mic.start(() => {
      console.log("Mic started");
    });
    
    fft = new p5.FFT();
    fft.setInput(mic);
  }


  nextTriggerTime = 1; // how often beat is triggered 


    /* Sliders */
   // Slider 1
   bassThresholdSlider = createSlider(80, 150, 110, 1);
   bassThresholdSlider.addClass("bass-threshold-slider"); 

   container1 = createDiv();
   container1.addClass("slider-container1");

    label1 = createSpan("Bass Sensitivity: ");
    label1.addClass("slider-label1");

    label1.parent(container1);
    bassThresholdSlider.parent(container1);

    // Slider 2
    particleSpeedSlider = createSlider(1, 20, 10, 1); 
    container2 = createDiv(); 
    label2 = createSpan("Particle Speed: "); 

    label2.parent(container2);
    particleSpeedSlider.parent(container2); 

    //bassThresholdSlider = createSlider(80, 150, 110, 1);
    //bassThresholdSlider.addClass("bass-threshold-slider"); 


}

/**
 * Draws Each Particle 
 * */ 
function draw() {
    background(0); 
    //newPattern(); 

    getFrequencies(); 

    findSpike(); 
    bassThreshold = (bassThresholdSlider.value())/100; 
    particleSpeed = (particleSpeedSlider.value());


    /* Beat on BPM Intervals */ 

   // findSpike(); 
  //if(!bpmFound) newPattern(); 
 
  /* CODE TO TRIGGER NEW PATTERN ON BPM */ 
    /*if (!isFinite(currentBPM) || currentBPM <= 0) {
      
      return; // cuts program if current bpm is zero 
    }


    if (findSpike()) {
      nextTriggerTime = millis() + intervalBeat;
      newPattern();
    }  

    //rect(width/2, height/2, lowBassEnergy, lowBassEnergy); // rect to show bass energy 

  } */

  /* Update and draw each particle */ 
  for (let p of particles) {
    p.update();
    p.display();
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
 *  Create Particles 
 */ 
function createParticles() {
    for (let i = 0; i < num; i++) { 
        particles.push(new Particle());
    }
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
        //this.glint = 5; // test - glint effect (alpha for the stroke?)
        //this.gpol = 0; // up and down movement
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


  /* Draws Particle in Position (GRAPHIC COMPONENTS HERE) */ 
    display() {
       /*if(this.pos.x < 100 && this.pos.y < 100) {
            stroke(100); 
            strokeWeight(map(dist(width/4, height/4, this.pos.x, this.pos.y, 0, 100, 2, 8))); 
        }
        else {
            stroke(255); 
            strokeWeight(map(bassEnergy, 90, 200, 1, 4));
        }*/

        //let shade = map(dist(width/2, height/2, this.pos.x, this.pos.y), 0, width/2, 1, 255));
        distVal = dist(width/2, height/2, this.pos.x, this.pos.y)
        stroke(dist(width,random(200, 600), this.pos.x, this.pos.y), distVal/2, dist(0,random(0, 100), this.pos.x, this.pos.y)/2); 
       // stroke(255);
        //console.log(dist(width/2, height/2, this.pos.x, this.pos.y));
        //strokeWeight()

       //stroke(0);
       //strokeWeight(dist(width/4, height/4, this.pos.x, this.pos.y))
       if(distVal <= width/2) {
        strokeWeight(map(bassEnergy, 90, 200, 1, 2)*random(1, map(distVal, 0, width/2, 5, 1))  );
       }
       else {
        strokeWeight(1)
       }
       point(this.pos.x, this.pos.y);
    }

}



function newPattern() {
    // choose new random mode numbers
    m = floor(random(minMN, maxMN)); // between 1 and 8
    n = floor(random(minMN, maxMN));

  /*if(20 < dominantFreq <=85) {
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

  }*/

  //console.log(m,n); 

  //m = floor(random(1, map(dominantFreq, 10, 500, 1, 20))); 
  //n = floor(random(1, map(dominantFreq, 10, 500, 1, 20))); 



 // console.log(dominantFreq); 


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
   // volume = amp.getLevel(); 
   // console.log("Vol: " + volume); 

   console.log(bassEnergy);

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
  console.log("findspike");
  let spike = false;

  /*if (bassEnergy > lastBass * bassThreshold && bassEnergy > 30) {
    spike = true;
    newPattern(); 
    console.log("spike"); 
  }*/

  if (
  bassEnergy > lastBass * bassThreshold &&
  bassEnergy > 30 &&
  millis() - lastSpikeTime > 200
) {
  newPattern();
  lastSpikeTime = millis();
}


  lastBass = bassEnergy;

  /* If Bass Spike Detected */ 
  /*
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
  }*/
}


function findHatSpike() {
  /* Hat Spike Direction */ 
  let hatSpike = false;

  if (hatEnergy > lastHat * hatThreshold && hatEnergy > 30) {
    hatSpike = true;
    newPattern(); 
    console.log("hatSpike"); 
  }

  lastBass = bassEnergy;
}



/**
 * Finds Volume Spike and Triggers newPattern()   (not in use)
 */
function findVolumeSpike() {
  
}