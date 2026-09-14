export type Subject = { id: string; subject: string; batch: string; schedule: string; seats: string };
export type Teacher = { id: string; name: string; subject: string; bio: string; image: string };
export type GalleryItem = { id: string; image: string; alt: string; layout: "wide" | "tall" | "standard" };
export type HeroStat = { id: string; value: string; label: string };
export type Testimonial = { id: string; quote: string; attribution: string };
export type Announcement = { id: string; title: string; description: string; date: string; target: string };
export type ContactDetails = { address: string; phone: string; email: string; hours: string };
export type StudyMaterial = { id: string; title: string; subject: string; link: string; type: "paper" | "unit" };
export type SiteData = {
  subjects: Subject[];
  teachers: Teacher[];
  gallery: GalleryItem[];
  heroStats: HeroStat[];
  testimonials: Testimonial[];
  announcements: Announcement[];
  contact: ContactDetails;
  questionPapers: StudyMaterial[];
  unitQuestions: StudyMaterial[];
};

const imageBase = "https://images.unsplash.com";

export const defaultSiteData: SiteData = {
  subjects: [
    { id: "math", subject: "Mathematics", batch: "Grades 8–10 · Foundation", schedule: "Mon / Wed · 4:30 PM", seats: "06 seats" },
    { id: "physics", subject: "Physics", batch: "Grades 11–12 · Boards", schedule: "Tue / Thu · 5:00 PM", seats: "03 seats" },
    { id: "english", subject: "English & Writing", batch: "Grades 6–8 · Core", schedule: "Sat · 10:00 AM", seats: "08 seats" },
    { id: "chemistry", subject: "Chemistry", batch: "Grades 11–12 · Boards", schedule: "Fri · 4:30 PM", seats: "02 seats" },
  ],
  teachers: [
    { id: "aarav", name: "Aarav Menon", subject: "Mathematics", bio: "Turns difficult concepts into calm, repeatable ways of thinking — one good question at a time.", image: `${imageBase}/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=85` },
    { id: "nisha", name: "Nisha Kapoor", subject: "Physics", bio: "A patient problem-solver who connects every formula to the world students can already see around them.", image: `${imageBase}/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85` },
    { id: "kabir", name: "Kabir Shah", subject: "English & Writing", bio: "Helps young writers find a clear voice, a sharper argument, and the confidence to share both.", image: `${imageBase}/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85` },
  ],
  gallery: [
    { id: "gallery-1", image: `${imageBase}/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=85`, alt: "Students learning together in a bright classroom", layout: "wide" },
    { id: "gallery-2", image: `${imageBase}/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=85`, alt: "Students collaborating around a classroom table", layout: "tall" },
    { id: "gallery-3", image: `${imageBase}/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=85`, alt: "Open notebook and study materials on a desk", layout: "standard" },
    { id: "gallery-4", image: `${imageBase}/photo-1588072432836-e10032774350?auto=format&fit=crop&w=900&q=85`, alt: "A teacher guiding students during a lesson", layout: "standard" },
    { id: "gallery-5", image: `${imageBase}/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=85`, alt: "Students sharing ideas after class", layout: "wide" },
    { id: "gallery-6", image: `${imageBase}/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=85`, alt: "Classroom notes and a discussion in progress", layout: "standard" },
  ],
  heroStats: [
    { id: "batches", value: "12", label: "Batches running" },
    { id: "students", value: "180+", label: "Students learning" },
    { id: "years", value: "18 yrs", label: "Teaching together" },
    { id: "location", value: "Indiranagar", label: "Bengaluru, India" },
  ],
  testimonials: [
    { id: "meera", quote: "The biggest change wasn't just in my daughter's marks. She started bringing her questions home — and wanting to talk about them.", attribution: "Meera S., parent of Ananya · Grade 10" },
    { id: "rahul", quote: "The teachers make difficult work feel possible. Our son now studies with curiosity instead of fear.", attribution: "Rahul K., parent of Arjun · Grade 8" },
    { id: "sahana", quote: "We noticed the confidence first, then the marks followed. The communication from the centre is wonderful.", attribution: "Sahana R., parent of Diya · Grade 11" },
  ],
  announcements: [
    { id: "open-batches", title: "New batches are open", description: "Book a free conversation for the 2026 term.", date: "2026-06-01", target: "All families" },
  ],
  contact: {
    address: "24, 12th Main\nIndiranagar, Bengaluru",
    phone: "+91 80 1234 5678",
    email: "hello@thestudyroom.in",
    hours: "Mon–Sat · 9:00 AM–7:00 PM",
  },
  questionPapers: [
    { id: "qp-1", title: "Mathematics Mid-Term 2026", subject: "Mathematics", link: "", type: "paper" },
  ],
  unitQuestions: [
    { id: "uq-1", title: "Algebra and equations", subject: "Mathematics", link: "", type: "unit" },
  ],
};

const STORAGE_KEY = "study-room-site-data-v2";

export function readSiteData(): SiteData {
  if (typeof window === "undefined") return defaultSiteData;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem("study-room-site-data-v1");
    if (!saved) return defaultSiteData;
    const parsed = JSON.parse(saved) as Partial<SiteData>;
    return {
      ...defaultSiteData,
      ...parsed,
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : defaultSiteData.subjects,
      teachers: Array.isArray(parsed.teachers) ? parsed.teachers : defaultSiteData.teachers,
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : defaultSiteData.gallery,
      heroStats: Array.isArray(parsed.heroStats) ? parsed.heroStats : defaultSiteData.heroStats,
      testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : defaultSiteData.testimonials,
      announcements: Array.isArray(parsed.announcements) ? parsed.announcements : defaultSiteData.announcements,
      contact: parsed.contact || defaultSiteData.contact,
      questionPapers: Array.isArray(parsed.questionPapers) ? parsed.questionPapers : defaultSiteData.questionPapers,
      unitQuestions: Array.isArray(parsed.unitQuestions) ? parsed.unitQuestions : defaultSiteData.unitQuestions,
    };
  } catch {
    return defaultSiteData;
  }
}

export function saveSiteData(data: SiteData) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export function resetSiteData() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem("study-room-site-data-v1");
  }
}
