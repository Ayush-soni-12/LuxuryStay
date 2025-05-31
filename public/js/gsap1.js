
import { gsap } from "https://cdn.skypack.dev/gsap";
import { ScrollTrigger } from "https://cdn.skypack.dev/gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);



 let cursor = document.querySelector(".cursor")
 document.addEventListener("mousemove",(obj)=>{
    gsap.to(cursor,{
       x:obj.x,
       y:obj.y,
       ease: "power2.out",
    })
})

