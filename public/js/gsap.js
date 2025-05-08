
// import { gsap } from "https://cdn.skypack.dev/gsap";

import { gsap } from "https://cdn.skypack.dev/gsap";
import { ScrollTrigger } from "https://cdn.skypack.dev/gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

 let listing = document.querySelector("li");

 let cursor = document.querySelector(".cursor")
 document.addEventListener("mousemove",(obj)=>{
    gsap.to(cursor,{
       x:obj.x,
       y:obj.y,
       ease: "power2.out",
    })
})

  
gsap.from(".navbar", {
    x: -100, // Start from 100px to the left
    opacity: 0, // Start with 0 opacity
    // duration: 1, // Duration of the animation
    ease: "power2.out" // Easing for a smooth effect
});

gsap.from(".navbar h4", {
    y: 50,
    opacity: 0,
      ease: "elastic.out(1, 0.3)",
    stagger: 0.3
});
    
 let navbar = document.querySelector(".navbar .nav");
 let body = document.querySelector("body");

let tl = gsap.timeline();

tl.to("#full",{
    x:-400,
    duration:0.5,
    
})
tl.from("#full h4",{
    x:-30,
    opacity:0,
    duration:0.5,
    stagger:0.3,
});
tl.pause();
navbar.addEventListener("click",()=>{
    console.log("hello");
    tl.play();
});
document.addEventListener("dblclick",()=>{
    console.log("bye");
    tl.reverse();
});

let h1 = document.querySelector("h1");
let h1Text = h1.textContent;

let splittedText = h1Text.split("");
let halfValue =Math.floor(splittedText.length/2);

let clutter = " "


splittedText.forEach((elem,idx)=>{
    if(idx<halfValue){
        clutter = clutter + `<span class="a">${elem}</span>`;
    }
    else{
        clutter = clutter + `<span class="b">${elem}</span>`;
    }

})
h1.innerHTML = clutter;

gsap.from("h1 .a",{
    y:50,
    opacity: 0,
    duration:0.8,
    delay:0.3,
    stagger:0.15
    
})
gsap.from("h1 .b",{
    y:50,
    opacity: 0,
    duration:0.8,
    delay:0.3,
    stagger:-0.15
    
})