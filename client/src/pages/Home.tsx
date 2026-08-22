/* Signal in the Dark page: asymmetric editorial layout, sky-blue signal accents, and utility-style metadata. */

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import {
  siCss3,
  siCloudinary,
  siDart,
  siFirebase,
  siFlutter,
  siGit,
  siHtml5,
  siJavascript,
  siMysql,
  siNetlify,
  siNodedotjs,
  siOpenjdk,
  siPhp,
  siPostman,
  siPython,
  siReact,
  siRender,
  siSharp,
  siSupabase,
  siSemaphoreci,
  siTailwindcss,
  siVercel,
  siWebrtc,
  siXml,
} from "simple-icons";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Braces,
  Check,
  Code2,
  Database,
  Download,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  MoveUpRight,
  Terminal,
  X,
} from "lucide-react";
import { portfolio, type Project } from "@/content/portfolio";
import Reveal from "@/components/Reveal";
import ScrollProgress from "@/components/ScrollProgress";
import HeroField from "@/components/HeroField";
import AnimatedHeadline from "@/components/AnimatedHeadline";
import FlipAvatar from "@/components/FlipAvatar";
import CustomCursor from "@/components/CustomCursor";
import Magnetic from "@/components/Magnetic";
import LoadIntro from "@/components/LoadIntro";
import { ScrollParallax, ScrollDrawLine, useHeroScrub, useHeroFieldDrift } from "@/components/ScrollMotion";
import { usePointerFine } from "@/hooks/usePointerFine";

/** Eased scroll to a target Y position over a fixed duration, so anchor navigation feels
    consistent across browsers instead of relying on native `scrollIntoView` smoothing.
    Jumps instantly for reduced-motion visitors. */
