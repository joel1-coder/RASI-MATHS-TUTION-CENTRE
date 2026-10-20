export type CollegeItem = { id: string; name: string; location: string; description: string; link: string; category: "technical" | "non-technical"; tier: "Tier 1" | "Tier 2" | "Tier 3"; cutoff: string };
export type Subject = { id: string; subject: string; batch: string; schedule: string; seats: string };
export type Teacher = { id: string; name: string; subject: string; bio: string; image: string };
export type GalleryItem = { id: string; image: string; alt: string; layout: "wide" | "tall" | "standard" };
export type HeroStat = { id: string; value: string; label: string };
export type Testimonial = { id: string; quote: string; attribution: string };
export type Announcement = { id: string; title: string; description: string; date: string; target: string };
export type ContactDetails = { address: string; phone: string; email: string; hours: string };
export type StudyMaterial = {
  id: string;
  title: string;
  subject: string;
  section?: string;
  link: string;
  type: "paper" | "unit";
  targetClass?: string;
  date?: string;
  fileName?: string;
  fileSize?: string;
  term?: string;
  maxMarks?: string;
};
export type GovExam = { id: string; name: string; month: string; monthIndex: number; group: "Central Government" | "Tamil Nadu Government"; description: string; link?: string };
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
  technicalColleges: CollegeItem[];
  nonTechnicalColleges: CollegeItem[];
  govExams: GovExam[];
};

const imageBase = "https://images.unsplash.com";

export const defaultTechnicalColleges: CollegeItem[] = [
  {
    id: "tech-1",
    name: "Kalasalingam Academy of Research & Education",
    location: "Krishnankoil, Tamil Nadu",
    description: "Deemed university offering engineering, research and interdisciplinary programs.",
    link: "https://kalasalingam.ac.in",
    category: "technical",
    tier: "Tier 1",
    cutoff: "190 / 200",
  },
  {
    id: "tech-2",
    name: "Thiagarajar College of Engineering",
    location: "Madurai, Tamil Nadu",
    description: "Autonomous engineering institute offering B.E./B.Tech across core and emerging branches.",
    link: "https://tce.edu",
    category: "technical",
    tier: "Tier 1",
    cutoff: "195 / 200",
  },
  {
    id: "tech-3",
    name: "PSNA College of Engineering & Technology",
    location: "Dindigul, Tamil Nadu",
    description: "NAAC-accredited engineering college with strong placement support.",
    link: "https://psnaacet.edu.in",
    category: "technical",
    tier: "Tier 2",
    cutoff: "178 / 200",
  },
  {
    id: "tech-4",
    name: "Anna University, Regional Campus",
    location: "Madurai, Tamil Nadu",
    description: "Government engineering campus offering UG/PG programs affiliated to Anna University.",
    link: "https://autm.ac.in",
    category: "technical",
    tier: "Tier 1",
    cutoff: "192 / 200",
  },
  {
    id: "tech-5",
    name: "Mepco Schlenk Engineering College",
    location: "Sivakasi, Tamil Nadu",
    description: "Autonomous engineering college recognized for academic excellence and technical research.",
    link: "https://mepcoeng.ac.in",
    category: "technical",
    tier: "Tier 2",
    cutoff: "182 / 200",
  },
  {
    id: "tech-6",
    name: "Velammal College of Engineering & Technology",
    location: "Madurai, Tamil Nadu",
    description: "Top-ranked institution providing quality engineering education and skill development.",
    link: "https://vcet.ac.in",
    category: "technical",
    tier: "Tier 2",
    cutoff: "175 / 200",
  },
  {
    id: "tech-7",
    name: "Kamaraj College of Engineering & Technology",
    location: "Virudhunagar, Tamil Nadu",
    description: "Anna University affiliated college offering engineering programs with good placement records.",
    link: "https://kamarajengg.edu.in",
    category: "technical",
    tier: "Tier 3",
    cutoff: "160 / 200",
  },
  {
    id: "tech-8",
    name: "Sri Vidya College of Engineering & Technology",
    location: "Virudhunagar, Tamil Nadu",
    description: "Self-financing engineering college with diverse technical programs.",
    link: "https://www.srividya.ac.in",
    category: "technical",
    tier: "Tier 3",
    cutoff: "150 / 200",
  },
];

