// gsap.js - LuxuryStays Animation System
import { gsap } from "https://cdn.skypack.dev/gsap";
import { ScrollTrigger } from "https://cdn.skypack.dev/gsap/ScrollTrigger";
import { Flip } from "https://cdn.skypack.dev/gsap/Flip";

gsap.registerPlugin(ScrollTrigger, Flip);

// Initialize animations when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initCustomCursor();
  initNavbarAnimations();
  initMenuAnimations();
  initDashboardAnimations();
});

// 1. Custom Cursor System
function initCustomCursor() {
  const cursor = document.querySelector(".cursor");
  const interactiveElements = document.querySelectorAll(
    "a, button, .nav, .stat-item, .sideBar a, .signLogin a"
  );

  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;

  // Smooth cursor follow with lerping
  function updateCursorPosition() {
    const lerp = 0.2;
    currentX = currentX + (targetX - currentX) * lerp;
    currentY = currentY + (targetY - currentY) * lerp;

    gsap.to(cursor, {
      x: currentX,
      y: currentY,
      duration: 0.8,
      ease: "power2.out",
    });

    requestAnimationFrame(updateCursorPosition);
  }

  updateCursorPosition();

  document.addEventListener("mousemove", (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  // Cursor hover effects
  interactiveElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      gsap.to(cursor, {
        scale: 2,
        backgroundColor: "rgba(255, 56, 92, 0.5)",
        borderColor: "transparent",
        duration: 0.3,
      });

      if (el.classList.contains("nav") || el.classList.contains("close-menu")) {
        gsap.to(cursor, {
          scale: 1.5,
          duration: 0.3,
        });
      }
    });

    el.addEventListener("mouseleave", () => {
      gsap.to(cursor, {
        scale: 1,
        backgroundColor: "transparent",
        borderColor: "#ff385c",
        duration: 0.3,
      });
    });
  });
}

// 2. Navbar Animations
function initNavbarAnimations() {
  gsap.from(".navbar", {
    y: -50,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
  });

  gsap.from(".navbar h4", {
    x: -20,
    opacity: 0,
    duration: 0.8,
    delay: 0.3,
    ease: "elastic.out(1, 0.5)",
  });

  gsap.from(".nav", {
    x: 20,
    opacity: 0,
    duration: 0.8,
    delay: 0.4,
    ease: "back.out(1.7)",
  });
}

// 3. Menu Animations
function initMenuAnimations() {
  let menuOpen = false;
  const menuTimeline = gsap.timeline({ paused: true });

  // Menu animation sequence
  menuTimeline
    .to("#full", {
      x: "100%",
      duration: 0.6,
      ease: "power3.inOut",
    })
    .to(
      ".menu-overlay",
      {
        opacity: 1,
        pointerEvents: "all",
        duration: 0.4,
        ease: "power2.inOut",
      },
      "<"
    )
    .from(
      ".profile",
      {
        x: -30,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.2)",
      },
      0.2
    )
    .from(
      ".host-dashboard",
      {
        y: 30,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.2)",
      },
      0.3
    )
    .from(
      ".sideBar a",
      {
        x: -30,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "back.out(1.2)",
      },
      0.4
    )
    .from(
      ".signLogin a",
      {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "back.out(1.2)",
      },
      0.5
    )
    .from(
      ".system-status",
      {
        y: 20,
        opacity: 0,
        duration: 0.4,
        ease: "back.out(1.2)",
      },
      0.6
    )
    .from(
      ".close-menu",
      {
        rotate: -90,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
      },
      0.2
    );

  // Menu toggle functionality
  document.querySelector(".nav").addEventListener("click", () => {
    if (!menuOpen) {
      menuTimeline.play();
      document.body.style.overflow = "hidden";
      menuOpen = true;
    }
  });

  document.querySelector(".close-menu").addEventListener("click", () => {
    if (menuOpen) {
      menuTimeline.reverse();
      document.body.style.overflow = "auto";
      menuOpen = false;
    }
  });

  document.querySelector(".menu-overlay").addEventListener("click", () => {
    if (menuOpen) {
      menuTimeline.reverse();
      document.body.style.overflow = "auto";
      menuOpen = false;
    }
  });
}

// 4. Dashboard Specific Animations
function initDashboardAnimations() {
  // Progress bar animation
  gsap.from(".progress-fill", {
    width: 0,
    duration: 1.5,
    delay: 1,
    ease: "power2.out",
  });

  // Quick stats animation
  gsap.from(".stat-item h4", {
    scale: 0,
    duration: 0.6,
    delay: 1.2,
    stagger: 0.1,
    ease: "back.out(1.7)",
  });

  // Interactive elements hover effects
  const interactiveItems = document.querySelectorAll(".sideBar a, .stat-item");
  interactiveItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      gsap.to(item, {
        y: -3,
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        duration: 0.3,
      });
    });

    item.addEventListener("mouseleave", () => {
      gsap.to(item, {
        y: 0,
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        duration: 0.3,
      });
    });
  });
}

// Responsive adjustments
function handleResize() {
  if (window.innerWidth < 768) {
    gsap.set("#full", { x: "-100%" });
  }
}

window.addEventListener("resize", handleResize);