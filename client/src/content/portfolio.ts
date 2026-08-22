/* Signal in the Dark content model: keep personal data replaceable while preserving the editorial developer-console design. */

export const portfolio = {
  identity: {
    name: "Roi Vincent P.  Solar",
    role: "Full-Stack Developer",
    eyebrow: "Full-Stack Developer — Web · Mobile",
    shortRole: "Flutter · Firebase · Web",
    location: "Ibaan, Batangas, Philippines",
    availability: "Available for select roles & collaborations",
    email: "roivincentsolar@gmail.com",
    resumeUrl: "/Solar_Roi_Resume.pdf",
    githubUrl: "https://github.com/RoiSolarr",
    linkedinUrl: "https://www.linkedin.com/in/roi-vincent-solar/",
  },
  about: {
    intro:
      "I turn complex requirements into focused, dependable software. My work sits at the intersection of thoughtful product decisions, clean implementation, and the small details that make an interface feel obvious to use.",
    story:
      "My path into technology began with a curiosity about how digital tools work under the surface. Today, I enjoy building products end-to-end—from shaping the data model and interaction flow to shipping the polished interface that people actually use.",
    values: [
      { label: "Clear thinking", detail: "Make the problem smaller before making the solution bigger." },
      { label: "Useful craft", detail: "Write code that respects the person on the other side of the screen." },
      { label: "Keep learning", detail: "Stay curious, test assumptions, and share what works." },
    ],
  },
  skills: {
    languages: ["JavaScript", "C#", "Python", "Java", "Dart", "PHP", "HTML5", "CSS3", "XML"],
    frameworks: ["React", "Flutter", "Node.js", "TailwindCSS"],
    tools: ["Firebase", "MySQL", "Git", "Supabase", "RESTful APIs", "WebRTC", "Cloudinary", "Semaphore"],
    deployment: ["Netlify", "Vercel", "Render"],
    certifications: [
      { title: "Cisco Networking Essentials", issuer: "Cisco", file: "/hardware-networking.pdf" },
      { title: "HTML Essentials", issuer: "Skillsoft", file: "/html-essentials.pdf" },
      { title: "JavaScript Essentials", issuer: "Skillsoft", file: "/javascript-essentials.pdf" },
      { title: "Linux Administration", issuer: "Linux Foundation / Training", file: "/linux-admin.pdf" },
      { title: "Python Essentials", issuer: "Skillsoft", file: "/python-essentials.pdf" },
      { title: "SAP S/4HANA", issuer: "SAP", file: "/sap-s4hana.pdf" },
    ],
  },
  projects: [
    {
      number: "01",
      title: "Sneakervault: Sneaker Inventory & Portfolio Tracker",
      type: "Mobile Application",
      overview:
        "A secure sneaker inventory and analytics platform that makes collection tracking and portfolio valuation easier to manage with a MySQL/PHP REST API and real-time wear-log insights.",
      contribution:
        "Developed the inventory architecture, shaped the authentication model, and implemented the analytics dashboard for collection tracking and valuation.",
      stack: ["Flutter", "MySQL", "Dart"],
      image: "/sneakervault_mockup_transparent.png",
      demoUrl: "https://sneakervaultapk.netlify.app/",
      codeUrl: "https://github.com/RoiSolarr/sneakervault",
    },
    {
      number: "02",
      title: "Room Reservation System",
      type: "Mobile Application",
      overview:
        "A room reservation workflow that makes shared spaces easier to discover, book, and manage with real-time availability and role-based access.",
      contribution:
        "Developed the booking workflow, shaped the access model, and implemented the interface for staff and administrators to ensure smooth multi-location operations.",
      stack: ["Flutter", "Dart", "Firebase"],
      image: "/transparent_phone_mockup.png",
      demoUrl: "https://dict-room-reservation-2k2604.netlify.app/",
      codeUrl: "https://github.com/RoiSolarr/DICT-WEB-IOS",
      webVariant: {
        type: "Web Application / Web-based Admin Panel",
        stack: ["HTML", "CSS", "JavaScript", "Firebase"],
        image: "/roomweb.png",
        demoLabel: "Get access",
        demoUrl: "https://dictadminweb-crisp-6325f5.netlify.app/",
        codeUrl: "https://github.com/RoiSolarr/roomweb",
      },
    },
    {
      number: "03",
      title: "VPM Online: A Mobile Ecommerce App with Delivery Tracking, SMS Alert and Inventory Management System",
      type: "Mobile Application",
      overview:
        "A mobile e-commerce platform that streamlines online shopping, live inventory tracking, and delivery updates for buyers and merchants.",
      contribution:
        "Engineered a three-tiered ecosystem with real-time GPS tracking and automated SMS notifications to improve customer communication and order management.",
      stack: ["Java", "XML", "Firebase"],
      image: "/vpm_portfolio_preview.png",
      demoUrl: "https://vpmonlineappdownload.netlify.app/",
      codeUrl: "https://github.com/RoiSolarr/vpmonlineapp",
      webVariant: {
        type: "Web-based Admin Panel",
        stack: ["HTML", "CSS", "JavaScript", "Node.js", "Firebase"],
        image: "/vpmweb.png",
        demoLabel: "Get access",
        demoUrl: "https://vpmonlineweb-kashata-f40629.netlify.app/",
        codeUrl: "https://github.com/RoiSolarr/vpmonlineweb",
      },
    },
  ],
  experience: [
    {
      period: "January 2026 - April 2026",
      role: "IT Intern",
      company: "Department of Information and Communications Technology",
      detail:
        "Co-developed a Firebase-powered Room Reservation System with real-time notifications, facilitated technical training programs for local police officers, and maintained core network hardware to ensure uninterrupted connectivity.",
    },
  ],
} as const;

export type Project = (typeof portfolio.projects)[number];