export const defaultNonTechnicalColleges: CollegeItem[] = [
  {
    id: "nontech-1",
    name: "Fatima College",
    location: "Madurai, Tamil Nadu",
    description: "Autonomous women's college with strong programs in commerce and sciences.",
    link: "https://fatimacollegemdu.org",
    category: "non-technical",
    tier: "Tier 1",
    cutoff: "90%",
  },
  {
    id: "nontech-2",
    name: "Lady Doak College",
    location: "Madurai, Tamil Nadu",
    description: "Autonomous women's college offering arts, science and management programs.",
    link: "https://ladydoakcollege.edu.in",
    category: "non-technical",
    tier: "Tier 1",
    cutoff: "88%",
  },
  {
    id: "nontech-3",
    name: "Sourashtra College",
    location: "Madurai, Tamil Nadu",
    description: "Grant-in-aid arts and science college affiliated to Madurai Kamaraj University.",
    link: "http://sourashtracollege.in",
    category: "non-technical",
    tier: "Tier 2",
    cutoff: "75%",
  },
  {
    id: "nontech-4",
    name: "American College",
    location: "Madurai, Tamil Nadu",
    description: "Autonomous arts and science college affiliated to Madurai Kamaraj University.",
    link: "https://americancollege.edu.in",
    category: "non-technical",
    tier: "Tier 2",
    cutoff: "78%",
  },
  {
    id: "nontech-5",
    name: "Madurai Kamaraj University",
    location: "Madurai, Tamil Nadu",
    description: "State public university offering comprehensive undergraduate, postgraduate, and research programs.",
    link: "https://mkuniversity.ac.in",
    category: "non-technical",
    tier: "Tier 1",
    cutoff: "85%",
  },
  {
    id: "nontech-6",
    name: "The Standard Fireworks Rajaratnam College for Women",
    location: "Sivakasi, Tamil Nadu",
    description: "Premier autonomous institution empowering women through arts, science, and computer applications.",
    link: "https://sfrcollege.edu.in",
    category: "non-technical",
    tier: "Tier 2",
    cutoff: "72%",
  },
  {
    id: "nontech-7",
    name: "Ayya Nadar Janaki Ammal College",
    location: "Sivakasi, Tamil Nadu",
    description: "Autonomous arts and science college affiliated to Madurai Kamaraj University.",
    link: "https://www.anjac.ac.in",
    category: "non-technical",
    tier: "Tier 3",
    cutoff: "60%",
  },
  {
    id: "nontech-8",
    name: "V.V. Vanniaperumal College for Women",
    location: "Virudhunagar, Tamil Nadu",
    description: "Aided women's college with arts and science programs.",
    link: "https://www.vvvcw.ac.in",
    category: "non-technical",
    tier: "Tier 3",
    cutoff: "55%",
  },
];

export const defaultGovExams: GovExam[] = [
  { id: "ge-jan-1", name: "SSC Stenographer Grade C & D", month: "January", monthIndex: 1, group: "Central Government", description: "Staff Selection Commission stenographer recruitment. (Eligible: 12th Pass; stenography skill required)", link: "https://ssc.gov.in" },
  { id: "ge-feb-1", name: "SSC CHSL (10+2)", month: "February", monthIndex: 2, group: "Central Government", description: "Combined Higher Secondary Level recruitment for LDC, JSA and DEO posts. (Eligible: 12th Pass; Science with Mathematics is required for specified DEO posts)", link: "https://ssc.gov.in" },
  { id: "ge-mar-1", name: "RRB NTPC (Undergraduate)", month: "March", monthIndex: 3, group: "Central Government", description: "Railway NTPC undergraduate posts including Commercial Cum Ticket Clerk and clerical posts. (Eligible: 12th Pass; some posts require 50% and/or typing)", link: "https://www.rrbcdg.gov.in" },
  { id: "ge-apr-1", name: "NDA / NA Exam I", month: "April", monthIndex: 4, group: "Central Government", description: "UPSC National Defence Academy and Naval Academy examination. (Eligible: 12th Pass; Physics, Chemistry and Mathematics are required for Air Force/Naval wings)", link: "https://upsc.gov.in" },
  { id: "ge-may-1", name: "Indian Coast Guard Navik (GD)", month: "May", monthIndex: 5, group: "Central Government", description: "Coast Guard Navik General Duty recruitment. (Eligible: 12th Pass with Physics and Mathematics)", link: "https://www.indiancoastguard.gov.in" },
  { id: "ge-jun-1", name: "Indian Air Force Agniveer Vayu", month: "June", monthIndex: 6, group: "Central Government", description: "Agnipath recruitment for Indian Air Force Agniveer Vayu. (Eligible: 12th Pass with the prescribed PCM/English subjects, or accepted equivalent route)", link: "https://agnipathvayu.cdac.in" },
  { id: "ge-jul-1", name: "Indian Navy Agniveer (SSR)", month: "July", monthIndex: 7, group: "Central Government", description: "Agnipath recruitment for Indian Navy Senior Secondary Recruit. (Eligible: 12th Pass with Mathematics and Physics)", link: "https://www.joinindiannavy.gov.in" },
  { id: "ge-sep-1", name: "NDA / NA Exam II", month: "September", monthIndex: 9, group: "Central Government", description: "UPSC National Defence Academy and Naval Academy examination, second session. (Eligible: 12th Pass; Physics, Chemistry and Mathematics are required for Air Force/Naval wings)", link: "https://upsc.gov.in" },
];