function smoothScrollTo(targetY: number, duration: number, reduceMotion: boolean) {
  const clampedTarget = Math.max(0, targetY);
  if (reduceMotion || typeof window === "undefined") {
    window.scrollTo(0, clampedTarget);
    return;
  }

  const startY = window.scrollY;
  const diff = clampedTarget - startY;
  const startTime = performance.now();
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + diff * easeOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

const navItems = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Certifications", href: "#certifications" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

function SectionLabel({ index, children }: { index: string; children: string }) {
  return (
    <Reveal className="section-label" direction="left" distance={16} duration={0.55}>
      <span>{index}</span>
      <span className="section-label__rule" aria-hidden="true" />
      <span>{children}</span>
    </Reveal>
  );
}

const skillIcons = {
  JavaScript: siJavascript,
  "C#": siSharp,
  Python: siPython,
  Java: siOpenjdk,
  Dart: siDart,
  PHP: siPhp,
  HTML5: siHtml5,
  CSS3: siCss3,
  XML: siXml,
  React: siReact,
  Flutter: siFlutter,
  "Node.js": siNodedotjs,
  TailwindCSS: siTailwindcss,
  Firebase: siFirebase,
  MySQL: siMysql,
  Git: siGit,
  Supabase: siSupabase,
  "RESTful APIs": siPostman,
  WebRTC: siWebrtc,
  Cloudinary: siCloudinary,
  Semaphore: siSemaphoreci,
  Netlify: siNetlify,
  Vercel: siVercel,
  Render: siRender,
} as const;

type SkillName = keyof typeof skillIcons;

// A few languages ship their official multi-color logo file instead of the monochrome
// simple-icons path, for a closer match to their real branding.
const skillImageIcons: Partial<Record<SkillName, string>> = {
  "C#": "/languagesicon/csharp.svg",
  Java: "/languagesicon/java.svg",
  Python: "/languagesicon/python.svg",
};

const skillCategories = [
  { key: "languages", label: "Languages", number: "01", columns: 4 },
  { key: "frameworks", label: "Frameworks", number: "02", columns: 4 },
  { key: "tools", label: "Data & Tools", number: "03", columns: 4 },
  { key: "deployment", label: "Deployment", number: "04", columns: 3 },
] as const;

type SkillCategoryKey = (typeof skillCategories)[number]["key"];

function SkillIcon({ name }: { name: string }) {
  const imageSrc = skillImageIcons[name as SkillName];
  if (imageSrc) {
    return (
      <span className="skill-chip__icon skill-chip__icon--image" aria-hidden="true">
        <img src={imageSrc} alt="" loading="lazy" />
      </span>
    );
  }
  const icon = skillIcons[name as SkillName];
  return (
    <span className="skill-chip__icon" aria-hidden="true" style={icon ? { color: `#${icon.hex}` } : undefined}>
      {icon ? <svg viewBox="0 0 24 24" role="presentation"><path d={icon.path} /></svg> : <span className="skill-chip__fallback">{name === "RESTful APIs" ? "API" : "S"}</span>}
    </span>
  );
}

function SkillChip({ name, index }: { name: string; index: number }) {
  return (
    <span className="skill-chip" tabIndex={0} title={name} style={{ "--skill-delay": `${index * 50}ms` } as CSSProperties}>
      <SkillIcon name={name} />
      <span className="skill-chip__label">{name}</span>
    </span>
  );
}

function ArrowLink({
  href,
  children,
  onClick,
  muted = false,
}: {
  href: string;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  muted?: boolean;
}) {
  return (
    <a className={`text-link${muted ? " text-link--muted" : ""}`} href={href} onClick={onClick}>
      <span>{children}</span>
      <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
    </a>
  );
}

function ProjectCard({ project, featured, onPlaceholder, delay = 0 }: { project: Project; featured?: boolean; onPlaceholder: (label: string) => void; delay?: number }) {
  const openPlaceholder = (event: MouseEvent<HTMLAnchorElement>, label: string) => {
    event.preventDefault();
    onPlaceholder(label);
  };

  // Some projects ship both a mobile app and a companion web/admin experience.
  // The Switch toggle lets a visitor flip the card between the two without leaving the grid.
  const webVariant = "webVariant" in project ? project.webVariant : undefined;
  const [showWeb, setShowWeb] = useState(false);
  const view = showWeb && webVariant ? webVariant : project;
  const demoLabel = showWeb && webVariant ? webVariant.demoLabel ?? "Get access" : "Get app";

  const projectClass = project.title.toLowerCase().includes("sneakervault")
    ? "project-card--sneakervault"
    : project.title.toLowerCase().includes("room reservation")
      ? "project-card--room-reservation"
      : project.title.toLowerCase().includes("vpm online")
        ? "project-card--vpm-online"
        : "";

  // 3D tilt-on-hover: track pointer position within the card and rotate toward it, spring-smoothed.
  // Only for fine-pointer, motion-ok visitors -- touch devices and reduced-motion just get the flat card.
  const shouldReduceMotion = useReducedMotion();
  const isPointerFine = usePointerFine();
  const tiltEnabled = isPointerFine && !shouldReduceMotion;
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const tiltSpringConfig = { stiffness: 220, damping: 22, mass: 0.4 };
  const springRotateX = useSpring(rotateX, tiltSpringConfig);
  const springRotateY = useSpring(rotateY, tiltSpringConfig);

  const handleTiltMove = (event: MouseEvent<HTMLElement>) => {
    if (!tiltEnabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 7);
    rotateX.set(py * -7);
  };
  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <Reveal
      as="article"
      className={`project-card${featured ? " project-card--featured" : ""} ${projectClass}`.trim()}
      delay={delay}
      duration={featured ? 0.85 : 0.7}
      distance={featured ? 46 : 26}
      scale={featured ? 0.88 : 0.96}
      style={{ rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 1000 }}
      onMouseMove={handleTiltMove}
      onMouseLeave={resetTilt}
    >
      <div className="project-card__media">
        {webVariant ? (
          <button
            type="button"
            className="project-card__switch"
            onClick={() => setShowWeb((value) => !value)}
            aria-pressed={showWeb}
          >
            {showWeb ? "Back to Mobile" : "Switch to Web"}
          </button>
        ) : null}
        <motion.img
          src={view.image}
          alt={`${project.title} abstract project preview`}
          whileHover={tiltEnabled ? { scale: 1.07 } : undefined}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
      <div className="project-card__body">
        <div className="project-card__topline">
          <span className="eyebrow">{view.type}</span>
          <span className="project-number">{project.number}</span>
        </div>
        <h3>{project.title}</h3>
        <p>{project.overview}</p>
        <div className="tag-row" aria-label={`${project.title} technology stack`}>
          {view.stack.map((item) => <span className="tech-tag" key={item}>{item}</span>)}
        </div>
        <p className="project-contribution"><strong>My contribution</strong>{project.contribution}</p>
        <div className="project-card__actions">
          <ArrowLink href={view.demoUrl}>{demoLabel}</ArrowLink>
          <ArrowLink href={view.codeUrl} muted>GitHub repo</ArrowLink>
        </div>
      </div>
    </Reveal>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const [notice, setNotice] = useState("");
  const [avatarFlipPaused, setAvatarFlipPaused] = useState(false);
  const [activeSkillCategory, setActiveSkillCategory] = useState<SkillCategoryKey>("languages");
  const shouldReduceMotion = useReducedMotion();

  // Hero mouse-parallax: normalized pointer position (-1..1) within the hero section.
  const heroRef = useRef<HTMLElement>(null);
  const heroMouseX = useMotionValue(0);
  const heroMouseY = useMotionValue(0);
  const heroMouseSpringConfig = { stiffness: 90, damping: 18, mass: 0.4 };
  const heroMouseXSpring = useSpring(heroMouseX, heroMouseSpringConfig);
  const heroMouseYSpring = useSpring(heroMouseY, heroMouseSpringConfig);
  const heroPanelX = useTransform(heroMouseXSpring, [-1, 1], [-12, 12]);
  const heroPanelY = useTransform(heroMouseYSpring, [-1, 1], [-9, 9]);
  const heroPanelRotateX = useTransform(heroMouseYSpring, [-1, 1], [4, -4]);
  const heroPanelRotateY = useTransform(heroMouseXSpring, [-1, 1], [-4, 4]);

  // Hero scroll-scrub: scale/fade/translate the hero content out as the visitor scrolls past it.
  const { scale: heroScale, opacity: heroOpacity, y: heroY } = useHeroScrub(heroRef);
  const { y: heroFieldY, opacity: heroFieldOpacity } = useHeroFieldDrift(heroRef);

  const handleHeroMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (shouldReduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    heroMouseX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    heroMouseY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };
  const handleHeroMouseLeave = () => {
    heroMouseX.set(0);
    heroMouseY.set(0);
  };

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter(Boolean) as HTMLElement[];

    const updateActiveSection = () => {
      const viewportCenter = window.innerHeight * 0.42;
      let nextActive = activeSection;
      let closestDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          nextActive = section.id;
        }
      });

      setActiveSection((current) => (nextActive && nextActive !== current ? nextActive : current));
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [activeSection]);

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    const targetId = href.slice(1);
    const target = document.getElementById(targetId);

    if (target) {
      const headerOffset = window.innerWidth <= 760 ? 68 : 76;
      const targetY =
        targetId === "top" ? 0 : target.getBoundingClientRect().top + window.scrollY - headerOffset;
      smoothScrollTo(targetY, 700, Boolean(shouldReduceMotion));
      setActiveSection(targetId);
      window.history.pushState(null, "", href);
    }
  };

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const closeMenu = () => setMenuOpen(false);
  const openPlaceholder = (event: MouseEvent<HTMLAnchorElement>, label: string) => {
    event.preventDefault();
    setNotice(`${label} is ready to configure — replace the placeholder URL in portfolio.ts.`);
  };

  return (
    <div className="site-shell">
      <ScrollProgress />
      <CustomCursor />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className={`site-header${menuOpen ? " site-header--menu-open" : ""}`}>
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="Back to top" onClick={(event) => handleNavClick(event, "#top")}>
            <span className="brand__text"><strong>{portfolio.identity.name}</strong></span>
          </a>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <motion.a
                className={activeSection === item.href.slice(1) ? "is-active" : ""}
                href={item.href}
                key={item.href}
                onClick={(event) => handleNavClick(event, item.href)}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
              >
                {item.label}
              </motion.a>
            ))}
          </nav>
          <Magnetic strength={10}>
            <a className="header-resume" href={portfolio.identity.resumeUrl}>Resume <Download size={14} aria-hidden="true" /></a>
          </Magnetic>
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen((value) => !value)}>
            <span className="sr-only">{menuOpen ? "Close" : "Open"} navigation</span>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.nav
              id="mobile-nav"
              className="mobile-nav"
              aria-label="Mobile navigation"
              initial={{ height: 0, opacity: shouldReduceMotion ? 1 : 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: shouldReduceMotion ? 1 : 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.01 }
                  : { type: "spring", stiffness: 340, damping: 32, mass: 0.9 }
              }
              style={{ overflow: "hidden" }}
            >
              {navItems.map((item) => (
                <a className={activeSection === item.href.slice(1) ? "is-active" : ""} href={item.href} key={item.href} onClick={(event) => { handleNavClick(event, item.href); closeMenu(); }}>
                  <span>{item.label}</span><ArrowUpRight size={15} aria-hidden="true" />
                </a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main id="main-content">
        <section
          className="hero"
          id="top"
          aria-labelledby="hero-title"
          ref={heroRef}
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
        >
          <motion.div
            className="hero__visual"
            aria-hidden="true"
            style={{ y: shouldReduceMotion ? 0 : heroFieldY, opacity: heroFieldOpacity }}
          >
            <HeroField mouseX={heroMouseXSpring} mouseY={heroMouseYSpring} />
          </motion.div>
          <motion.div
            className="hero__grid page-width"
            style={{ scale: shouldReduceMotion ? 1 : heroScale, opacity: heroOpacity, y: shouldReduceMotion ? 0 : heroY }}
          >
            <div className="hero__copy">
              <div className="status-line"><span className="status-dot status-dot--live" /> {portfolio.identity.availability}</div>
              <p className="hero__kicker">{portfolio.identity.eyebrow}</p>
              <AnimatedHeadline id="hero-title" />
              <p className="hero__lede">{portfolio.identity.role} specializing in {portfolio.identity.shortRole}. I build useful, dependable software for real people — calm, clear, and ready for what's next.</p>
              <div className="hero__actions">
                <Magnetic strength={16}>
                  <motion.a
                    className="button button--primary"
                    href="#projects"
                    onClick={(event) => handleNavClick(event, "#projects")}
                    whileHover={{ scale: 1.04, boxShadow: "0 18px 40px rgba(14,165,233,0.32)" }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  >
                    View selected work <ArrowUpRight size={16} aria-hidden="true" />
                  </motion.a>
                </Magnetic>
                <Magnetic strength={14}>
                  <motion.a
                    className="button button--ghost"
                    href={portfolio.identity.resumeUrl}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  >
                    Download resume <Download size={16} aria-hidden="true" />
                  </motion.a>
                </Magnetic>
              </div>
              <div className="hero__meta">
                <span><MapPin size={15} aria-hidden="true" /> {portfolio.identity.location}</span>
                <span><Code2 size={15} aria-hidden="true" /> Open to building</span>
              </div>
            </div>
            <motion.aside
              className="hero-panel"
              aria-label="Developer status"
              style={
                shouldReduceMotion
                  ? undefined
                  : { x: heroPanelX, y: heroPanelY, rotateX: heroPanelRotateX, rotateY: heroPanelRotateY }
              }
              onMouseEnter={() => setAvatarFlipPaused(true)}
              onMouseLeave={() => setAvatarFlipPaused(false)}
              onFocus={() => setAvatarFlipPaused(true)}
              onBlur={() => setAvatarFlipPaused(false)}
            >
              <div className="hero-panel__avatar">
                <FlipAvatar name={portfolio.identity.name} paused={avatarFlipPaused} />
              </div>
            </motion.aside>
          </motion.div>
          <a
            className="hero__scroll"
            href="#about"
            aria-label="Scroll to explore"
            onClick={(event) => handleNavClick(event, "#about")}
          />
        </section>

        <section className="section section--about page-width" id="about" aria-labelledby="about-title">
          <div className="section-intro"><SectionLabel index="01" >About me</SectionLabel></div>
          <div className="about-grid">
            <Reveal as="h2" id="about-title">Good software<br /><em>feels inevitable.</em></Reveal>
            <Reveal as="div" className="about-copy" direction="right" delay={0.1}><p className="lead-copy">{portfolio.about.intro}</p><p>{portfolio.about.story}</p><div className="fact-strip"><span><strong>01</strong> curious by default</span><span><strong>02</strong> detail-oriented</span><span><strong>03</strong> team-minded</span></div></Reveal>
          </div>
          <div className="values-grid">{portfolio.about.values.map((value, index) => <Reveal as="div" className="value-card" key={value.label} delay={index * 0.08} distance={18} scale={0.94}><span className="value-card__index">0{index + 1}</span><h3>{value.label}</h3><p>{value.detail}</p></Reveal>)}</div>
        </section>

        <section className="section section--skills page-width" id="skills" aria-labelledby="skills-title">
          <ScrollParallax className="section-glow section-glow--skills" speed={50} />
          <div className="section-intro"><SectionLabel index="02">Tools I use</SectionLabel></div>
          <div className="split-heading"><Reveal as="h2" id="skills-title">The stack behind<br /><em>the signal.</em></Reveal><Reveal as="p" delay={0.1}>I choose tools for the problem in front of me—balancing speed, maintainability, and the experience of the people who will live with the result.</Reveal></div>
          <div className="skills-tabs" role="tablist" aria-label="Technology categories">
            {skillCategories.map((category) => (
              <button
                className={`skills-tab${activeSkillCategory === category.key ? " is-active" : ""}`}
                key={category.key}
                id={`skill-tab-${category.key}`}
                role="tab"
                type="button"
                aria-selected={activeSkillCategory === category.key}
                aria-controls="skills-panel"
                onClick={() => setActiveSkillCategory(category.key)}
              >
                <span>{category.number}</span>
                {category.label}
              </button>
            ))}
          </div>
          <div className="skills-panel" id="skills-panel" role="tabpanel" aria-live="polite" aria-labelledby={`skill-tab-${activeSkillCategory}`} key={activeSkillCategory}>
            {skillCategories.map((category) => category.key === activeSkillCategory ? (
              <div className="skill-group skill-group--active" key={category.key}>
                <div className="skill-group__heading"><span className="skill-group__number">{category.number}</span><h3>{category.label}</h3></div>
                <div className={`skill-list skill-list--cols-${category.columns}`}>{portfolio.skills[activeSkillCategory].map((skill, index) => <SkillChip key={skill} name={skill} index={index} />)}</div>
              </div>
            ) : null)}
          </div>
        </section>

        <section className="section section--certifications page-width" id="certifications" aria-labelledby="certifications-title">
          <div className="section-intro"><SectionLabel index="03">Certifications</SectionLabel></div>
          <div className="split-heading"><Reveal as="h2" id="certifications-title">Proof of skill,<br /><em>in public.</em></Reveal><Reveal as="p" delay={0.1}>Selected credentials that reflect my foundation in systems, development, and business technology.</Reveal></div>
          <div className="certifications-grid">
            {portfolio.skills.certifications.map((certification, index) => (
              <Reveal as="a" className="cert-card" href={certification.file} target="_blank" rel="noreferrer" key={certification.title} delay={index * 0.06} distance={16} scale={0.95}>
                <span className="cert-card__index">0{index + 1}</span>
                <div className="cert-card__meta">
                  <span className="eyebrow">{certification.issuer}</span>
                  <h3>{certification.title}</h3>
                </div>
                <span className="cert-card__action">View PDF <ArrowUpRight size={14} aria-hidden="true" /></span>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section section--projects page-width" id="projects" aria-labelledby="projects-title">
          <div className="section-intro"><SectionLabel index="04">Selected work</SectionLabel></div>
          <div className="split-heading"><Reveal as="h2" id="projects-title">A few things<br /><em>I've shaped.</em></Reveal><Reveal as="p" delay={0.1}>Selected placeholders for the work that best represents how I think, collaborate, and turn an open question into a useful system.</Reveal></div>
          <div className="projects-list"><ProjectCard project={portfolio.projects[0]} featured onPlaceholder={setNotice} /><ProjectCard project={portfolio.projects[1]} featured onPlaceholder={setNotice} delay={0.1} /><ProjectCard project={portfolio.projects[2]} featured onPlaceholder={setNotice} delay={0.2} /></div>
        </section>

        <section className="section section--experience page-width" id="experience" aria-labelledby="experience-title">
          <div className="section-intro"><SectionLabel index="05">Experience</SectionLabel></div>
          <div className="experience-grid">
            <div><Reveal as="h2" id="experience-title">Learning by<br /><em>doing the work.</em></Reveal><Reveal as="p" className="experience-intro" delay={0.1}>Every role has taught me to ask better questions, communicate earlier, and leave the system easier to understand than I found it.</Reveal></div>
            <ScrollDrawLine className="timeline">
              {portfolio.experience.map((item, index) => <Reveal as="div" className="timeline-item" key={`${item.period}-${item.role}`} direction="left" delay={index * 0.1}><div className="timeline-item__header"><div className="timeline-item__heading"><h3>{item.role}</h3><p className="timeline-item__company">{item.company}</p></div><span className="timeline-item__period">{item.period}</span></div><p className="timeline-item__detail">{item.detail}</p></Reveal>)}
            </ScrollDrawLine>
          </div>
        </section>

        <section className="section section--contact page-width" id="contact" aria-labelledby="contact-title">
          <Reveal as="div" className="contact-card" distance={22} duration={0.8}>
            <ScrollParallax className="contact-card__pattern" speed={30} />
            <div className="contact-card__copy"><SectionLabel index="06">Open channel</SectionLabel><h2 id="contact-title">Have a problem<br />worth solving?</h2><p>Tell me what you're building, where it feels stuck, and what good could look like. I'll bring questions, structure, and a practical next step.</p></div>
            <div className="contact-card__action">
              <span className="eyebrow">Direct line</span>
              <motion.a className="email-link" href={`mailto:${portfolio.identity.email}`} whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 26 }}><Mail size={18} aria-hidden="true" /> {portfolio.identity.email}</motion.a>
              <div className="contact-links">
                <motion.a href={portfolio.identity.githubUrl} target="_blank" rel="noopener noreferrer" whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 24 }}><Github size={17} aria-hidden="true" /> GitHub</motion.a>
                <motion.a href={portfolio.identity.linkedinUrl} target="_blank" rel="noopener noreferrer" whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 24 }}><Linkedin size={17} aria-hidden="true" /> LinkedIn</motion.a>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="site-footer page-width"><div className="footer-brand"><span>© {new Date().getFullYear()} {portfolio.identity.name}</span></div></footer>
      <AnimatePresence>
        {notice && (
          <motion.div
            className="toast"
            role="status"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.96 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            transition={shouldReduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 340, damping: 28 }}
          >
            <span className="status-dot status-dot--live" />
            {notice}
            <button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={15} /></button>
          </motion.div>
        )}
      </AnimatePresence>
      <LoadIntro />
    </div>
  );
}
