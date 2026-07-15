import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "motion/react";
import imageRef from "@/imports/image.png";

function trackAnalyticsEvent(action: string, label?: string) {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;

  if (typeof gtag === "function") {
    gtag("event", action, {
      event_category: "engagement",
      event_label: label ?? action,
    });
  }
}

// ─── Grain overlay ────────────────────────────────────────────────────────────
function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] opacity-[0.06] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "200px 200px",
      }}
    />
  );
}

function StaffLines({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ height: 1, background: "rgba(191,92,40,0.2)", marginBottom: 8 }} />
      ))}
    </div>
  );
}

function RuleLine() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px" style={{ background: "rgba(191,92,40,0.28)" }} />
      <span style={{ fontFamily: "'DM Mono', monospace", color: "#bf5c28", fontSize: 10 }}>✦</span>
      <div className="flex-1 h-px" style={{ background: "rgba(191,92,40,0.28)" }} />
    </div>
  );
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Piano keyboard (interactive) ─────────────────────────────────────────
const BLACK_AFTER = [true, true, false, true, true, true, false];
const KEY_COUNT = 15;
const KEY_TEXTS = [
  "SOFTWARE ENGINEERING", "BUSINESS ENGINEERING", "DIGITAL INNOVATION",
  "SYSTEMS DESIGN", "REACT TYPESCRIPT", "AGILE DELIVERY", "DATA PLATFORMS",
  "CLOUD ARCHITECTURE", "LIFELONG LEARNING", "WOMEN IN STEM",
  "ETL PIPELINES", "AI INTEGRATION", "FULL-STACK", "CYBERSECURITY", "STRATEGIC THINKING",
];
const NOTE_NAMES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6"];
const NOTE_FREQUENCIES: Record<string, number> = {
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  "D#4": 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392.0,
  "G#4": 415.3,
  A4: 440.0,
  "A#4": 466.16,
  B4: 493.88,
  C5: 523.25,
  "C#5": 554.37,
  D5: 587.33,
  "D#5": 622.25,
  E5: 659.25,
  F5: 698.46,
  "F#5": 739.99,
  G5: 783.99,
  "G#5": 830.61,
  A5: 880.0,
  "A#5": 932.33,
  B5: 987.77,
  C6: 1046.5,
};