const higherSecondaryExamPattern = /12th|10\+2|higher secondary|senior secondary|intermediate/i;
const excludedExamPattern = /10th|sslc|matric|degree|bachelor|graduate|post[- ]?graduation|any degree/i;

export function onlyHigherSecondaryExams(exams: GovExam[]): GovExam[] {
  return exams.filter((exam) => {
    const details = `${exam.name} ${exam.description}`;
    return higherSecondaryExamPattern.test(details) && !excludedExamPattern.test(details);
  });
}

export const defaultSiteData: SiteData = {
  subjects: [
    { id: "math", subject: "Mathematics", batch: "Grades 8–10 · Foundation", schedule: "Mon / Wed · 4:30 PM", seats: "06 seats" },
    { id: "physics", subject: "Physics", batch: "Grades 11–12 · Boards", schedule: "Tue / Thu · 5:00 PM", seats: "03 seats" },
    { id: "english", subject: "English & Writing", batch: "Grades 6–8 · Core", schedule: "Sat · 10:00 AM", seats: "08 seats" },
    { id: "chemistry", subject: "Chemistry", batch: "Grades 11–12 · Boards", schedule: "Fri · 4:30 PM", seats: "02 seats" },
  ],
  teachers: [
    { id: "ramanan", name: "Mr. RAMANAN P S", subject: "Mathematics", bio: "18+ years of patient, structured teaching. Transforms abstract concepts into clear, repeatable methods that students carry with them long after the exam.", image: `${imageBase}/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=85` },
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
    { id: "location", value: "Panruti", label: "Tamil Nadu, India" },
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
    address: "QH83+RCM, 3rd Street, Police Line\nKamaraj Nagar, Panruti\nTamil Nadu 607106",
    phone: "+91 80 1234 5678",
    email: "rasimathstutioncentre@gmail.com",
    hours: "Mon–Sat · 9:00 AM–7:00 PM",
  },
  questionPapers: [
    { id: "qp-1", title: "Mathematics Mid-Term 2026", subject: "Mathematics", link: "", type: "paper" },
  ],
  unitQuestions: [
    { id: "uq-1", title: "Algebra and equations", subject: "Mathematics", link: "", type: "unit" },
  ],
  technicalColleges: defaultTechnicalColleges,
  nonTechnicalColleges: defaultNonTechnicalColleges,
  govExams: defaultGovExams,
};

const STORAGE_KEY = "study-room-site-data-v2";

export function readSiteData(): SiteData {
  if (typeof window === "undefined") return defaultSiteData;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem("study-room-site-data-v1");
    if (!saved) return defaultSiteData;
    const parsed = JSON.parse(saved) as Partial<SiteData>;
    let contact = parsed.contact || defaultSiteData.contact;
    if (!contact.address || contact.address.includes("Indiranagar") || contact.address.includes("Bengaluru")) {
      contact = { ...contact, address: defaultSiteData.contact.address };
    }
    return {
      ...defaultSiteData,
      ...parsed,
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : defaultSiteData.subjects,
      teachers: Array.isArray(parsed.teachers) ? parsed.teachers : defaultSiteData.teachers,
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : defaultSiteData.gallery,
      heroStats: Array.isArray(parsed.heroStats)
        ? parsed.heroStats.map(s => s.id === "location" && (s.value === "Indiranagar" || s.label.includes("Bengaluru"))
            ? { id: "location", value: "Panruti", label: "Tamil Nadu, India" }
            : s)
        : defaultSiteData.heroStats,
      testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : defaultSiteData.testimonials,
      announcements: Array.isArray(parsed.announcements) ? parsed.announcements : defaultSiteData.announcements,
      contact,
      questionPapers: Array.isArray(parsed.questionPapers) ? parsed.questionPapers : defaultSiteData.questionPapers,
      unitQuestions: Array.isArray(parsed.unitQuestions) ? parsed.unitQuestions : defaultSiteData.unitQuestions,
      technicalColleges: Array.isArray(parsed.technicalColleges) ? parsed.technicalColleges : defaultTechnicalColleges,
      nonTechnicalColleges: Array.isArray(parsed.nonTechnicalColleges) ? parsed.nonTechnicalColleges : defaultNonTechnicalColleges,
      govExams: onlyHigherSecondaryExams(Array.isArray(parsed.govExams) ? parsed.govExams : defaultGovExams),
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
