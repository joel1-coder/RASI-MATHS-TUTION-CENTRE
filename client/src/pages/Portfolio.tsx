import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Clock3,
  Mail,
  MapPin,
  Menu,
  Phone,
  X,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { readSiteData, type SiteData } from "@/lib/siteData";

const imageBase = "https://images.unsplash.com";

const stats = [
  { value: "94%", label: "students improved their last term score" },
  { value: "12", label: "focused batches running this season" },
  { value: "18", label: "years of teaching, together" },
  { value: "4.9/5", label: "average parent recommendation" },
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description: string }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="section-description">{description}</p>
    </div>
  );
}

interface PortfolioProps {
  onLogin?: () => void;
  user?: { name: string; role: string; email: string } | null;
  onGoToPortal?: () => void;
  onLogout?: () => void;
}

export default function Portfolio({ onLogin, user, onGoToPortal, onLogout }: PortfolioProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [siteData, setSiteData] = useState<SiteData>(() => readSiteData());
  const [subjectQuery, setSubjectQuery] = useState("");
  const [subjectCategory, setSubjectCategory] = useState("All classes");
  const [gradeFilter, setGradeFilter] = useState("All grades");
  const [seatFilter, setSeatFilter] = useState("Any availability");
  const [selectedSubject, setSelectedSubject] = useState<SiteData["subjects"][number] | null>(null);
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");

  useEffect(() => {
    const sync = () => setSiteData(readSiteData());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const announcement = siteData.announcements[0];
  const categories = ["All classes", ...Array.from(new Set(siteData.subjects.map((item) => item.batch.split("·").slice(-1)[0].trim())))];
  const grades = ["All grades", ...Array.from(new Set(siteData.subjects.map((item) => item.batch.split("·")[0].trim())))];
  const seatOptions = ["Any availability", "1–3 seats", "4–8 seats", "9+ seats"];
  const seatCount = (value: string) => Number(value.match(/\d+/)?.[0] || 0);
  const visibleSubjects = siteData.subjects.filter((item) => {
    const count = seatCount(item.seats);
    const matchesSearch = `${item.subject} ${item.batch} ${item.schedule} ${item.seats}`.toLowerCase().includes(subjectQuery.toLowerCase());
    const matchesCategory = subjectCategory === "All classes" || item.batch.toLowerCase().includes(subjectCategory.toLowerCase());
    const matchesGrade = gradeFilter === "All grades" || item.batch.startsWith(gradeFilter);
    const matchesSeats = seatFilter === "Any availability" || (seatFilter === "1–3 seats" && count <= 3) || (seatFilter === "4–8 seats" && count >= 4 && count <= 8) || (seatFilter === "9+ seats" && count >= 9);
    return matchesSearch && matchesCategory && matchesGrade && matchesSeats;
  });

  const closeMenu = () => setMenuOpen(false);

  const handleLoginClick = () => {
    closeMenu();
    if (user && onGoToPortal) {
      onGoToPortal();
    } else if (onLogin) {
      onLogin();
    } else {
      window.location.href = "/portal";
    }
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="page-width header-inner">
          <a className="brand" href="#top" aria-label="Rasi Maths Tuition Centre home" onClick={closeMenu}>
            <span className="brand-mark">RM</span>
            <span className="brand-name">Rasi Maths Tuition Centre</span>
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
            <a href="#subjects" onClick={closeMenu}>Subjects</a>
            <a href="#results" onClick={closeMenu}>Results</a>
            <a href="#teachers" onClick={closeMenu}>Teachers</a>
            <a href="#colleges-tech" onClick={closeMenu}>Colleges</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
            {user ? (
              <div className="flex items-center gap-2">
                <button className="nav-login" type="button" onClick={handleLoginClick}>
                  <UserIcon size={14} /> {user.name.split(" ")[0]} ({user.role})
                </button>
                {onLogout && (
                  <button
                    className="p-1.5 rounded-full hover:bg-black/5 text-gray-600"
                    type="button"
                    onClick={onLogout}
                    title="Log out"
                  >
                    <LogOut size={15} />
                  </button>
                )}
              </div>
            ) : (
              <button className="nav-login" type="button" onClick={handleLoginClick}>
                Portal login <ArrowUpRight size={15} />
              </button>
            )}
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero section-rule">
          <div className="page-width hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">A little more curious every day</p>
              <h1>Good learning<br /><em>stays with you.</em></h1>
              <p className="hero-description">Small-batch tuition for thoughtful students who want to understand the work — not just finish it.</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#subjects">Explore classes <ArrowUpRight size={17} /></a>
                <a className="button button-secondary" href="#contact">Book a demo</a>
              </div>
              <p className="hero-note"><span className="note-dot" /> {announcement?.title || "New batches are now open"}</p>
            </div>

            <aside className="hero-panel" aria-label="Rasi Maths Tuition Centre at a glance">
              <div className="hero-image-wrap">
                <img src={`${imageBase}/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=90`} alt="Students learning together in a bright classroom" />
                <div className="hero-image-sheen" />
                <div className="hero-image-caption"><span>Inside the classroom</span><span>01 / 04</span></div>
              </div>
              <div className="glass-panel">
                <div className="panel-label">At a glance <span>Since 2006</span></div>
                <div className="hero-stats">
                  {siteData.heroStats.map((stat) => <div className="hero-stat" key={stat.id}><span>{stat.value}</span><p>{stat.label}</p></div>)}
                </div>
                <div className="panel-footer"><span>Come in, sit down.</span><span className="panel-arrow">→</span></div>
              </div>
            </aside>
          </div>
        </section>

        <section className="content-section subjects-section" id="subjects">
          <div className="page-width">
            <SectionHeading
              eyebrow="01 / What we teach"
              title={<>The right room for<br />your next question.</>}
              description="A focused timetable, a steady pace, and teachers who notice when the lightbulb comes on."
            />
            <div className="subject-filters" aria-label="Find a class">
              <label className="subject-search">
                <span aria-hidden="true">🔍</span>
                <input value={subjectQuery} onChange={(event) => setSubjectQuery(event.target.value)} placeholder="Search subjects, grades, or schedule" aria-label="Search subjects, grades, or schedule" />
              </label>
              <div className="subject-selects">
                <select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)} aria-label="Filter by grade level">{grades.map((grade) => <option key={grade}>{grade}</option>)}</select>
                <select value={seatFilter} onChange={(event) => setSeatFilter(event.target.value)} aria-label="Filter by seat availability">{seatOptions.map((option) => <option key={option}>{option}</option>)}</select>
              </div>
              <div className="category-filters" role="group" aria-label="Filter subjects by category">
                {categories.map((category) => <button type="button" key={category} className={subjectCategory === category ? "is-active" : ""} onClick={() => setSubjectCategory(category)}>{category}</button>)}
              </div>
            </div>
            <div className="subject-table" role="table" aria-label="Current tuition batches">
              <div className="subject-row subject-header" role="row">
                <span>Subject</span><span>Grade / Batch</span><span>Schedule</span><span>Seats</span>
              </div>
              {visibleSubjects.map((item) => (
                <button className="subject-row subject-row-clickable" type="button" role="row" key={item.subject} onClick={() => setSelectedSubject(item)}>
                  <strong>{item.subject}</strong>
                  <span>{item.batch}</span>
                  <span>{item.schedule}</span>
                  <span><b className="seat-badge">{item.seats}</b></span>
                </button>
              ))}
              {!visibleSubjects.length && <div className="subject-empty">No classes match that search. Try another subject or category.</div>}
            </div>
            <p className="table-footnote">Not sure which batch fits? <a href="#contact">Talk to us <ArrowUpRight size={14} /></a></p>
          </div>
        </section>

        <section className="stats-section" id="results">
          <div className="page-width">
            <SectionHeading
              eyebrow="02 / The difference"
              title={<>Progress you can<br />feel in the room.</>}
              description="We measure success in better questions, steadier confidence, and results that follow."
            />
            <div className="stats-grid">
              {stats.map((stat) => <div className="stat-block" key={stat.value}><span>{stat.value}</span><p>{stat.label}</p></div>)}
            </div>
          </div>
        </section>

        <section className="content-section teachers-section" id="teachers">
          <div className="page-width">
            <SectionHeading
              eyebrow="03 / The people"
              title={<>Teachers who make<br />space for thinking.</>}
              description="No scripts, no shortcuts. Just experienced teachers who know when to lead — and when to listen."
            />
            <div className="teachers-grid">
              {siteData.teachers.map((teacher) => (
                <article className="teacher-card" key={teacher.name}>
                  <div className="teacher-photo"><img src={teacher.image} alt={`${teacher.name}, ${teacher.subject} teacher`} loading="eager" /></div>
                  <div className="teacher-info">
                    <div className="teacher-name-row"><h3>{teacher.name}</h3><ArrowUpRight size={18} /></div>
                    <p className="subject-tag">{teacher.subject}</p>
                    <p className="teacher-bio">{teacher.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="content-section gallery-section">
          <div className="page-width">
            <SectionHeading
              eyebrow="04 / The place"
              title="Inside the classroom."
              description="A bright, unhurried space where work is taken seriously — and curiosity is always welcome."
            />
            <div className="gallery-grid">
              {siteData.gallery.map((item, index) => <div className={`gallery-item ${item.layout === "wide" ? "gallery-wide" : ""} ${item.layout === "tall" ? "gallery-tall" : ""}`} key={`${item.image}-${index}`}><img src={item.image} alt={item.alt} loading="eager" /></div>)}
            </div>
          </div>
        </section>

        <section className="colleges-section" id="colleges-tech">
          <div className="page-width">
            <div className="section-heading">
              <p className="eyebrow eyebrow-orange">Where our students go</p>
              <h2>List of Colleges (Technical)</h2>
              <p className="section-description">
                A sample list of engineering and technical institutions our senior students have gone on to. Hover to pause.
              </p>
            </div>
          </div>
          <div className="college-marquee" aria-label="Technical Colleges marquee">
            <div className="college-track">
              {[...siteData.technicalColleges, ...siteData.technicalColleges].map((college, index) => (
                <article className="college-card" key={`${college.id}-${index}`}>
                  <div>
                    <span className="college-badge">{college.location}</span>
                    <h3 className="college-title">{college.name}</h3>
                    <p className="college-desc">{college.description}</p>
                  </div>
                  {college.link && (
                    <a className="college-link" href={college.link} target="_blank" rel="noopener noreferrer">
                      Visit website
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="colleges-section" id="colleges-nontech">
          <div className="page-width">
            <div className="section-heading">
              <p className="eyebrow eyebrow-orange">Where our students go</p>
              <h2>List of Colleges (Non-Technical)</h2>
              <p className="section-description">
                Arts, science and commerce institutions our students have been admitted to.
              </p>
            </div>
          </div>
          <div className="college-marquee" aria-label="Non-Technical Colleges marquee">
            <div className="college-track">
              {[...siteData.nonTechnicalColleges, ...siteData.nonTechnicalColleges].map((college, index) => (
                <article className="college-card" key={`${college.id}-${index}`}>
                  <div>
                    <span className="college-badge">{college.location}</span>
                    <h3 className="college-title">{college.name}</h3>
                    <p className="college-desc">{college.description}</p>
                  </div>
                  {college.link && (
                    <a className="college-link" href={college.link} target="_blank" rel="noopener noreferrer">
                      Visit website
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="testimonial-section">
          <div className="page-width testimonial-inner mx-auto mb-10">
            <p className="eyebrow">05 / A parent's note</p>
          </div>
          <div className="testimonial-marquee" aria-label="Parent testimonials">
            <div className="testimonial-track">
              {[...siteData.testimonials, ...siteData.testimonials].map((note, index) => <article className="marquee-note" key={`${note.id}-${index}`}><blockquote>"{note.quote}"</blockquote><p className="attribution">— {note.attribution}</p></article>)}
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="page-width contact-grid">
            <div>
              <p className="eyebrow eyebrow-light">06 / Come say hello</p>
              <h2>Let's find the<br /><em>right next step.</em></h2>
              <p className="contact-intro">Drop by for a conversation, a cup of chai, and a look around. No pressure, ever.</p>
            </div>
            <div className="contact-details">
              <a href="https://maps.google.com/?q=12th+Main+Indiranagar+Bengaluru" target="_blank" rel="noreferrer"><MapPin size={18} /><span>{siteData.contact.address.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</span></a>
              <a href={`tel:${siteData.contact.phone.replace(/\s/g, "")}`}><Phone size={18} /><span>{siteData.contact.phone}</span></a>
              <a href={`mailto:${siteData.contact.email}`}><Mail size={18} /><span>{siteData.contact.email}</span></a>
              <p><Clock3 size={18} /><span>{siteData.contact.hours}</span></p>
            </div>
            <a className="button button-ochre" href="mailto:hello@thestudyroom.in?subject=Book%20a%20demo">Book a demo <ArrowUpRight size={17} /></a>
          </div>
        </section>
      </main>

      {selectedSubject && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedSubject(null); }}><section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title"><button className="modal-close" type="button" onClick={() => setSelectedSubject(null)} aria-label="Close class details"><X size={19} /></button><p className="eyebrow">Class details</p><h2 id="booking-title">{selectedSubject.subject}</h2><p className="booking-lead">A small, focused room for students who want to understand the work — not just finish it.</p><div className="booking-facts"><div><span>Grade / batch</span><strong>{selectedSubject.batch}</strong></div><div><span>Schedule</span><strong>{selectedSubject.schedule}</strong></div><div><span>Availability</span><strong>{selectedSubject.seats}</strong></div></div><form className="booking-form" onSubmit={(event) => { event.preventDefault(); if (!bookingName || !bookingEmail) return toast.error("Please add your name and email"); toast.success("Thanks — we'll be in touch about this class."); setSelectedSubject(null); setBookingName(""); setBookingEmail(""); }}><p className="booking-form-title">Book a conversation about this class</p><input required value={bookingName} onChange={(event) => setBookingName(event.target.value)} placeholder="Parent or student name" aria-label="Parent or student name" /><input required type="email" value={bookingEmail} onChange={(event) => setBookingEmail(event.target.value)} placeholder="Email address" aria-label="Email address" /><button className="button button-primary" type="submit">Request a demo <ArrowUpRight size={16} /></button></form></section></div>}

      <footer className="site-footer">
        <div className="page-width footer-inner">
          <span>© 2026 Rasi Maths Tuition Centre</span>
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleLoginClick} className="text-inherit hover:underline">
              Student / Parent / Admin Portal
            </button>
            <a href="/site-admin" className="text-inherit hover:underline">
              Site Admin
            </a>
          </div>
          <span>Learning, thoughtfully.</span>
        </div>
      </footer>
    </div>
  );
}