function PianoKeys() {
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNote = (index: number) => {
    if (typeof window === "undefined") return;

    const noteName = NOTE_NAMES[index] ?? "C4";
    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    const ctx = audioContextRef.current;
    void ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(NOTE_FREQUENCIES[noteName] ?? 440, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.45);
  };

  const handlePress = (index: number) => {
    setActiveKey(index);
    playNote(index);
    window.setTimeout(() => {
      setActiveKey((current) => (current === index ? null : current));
    }, 180);
  };

  return (
    <div className="relative flex w-full" style={{ height: 140 }}>
      {Array.from({ length: KEY_COUNT }).map((_, i) => {
        const hasBlack = BLACK_AFTER[i % 7] && i < KEY_COUNT - 1;
        const isActive = activeKey === i;
        const blackNote = NOTE_NAMES[i + 1] ?? NOTE_NAMES[i];
        return (
          <div key={i} className="relative flex-1 min-w-0" style={{ height: 140 }}>
            <button
              type="button"
              onPointerDown={() => handlePress(i)}
              onMouseDown={() => handlePress(i)}
              onTouchStart={() => handlePress(i)}
              className="absolute inset-0 overflow-hidden flex flex-col justify-center transition-all duration-200"
              style={{
                background: isActive
                  ? "linear-gradient(175deg, #f0dfb2 0%, #d9bd7f 40%, #c3953d 100%)"
                  : "linear-gradient(175deg, #e8d5a3 0%, #d4b87a 40%, #bf9a52 100%)",
                border: "1px solid rgba(100,60,10,0.4)",
                borderTop: "2px solid rgba(100,60,10,0.6)",
                borderRadius: "0 0 3px 3px",
                cursor: "pointer",
                transform: isActive ? "translateY(2px) scale(0.985)" : "translateY(0) scale(1)",
                boxShadow: isActive ? "inset 0 2px 8px rgba(0,0,0,0.18)" : undefined,
              }}
              aria-label={`Play ${NOTE_NAMES[i]} on the piano`}
            >
              <div
                className="absolute inset-0 flex flex-col justify-center overflow-hidden px-[2px]"
                style={{ opacity: 0.5 }}
              >
                {Array.from({ length: 10 }).map((_, r) => (
                  <div
                    key={r}
                    style={{
                      fontFamily: "'Old Standard TT', serif",
                      fontSize: 5,
                      color: "#2a1408",
                      lineHeight: "7px",
                      transform: "rotate(-90deg)",
                      whiteSpace: "nowrap",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {KEY_TEXTS[i]} ·{" "}
                  </div>
                ))}
              </div>
              <div
                className="absolute top-0 left-0 right-0"
                style={{ height: 6, background: "linear-gradient(180deg, rgba(50,25,5,0.4) 0%, transparent 100%)" }}
              />
            </button>
            {hasBlack && (
              <button
                type="button"
                onPointerDown={() => handlePress(i + 1)}
                onMouseDown={() => handlePress(i + 1)}
                onTouchStart={() => handlePress(i + 1)}
                className="absolute top-0 z-20 transition-all duration-200"
                style={{
                  right: "-30%",
                  width: "60%",
                  height: "60%",
                  background: activeKey === i + 1
                    ? "linear-gradient(175deg, #4f3116 0%, #1f1307 100%)"
                    : "linear-gradient(175deg, #2a1a08 0%, #120900 100%)",
                  border: "1px solid rgba(191,92,40,0.25)",
                  borderTop: "none",
                  borderRadius: "0 0 4px 4px",
                  boxShadow: activeKey === i + 1 ? "0 0 0 1px rgba(255,255,255,0.12) inset" : "2px 3px 6px rgba(0,0,0,0.7)",
                  transform: activeKey === i + 1 ? "translateY(1px)" : "translateY(0)",
                  cursor: "pointer",
                }}
                aria-label={`Play ${blackNote} on the piano`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(26,16,8,0.94)" : "transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(191,92,40,0.2)" : "1px solid transparent",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a
          href="#"
          style={{
            fontFamily: "'Old Standard TT', serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#f0e2c0",
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
        >
          Erin L.
        </a>
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#a08060",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#f0e2c0")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#a08060")}
            >
              {link.label}
            </a>
          ))}
        </div>
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block w-5 h-px transition-all duration-200"
              style={{ background: "#a08060" }}
            />
          ))}
        </button>
      </div>
      {open && (
        <div
          className="md:hidden px-6 py-5 flex flex-col gap-4"
          style={{ background: "rgba(26,16,8,0.97)", borderTop: "1px solid rgba(191,92,40,0.15)" }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#a08060",
                textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={imageRef}
          alt="Collage piano keys — newsprint and sheet music"
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.32) saturate(0.8) sepia(0.2)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(155deg, rgba(26,16,8,0.6) 0%, rgba(26,16,8,0.1) 40%, rgba(26,16,8,0.88) 80%, rgba(26,16,8,1) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 30% 55%, rgba(191,92,40,0.1) 0%, transparent 65%)" }}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-6xl mx-auto px-6 pt-36 pb-6 w-full">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <StaffLines className="mb-8 max-w-xs" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#bf5c28",
            marginBottom: 18,
          }}
        >
          Software Engineering · Business Engineering · Digital Innovation
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Old Standard TT', serif",
            fontWeight: 700,
            fontSize: "clamp(4rem, 10vw, 10rem)",
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
            color: "#f0e2c0",
            marginBottom: 28,
          }}
        >
          Erin L.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="max-w-lg leading-relaxed mb-10"
          style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: "1rem",
            color: "#a08060",
            fontStyle: "italic",
            lineHeight: 1.8,
          }}
        >
          Exploring how systems work, why they're built that way, and how they can
          be improved through thoughtful technology and strategy.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="flex flex-wrap gap-4"
        >
          <a
            href="#experience"
            onClick={() => trackAnalyticsEvent("resume_click", "view_resume")}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              background: "#bf5c28",
              color: "#f0e2c0",
              padding: "13px 28px",
              textDecoration: "none",
              transition: "background 0.3s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d4852a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#bf5c28")}
          >
            View Resume
          </a>
          <a
            href="https://linkedin.com/in/erin-l"
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              background: "transparent",
              color: "#bf5c28",
              border: "1px solid rgba(191,92,40,0.45)",
              padding: "13px 28px",
              textDecoration: "none",
              transition: "border-color 0.3s, color 0.3s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(191,92,40,0.9)";
              e.currentTarget.style.color = "#f0e2c0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(191,92,40,0.45)";
              e.currentTarget.style.color = "#bf5c28";
            }}
          >
            Contact Me
          </a>
        </motion.div>
      </div>

      {/* Piano keys at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1 }}
        className="relative z-10 w-full"
      >
        <StaffLines />
        <PianoKeys />
      </motion.div>
    </section>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function About() {
  return (
    <section
      id="about"
      className="py-28 px-6 relative overflow-hidden"
      style={{ background: "#1a1008" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(191,92,40,0.06) 23px, rgba(191,92,40,0.06) 24px)",
        }}
      />
      <div className="relative max-w-6xl mx-auto">
        <FadeIn>
          <RuleLine />
          <div className="mt-14 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20">
            <div>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#bf5c28",
                  marginBottom: 16,
                }}
              >
                About
              </p>
              <h2
                style={{
                  fontFamily: "'Old Standard TT', serif",
                  fontWeight: 700,
                  fontSize: "clamp(2.2rem, 4vw, 3.8rem)",
                  lineHeight: 0.95,
                  color: "#f0e2c0",
                }}
              >
                The Why
                <br />
                <em style={{ fontStyle: "italic", color: "#bf5c28", fontWeight: 400 }}>
                  Behind
                </em>
                <br />
                the What.
              </h2>
            </div>
            <div className="space-y-5">
              {[
                "Not just interested in how systems work — I want to understand why they're built that way, and how they could be better.",
                "With a background in tech, business, and engineering analysis, I love looking at the bigger picture and understanding how to connect technical and strategic dots — to think beyond the box. I thrive in roles where I can challenge myself to understand not only the intricate details but also improve the system as a whole.",
                "As an advocate for women in STEM, cybersecurity, and digital safety, I hope to learn and grow from mentors who carry this initiative while continuing my passion for lifelong learning.",
                "For now, I'm diving deep, staying curious, and always chasing the \"why behind the what.\" If you're working on something complex and meaningful, let's talk :)",
              ].map((para, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <p
                    style={{
                      fontFamily: "'Libre Baskerville', serif",
                      fontSize: "0.97rem",
                      color: i === 0 ? "#d4b07a" : "#a08060",
                      lineHeight: 1.85,
                      fontStyle: i === 0 ? "italic" : "normal",
                    }}
                  >
                    {para}
                  </p>
                </FadeIn>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Experience ───────────────────────────────────────────────────────────────
const EXPERIENCE = [
  {
    title: "Business Engineering Analyst",
    company: "Kyndryl Global (formerly IBM's Global Technology Services)",
    location: "Toronto, ON",
    period: "May 2025 – Present",
    bullets: [
      "Designed and delivered scalable frontend architectures for multiple global enterprise applications using React/TypeScript-based Power Platform Component Framework (PCF) components, SQL-driven experiences, and REST API integrations.",
      "Partnered with product managers, engineers, and business stakeholders to translate strategic objectives into technical solutions through discovery workshops, requirement definition, implementation planning, and Agile delivery.",
      "Architected AI-enabled digital experiences with Microsoft Copilot Studio, Power Automate, and custom frontend components to streamline workflows and reduce manual effort by 43%.",
      "Created data-driven experiences by integrating frontend applications, SQL databases, ETL workflows, and enterprise services to improve accessibility and support smarter operational decisions.",
    ],
  },
  {
    title: "Solutions Engineer Intern",
    company: "Kyndryl (formerly IBM's Global Technology Services)",
    location: "Toronto, ON",
    period: "May 2023 – February 2025",
    bullets: [
      "Designed and launched a production Power Apps model-driven application that automated financial governance workflows, enforced complex business rules, and consolidated data from multiple enterprise sources.",
      "Reduced manual ETL effort by 40% while improving operational reporting and risk analysis.",
      "Architected a scalable data platform integrating live SQL databases, ETL pipelines, Power BI, Power Automate, and AI-powered Copilot agents for 1,000+ customer accounts.",
    ],
  },
  {
    title: "Data Engineer Apprentice",
    company: "CFL – Canadian Football League",
    location: "Toronto, ON",
    period: "Dec 2022 – May 2023",
    bullets: [
      "Developed foundational data engineering expertise by collaborating with engineers on secure data storage practices, cloud-based architectures, and serverless application deployment workflows.",
      "Gained hands-on exposure to Snowflake, Python, and AWS services while supporting data engineering initiatives involving data pipelines, cloud infrastructure, and scalable application design.",
    ],
  },
  {
    title: "Communications & Strategy Director",
    company: "IDDSI – International Dysphagia Diet Standardisation Initiative",
    location: "Toronto, ON",
    period: "Dec 2022 – Present",
    bullets: [
      "Developed clear, audience-focused messaging by translating complex technical and organizational initiatives into engaging digital content for diverse global stakeholders.",
      "Collaborated with international reference groups to gather stakeholder feedback and regional insights, ensuring communications strategies aligned with organizational priorities.",
      "Coordinated cross-functional communications initiatives by managing content calendars, project timelines, and campaign deliverables across distributed teams.",
      "Monitored engagement metrics and campaign performance to optimize communications strategies and support data-driven decision-making.",
    ],
  },
];

function ExperienceCard({ job, index }: { job: typeof EXPERIENCE[0]; index: number }) {
  return (
    <FadeIn delay={index * 0.08}>
      <div
        style={{
          background: "rgba(34,22,8,0.6)",
          border: "1px solid rgba(191,92,40,0.2)",
          padding: "28px 32px",
          marginBottom: 2,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
          <div>
            <h3
              style={{
                fontFamily: "'Old Standard TT', serif",
                fontWeight: 700,
                fontSize: "1.15rem",
                color: "#f0e2c0",
                marginBottom: 4,
              }}
            >
              {job.title}
            </h3>
            <p
              style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: "0.85rem",
                color: "#bf5c28",
                fontStyle: "italic",
                marginBottom: 2,
              }}
            >
              {job.company}
            </p>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.15em",
                color: "#6a4e30",
              }}
            >
              {job.location}
            </p>
          </div>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "#a08060",
              whiteSpace: "nowrap",
              flexShrink: 0,
              paddingTop: 2,
            }}
          >
            {job.period}
          </span>
        </div>
        <ul className="space-y-2 mt-4" style={{ paddingLeft: 0, listStyle: "none" }}>
          {job.bullets.map((b, i) => (
            <li
              key={i}
              className="flex gap-3"
              style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: "0.88rem",
                color: "#8a6a48",
                lineHeight: 1.75,
              }}
            >
              <span style={{ color: "#bf5c28", flexShrink: 0, marginTop: 2 }}>—</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </FadeIn>
  );
}

function Experience() {
  return (
    <section id="experience" className="py-28 px-6" style={{ background: "#140e06" }}>
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#bf5c28",
              marginBottom: 12,
            }}
          >
            Experience
          </p>
          <h2
            style={{
              fontFamily: "'Old Standard TT', serif",
              fontWeight: 700,
              fontSize: "clamp(2.2rem, 4vw, 4rem)",
              lineHeight: 0.95,
              color: "#f0e2c0",
              marginBottom: 40,
            }}
          >
            Where I've
            <br />
            <em style={{ fontStyle: "italic", color: "#bf5c28", fontWeight: 400 }}>Worked.</em>
          </h2>
        </FadeIn>
        <div className="space-y-px">
          {EXPERIENCE.map((job, i) => (
            <ExperienceCard key={job.title} job={job} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Projects ─────────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    title: "LangChainJS Open-Source Contributor",
    type: "Open-Source Software Contribution",
    stack: "TypeScript · JavaScript · Docker · REST APIs · Jupyter Notebook · GitHub",
    period: "Nov 2024 – Dec 2024",
    link: "https://github.com/langchain-ai/langchainjs/pull/7300",
    bullets: [
      "Designed and implemented a production-ready Reddit integration for the LangChainJS framework, developing a Reddit API wrapper, search tool, and document loader to enable LLM-powered applications to retrieve and process subreddit and user content.",
      "Contributed TypeScript code to a large-scale open-source codebase, collaborating with maintainers through GitHub code reviews to deliver features aligned with LangChain's architecture and engineering standards.",
    ],
  },
  {
    title: "Go-Here: Crohn's and Colitis Canada Expo App",
    type: "Full-Stack Digital Application",
    stack: "React · JavaScript · MongoDB · Mongoose · Expo · HTML/CSS · REST APIs · Git",
    period: "Nov 2023 – Present",
    link: "https://github.com/AlvinCao88/c01w24-project-Safe_Haven",
    bullets: [
      "Designed and developed a full-stack mobile application to improve accessibility for Crohn's and Colitis Canada Expo attendees, building interactive React-based experiences and integrating REST APIs, MongoDB, and Mongoose for scalable data management.",
      "Engineered an interactive geospatial user experience using React Leaflet and Google Maps APIs, enabling users to search and locate nearby accessible washrooms through optimized map interactions, improving navigation efficiency by 40%.",
      "Collaborated within an Agile development team to translate user needs into technical requirements, design application workflows, implement frontend components, and deliver iterative product enhancements through Git-based development practices.",
    ],
  },
];

function Projects() {
  return (
    <section
      id="projects"
      className="py-28 px-6 relative overflow-hidden"
      style={{ background: "#1a1008" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(191,92,40,0.055) 31px, rgba(191,92,40,0.055) 32px)",
        }}
      />
      <div className="relative max-w-6xl mx-auto">
        <FadeIn>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#bf5c28",
              marginBottom: 12,
            }}
          >
            Projects
          </p>
          <h2
            style={{
              fontFamily: "'Old Standard TT', serif",
              fontWeight: 700,
              fontSize: "clamp(2.2rem, 4vw, 4rem)",
              lineHeight: 0.95,
              color: "#f0e2c0",
              marginBottom: 40,
            }}
          >
            Things
            <br />
            <em style={{ fontStyle: "italic", color: "#bf5c28", fontWeight: 400 }}>I've Built.</em>
          </h2>
        </FadeIn>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px" style={{ background: "rgba(191,92,40,0.14)" }}>
          {PROJECTS.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.1}>
              <div
                style={{
                  background: "#1a1008",
                  padding: "32px",
                  height: "100%",
                }}
              >
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#bf5c28",
                    marginBottom: 8,
                  }}
                >
                  {p.type}
                </p>
                <h3
                  style={{
                    fontFamily: "'Old Standard TT', serif",
                    fontWeight: 700,
                    fontSize: "1.15rem",
                    color: "#f0e2c0",
                    marginBottom: 10,
                    lineHeight: 1.3,
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9.5,
                    letterSpacing: "0.08em",
                    color: "#6a4e30",
                    marginBottom: 20,
                    lineHeight: 1.6,
                  }}
                >
                  {p.stack}
                </p>
                <ul className="space-y-3" style={{ listStyle: "none", paddingLeft: 0 }}>
                  {p.bullets.map((b, j) => (
                    <li
                      key={j}
                      className="flex gap-3"
                      style={{
                        fontFamily: "'Libre Baskerville', serif",
                        fontSize: "0.85rem",
                        color: "#8a6a48",
                        lineHeight: 1.75,
                      }}
                    >
                      <span style={{ color: "#bf5c28", flexShrink: 0, marginTop: 2 }}>—</span>
                      {b}
                    </li>
                  ))}
                </ul>
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackAnalyticsEvent("project_click", p.title)}
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9.5,
                      letterSpacing: "0.16em",
                      color: "#bf5c28",
                      marginTop: 16,
                      display: "inline-block",
                      textDecoration: "none",
                      textTransform: "uppercase",
                    }}
                  >
                    View project ↗
                  </a>
                )}
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    color: "#4a3020",
                    marginTop: 12,
                  }}
                >
                  {p.period}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Fun Facts ──────────────────────────────────────────────────────────────
const FUN_FACTS = [
  {
    icon: "🎹",
    title: "Jazz comping & piano",
    description: "Love discovering new voicings + turning improvisation into conversation (my favourite jazz pianist is hiromi, highly recommend giving her a listen)",
  },
  {
    icon: "🥊",
    title: "Muay Thai",
    description: "There's something satisfying about being able to kick something really hard without breaking anything + it's the best stress reliever + the community is amazing :)",
  },
  {
    icon: "🧗",
    title: "Rock climbing",
    description: "What can I say, there's something enticing about plastic rocks - next adventure: outdoor climbing :O",
  },
  {
    icon: "✈️",
    title: "Traveling",
    description: "I love exploring new places, experiencing different cultures, and finding hidden gems - mainly restaurants though.",
  },
  {
    icon: "🌿",
    title: "Nature",
    description: "A bit of fresh air always helps me reset and my dog loves it too.",
  },
];

function FunFacts() {
  return (
    <section className="py-28 px-6 relative overflow-hidden" style={{ background: "#140e06" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, rgba(191,92,40,0.14), transparent 42%)",
        }}
      />
      <div className="relative max-w-6xl mx-auto">
        <FadeIn>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#bf5c28",
              marginBottom: 12,
            }}
          >
            Fun Facts
          </p>
          <h2
            style={{
              fontFamily: "'Old Standard TT', serif",
              fontWeight: 700,
              fontSize: "clamp(2.1rem, 4vw, 3.4rem)",
              lineHeight: 0.95,
              color: "#f0e2c0",
              marginBottom: 10,
            }}
          >
            A little more
            <br />
            <em style={{ fontStyle: "italic", color: "#bf5c28", fontWeight: 400 }}>about me.</em>
          </h2>
          <p
            style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: "0.95rem",
              color: "#a08060",
              lineHeight: 1.8,
              maxWidth: "56rem",
              marginBottom: 28,
            }}
          >
            I’m the kind of person who finds beauty in both structured thinking and lived experience — whether that means practicing jazz on the piano, training with focus, or heading outside to reset.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FUN_FACTS.map((fact, index) => (
            <FadeIn key={fact.title} delay={index * 0.06}>
              <div
                style={{
                  background: "rgba(34,22,8,0.72)",
                  border: "1px solid rgba(191,92,40,0.22)",
                  padding: "24px 22px",
                  minHeight: 150,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 42,
                    height: 42,
                    borderRadius: "999px",
                    background: "rgba(191,92,40,0.16)",
                    fontSize: 20,
                    marginBottom: 12,
                  }}
                >
                  {fact.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "'Old Standard TT', serif",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "#f0e2c0",
                    marginBottom: 8,
                  }}
                >
                  {fact.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Libre Baskerville', serif",
                    fontSize: "0.9rem",
                    color: "#a08060",
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {fact.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────────
const SKILLS = [
  { group: "Frontend & Web", items: ["React", "TypeScript", "JavaScript", "HTML/CSS", "Next.js", ".NET", "REST APIs", "Express.js", "Figma"] },
  { group: "Programming", items: ["Python", "Java", "C++", "C", "PHP", "Bash", "SQL", "PowerFX"] },
  { group: "Data & AI", items: ["SQL Server", "Snowflake", "MongoDB", "ETL", "Power BI", "Microsoft Copilot Studio", "AI Integration"] },
  { group: "Cloud & DevOps", items: ["Azure", "AWS", "AWS EC2", "Azure DevOps", "GitHub Actions", "Docker", "CI/CD", "Git"] },
];

function Skills() {
  return (
    <section id="skills" className="py-28 px-6" style={{ background: "#140e06" }}>
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#bf5c28",
              marginBottom: 12,
            }}
          >
            Skills
          </p>
          <h2
            style={{
              fontFamily: "'Old Standard TT', serif",
              fontWeight: 700,
              fontSize: "clamp(2.2rem, 4vw, 4rem)",
              lineHeight: 0.95,
              color: "#f0e2c0",
              marginBottom: 40,
            }}
          >
            The
            <br />
            <em style={{ fontStyle: "italic", color: "#bf5c28", fontWeight: 400 }}>Toolkit.</em>
          </h2>
        </FadeIn>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ background: "rgba(191,92,40,0.15)" }}
        >
          {SKILLS.map((s, i) => (
            <FadeIn key={s.group} delay={i * 0.07}>
              <div style={{ background: "#140e06", padding: "28px 26px", height: "100%" }}>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "#bf5c28",
                    marginBottom: 16,
                  }}
                >
                  {s.group}
                </p>
                <div className="flex flex-wrap gap-2">
                  {s.items.map((item) => (
                    <span
                      key={item}
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        color: "#a08060",
                        border: "1px solid rgba(191,92,40,0.22)",
                        padding: "4px 8px",
                        display: "inline-block",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Education ────────────────────────────────────────────────────────────────
function Education() {
  return (
    <section
      className="py-20 px-6 relative overflow-hidden"
      style={{ background: "#1a1008" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(191,92,40,0.05) 23px, rgba(191,92,40,0.05) 24px)",
        }}
      />
      <div className="relative max-w-6xl mx-auto">
        <FadeIn>
          <RuleLine />
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10">
            <div>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#bf5c28",
                  marginBottom: 12,
                }}
              >
                Education
              </p>
              <h2
                style={{
                  fontFamily: "'Old Standard TT', serif",
                  fontWeight: 700,
                  fontSize: "clamp(2rem, 3.5vw, 3.2rem)",
                  lineHeight: 1,
                  color: "#f0e2c0",
                }}
              >
                Where I
                <br />
                <em style={{ fontStyle: "italic", color: "#bf5c28", fontWeight: 400 }}>Studied.</em>
              </h2>
            </div>
            <div
              style={{
                background: "rgba(34,22,8,0.6)",
                border: "1px solid rgba(191,92,40,0.2)",
                padding: "28px 32px",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Old Standard TT', serif",
                  fontWeight: 700,
                  fontSize: "1.3rem",
                  color: "#f0e2c0",
                  marginBottom: 4,
                }}
              >
                University of Toronto
              </h3>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  color: "#6a4e30",
                  marginBottom: 14,
                }}
              >
                Toronto, ON
              </p>
              <p
                style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: "0.92rem",
                  color: "#a08060",
                  lineHeight: 1.75,
                  marginBottom: 6,
                }}
              >
                Computer Science Specialist in Software Engineering (Co-op)
              </p>
              <p
                style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: "0.9rem",
                  color: "#6a4e30",
                  fontStyle: "italic",
                }}
              >
                Literature and Film Studies Minor
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden" style={{ background: "#100b05" }}>
      <img
        src="https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=1600&h=500&fit=crop&auto=format"
        alt="Grand piano in warm amber light"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.22) saturate(0.5) sepia(0.5)", objectPosition: "center 40%" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, rgba(16,11,5,0.97) 0%, rgba(16,11,5,0.6) 60%, rgba(16,11,5,0.9) 100%)" }}
      />
      <div className="relative z-10 px-6 py-28 max-w-6xl mx-auto">
        <FadeIn>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#bf5c28",
              marginBottom: 12,
            }}
          >
            Contact
          </p>
          <h2
            style={{
              fontFamily: "'Old Standard TT', serif",
              fontWeight: 700,
              fontStyle: "italic",
              fontSize: "clamp(2rem, 4vw, 4rem)",
              color: "#f0e2c0",
              lineHeight: 1.1,
              maxWidth: "20ch",
              marginBottom: 32,
            }}
          >
            Working on something complex and meaningful?
          </h2>
          <p
            style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: "0.95rem",
              color: "#a08060",
              fontStyle: "italic",
              marginBottom: 36,
            }}
          >
            Let's talk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="https://linkedin.com/in/erin-l"
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                background: "#bf5c28",
                color: "#f0e2c0",
                padding: "13px 28px",
                textDecoration: "none",
                display: "inline-block",
                transition: "background 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#d4852a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#bf5c28")}
            >
              LinkedIn →
            </a>
            <a
              href="https://github.com/erinL168"
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                background: "transparent",
                color: "#bf5c28",
                border: "1px solid rgba(191,92,40,0.45)",
                padding: "13px 28px",
                textDecoration: "none",
                display: "inline-block",
                transition: "border-color 0.3s, color 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(191,92,40,0.9)";
                e.currentTarget.style.color = "#f0e2c0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(191,92,40,0.45)";
                e.currentTarget.style.color = "#bf5c28";
              }}
            >
              GitHub →
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        background: "#100b05",
        borderTop: "1px solid rgba(191,92,40,0.18)",
        padding: "36px 24px",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <RuleLine />
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span
            style={{
              fontFamily: "'Old Standard TT', serif",
              fontSize: "0.9rem",
              color: "#6a4e30",
              letterSpacing: "0.04em",
            }}
          >
            Erin L. — Software Engineering · Business Engineering · Digital Innovation
          </span>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: "#3a2510",
              letterSpacing: "0.1em",
            }}
          >
            Chasing the why behind the what.
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div style={{ background: "#1a1008", color: "#f0e2c0", overflowX: "hidden" }}>
      <Grain />
      <Nav />
      <Hero />
      <About />
      <Experience />
      <Projects />
      <FunFacts />
      <Skills />
      <Education />
      <Contact />
      <Footer />
    </div>
  );
}
