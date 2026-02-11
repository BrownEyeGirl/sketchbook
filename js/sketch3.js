// not my code!!! 

function aniA(parentCanvas) {
    console.log("in ani-A -teamE");

    let circles = []; //empty array of circles

    //call to setup the animation before running
    setupSketch();
    //add event listener to the button

    function setupSketch() {
      //offset
      let offset = 40;

      for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
          let circle = document.createElement("div");
          circle.classList.add("TEAM_E_circle");

          let offset = 40;
          circle.style.width = "18px";
          circle.style.height = "18px";
          circle.style.left = offset + i * 20 + "px";
          circle.style.top = offset + j * 20 + "px";

          // store grid position
          circle.dataset.x = i;
          circle.dataset.y = j;

          parentCanvas.appendChild(circle);
          circles.push(circle);

          // click listener
          circle.addEventListener("click", () => rippleEffect(i, j));
        }
      }
    }

    function rippleEffect(cx, cy) {
      const maxRadius = 30; // how far the wave spreads

      circles.forEach((circle) => {
        let x = parseInt(circle.dataset.x);
        let y = parseInt(circle.dataset.y);

        // distance from clicked circle
        let dist = Math.abs(cx - x) + Math.abs(cy - y);

        if (dist <= maxRadius) {
          setTimeout(() => {
            circle.classList.remove("ripple"); // reset
            void circle.offsetWidth; // force reflow
            circle.classList.add("ripple");
          }, dist * 40); // delay creates wave effect
        }
      });
    }
  }
