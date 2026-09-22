import { useEffect, useMemo, useState } from "react";
import Portfolio from "./Portfolio";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, ArrowRight, ArrowUpRight, BarChart3, BookOpen, Building2, CalendarDays, Check, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, Download, Edit3, FileSpreadsheet, FileText, Filter, FolderPlus, GraduationCap, LayoutDashboard, Loader2, LogOut, Menu, MessageCircle, NotebookPen, Plus, Search, ShieldCheck, Sparkles, Trash2, Upload, UserPlus, Users, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { parseAttendanceCsv, summarizeAttendance } from "@shared/portalData";
import { COOKIE_NAME } from "@shared/const";
import { readSiteData } from "@/lib/siteData";

export type Role = "student" | "parent" | "admin" | "teacher";

export type User = {
  role: Role;
  name: string;
  email: string;
  password?: string;
};

export const demoUsers: Record<string, User & { password: string }> = {
  "student@portal.com": { role: "student", name: "Ananya Sharma", email: "student@portal.com", password: "student123" },
  "teacher@portal.com": { role: "teacher", name: "Prof. Aarav Menon", email: "teacher@portal.com", password: "teacher123" },
  "parent@portal.com":  { role: "parent",  name: "Ramesh Sharma",  email: "parent@portal.com",  password: "parent123"  },
  "admin@portal.com":   { role: "admin",   name: "Centre Admin",  email: "admin@portal.com",   password: "admin123"   },
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#e8dff0] bg-[#f5f0fb] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d4b9f]">
      {children}
    </span>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-12 text-sm text-[#8d8197]">
      <Loader2 className="animate-spin text-[#6d4b9f]" size={18} />
      {label}
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#d8cee6] bg-[#faf7fc] p-10 text-center">
      <p className="text-sm font-semibold text-[#4d4060]">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[#8d8197]">{message}</p>
    </div>
  );
}

function Logo() {
  return (
    <a href="/" className="flex items-center gap-3 text-[#251f37]" aria-label="Rasi Maths home">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2f315d] text-xs font-bold tracking-[0.12em] text-white shadow-[0_8px_0_#e9b08f]">
        RM
      </span>
      <span className="leading-tight">
        <strong className="block text-sm font-bold tracking-[-0.02em]">Rasi Maths</strong>
        <small className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#90859b]">Tuition centre</small>
      </span>
    </a>
  );
}

export type SubjectRecord = {
  id: number;
  name: string;
  code: string;
  summary: string;
  paperLabel: string;
  durationMinutes: number;
  questionCount: number;
  accentColor: string;
  isFeatured: number;
  sortOrder: number;
};

const navItems = (role: Role) => role === "admin" ? ["Overview", "Students", "Attendance", "Marks", "Materials", "Announcements"] : role === "teacher" ? ["Home", "Attendance Records", "Marks Portal", "Mark Record"] : role === "student" ? ["Overview", "Attendance", "Mark statement", "Timetable", "Study materials", "Projects"] : ["Overview", "Attendance", "Performance", "Projects", "Announcements", "Career guidance"];

function RoleChooser({ onChoose, onClose }: { onChoose: (role: Role) => void; onClose: () => void }) {
  const roles: { role: Role; title: string; description: string; icon: React.ReactNode }[] = [
    { role: "student", title: "Student login", description: "View your learning plan, attendance, marks and materials.", icon: <GraduationCap size={22} /> },
    { role: "teacher", title: "Teacher login", description: "Take batch attendance, enter test marks and check mark records.", icon: <ClipboardCheck size={22} /> },
    { role: "parent", title: "Parent login", description: "Follow your child’s progress, projects and guidance updates.", icon: <Users size={22} /> },
    { role: "admin", title: "Admin login", description: "Manage students, marks, attendance and centre updates.", icon: <ShieldCheck size={22} /> },
  ];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#21193a]/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-[28px] bg-[#fffdfb] p-7 shadow-2xl">
        <button onClick={onClose} className="absolute right-5 top-5 rounded-full p-2 text-[#897c99] hover:bg-[#f2edf7]">
          <X size={18} />
        </button>
        <div className="mb-7">
          <Pill>Rasi Maths portal</Pill>
          <h2 className="mt-4 text-3xl font-semibold text-[#241b3d]">Choose your login.</h2>
          <p className="mt-2 text-sm text-[#81758e]">Each view keeps the right information in the right hands.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {roles.map(item => (
            <button
              key={item.role}
              onClick={() => onChoose(item.role)}
              className="group flex flex-col justify-between rounded-2xl border border-[#e8deeb] bg-[#faf7fc] p-5 text-left transition hover:-translate-y-1 hover:border-[#b99cda] hover:bg-[#f4edf9]"
            >
              <div>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e9ddf4] text-[#6d4b9f]">
                  {item.icon}
                </span>
                <h3 className="mt-5 font-semibold text-[#34244d]">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#82758e]">{item.description}</p>
              </div>
              <span className="mt-5 block text-xs font-semibold text-[#6d4b9f]">
                Continue <ArrowRight className="ml-1 inline transition group-hover:translate-x-1" size={13} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleLoginPage({ role, onLogin, onBack }: { role: Role; onLogin: (user: User) => void; onBack: () => void }) {
  const account = Object.values(demoUsers).find(user => user.role === role)!;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation();

  const config = role === "student"
    ? { label: "Student portal", title: "Your learning, in one place.", accent: "See your next step clearly — from attendance to mark statements and study materials." }
    : role === "teacher"
    ? { label: "Teacher portal", title: "Classroom & evaluation hub.", accent: "Take daily LAB attendance with roll chips, enter student test marks, and review performance records." }
    : role === "parent"
    ? { label: "Parent portal", title: "Stay close to the progress.", accent: "A calm, private view of your child’s attendance, performance, projects and future options." }
    : { label: "Admin portal", title: "Run the centre with clarity.", accent: "Manage the people, records and updates that keep every learning journey moving." };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await loginMutation.mutateAsync({ email, password, role });
      if (res.token) {
        try {
          sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${res.token}`);
        } catch {}
      }
      try {
        sessionStorage.setItem("demo-user-email", res.user.email!);
      } catch {}
      await utils.auth.me.invalidate();
      onLogin({
        role: res.user.role as Role,
        name: res.user.name,
        email: res.user.email!,
      });
    } catch (err: any) {
      setError(err?.message || "Invalid email or password. Access denied.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0f8] text-[#271f3c]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-8 md:grid-cols-[.9fr_1.1fr] md:px-10">
        <div className="hidden md:block">
          <Logo />
          <div className="mt-20 max-w-md">
            <Pill>{config.label}</Pill>
            <h1 className="mt-6 text-6xl font-semibold leading-[1.02] tracking-[-0.06em]">
              {config.title.split(", ")[0]}<br />
              <em className="font-serif font-normal text-[#7455b2]">{config.title.includes(", ") ? config.title.split(", ")[1] : ""}</em>
            </h1>
            <p className="mt-6 text-base leading-7 text-[#766a88]">{config.accent}</p>
            <div className="mt-10 flex items-center gap-3 text-xs text-[#877b91]">
              <ShieldCheck size={16} className="text-[#ef8656]" /> Your role controls what you can view and manage.
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-md">
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#6d4b9f]">
            <ArrowRight className="rotate-180" size={14} /> Choose another login
          </button>
          <div className="rounded-[28px] bg-[#fffdfb] p-7 shadow-xl shadow-[#b7a6c8]/20">
            <div className="md:hidden">
              <Logo />
              <div className="mt-7" />
            </div>
            <Pill>{config.label}</Pill>
            <h2 className="mt-4 text-3xl font-semibold text-[#241b3d]">Sign in securely.</h2>
            <p className="mt-2 text-sm text-[#81758e]">Use your {role} account to continue.</p>
            <div className="mt-3"></div>
            <form onSubmit={submit} className="mt-7 space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#776c88]">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={account.email}
                  className="mt-2 w-full rounded-2xl border border-[#e6deeb] bg-white px-4 py-3 text-sm outline-none focus:border-[#8c68cf]"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#776c88]">
                Password
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-2xl border border-[#e6deeb] bg-white px-4 py-3 text-sm outline-none focus:border-[#8c68cf]"
                />
              </label>
              {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}
              <button
                disabled={loginMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5b3b92] py-3.5 text-sm font-semibold text-white transition hover:bg-[#482c7c] disabled:opacity-60"
              >
                {loginMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : null}
                Sign in to {role} portal <ArrowRight size={16} />
              </button>
            </form>
            <div className="mt-6 rounded-2xl bg-[#f7f2fb] p-4 text-xs text-[#746785]">
              <p className="mb-2 font-semibold text-[#44325f]">Authorized {role} credentials</p>
              <p>ID: {account.email}</p>
              <p>Password: {account.password}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function MarkStatements({ parent = false, studentEmail }: { parent?: boolean; studentEmail?: string }) {
  const now = new Date();
  const [view, setView] = useState<"cards" | "weekly" | "monthly">("cards");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const marksInput = useMemo(() => ({ studentEmail: studentEmail ?? "student@portal.com", assessmentType: view === "weekly" ? "weekly" as const : view === "monthly" ? "monthly" as const : undefined }), [studentEmail, view]);
  const marksQuery = trpc.student.marks.useQuery(marksInput, { enabled: Boolean(studentEmail), retry: false });
  const databaseMarks = marksQuery.data ?? [];
  const weeklyMarks = databaseMarks.filter(mark => mark.assessmentType === "weekly").map(mark => [mark.periodLabel, mark.subject, `${mark.score} / ${mark.maxScore}`, `${Math.round((mark.score / mark.maxScore) * 100)}%`]);
  const monthlyMarks = databaseMarks.filter(mark => mark.assessmentType === "monthly").map(mark => [mark.periodLabel, `${Math.round((mark.score / mark.maxScore) * 100)}%`]);
  useEffect(() => {
    if (view === "cards") return;
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 220);
    return () => window.clearTimeout(timer);
  }, [view, month, year]);
  if (view === "cards") return <div><div className="mb-6"><p className="text-sm text-[#81758e]">Choose an assessment to open its detailed mark statement.</p></div><div className="grid gap-4 md:grid-cols-2">{(["WEEKLY TEST", "MONTHLY TEST"] as const).map(test => <button key={test} onClick={() => setView(test === "WEEKLY TEST" ? "weekly" : "monthly")} className="group rounded-3xl border border-[#eee6f0] bg-white p-7 text-left transition hover:-translate-y-1 hover:border-[#b99cda] hover:bg-[#faf7fc]"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e9ddf4] text-[#6d4b9f]"><BarChart3 size={24} /></span><p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">Assessment card</p><h2 className="mt-2 text-2xl font-semibold">{test}</h2><p className="mt-2 text-sm leading-6 text-[#887c91]">Open the {test.toLowerCase()} marks and filter results by time period.</p><span className="mt-6 block text-xs font-semibold text-[#6d4b9f]">View mark statement <ArrowRight className="ml-1 inline transition group-hover:translate-x-1" size={13} /></span></button>)}</div></div>;
  if (isLoading || marksQuery.isLoading) return <LoadingState label="Loading mark statements…" />;
  if (!databaseMarks.length || year > now.getFullYear()) return <div><button onClick={() => setView("cards")} className="mb-5 text-xs font-semibold text-[#6d4b9f]">← Back to assessment cards</button><EmptyState title="No marks published yet" message={`There are no ${view === "weekly" ? "weekly" : "monthly"} marks available for ${year}. Ask Admin to publish results for this student.`} /></div>;
  return <div><div className="mb-5 flex flex-col justify-between gap-4 rounded-3xl border border-[#eee6f0] bg-white p-5 md:flex-row md:items-end"><div><button onClick={() => setView("cards")} className="text-xs font-semibold text-[#6d4b9f]">← Back to assessment cards</button><p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">{view === "weekly" ? "Weekly test marks" : "Monthly test marks"}</p><h2 className="mt-2 text-2xl font-semibold">{view === "weekly" ? `Week-wise results · ${monthNames[month]} ${year}` : `Month-wise results · ${year}`}</h2></div><div className="flex flex-wrap gap-2"><select value={month} onChange={e => setMonth(Number(e.target.value))} className="rounded-xl border border-[#e6deeb] bg-[#faf7fc] px-3 py-2 text-xs font-semibold text-[#5d506c] outline-none"><option value={-1}>All months</option>{monthNames.map((name, i) => <option value={i} key={name}>{name}</option>)}</select><select value={year} onChange={e => setYear(Number(e.target.value))} className="rounded-xl border border-[#e6deeb] bg-[#faf7fc] px-3 py-2 text-xs font-semibold text-[#5d506c] outline-none">{[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option value={y} key={y}>{y}</option>)}</select></div></div>{view === "weekly" ? <div className="space-y-3">{weeklyMarks.map(row => <div className="flex items-center justify-between rounded-2xl border border-[#eee6f0] bg-white p-4" key={row[0]}><div><p className="text-sm font-semibold">{row[0]} · {row[1]}</p><p className="mt-1 text-xs text-[#8d8197]">{parent ? "Shared with linked parent account" : "Teacher feedback available"}</p></div><div className="text-right"><p className="text-lg font-semibold text-[#5b3b92]">{row[2]}</p><p className="text-xs font-semibold text-[#ef8656]">{row[3]}</p></div></div>)}</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{monthlyMarks.map(row => <div className={`rounded-2xl border p-4 ${row[0] === monthNames[month] ? "border-[#b99cda] bg-[#f3ecf9]" : "border-[#eee6f0] bg-white"}`} key={row[0]}><p className="text-sm font-semibold">{row[0]} {year}</p><p className="mt-4 text-2xl font-semibold text-[#5b3b92]">{row[1]}</p><p className="mt-1 text-xs text-[#8d8197]">{row[1] === "Upcoming" ? "Not published yet" : "Monthly test average"}</p></div>)}</div>}<p className="mt-5 text-xs text-[#8d8197]">The month defaults to the current month and the year defaults to the current year automatically.</p></div>;
}

function MaterialsView({ type, targetClass }: { type: "paper" | "unit"; targetClass: string }) {
  const dbPapersQuery = trpc.materials.questionPapers.useQuery({});
  const dbUnitsQuery = trpc.materials.unitQuestions.useQuery({});

  const isPaper = type === "paper";
  const dbData = isPaper ? dbPapersQuery.data : dbUnitsQuery.data;
  const isLoading = isPaper ? dbPapersQuery.isLoading : dbUnitsQuery.isLoading;

  if (isLoading) return <LoadingState label={`Loading ${isPaper ? "question papers" : "unit questions"}…`} />;

  if (dbData && dbData.length > 0) {
    const list = dbData.filter(item => item.targetClass === targetClass || item.targetClass === "All classes" || !item.targetClass);
    if (!list.length) return <EmptyState title="No materials for your class" message={`No ${isPaper ? "question papers" : "unit questions"} have been sent to ${targetClass} yet.`} />;

    const grouped = list.reduce((acc, item) => {
      if (!acc[item.subject]) acc[item.subject] = [];
      acc[item.subject].push(item);
      return acc;
    }, {} as Record<string, typeof list>);

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(grouped).map(([subject, items]) => (
          <div className="rounded-3xl border border-[#eee6f0] bg-white p-6" key={subject}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">{subject}</p>
                <h2 className="mt-2 text-xl font-semibold">{isPaper ? "Question papers" : "Unit questions"}</h2>
              </div>
              <BookOpen className="text-[#8060ac]" size={20} />
            </div>
            <div className="mt-5 space-y-3">
              {items.map((item, i) => (
                <a
                  href={item.link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl bg-[#faf7fc] p-4 transition hover:bg-[#f3ecf9]"
                  key={item.id}
                >
                  <span className="text-xs font-bold text-[#ef8656]">0{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-5 text-[#5d506c] hover:text-[#6d4b9f]">{item.title}</p>
                    <span className="text-[10px] font-bold text-[#3c8e83] bg-[#e9f5ed] px-2 py-0.5 rounded-full inline-block mt-1">Target: {item.targetClass}</span>
                  </div>
                  <ArrowUpRight size={14} className="ml-auto text-[#aaa0b1]" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback to localStorage siteData
  const data = readSiteData();
  const list = isPaper ? data.questionPapers : data.unitQuestions;
  if (!list || !list.length) return <EmptyState title="No materials available" message={`There are no ${isPaper ? "question papers" : "unit questions"} available yet.`} />;

  const grouped = list.reduce((acc, item) => {
    if (!acc[item.subject]) acc[item.subject] = [];
    acc[item.subject].push(item);
    return acc;
  }, {} as Record<string, typeof list>);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Object.entries(grouped).map(([subject, items]) => (
        <div className="rounded-3xl border border-[#eee6f0] bg-white p-6" key={subject}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">{subject}</p>
              <h2 className="mt-2 text-xl font-semibold">{isPaper ? "Question papers" : "Unit questions"}</h2>
            </div>
            <BookOpen className="text-[#8060ac]" size={20} />
          </div>
          <div className="mt-5 space-y-3">
            {items.map((item, i) => (
              <a
                href={item.link || "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl bg-[#faf7fc] p-4 transition hover:bg-[#f3ecf9]"
                key={item.id}
              >
                <span className="text-xs font-bold text-[#ef8656]">0{i + 1}</span>
                <span className="text-sm font-semibold leading-5 text-[#5d506c] hover:text-[#6d4b9f]">{item.title}</span>
                <ArrowUpRight size={14} className="ml-auto text-[#aaa0b1]" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const studentNav = ["Overview", "Attendance", "Mark statement", "Schedule", "Timetable", "Question paper", "Unit question", "Projects"];

function StudentWorkspace({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [active, setActive] = useState("Overview");
  const [showHelp, setShowHelp] = useState(true);
  const [selectedTest, setSelectedTest] = useState<"Weekly test" | "Monthly test" | null>(null);
  const [selectedDate, setSelectedDate] = useState(12);
  const attendanceQuery = trpc.student.attendance.useQuery({ studentEmail: user.email });
  const scheduleQuery = trpc.student.schedule.useQuery({ studentEmail: user.email });
  const projectsQuery = trpc.student.projects.useQuery({ studentEmail: user.email });
  const liveAttendance = attendanceQuery.data ?? [];
  const liveSchedule = scheduleQuery.data ?? [];
  const scheduleByDate = Object.fromEntries(liveSchedule.map(session => [Number(session.sessionDate.slice(-2)), `${session.subject} · ${session.exercise}`]));
  const attendance = ["Present", "Present", "Late", "Present", "Absent", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Absent"];
  const sessions: Record<number, string> = { 3: "Mathematics · Algebra practice", 7: "Physics · Motion and forces", 12: "Mathematics · Weekly problem set", 18: "English · Essay planning", 24: "Physics · Revision workshop" };
  const tests = { "Weekly test": [["Mathematics", "18 / 20", "90%"], ["Physics", "16 / 20", "80%"], ["English", "17 / 20", "85%"]], "Monthly test": [["Mathematics", "86 / 100", "86%"], ["Physics", "82 / 100", "82%"], ["English", "88 / 100", "88%"]] };
  const pageIntro: Record<string, string> = { Overview: "Your learning space for the week ahead.", Attendance: "A daily view of your attendance and learning rhythm.", "Mark statement": "Open a test card to review subject-wise performance.", Schedule: "Choose a date to see the exercise planned for that session.", Timetable: "Your current weekly class timetable.", "Question paper": "Download and review question papers sent by Admin to your class.", "Important Question papers": "Download and review question papers sent by Admin.", "Unit question": "Teacher-curated unit questions sent by Admin to your class.", "Important questions (Unit wise)": "Teacher-curated questions to strengthen your revision.", Projects: "Projects assigned by your teachers, with due dates and progress." };
  const renderPage = () => {
    if (active === "Attendance") {
      if (attendanceQuery.isLoading) return <LoadingState label="Loading daily attendance…" />;
      if (!liveAttendance.length) return <EmptyState title="No attendance has been published" message="When Admin records attendance for this student, the daily calendar and summary will appear here." />;
      const { present, late, absent, percentage } = summarizeAttendance(liveAttendance);
      return <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-3xl border border-[#eee6f0] bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">Daily attendance</p><h2 className="mt-2 text-2xl font-semibold">Admin-updated record</h2></div><span className="rounded-full bg-[#e9f5ed] px-3 py-1 text-xs font-semibold text-[#44835b]">{percentage}% present</span></div><div className="mt-7 space-y-3">{liveAttendance.slice().sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate)).map(record => <div className="flex items-center justify-between rounded-2xl bg-[#faf7fc] p-4" key={record.id}><span className="text-sm font-semibold">{record.attendanceDate}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.status === "present" ? "bg-[#e9f5ed] text-[#44835b]" : record.status === "late" ? "bg-[#fff0e7] text-[#c36b42]" : "bg-[#fbe8eb] text-[#c25b68]"}`}>{record.status}</span></div>)}</div></div><div className="rounded-3xl bg-[#5b3b92] p-6 text-white"><ClipboardCheck className="text-[#f6ae8a]" size={20} /><p className="mt-8 text-5xl font-semibold">{present}<span className="text-2xl text-white/50"> / {liveAttendance.length}</span></p><p className="mt-2 text-sm text-white/65">present · {late} late · {absent} absent</p><div className="mt-8 border-t border-white/15 pt-5 text-sm text-white/75">This record is synced from the Admin dashboard.</div></div></div>;
    }
    if (active === "Mark statement") return <MarkStatements studentEmail={user.email} />;
    if (active === "Schedule") {
      if (scheduleQuery.isLoading) return <LoadingState label="Loading scheduled exercises…" />;
      if (!liveSchedule.length) return <EmptyState title="No sessions scheduled yet" message="Admin can add a session date and exercise from the Admin dashboard. Your calendar will update automatically." />;
      const selectedSession = liveSchedule.find(session => Number(session.sessionDate.slice(-2)) === selectedDate);
      return <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="rounded-3xl border border-[#eee6f0] bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">Live session scheduling</p><h2 className="mt-2 text-2xl font-semibold">September 2026</h2></div><CalendarDays className="text-[#6d4b9f]" /></div><div className="mt-7 grid grid-cols-7 gap-2 text-center"><div className="col-span-7 grid grid-cols-7 text-[10px] font-bold uppercase tracking-[0.12em] text-[#aaa0b1]">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>{Array.from({ length: 30 }, (_, i) => <button key={i} onClick={() => setSelectedDate(i + 1)} className={`grid h-11 place-items-center rounded-xl text-sm transition ${selectedDate === i + 1 ? "bg-[#5b3b92] font-semibold text-white" : scheduleByDate[i + 1] ? "bg-[#f3ecf9] font-semibold text-[#6d4b9f]" : "text-[#81758e] hover:bg-[#faf7fc]"}`}>{i + 1}</button>)}</div><p className="mt-5 text-xs text-[#8d8197]">Purple dates have an exercise scheduled by Admin.</p></div><div className="rounded-3xl bg-[#f4e9dd] p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c36b42]">Selected date</p><h2 className="mt-3 text-3xl font-semibold">September {selectedDate}</h2><div className="mt-8 rounded-2xl bg-white/70 p-4">{selectedSession ? <><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a7633e]">Scheduled exercise</p><p className="mt-3 text-lg font-semibold text-[#4a3041]">{selectedSession.subject}</p><p className="mt-2 text-sm leading-6 text-[#887477]">{selectedSession.exercise}</p><p className="mt-3 text-xs font-semibold text-[#a7633e]">{selectedSession.sessionTime || "Time to be confirmed"}</p></> : <><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a7633e]">No session for this date</p><p className="mt-3 text-sm leading-6 text-[#887477]">Select a purple date or ask Admin to schedule an exercise.</p></>}</div></div></div>;
    }
    if (active === "Timetable") return <div className="rounded-3xl border border-[#eee6f0] bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">Weekly schedule</p><h2 className="mt-2 text-2xl font-semibold">Your timetable</h2></div><Pill>Updated by admin</Pill></div><div className="mt-7 overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="border-b border-[#eee6f0] text-[10px] uppercase tracking-[0.15em] text-[#a196aa]"><tr><th className="pb-3">Day</th><th className="pb-3">Time</th><th className="pb-3">Subject</th><th className="pb-3">Teacher</th><th className="pb-3">Room</th></tr></thead><tbody>{[["Monday", "4:30 PM", "Mathematics", "Aarav Menon", "Room 2"], ["Tuesday", "5:00 PM", "Physics", "Nisha Kapoor", "Room 1"], ["Wednesday", "4:30 PM", "Mathematics", "Aarav Menon", "Room 2"], ["Friday", "4:30 PM", "Chemistry", "Nisha Kapoor", "Lab 1"], ["Saturday", "10:00 AM", "English & Writing", "Kabir Shah", "Studio"]].map(row => <tr key={row[0]} className="border-b border-[#f1ebf2] last:border-0"><td className="py-4 text-sm font-semibold">{row[0]}</td><td className="py-4 text-sm text-[#6d4b9f]">{row[1]}</td><td className="py-4 text-sm">{row[2]}</td><td className="py-4 text-xs text-[#887c91]">{row[3]}</td><td className="py-4 text-xs text-[#887c91]">{row[4]}</td></tr>)}</tbody></table></div></div>;
    if (active === "Question paper" || active === "Important Question papers") {
      return <MaterialsView type="paper" targetClass="Grade 10" />;
    }
    if (active === "Unit question" || active === "Important questions (Unit wise)") {
      return <MaterialsView type="unit" targetClass="Grade 10" />;
    }
    if (active === "Projects") {
      if (projectsQuery.isLoading) return <LoadingState label="Loading assigned projects…" />;
      const projects = projectsQuery.data ?? [];
      if (!projects.length) return <EmptyState title="No projects assigned yet" message="Admin-assigned projects will appear here with subject, due date, status, and progress." />;
      return <div className="grid gap-4 md:grid-cols-2">{projects.map(project => <div className="rounded-3xl border border-[#eee6f0] bg-white p-6" key={project.id}><div className="flex items-start justify-between"><span className="rounded-full bg-[#f4e9dd] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c36b42]">{project.subject}</span><NotebookPen className="text-[#8060ac]" size={20} /></div><h2 className="mt-6 text-xl font-semibold">{project.title}</h2><p className="mt-2 text-sm text-[#887c91]">Assigned project · Due {project.dueDate}</p><div className="mt-6 flex items-center justify-between text-xs"><span className="font-semibold text-[#6d4b9f]">{project.status}</span><span className="text-[#887c91]">{project.progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee7f3]"><div className="h-full rounded-full bg-[#7c5ab1]" style={{ width: `${project.progress}%` }} /></div></div>)}</div>;
    }

    return <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["92%", "Attendance", ClipboardCheck], ["86%", "Average score", BarChart3], ["04", "Upcoming sessions", CalendarDays], ["03", "Open projects", NotebookPen]].map(([value, label, Icon]) => <div key={label as string} className="rounded-3xl border border-[#eee6f0] bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-3xl font-semibold text-[#5b3b92]">{value as string}</p><span className="rounded-xl bg-[#f4edf9] p-2 text-[#8060ac]"><Icon size={17} /></span></div><p className="mt-6 text-xs text-[#877b91]">{label as string}</p></div>)}</div><div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><div className="rounded-3xl border border-[#eee6f0] bg-white p-6"><div className="flex items-center justify-between"><h2 className="font-semibold">Today’s learning plan</h2><button onClick={() => setActive("Schedule")} className="text-xs font-semibold text-[#6d4b9f]">Open calendar <ChevronRight className="inline" size={14} /></button></div><div className="mt-6 space-y-4">{[["Mathematics", "Weekly problem set · Due today", "On track"], ["Physics", "Next class · Tuesday, 5:00 PM", "Upcoming"], ["Build a bridge", "Project due 18 October", "In progress"]].map(row => <div className="flex items-center justify-between rounded-2xl bg-[#faf7fc] p-4" key={row[0]}><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9ddf4] text-[#6e4b9e]"><Check size={16} /></span><div><p className="text-sm font-semibold">{row[0]}</p><p className="mt-1 text-xs text-[#8d8197]">{row[1]}</p></div></div><span className="text-[11px] font-semibold text-[#ef8656]">{row[2]}</span></div>)}</div></div><div className="rounded-3xl bg-[#5b3b92] p-6 text-white"><Sparkles className="text-[#f8b08b]" size={20} /><h2 className="mt-8 text-2xl font-semibold">Small steps,<br /><em className="font-serif font-normal">strong habits.</em></h2><p className="mt-4 text-sm leading-6 text-white/65">Keep showing up for the next question.</p><button onClick={() => setActive("Mark statement")} className="mt-8 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-[#5b3b92]">Review marks <ArrowRight className="ml-1 inline" size={13} /></button></div></div></>;
  };
  return <div className="min-h-screen bg-[#f6f2f8] text-[#2a203e]"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#ebe3ef] bg-[#fffdfb] p-6 md:block"><Logo /><div className="mt-12"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a296ac]">Student workspace</p>{studentNav.map((item, i) => <button key={item} onClick={() => { setActive(item); setSelectedTest(null); }} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${active === item ? "bg-[#f0e9f7] font-semibold text-[#5b3b92]" : "text-[#81758e] hover:bg-[#faf7fc]"}`}><span className="text-xs">{i === 0 ? <LayoutDashboard size={16} /> : i === 1 ? <ClipboardCheck size={16} /> : i === 2 ? <BarChart3 size={16} /> : i === 3 ? <CalendarDays size={16} /> : i === 4 ? <BookOpen size={16} /> : i === 5 ? <FileText size={16} /> : i === 6 ? <MessageCircle size={16} /> : <NotebookPen size={16} />}</span>{item}</button>)}</div>{showHelp && <div className="absolute bottom-6 left-6 right-6"><div className="relative rounded-2xl bg-[#f7f1fb] p-4"><button onClick={() => setShowHelp(false)} className="absolute right-3 top-3 text-[#aaa0b1] hover:text-[#5b3b92]"><X size={14} /></button><p className="text-xs font-semibold">Need help?</p><p className="mt-1 text-[11px] leading-4 text-[#8d8197] pr-2">Talk to the centre team about your learning plan.</p></div></div>}</aside><main className="md:ml-64"><header className="flex items-center justify-between border-b border-[#ebe3ef] bg-[#fffdfb]/80 px-5 py-5 backdrop-blur md:px-10"><div><p className="text-xs text-[#978ca1]">Student portal</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Good morning, {user.name.split(" ")[0]}.</h1></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-xs font-semibold">{user.name}</p><p className="text-[11px] text-[#94889e]">Grade 10 · Foundation batch</p></div><button onClick={onLogout} className="rounded-full border border-[#e4dce9] bg-white p-2.5 text-[#796c88] hover:text-[#5b3b92]" title="Log out"><LogOut size={16} /></button></div></header><div className="p-5 md:p-10"><div className="mb-8 flex items-center justify-between"><div><Pill>{active}</Pill><p className="mt-3 max-w-lg text-sm leading-6 text-[#81758e]">{pageIntro[active]}</p></div><div className="hidden rounded-2xl bg-[#f4e9dd] p-4 text-[#a7633e] md:block"><ShieldCheck size={20} /><p className="mt-2 text-[11px] font-semibold">Private student view</p></div></div>{renderPage()}</div></main></div>;
}

const parentNav = ["Overview", "Attendance", "Mark statements", "Question paper", "Unit question", "Projects", "Orientation programs", "Colleges", "Government exams"];

function ParentWorkspace({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [active, setActive] = useState("Overview");
  const [showLinked, setShowLinked] = useState(true);
  const child = "Ananya Sharma";
  const attendanceQuery = trpc.student.attendance.useQuery({ studentEmail: "student@portal.com" });
  const liveAttendance = attendanceQuery.data ?? [];
  const projectsQuery = trpc.student.projects.useQuery({ studentEmail: "student@portal.com" });
  const collegesQuery = trpc.guidance.colleges.useQuery();
  const examsQuery = trpc.guidance.exams.useQuery();
  const intro: Record<string, string> = { Overview: "A calm view of Ananya’s learning journey.", Attendance: "Review your child’s day-by-day attendance record.", "Mark statements": "See the same weekly and monthly test results shared with your child.", "Question paper": "Review question papers sent by Admin to your child's class.", "Unit question": "Review unit-wise questions sent by Admin to your child's class.", Projects: "Track projects assigned by the Admin and their progress.", "Orientation programs": "Centre meetings and orientation sessions scheduled for your family.", Colleges: "Explore technology and non-technology colleges by tier.", "Government exams": "Compare Central and Tamil Nadu government examination pathways." };
  const render = () => {
    if (active === "Attendance") {
      if (attendanceQuery.isLoading) return <LoadingState label="Loading child attendance…" />;
      if (!liveAttendance.length) return <EmptyState title="No attendance has been published" message="Admin attendance updates for Ananya will appear here automatically." />;
      const { present, percentage } = summarizeAttendance(liveAttendance);
      return <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-3xl border border-[#eee6f0] bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">Child attendance</p><h2 className="mt-2 text-2xl font-semibold">{child} · Admin-updated</h2></div><span className="rounded-full bg-[#e9f5ed] px-3 py-1 text-xs font-semibold text-[#44835b]">{percentage}% present</span></div><div className="mt-7 space-y-3">{liveAttendance.slice().sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate)).map(record => <div className="flex items-center justify-between rounded-2xl bg-[#faf7fc] p-4" key={record.id}><span className="text-sm font-semibold">{record.attendanceDate}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.status === "present" ? "bg-[#e9f5ed] text-[#44835b]" : record.status === "late" ? "bg-[#fff0e7] text-[#c36b42]" : "bg-[#fbe8eb] text-[#c25b68]"}`}>{record.status}</span></div>)}</div></div><div className="rounded-3xl bg-[#5b3b92] p-6 text-white"><ClipboardCheck className="text-[#f6ae8a]" size={20} /><h2 className="mt-8 text-2xl font-semibold">Live family<br /><em className="font-serif font-normal">visibility.</em></h2><p className="mt-4 text-sm leading-6 text-white/65">Attendance changes saved by Admin are reflected here for the linked parent.</p></div></div>;
    }
    if (active === "Mark statements") return <MarkStatements parent studentEmail="student@portal.com" />;
    if (active === "Question paper" || active === "Important Question papers") {
      return <MaterialsView type="paper" targetClass="Grade 10" />;
    }
    if (active === "Unit question" || active === "Important questions (Unit wise)") {
      return <MaterialsView type="unit" targetClass="Grade 10" />;
    }
    if (active === "Projects") {
      if (projectsQuery.isLoading) return <LoadingState label="Loading assigned projects…" />;
      const projects = projectsQuery.data ?? [];
      if (!projects.length) return <EmptyState title="No projects assigned yet" message="Admin-assigned projects for Ananya will appear here automatically." />;
      return <div className="grid gap-4 md:grid-cols-2">{projects.map(project => <div className="rounded-3xl border border-[#eee6f0] bg-white p-6" key={project.id}><div className="flex items-start justify-between"><span className="rounded-full bg-[#f4e9dd] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c36b42]">{project.subject}</span><NotebookPen className="text-[#8060ac]" size={20} /></div><h2 className="mt-6 text-xl font-semibold">{project.title}</h2><p className="mt-2 text-sm text-[#887c91]">Assigned by Admin · Due {project.dueDate}</p><div className="mt-6 flex items-center justify-between text-xs"><span className="font-semibold text-[#6d4b9f]">{project.status}</span><span className="text-[#887c91]">{project.progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee7f3]"><div className="h-full rounded-full bg-[#7c5ab1]" style={{ width: `${project.progress}%` }} /></div></div>)}</div>;
    }
    if (active === "Orientation programs") return <div className="space-y-4">{[["Parent orientation · Term 1", "Saturday, 10 October 2026", "10:30 AM", "Centre hall", "Scheduled"], ["Progress meeting · Ananya", "Monday, 19 October 2026", "5:30 PM", "Video meeting", "Scheduled"], ["Career pathways evening", "Friday, 6 November 2026", "6:00 PM", "Centre hall", "Save the date"]].map(item => <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#eee6f0] bg-white p-6 md:flex-row md:items-center" key={item[0]}><div><span className="rounded-full bg-[#f4e9dd] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c36b42]">{item[4]}</span><h2 className="mt-4 text-xl font-semibold">{item[0]}</h2><p className="mt-2 text-sm text-[#887c91]">{item[1]} · {item[2]} · {item[3]}</p></div><button className="rounded-full border border-[#dcd1e5] px-4 py-2.5 text-xs font-semibold text-[#6d4b9f]">View details</button></div>)}</div>;
    if (active === "Colleges") {
      if (collegesQuery.isLoading) return <LoadingState label="Loading college guidance…" />;
      const colleges = collegesQuery.data ?? [];
      if (!colleges.length) return <EmptyState title="No college guidance published" message="Admin can add tiered college and cut-off guidance from the Content workspace." />;
      const groups = colleges.reduce<Record<string, typeof colleges>>((result, college) => { (result[college.tier] ??= []).push(college); return result; }, {});
      return <div><div className="mb-5 rounded-2xl bg-[#fff5ed] p-4 text-xs leading-5 text-[#8b6b5c]">Cut-offs are indicative planning guidance. Verify the current category, course, year, and official counselling notification.</div><div className="space-y-5">{Object.entries(groups).map(([tier, items]) => <div className="rounded-3xl border border-[#eee6f0] bg-white p-6" key={tier}><h2 className="text-xl font-semibold">{tier}</h2><div className="mt-5 grid gap-3 md:grid-cols-3">{items.map(item => <div className="rounded-2xl bg-[#faf7fc] p-4" key={item.id}><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-[#ef8656]">{item.category}</p><p className="mt-4 text-xs leading-5 text-[#887c91]">Indicative cut-off<br /><strong className="text-[#5b3b92]">{item.cutoff}</strong></p></div>)}</div></div>)}</div></div>;
    }
    if (active === "Government exams") {
      if (examsQuery.isLoading) return <LoadingState label="Loading government exam guidance…" />;
      const exams = examsQuery.data ?? [];
      if (!exams.length) return <EmptyState title="No exam guidance published" message="Admin can add Central and Tamil Nadu government examinations from the Content workspace." />;
      const groups = exams.reduce<Record<string, typeof exams>>((result, exam) => { (result[exam.groupName] ??= []).push(exam); return result; }, {});
      return <div><div className="mb-5 rounded-2xl bg-[#fff5ed] p-4 text-xs leading-5 text-[#8b6b5c]">Exam patterns and qualification rules can change by notification. Confirm the latest official notification before applying.</div><div className="space-y-5">{Object.entries(groups).map(([group, items]) => <div className="rounded-3xl border border-[#eee6f0] bg-white p-6" key={group}><h2 className="text-xl font-semibold">{group}</h2><div className="mt-5 space-y-3">{items.map(item => <div className="grid gap-3 rounded-2xl bg-[#faf7fc] p-4 md:grid-cols-[1.1fr_1fr_1.1fr_1.1fr] md:items-center" key={item.id}><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#ef8656]">Exam pathway</p></div><p className="text-xs leading-5 text-[#887c91]"><strong className="block text-[#5d506c]">Education</strong>{item.qualification}</p><p className="text-xs leading-5 text-[#887c91]"><strong className="block text-[#5d506c]">Maximum marks</strong>{item.maxMarks}</p><p className="text-xs leading-5 text-[#887c91]"><strong className="block text-[#5d506c]">Planning benchmark</strong>{item.benchmark}</p></div>)}</div></div>)}</div></div>;
    }
    return <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["92%", "Child attendance", ClipboardCheck], ["86%", "Current average", BarChart3], ["03", "Projects this term", NotebookPen], ["02", "Upcoming meetings", CalendarDays]].map(([value, label, Icon]) => <button onClick={() => setActive(label === "Child attendance" ? "Attendance" : label === "Current average" ? "Mark statements" : label === "Projects this term" ? "Projects" : "Orientation programs")} key={label as string} className="rounded-3xl border border-[#eee6f0] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1"><div className="flex items-start justify-between"><p className="text-3xl font-semibold text-[#5b3b92]">{value as string}</p><span className="rounded-xl bg-[#f4edf9] p-2 text-[#8060ac]"><Icon size={17} /></span></div><p className="mt-6 text-xs text-[#877b91]">{label as string}</p></button>)}</div><div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><div className="rounded-3xl border border-[#eee6f0] bg-white p-6"><div className="flex items-center justify-between"><h2 className="font-semibold">Family learning snapshot</h2><button onClick={() => setActive("Mark statements")} className="text-xs font-semibold text-[#6d4b9f]">View marks <ChevronRight className="inline" size={14} /></button></div><div className="mt-6 space-y-4">{[["Ananya’s attendance", "41 of 45 classes attended", "92%"], ["Latest result", "Monthly test · 86% average", "On track"], ["Next meeting", "Parent orientation · 10 October", "Scheduled"]].map(row => <div className="flex items-center justify-between rounded-2xl bg-[#faf7fc] p-4" key={row[0]}><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9ddf4] text-[#6e4b9e]"><Check size={16} /></span><div><p className="text-sm font-semibold">{row[0]}</p><p className="mt-1 text-xs text-[#8d8197]">{row[1]}</p></div></div><span className="text-[11px] font-semibold text-[#ef8656]">{row[2]}</span></div>)}</div></div><div className="rounded-3xl bg-[#5b3b92] p-6 text-white"><Sparkles className="text-[#f8b08b]" size={20} /><h2 className="mt-8 text-2xl font-semibold">Support the next<br /><em className="font-serif font-normal">good question.</em></h2><p className="mt-4 text-sm leading-6 text-white/65">Use the guidance library to explore pathways together.</p><button onClick={() => setActive("Colleges")} className="mt-8 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-[#5b3b92]">Explore colleges <ArrowRight className="ml-1 inline" size={13} /></button></div></div></>;
  };
  return <div className="min-h-screen bg-[#f6f2f8] text-[#2a203e]"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#ebe3ef] bg-[#fffdfb] p-6 md:block"><Logo /><div className="mt-12"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a296ac]">Parent workspace</p>{parentNav.map((item, i) => <button key={item} onClick={() => setActive(item)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${active === item ? "bg-[#f0e9f7] font-semibold text-[#5b3b92]" : "text-[#81758e] hover:bg-[#faf7fc]"}`}><span className="text-xs">{i === 0 ? <LayoutDashboard size={16} /> : i === 1 ? <ClipboardCheck size={16} /> : i === 2 ? <BarChart3 size={16} /> : i === 3 ? <FileText size={16} /> : i === 4 ? <BookOpen size={16} /> : i === 5 ? <NotebookPen size={16} /> : i === 6 ? <CalendarDays size={16} /> : i === 7 ? <GraduationCap size={16} /> : <ShieldCheck size={16} />}</span>{item}</button>)}</div>{showLinked && <div className="absolute bottom-6 left-6 right-6"><div className="relative rounded-2xl bg-[#f7f1fb] p-4"><button onClick={() => setShowLinked(false)} className="absolute right-3 top-3 text-[#aaa0b1] hover:text-[#5b3b92]"><X size={14} /></button><p className="text-xs font-semibold">Linked student</p><p className="mt-1 text-[11px] leading-4 text-[#8d8197]">{child} · Grade 10</p></div></div>}</aside><main className="md:ml-64"><header className="flex items-center justify-between border-b border-[#ebe3ef] bg-[#fffdfb]/80 px-5 py-5 backdrop-blur md:px-10"><div><p className="text-xs text-[#978ca1]">Parent portal</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Good morning, {user.name.split(" ")[0]}.</h1></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-xs font-semibold">{user.name}</p><p className="text-[11px] text-[#94889e]">Parent of {child}</p></div><button onClick={onLogout} className="rounded-full border border-[#e4dce9] bg-white p-2.5 text-[#796c88] hover:text-[#5b3b92]" title="Log out"><LogOut size={16} /></button></div></header><div className="p-5 md:p-10"><div className="mb-8 flex items-center justify-between"><div><Pill>{active}</Pill><p className="mt-3 max-w-lg text-sm leading-6 text-[#81758e]">{intro[active]}</p></div><div className="hidden rounded-2xl bg-[#f4e9dd] p-4 text-[#a7633e] md:block"><ShieldCheck size={20} /><p className="mt-2 text-[11px] font-semibold">Private family view</p></div></div>{render()}</div></main></div>;
}

function AdminContentManager() {
  const [section, setSection] = useState<"marks" | "projects" | "colleges" | "exams" | "access">("marks");
  const [mark, setMark] = useState({ studentEmail: "student@portal.com", assessmentType: "weekly" as "weekly" | "monthly", periodLabel: "Week one", subject: "Mathematics", score: "18", maxScore: "20" });
  const [project, setProject] = useState({ studentEmail: "student@portal.com", title: "", subject: "Mathematics", dueDate: "", status: "Not started", progress: "0" });
  const [college, setCollege] = useState({ tier: "Tier 1", name: "", category: "Technology", cutoff: "" });
  const [exam, setExam] = useState({ groupName: "Central Government", name: "", qualification: "", maxMarks: "", benchmark: "" });
  const [accountEmail, setAccountEmail] = useState("");
  const [accountRole, setAccountRole] = useState<"user" | "admin" | "student" | "parent">("student");
  const [linkedStudentEmail, setLinkedStudentEmail] = useState("");
  const marksQuery = trpc.student.marks.useQuery({ studentEmail: "student@portal.com" });
  const projectsQuery = trpc.student.projects.useQuery({ studentEmail: "student@portal.com" });
  const collegesQuery = trpc.guidance.colleges.useQuery();
  const examsQuery = trpc.guidance.exams.useQuery();
  const markMutation = trpc.admin.marks.useMutation({ onSuccess: () => marksQuery.refetch() });
  const projectMutation = trpc.admin.project.useMutation({ onSuccess: () => projectsQuery.refetch() });
  const collegeMutation = trpc.admin.college.useMutation({ onSuccess: () => collegesQuery.refetch() });
  const examMutation = trpc.admin.exam.useMutation({ onSuccess: () => examsQuery.refetch() });
  const roleMutation = trpc.admin.setUserRole.useMutation();
  const tabs = [["marks", "Marks"], ["projects", "Projects"], ["colleges", "Colleges"], ["exams", "Government exams"], ["access", "Account access"]] as const;
  return <div className="space-y-5"><div className="flex flex-wrap gap-2">{tabs.map(([key, label]) => <button key={key} onClick={() => setSection(key)} className={`rounded-full px-4 py-2 text-xs font-semibold ${section === key ? "bg-[#5b3b92] text-white" : "border border-[#e4dce9] bg-white text-[#6d4b9f]"}`}>{label}</button>)}</div>{section === "marks" && <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]"><form className="rounded-3xl border border-[#eee6f0] bg-white p-6" onSubmit={e => { e.preventDefault(); markMutation.mutate({ ...mark, score: Number(mark.score), maxScore: Number(mark.maxScore) }); }}><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">Publish marks</p><h2 className="mt-2 text-2xl font-semibold">Add or update a result</h2><div className="mt-5 space-y-3">{[["periodLabel", "Period label"], ["subject", "Subject"], ["score", "Score"], ["maxScore", "Maximum score"]].map(([key, label]) => <label key={key} className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#776c88]">{label}<input required value={mark[key as keyof typeof mark] as string} onChange={e => setMark({ ...mark, [key]: e.target.value })} className="mt-2 w-full rounded-2xl border border-[#e6deeb] px-4 py-3 text-sm" /></label>)}<select value={mark.assessmentType} onChange={e => setMark({ ...mark, assessmentType: e.target.value as typeof mark.assessmentType })} className="w-full rounded-2xl border border-[#e6deeb] px-4 py-3 text-sm"><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select><button disabled={markMutation.isPending} className="w-full rounded-2xl bg-[#5b3b92] py-3 text-sm font-semibold text-white">Save mark statement</button></div></form><div>{marksQuery.isLoading ? <LoadingState label="Loading marks…" /> : marksQuery.data?.length ? <div className="space-y-3">{marksQuery.data.map(item => <div className="rounded-2xl border border-[#eee6f0] bg-white p-4" key={item.id}><div className="flex justify-between"><p className="text-sm font-semibold">{item.periodLabel} · {item.subject}</p><span className="text-xs font-semibold text-[#ef8656]">{item.assessmentType}</span></div><p className="mt-2 text-sm text-[#887c91]">{item.score} / {item.maxScore}</p></div>)}</div> : <EmptyState title="No marks published" message="Use the form to add the first mark statement." />}</div></div>}{section === "projects" && <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]"><form className="rounded-3xl border border-[#eee6f0] bg-white p-6" onSubmit={e => { e.preventDefault(); projectMutation.mutate({ ...project, progress: Number(project.progress) }); }}><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">Assign project</p><h2 className="mt-2 text-2xl font-semibold">Create or update a project</h2><div className="mt-5 space-y-3">{[["title", "Project title"], ["subject", "Subject"], ["dueDate", "Due date"], ["status", "Status"], ["progress", "Progress %"]].map(([key, label]) => <label key={key} className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#776c88]">{label}<input required value={project[key as keyof typeof project] as string} onChange={e => setProject({ ...project, [key]: e.target.value })} className="mt-2 w-full rounded-2xl border border-[#e6deeb] px-4 py-3 text-sm" /></label>)}<button disabled={projectMutation.isPending} className="w-full rounded-2xl bg-[#5b3b92] py-3 text-sm font-semibold text-white">Save project</button></div></form><div>{projectsQuery.isLoading ? <LoadingState label="Loading projects…" /> : projectsQuery.data?.length ? <div className="space-y-3">{projectsQuery.data.map(item => <div className="rounded-2xl border border-[#eee6f0] bg-white p-4" key={item.id}><p className="text-sm font-semibold">{item.title}</p><p className="mt-2 text-xs text-[#887c91]">{item.subject} · {item.status} · {item.progress}%</p></div>)}</div> : <EmptyState title="No projects assigned" message="Use the form to assign work to the student." />}</div></div>}{section === "colleges" && <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]"><form className="rounded-3xl border border-[#eee6f0] bg-white p-6" onSubmit={e => { e.preventDefault(); collegeMutation.mutate(college); }}><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">College guidance</p><h2 className="mt-2 text-2xl font-semibold">Add or update a college</h2><div className="mt-5 space-y-3">{[["tier", "Tier"], ["name", "College name"], ["category", "Category"], ["cutoff", "Indicative cut-off"]].map(([key, label]) => <label key={key} className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#776c88]">{label}<input required value={college[key as keyof typeof college]} onChange={e => setCollege({ ...college, [key]: e.target.value })} className="mt-2 w-full rounded-2xl border border-[#e6deeb] px-4 py-3 text-sm" /></label>)}<button disabled={collegeMutation.isPending} className="w-full rounded-2xl bg-[#5b3b92] py-3 text-sm font-semibold text-white">Save college</button></div></form><div>{collegesQuery.isLoading ? <LoadingState label="Loading colleges…" /> : collegesQuery.data?.length ? <div className="space-y-3">{collegesQuery.data.map(item => <div className="rounded-2xl border border-[#eee6f0] bg-white p-4" key={item.id}><p className="text-sm font-semibold">{item.name}</p><p className="mt-2 text-xs text-[#887c91]">{item.tier} · {item.category} · {item.cutoff}</p></div>)}</div> : <EmptyState title="No colleges added" message="Use the form to publish college guidance." />}</div></div>}{section === "exams" && <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]"><form className="rounded-3xl border border-[#eee6f0] bg-white p-6" onSubmit={e => { e.preventDefault(); examMutation.mutate(exam); }}><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">Exam guidance</p><h2 className="mt-2 text-2xl font-semibold">Add or update an exam</h2><div className="mt-5 space-y-3">{[["groupName", "Group"], ["name", "Exam name"], ["qualification", "Qualification"], ["maxMarks", "Maximum marks"], ["benchmark", "Selection benchmark"]].map(([key, label]) => <label key={key} className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#776c88]">{label}<input required value={exam[key as keyof typeof exam]} onChange={e => setExam({ ...exam, [key]: e.target.value })} className="mt-2 w-full rounded-2xl border border-[#e6deeb] px-4 py-3 text-sm" /></label>)}<button disabled={examMutation.isPending} className="w-full rounded-2xl bg-[#5b3b92] py-3 text-sm font-semibold text-white">Save exam</button></div></form><div>{examsQuery.isLoading ? <LoadingState label="Loading exams…" /> : examsQuery.data?.length ? <div className="space-y-3">{examsQuery.data.map(item => <div className="rounded-2xl border border-[#eee6f0] bg-white p-4" key={item.id}><p className="text-sm font-semibold">{item.name}</p><p className="mt-2 text-xs text-[#887c91]">{item.groupName} · {item.maxMarks} · {item.benchmark}</p></div>)}</div> : <EmptyState title="No exams added" message="Use the form to publish Central or Tamil Nadu exam guidance." />}</div></div>}{section === "access" && <form className="max-w-xl rounded-3xl border border-[#eee6f0] bg-white p-6" onSubmit={event => { event.preventDefault(); roleMutation.mutate({ email: accountEmail, role: accountRole, linkedStudentEmail: accountRole === "parent" && linkedStudentEmail ? linkedStudentEmail : undefined }); }}><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">Secure account access</p><h2 className="mt-2 text-2xl font-semibold">Assign a portal role</h2><p className="mt-2 text-sm leading-6 text-[#887c91]">The user must first sign in. Then assign their role here; Parent accounts can be linked to one Student email.</p><div className="mt-5 space-y-3"><label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#776c88]">Account email<input required type="email" value={accountEmail} onChange={event => setAccountEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#e6deeb] px-4 py-3 text-sm" /></label><label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#776c88]">Role<select value={accountRole} onChange={event => setAccountRole(event.target.value as typeof accountRole)} className="mt-2 w-full rounded-2xl border border-[#e6deeb] px-4 py-3 text-sm"><option value="student">Student</option><option value="parent">Parent</option><option value="admin">Admin</option><option value="user">Unassigned</option></select></label>{accountRole === "parent" && <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#776c88]">Linked student email<input required type="email" value={linkedStudentEmail} onChange={event => setLinkedStudentEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#e6deeb] px-4 py-3 text-sm" /></label>}<button disabled={roleMutation.isPending} className="w-full rounded-2xl bg-[#5b3b92] py-3 text-sm font-semibold text-white">{roleMutation.isPending ? "Saving access…" : "Save account role"}</button></div></form>}</div>;
}

export interface ManagedStudent {
  id: string;
  studentId: string;
  name: string;
  email: string;
  department: string;
  section: string;
  status: "active" | "inactive";
  joinedDate: string;
}

interface SectionItem {
  id: string;
  name: string;
  department: string;
}

const INITIAL_DEPARTMENTS = ["BCA", "BSc(CS)", "BA", "IBSc CS", "Grade 10", "Grade 11", "Grade 12", "BSc Mathematics", "Pure Mathematics"];

const INITIAL_SECTIONS: SectionItem[] = [
  { id: "sec-bca-a", name: "A", department: "BCA" },
  { id: "sec-bca-b", name: "B", department: "BCA" },
  { id: "sec-bsc-a", name: "A", department: "BSc(CS)" },
  { id: "sec-bsc-b", name: "B", department: "BSc(CS)" },
  { id: "sec-ba-a", name: "A", department: "BA" },
  { id: "sec-1", name: "A", department: "Grade 10" },
  { id: "sec-2", name: "B", department: "Grade 10" },
  { id: "sec-3", name: "A", department: "IBSc CS" },
  { id: "sec-4", name: "B", department: "IBSc CS" },
  { id: "sec-5", name: "Morning Batch", department: "Grade 12" },
  { id: "sec-6", name: "Evening Batch", department: "Grade 12" },
];

const INITIAL_STUDENTS: ManagedStudent[] = [
  // BCA Section A (10 students matching user screenshots BCAA001 - BCAA010)
  { id: "bca-1", studentId: "BCAA001", name: "Arun Kumar", email: "arun.kumar@portal.com", department: "BCA", section: "A", status: "active", joinedDate: "2026-01-10" },
  { id: "bca-2", studentId: "BCAA002", name: "Bala Kumar", email: "bala.kumar@portal.com", department: "BCA", section: "A", status: "active", joinedDate: "2026-01-10" },
  { id: "bca-3", studentId: "BCAA003", name: "Divya Kumar", email: "divya.kumar@portal.com", department: "BCA", section: "A", status: "active", joinedDate: "2026-01-10" },
  { id: "bca-4", studentId: "BCAA004", name: "Elan Kumar", email: "elan.kumar@portal.com", department: "BCA", section: "A", status: "active", joinedDate: "2026-01-10" },
  { id: "bca-5", studentId: "BCAA005", name: "Fathima Kumar", email: "fathima.kumar@portal.com", department: "BCA", section: "A", status: "active", joinedDate: "2026-01-10" },
  { id: "bca-6", studentId: "BCAA006", name: "Ganesh Kumar", email: "ganesh.kumar@portal.com", department: "BCA", section: "A", status: "active", joinedDate: "2026-01-10" },
  { id: "bca-7", studentId: "BCAA007", name: "Harish Kumar", email: "harish.kumar@portal.com", department: "BCA", section: "A", status: "active", joinedDate: "2026-01-10" },
  { id: "bca-8", studentId: "BCAA008", name: "Ishwarya Kumar", email: "ishwarya.kumar@portal.com", department: "BCA", section: "A", status: "active", joinedDate: "2026-01-10" },
  { id: "bca-9", studentId: "BCAA009", name: "Janani Kumar", email: "janani.kumar@portal.com", department: "BCA", section: "A", status: "active", joinedDate: "2026-01-10" },
  { id: "bca-10", studentId: "BCAA010", name: "Kavitha Kumar", email: "kavitha.kumar@portal.com", department: "BCA", section: "A", status: "active", joinedDate: "2026-01-10" },

  // BSc(CS) Section A
  { id: "bsc-1", studentId: "001", name: "Aditya Nair", email: "aditya001@portal.com", department: "BSc(CS)", section: "A", status: "active", joinedDate: "2026-01-12" },
  { id: "bsc-2", studentId: "002", name: "Bhavna Jain", email: "bhavna002@portal.com", department: "BSc(CS)", section: "A", status: "active", joinedDate: "2026-01-12" },
  { id: "bsc-3", studentId: "003", name: "Chetan Deshmukh", email: "chetan003@portal.com", department: "BSc(CS)", section: "A", status: "active", joinedDate: "2026-01-12" },

  // Grade 10 Section A
  { id: "stu-1", studentId: "21CS01", name: "Ananya Sharma", email: "student@portal.com", department: "Grade 10", section: "A", status: "active", joinedDate: "2026-01-15" },
  { id: "stu-2", studentId: "21CS02", name: "Rohit Verma", email: "rohit.verma@portal.com", department: "Grade 10", section: "A", status: "active", joinedDate: "2026-01-20" },
  { id: "stu-3", studentId: "21CS03", name: "Priya Natarajan", email: "priya.n@portal.com", department: "Grade 10", section: "B", status: "active", joinedDate: "2026-02-01" },
  { id: "stu-4", studentId: "22MAT01", name: "Karthik Sundaram", email: "karthik.s@portal.com", department: "Grade 12", section: "Morning Batch", status: "active", joinedDate: "2026-02-10" },
  { id: "stu-5", studentId: "22MAT02", name: "Deepa R.", email: "deepa.r@portal.com", department: "IBSc CS", section: "A", status: "active", joinedDate: "2026-02-18" },
  { id: "stu-6", studentId: "22MAT03", name: "Suresh Kumar", email: "suresh.k@portal.com", department: "IBSc CS", section: "B", status: "inactive", joinedDate: "2026-03-02" },
];

function AdminStudentManager() {
  const [departments, setDepartments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("rasi_admin_departments");
      return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
    } catch {
      return INITIAL_DEPARTMENTS;
    }
  });

  const [sections, setSections] = useState<SectionItem[]>(() => {
    try {
      const saved = localStorage.getItem("rasi_admin_sections");
      return saved ? JSON.parse(saved) : INITIAL_SECTIONS;
    } catch {
      return INITIAL_SECTIONS;
    }
  });

  const [students, setStudents] = useState<ManagedStudent[]>(() => {
    try {
      const saved = localStorage.getItem("rasi_admin_students");
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try { localStorage.setItem("rasi_admin_departments", JSON.stringify(departments)); } catch {}
  }, [departments]);

  useEffect(() => {
    try { localStorage.setItem("rasi_admin_sections", JSON.stringify(sections)); } catch {}
  }, [sections]);

  useEffect(() => {
    try { localStorage.setItem("rasi_admin_students", JSON.stringify(students)); } catch {}
  }, [students]);

  // Form states
  const [newDeptName, setNewDeptName] = useState("");
  const [newSectionDept, setNewSectionDept] = useState(departments[0] || "");
  const [newSectionName, setNewSectionName] = useState("");

  // Single Student Form
  const [singleStudent, setSingleStudent] = useState({
    studentId: "",
    name: "",
    email: "",
    department: departments[0] || "IBSc CS",
    section: "A",
  });

  // Bulk Import Form
  const [bulkDept, setBulkDept] = useState("");
  const [bulkSection, setBulkSection] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [bulkFileText, setBulkFileText] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState<ManagedStudent | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add Department
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDeptName.trim();
    if (!trimmed) return;
    if (departments.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Department "${trimmed}" already exists!`);
      return;
    }
    setDepartments([...departments, trimmed]);
    setNewDeptName("");
    showToast(`Department "${trimmed}" added successfully.`);
  };

  const handleDeleteDepartment = (dept: string) => {
    if (confirm(`Remove department "${dept}"?`)) {
      setDepartments(departments.filter(d => d !== dept));
      showToast(`Department "${dept}" removed.`);
    }
  };

  // Add Section
  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSec = newSectionName.trim();
    if (!trimmedSec) return;
    const targetDept = newSectionDept || departments[0] || "General";
    if (sections.some(s => s.name.toLowerCase() === trimmedSec.toLowerCase() && s.department.toLowerCase() === targetDept.toLowerCase())) {
      showToast(`Section "${trimmedSec}" already exists in ${targetDept}!`);
      return;
    }
    setSections([...sections, { id: `sec-${Date.now()}`, name: trimmedSec, department: targetDept }]);
    setNewSectionName("");
    showToast(`Section "${trimmedSec}" added under ${targetDept}.`);
  };

  const handleDeleteSection = (secId: string) => {
    setSections(sections.filter(s => s.id !== secId));
    showToast("Section removed.");
  };

  // Add Single Student
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStudent.studentId.trim() || !singleStudent.name.trim() || !singleStudent.email.trim()) {
      showToast("Please fill in Student ID, Name, and Email.");
      return;
    }
    if (students.some(s => s.studentId.toLowerCase() === singleStudent.studentId.trim().toLowerCase())) {
      showToast(`Student ID "${singleStudent.studentId}" is already assigned.`);
      return;
    }
    const newStudent: ManagedStudent = {
      id: `stu-${Date.now()}`,
      studentId: singleStudent.studentId.trim(),
      name: singleStudent.name.trim(),
      email: singleStudent.email.trim(),
      department: singleStudent.department || departments[0] || "General",
      section: singleStudent.section.trim() || "A",
      status: "active",
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    setStudents([newStudent, ...students]);
    setSingleStudent({
      studentId: "",
      name: "",
      email: "",
      department: departments[0] || "IBSc CS",
      section: "A",
    });
    showToast(`Student "${newStudent.name}" (${newStudent.studentId}) added!`);
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(
      "studentId,name,email,section,department\n" +
      "23CS101,Aarav Patel,aarav.p@portal.com,A,IBSc CS\n" +
      "23CS102,Meera Krishnan,meera.k@portal.com,A,Grade 10\n" +
      "23CS103,Vikram Singhania,vikram.s@portal.com,B,Grade 12\n"
    );
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "students_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Sample template downloaded!");
  };

  // Handle File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    try {
      const text = await file.text();
      setBulkFileText(text);
      setImportStatus(`Selected file: ${file.name} ready for import.`);
    } catch {
      setImportStatus("Error reading file.");
    }
  };

  // Confirm Bulk Import
  const handleConfirmImport = () => {
    if (!bulkFileText.trim()) {
      showToast("Please choose a valid CSV file first.");
      return;
    }
    const lines = bulkFileText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      showToast("No data rows found in file.");
      return;
    }

    const header = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
    const idIdx = header.findIndex(h => h.includes("id") || h.includes("studentid") || h.includes("roll"));
    const nameIdx = header.findIndex(h => h.includes("name") || h.includes("student"));
    const emailIdx = header.findIndex(h => h.includes("email") || h.includes("mail"));
    const secIdx = header.findIndex(h => h.includes("section") || h.includes("batch") || h.includes("sec"));
    const deptIdx = header.findIndex(h => h.includes("department") || h.includes("dept") || h.includes("class"));

    let importedCount = 0;
    const newRecords: ManagedStudent[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
      if (row.length < 2) continue;

      const sid = (idIdx !== -1 ? row[idIdx] : row[0]) || `RM-${Date.now()}-${i}`;
      const sname = (nameIdx !== -1 ? row[nameIdx] : row[1]) || "Imported Student";
      const semail = (emailIdx !== -1 ? row[emailIdx] : row[2]) || `student_${i}@portal.com`;
      const ssec = bulkSection.trim() || (secIdx !== -1 ? row[secIdx] : row[3]) || "A";
      const sdept = bulkDept.trim() || (deptIdx !== -1 ? row[deptIdx] : row[4]) || departments[0] || "General";

      if (!students.some(s => s.studentId.toLowerCase() === sid.toLowerCase())) {
        newRecords.push({
          id: `stu-${Date.now()}-${i}`,
          studentId: sid,
          name: sname,
          email: semail,
          department: sdept,
          section: ssec,
          status: "active",
          joinedDate: new Date().toISOString().slice(0, 10),
        });
        importedCount++;
      }
    }

    if (importedCount > 0) {
      setStudents(prev => [...newRecords, ...prev]);
      showToast(`Successfully imported ${importedCount} students!`);
      setImportStatus(`✅ Imported ${importedCount} new student records.`);
      setSelectedFileName("");
      setBulkFileText("");
    } else {
      showToast("No new unique students were imported (possible duplicates).");
      setImportStatus("No new records added.");
    }
  };

  // Delete Student
  const handleDeleteStudent = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete student "${name}"?`)) {
      setStudents(students.filter(s => s.id !== id));
      showToast(`Student "${name}" deleted.`);
    }
  };

  // Toggle Student Status
  const handleToggleStatus = (id: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s));
  };

  // Update Student Modal Save
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setStudents(students.map(s => s.id === editingStudent.id ? editingStudent : s));
    setEditingStudent(null);
    showToast(`Updated details for "${editingStudent.name}".`);
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === "All" || s.department === deptFilter;
      const matchesStatus = statusFilter === "All" || s.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [students, searchQuery, deptFilter, statusFilter]);

  const activeCount = students.filter(s => s.status === "active").length;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-[#2a203e] px-5 py-3.5 text-sm font-medium text-white shadow-2xl transition-all">
          <CheckCircle2 className="text-[#68d391]" size={18} />
          {toastMessage}
        </div>
      )}

      {/* Main Creation / Management Header */}
      <div className="border-b border-[#ece4ef] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1b3a6b]">
              Creation <span className="font-light text-[#94889e]">/</span> Management
            </h1>
            <div className="mt-1.5 h-1 w-16 rounded-full bg-[#ef8656]"></div>
            <p className="mt-2 text-xs text-[#81758e]">
              Manage departments, section batches, and perform comprehensive CRUD operations for students.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-[#eee6f0] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#5b3b92] shadow-sm">
              👥 {students.length} Total Students
            </span>
            <span className="rounded-xl border border-[#eee6f0] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1b7e47] shadow-sm">
              ● {activeCount} Active
            </span>
            <span className="rounded-xl border border-[#eee6f0] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#ef8656] shadow-sm">
              🏛️ {departments.length} Departments
            </span>
          </div>
        </div>
      </div>

      {/* 1. Add Department Card */}
      <div className="rounded-3xl border border-[#eee6f0] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏛️</span>
          <h2 className="text-base font-bold text-[#2a203e]">Add Department</h2>
        </div>
        <form onSubmit={handleAddDepartment} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            required
            value={newDeptName}
            onChange={e => setNewDeptName(e.target.value)}
            placeholder="Department name (e.g. IBSc CS)"
            className="flex-1 rounded-2xl border border-[#e4dce9] bg-white px-4 py-3 text-sm transition focus:border-[#5b3b92] focus:outline-none focus:ring-2 focus:ring-[#5b3b92]/20"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#1b55a8] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15468d]"
          >
            Add
          </button>
        </form>

        {/* Existing Departments Tag Cloud */}
        {departments.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9a8ea4]">Active:</span>
            {departments.map(dept => {
              const count = students.filter(s => s.department === dept).length;
              return (
                <span
                  key={dept}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-[#ebe3ef] bg-[#faf7fc] py-1 pl-3 pr-2 text-xs font-medium text-[#5b3b92]"
                >
                  {dept}
                  <span className="rounded-full bg-[#eee6f4] px-1.5 py-0.5 text-[10px] font-bold text-[#6d4b9f]">
                    {count}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteDepartment(dept)}
                    className="ml-1 text-[#aaa0b1] hover:text-[#d32f2f]"
                    title={`Delete ${dept}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Add Section Card */}
      <div className="rounded-3xl border border-[#eee6f0] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">📁</span>
          <h2 className="text-base font-bold text-[#2a203e]">Add Section</h2>
        </div>
        <form onSubmit={handleAddSection} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]">
          <select
            value={newSectionDept}
            onChange={e => setNewSectionDept(e.target.value)}
            className="rounded-2xl border border-[#e4dce9] bg-white px-4 py-3 text-sm text-[#4a3e5c] focus:border-[#5b3b92] focus:outline-none"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            type="text"
            required
            value={newSectionName}
            onChange={e => setNewSectionName(e.target.value)}
            placeholder="Section name (e.g. A, B, Morning Batch)"
            className="rounded-2xl border border-[#e4dce9] bg-white px-4 py-3 text-sm transition focus:border-[#5b3b92] focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#1b55a8] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15468d]"
          >
            Add
          </button>
        </form>

        {/* Existing Sections Tag Cloud */}
        {sections.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9a8ea4]">Configured:</span>
            {sections.map(sec => (
              <span
                key={sec.id}
                className="group inline-flex items-center gap-1.5 rounded-full border border-[#ebe3ef] bg-[#faf7fc] py-1 pl-3 pr-2 text-xs font-medium text-[#4a3e5c]"
              >
                <span className="text-[11px] text-[#8d8197]">{sec.department}:</span>
                <span className="font-semibold text-[#5b3b92]">{sec.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteSection(sec.id)}
                  className="ml-1 text-[#aaa0b1] hover:text-[#d32f2f]"
                  title="Delete Section"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. Add Student (Single) Card */}
      <div className="rounded-3xl border border-[#eee6f0] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎓</span>
          <h2 className="text-base font-bold text-[#2a203e]">Add Student (Single)</h2>
        </div>
        <form onSubmit={handleAddSingleStudent} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#81758e]">Student ID</label>
              <input
                type="text"
                required
                value={singleStudent.studentId}
                onChange={e => setSingleStudent({ ...singleStudent, studentId: e.target.value })}
                placeholder="e.g. 21CS01"
                className="w-full rounded-2xl border border-[#e4dce9] bg-white px-3.5 py-2.5 text-sm focus:border-[#5b3b92] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#81758e]">Full Name</label>
              <input
                type="text"
                required
                value={singleStudent.name}
                onChange={e => setSingleStudent({ ...singleStudent, name: e.target.value })}
                placeholder="Full Name"
                className="w-full rounded-2xl border border-[#e4dce9] bg-white px-3.5 py-2.5 text-sm focus:border-[#5b3b92] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#81758e]">Email</label>
              <input
                type="email"
                required
                value={singleStudent.email}
                onChange={e => setSingleStudent({ ...singleStudent, email: e.target.value })}
                placeholder="Email Address"
                className="w-full rounded-2xl border border-[#e4dce9] bg-white px-3.5 py-2.5 text-sm focus:border-[#5b3b92] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#81758e]">Department</label>
              <select
                value={singleStudent.department}
                onChange={e => setSingleStudent({ ...singleStudent, department: e.target.value })}
                className="w-full rounded-2xl border border-[#e4dce9] bg-white px-3.5 py-2.5 text-sm text-[#4a3e5c] focus:border-[#5b3b92] focus:outline-none"
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#81758e]">Section</label>
              <input
                type="text"
                value={singleStudent.section}
                onChange={e => setSingleStudent({ ...singleStudent, section: e.target.value })}
                placeholder="e.g. A"
                className="w-full rounded-2xl border border-[#e4dce9] bg-white px-3.5 py-2.5 text-sm focus:border-[#5b3b92] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-2xl bg-[#1b55a8] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15468d]"
            >
              <UserPlus size={16} />
              Add Student
            </button>
          </div>
        </form>
      </div>

      {/* 4. Bulk Import Students (Excel / CSV) Card */}
      <div className="rounded-3xl border border-[#eee6f0] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h2 className="text-base font-bold text-[#2a203e]">Bulk Import Students (Excel / CSV)</h2>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#81758e]">
          Upload an Excel (<code className="rounded bg-[#f4edf9] px-1 py-0.5 text-[#5b3b92]">.xlsx</code>) or CSV (<code className="rounded bg-[#f4edf9] px-1 py-0.5 text-[#5b3b92]">.csv</code>) file to add many students at once. Your file should have columns: <strong className="text-[#2a203e]">studentId, name, email, section</strong>. Department is chosen below.
        </p>

        {/* Download template button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1b55a8] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#15468d]"
          >
            <Download size={14} />
            Download Template
          </button>
          <span className="ml-3 text-xs text-[#8d8197]">Download a sample file to see the correct format</span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#71647f]">
              Department (Optional):
            </label>
            <select
              value={bulkDept}
              onChange={e => setBulkDept(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[#e4dce9] bg-white px-4 py-2.5 text-sm text-[#4a3e5c] focus:border-[#5b3b92] focus:outline-none"
            >
              <option value="">— Select — (Use file column or default)</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#71647f]">
              Section (Optional):
            </label>
            <input
              type="text"
              value={bulkSection}
              onChange={e => setBulkSection(e.target.value)}
              placeholder="Leave blank to use file"
              className="mt-1.5 w-full rounded-2xl border border-[#e4dce9] bg-white px-4 py-2.5 text-sm focus:border-[#5b3b92] focus:outline-none"
            />
          </div>
        </div>

        {/* File Picker & Import Button */}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#d8cfe0] bg-[#faf7fc] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#5b3b92] transition hover:bg-[#f3ecf9]">
            <FolderPlus size={16} />
            Choose File
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <span className="text-xs text-[#887c91]">
            {selectedFileName || "No file chosen"}
          </span>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!bulkFileText}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#5984ba] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-sm transition hover:bg-[#4672a8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={16} />
            Confirm Import
          </button>
        </div>

        {importStatus && (
          <p className="mt-3 rounded-xl bg-[#f7f3fb] px-4 py-2.5 text-xs font-medium text-[#5b3b92]">
            {importStatus}
          </p>
        )}
      </div>

      {/* 5. Registered Students Directory (CRUD Table) */}
      <div className="rounded-3xl border border-[#eee6f0] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0e8f4] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#2a203e]">
              Enrolled Students Registry ({filteredStudents.length})
            </h2>
            <p className="mt-0.5 text-xs text-[#81758e]">
              Search, filter, update details, or remove enrolled students.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a397ad]" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ID, name, email…"
                className="w-48 rounded-xl border border-[#e4dce9] bg-white py-1.5 pl-8 pr-3 text-xs focus:border-[#5b3b92] focus:outline-none sm:w-60"
              />
            </div>

            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="rounded-xl border border-[#e4dce9] bg-white px-3 py-1.5 text-xs text-[#524466] focus:outline-none"
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#e4dce9] bg-white px-3 py-1.5 text-xs text-[#524466] focus:outline-none"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto text-[#c4b8d1]" size={36} />
            <p className="mt-3 text-sm font-semibold text-[#524466]">No students found</p>
            <p className="mt-1 text-xs text-[#9a8ea4]">
              Try adjusting your search query or add a new student using the form above.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#f0e8f4] text-[11px] font-bold uppercase tracking-[0.1em] text-[#8d8197]">
                  <th className="py-3 pl-2 pr-4">Student ID</th>
                  <th className="py-3 px-4">Student Info</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 pr-2 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7f2f9]">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="transition hover:bg-[#fbf9fd]">
                    <td className="py-3.5 pl-2 pr-4 font-mono font-semibold text-[#5b3b92]">
                      <span className="rounded-lg bg-[#f4ecf9] px-2 py-1 text-[11px]">
                        {student.studentId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#5b3b92] text-[11px] font-bold text-white">
                          {student.name.charAt(0)}
                        </span>
                        <div>
                          <p className="font-semibold text-[#2a203e]">{student.name}</p>
                          <p className="text-[11px] text-[#8d8197]">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-[#f0eaf7] px-2.5 py-0.5 text-[11px] font-medium text-[#5b3b92]">
                        {student.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-[#fdf5ed] px-2 py-0.5 text-[11px] font-bold text-[#ef8656]">
                        {student.section}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(student.id)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] transition ${
                          student.status === "active"
                            ? "bg-[#e8f6ed] text-[#1c7e47] hover:bg-[#d8eedd]"
                            : "bg-[#f5e9e9] text-[#b83232] hover:bg-[#edd3d3]"
                        }`}
                        title="Click to toggle status"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                        {student.status}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-[#8d8197]">
                      {student.joinedDate}
                    </td>
                    <td className="py-3.5 pr-2 pl-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingStudent(student)}
                          className="rounded-lg p-1.5 text-[#5b3b92] transition hover:bg-[#f0e8f7]"
                          title="Edit Student"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          className="rounded-lg p-1.5 text-[#b83232] transition hover:bg-[#fcedec]"
                          title="Delete Student"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[#eee6f0] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#f0e8f4] pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ef8656]">Edit Student</p>
                <h3 className="mt-1 text-lg font-bold text-[#2a203e]">{editingStudent.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="rounded-full p-2 text-[#9a8ea4] hover:bg-[#f5eff9]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-[0.08em] text-[#71647f]">Student ID</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.studentId}
                    onChange={e => setEditingStudent({ ...editingStudent, studentId: e.target.value })}
                    className="w-full rounded-2xl border border-[#e4dce9] px-3.5 py-2.5 focus:border-[#5b3b92] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-[0.08em] text-[#71647f]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name}
                    onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full rounded-2xl border border-[#e4dce9] px-3.5 py-2.5 focus:border-[#5b3b92] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold uppercase tracking-[0.08em] text-[#71647f]">Email</label>
                <input
                  type="email"
                  required
                  value={editingStudent.email}
                  onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                  className="w-full rounded-2xl border border-[#e4dce9] px-3.5 py-2.5 focus:border-[#5b3b92] focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-[0.08em] text-[#71647f]">Department</label>
                  <select
                    value={editingStudent.department}
                    onChange={e => setEditingStudent({ ...editingStudent, department: e.target.value })}
                    className="w-full rounded-2xl border border-[#e4dce9] bg-white px-3.5 py-2.5 focus:border-[#5b3b92] focus:outline-none"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-[0.08em] text-[#71647f]">Section</label>
                  <input
                    type="text"
                    value={editingStudent.section}
                    onChange={e => setEditingStudent({ ...editingStudent, section: e.target.value })}
                    className="w-full rounded-2xl border border-[#e4dce9] px-3.5 py-2.5 focus:border-[#5b3b92] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold uppercase tracking-[0.08em] text-[#71647f]">Status</label>
                <select
                  value={editingStudent.status}
                  onChange={e => setEditingStudent({ ...editingStudent, status: e.target.value as "active" | "inactive" })}
                  className="w-full rounded-2xl border border-[#e4dce9] bg-white px-3.5 py-2.5 focus:border-[#5b3b92] focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="rounded-2xl border border-[#e4dce9] px-5 py-2.5 font-semibold text-[#71647f] hover:bg-[#faf7fc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#5b3b92] px-6 py-2.5 font-semibold text-white transition hover:bg-[#4a2e7c]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface AttendanceSessionRecord {
  id: string;
  date: string;
  department: string;
  section: string;
  description: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  absentStudentIds: string[];
  recordedAt: string;
}

const INITIAL_ATTENDANCE_SESSIONS: AttendanceSessionRecord[] = [
  {
    id: "att-sess-1",
    date: "2026-09-14",
    department: "BCA",
    section: "A",
    description: "Morning Mathematics practical batch #1",
    totalStudents: 10,
    presentCount: 9,
    absentCount: 1,
    absentStudentIds: ["004"],
    recordedAt: "10:30 AM",
  },
  {
    id: "att-sess-2",
    date: "2026-09-13",
    department: "BSc(CS)",
    section: "A",
    description: "Linear Algebra & Calculus session",
    totalStudents: 3,
    presentCount: 3,
    absentCount: 0,
    absentStudentIds: [],
    recordedAt: "04:30 PM",
  },
];

function AdminAttendanceManager() {
  const [departments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("rasi_admin_departments");
      return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
    } catch {
      return INITIAL_DEPARTMENTS;
    }
  });

  const [sections] = useState<SectionItem[]>(() => {
    try {
      const saved = localStorage.getItem("rasi_admin_sections");
      return saved ? JSON.parse(saved) : INITIAL_SECTIONS;
    } catch {
      return INITIAL_SECTIONS;
    }
  });

  const [students] = useState<ManagedStudent[]>(() => {
    try {
      const saved = localStorage.getItem("rasi_admin_students");
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedDept, setSelectedDept] = useState("BCA");
  const [selectedSection, setSelectedSection] = useState("A");
  const [description, setDescription] = useState("");

  // Map of studentId -> 'present' | 'absent'
  const [attendanceState, setAttendanceState] = useState<Record<string, "present" | "absent">>({});

  const [sessionLogs, setSessionLogs] = useState<AttendanceSessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem("rasi_attendance_sessions");
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_SESSIONS;
    } catch {
      return INITIAL_ATTENDANCE_SESSIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("rasi_attendance_sessions", JSON.stringify(sessionLogs));
    } catch {}
  }, [sessionLogs]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Available sections for chosen department
  const availableSections = useMemo(() => {
    const matched = sections.filter(s => s.department === selectedDept);
    return matched.length > 0 ? matched : [{ id: "default-a", name: "A", department: selectedDept }];
  }, [sections, selectedDept]);

  // Ensure selectedSection is valid for chosen department
  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.some(s => s.name === selectedSection)) {
      setSelectedSection(availableSections[0].name);
    }
  }, [availableSections, selectedSection]);

  // Filter students for chosen Department and Section
  const batchStudents = useMemo(() => {
    return students.filter(
      s => s.department.toLowerCase() === selectedDept.toLowerCase() &&
           s.section.toLowerCase() === selectedSection.toLowerCase()
    );
  }, [students, selectedDept, selectedSection]);

  // Initialize all batch students to 'present' when batch changes
  useEffect(() => {
    const initialMap: Record<string, "present" | "absent"> = {};
    batchStudents.forEach(s => {
      initialMap[s.studentId] = "present";
    });
    setAttendanceState(initialMap);
  }, [batchStudents]);

  // Toggle individual student
  const toggleStudent = (studentId: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "absent" ? "present" : "absent",
    }));
  };

  // Mark all present
  const markAllPresent = () => {
    const updated: Record<string, "present" | "absent"> = {};
    batchStudents.forEach(s => {
      updated[s.studentId] = "present";
    });
    setAttendanceState(updated);
  };

  // Mark all absent
  const markAllAbsent = () => {
    const updated: Record<string, "present" | "absent"> = {};
    batchStudents.forEach(s => {
      updated[s.studentId] = "absent";
    });
    setAttendanceState(updated);
  };

  // Calculate live counts
  const presentCount = batchStudents.filter(s => (attendanceState[s.studentId] ?? "present") === "present").length;
  const absentCount = batchStudents.filter(s => attendanceState[s.studentId] === "absent").length;
  const absentIds = batchStudents.filter(s => attendanceState[s.studentId] === "absent").map(s => s.studentId);

  // Submit attendance
  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchStudents.length === 0) {
      showToast("No students enrolled in this department and section.");
      return;
    }

    const newRecord: AttendanceSessionRecord = {
      id: `att-sess-${Date.now()}`,
      date: attendanceDate,
      department: selectedDept,
      section: selectedSection,
      description: description.trim() || "Daily attendance record",
      totalStudents: batchStudents.length,
      presentCount,
      absentCount,
      absentStudentIds: absentIds,
      recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessionLogs([newRecord, ...sessionLogs]);
    showToast(`✅ Attendance published for ${selectedDept} — Section ${selectedSection} (${presentCount} Present, ${absentCount} Absent)`);
    setDescription("");
  };

  const handleDeleteSession = (id: string) => {
    if (confirm("Delete this attendance log?")) {
      setSessionLogs(sessionLogs.filter(s => s.id !== id));
      showToast("Attendance record removed.");
    }
  };

  const formattedDisplayDate = useMemo(() => {
    try {
      const [y, m, d] = attendanceDate.split("-");
      return `${d}-${m}-${y}`;
    } catch {
      return attendanceDate;
    }
  }, [attendanceDate]);

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-[#2a203e] px-5 py-3.5 text-sm font-medium text-white shadow-2xl transition-all">
          <CheckCircle2 className="text-[#68d391]" size={18} />
          {toastMessage}
        </div>
      )}

      {/* Main Form Container */}
      <div className="rounded-3xl border border-[#eee6f0] bg-white p-6 shadow-sm md:p-8">
        {/* Header with Title and Date Badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f3ebf6] pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1b3a6b]">
              LAB Attendance
            </h1>
            <div className="mt-1.5 h-1 w-14 rounded-full bg-[#ef8656]"></div>
          </div>

          {/* Date Selector Badge */}
          <div className="relative flex items-center gap-2 rounded-2xl border border-[#d8cfe0] bg-[#f8f5fc] px-4 py-2 text-xs font-semibold text-[#5b3b92]">
            <CalendarDays size={16} className="text-[#1b55a8]" />
            <span>Date: {formattedDisplayDate}</span>
            <input
              type="date"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              title="Click to change date"
            />
          </div>
        </div>

        {/* Form Selectors */}
        <form onSubmit={handleSubmitAttendance} className="mt-6 space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#4a3e5c]">
                DEPARTMENT:
              </label>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#e4dce9] bg-white px-4 py-3 text-sm text-[#2a203e] shadow-sm focus:border-[#1b55a8] focus:outline-none"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#4a3e5c]">
                SECTION:
              </label>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#e4dce9] bg-white px-4 py-3 text-sm text-[#2a203e] shadow-sm focus:border-[#1b55a8] focus:outline-none"
              >
                {availableSections.map(sec => (
                  <option key={sec.id} value={sec.name}>{sec.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#4a3e5c]">
                DESCRIPTION:
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Reason / notes"
                className="mt-2 w-full rounded-2xl border border-[#e4dce9] bg-white px-4 py-3 text-sm text-[#2a203e] shadow-sm placeholder:text-[#a89cb3] focus:border-[#1b55a8] focus:outline-none"
              />
            </div>
          </div>

          {/* Chip Attendance Marking Section */}
          {batchStudents.length === 0 ? (
            <div className="my-8 rounded-3xl border border-dashed border-[#d8c89b] bg-[#fdfcf7] p-10 text-center">
              <p className="italic text-[#7a6f58]">
                No students found for {selectedDept} — Section {selectedSection}
              </p>
              <p className="mt-2 text-xs text-[#a0947e]">
                Switch department/section above, or enroll students under <strong className="text-[#5b3b92]">Students (Creation / Management)</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {/* Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#eee6f0] bg-[#faf7fd] p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#1b55a8]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#1b55a8]"></span>
                    Present: {presentCount}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#d93838]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d93838]"></span>
                    Absent: {absentCount}
                  </span>
                  <span className="rounded-lg bg-[#fffdf5] px-2.5 py-1 text-xs font-serif font-bold tracking-wider text-[#b8860b] shadow-xs">
                    {selectedDept.replace(/\s+/g, '')}{selectedSection}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-[#8d8197] md:inline">
                    Tap a chip to mark absent (red)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={markAllPresent}
                      className="rounded-xl bg-[#0f4c81] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b3860]"
                    >
                      All Present
                    </button>
                    <button
                      type="button"
                      onClick={markAllAbsent}
                      className="rounded-xl bg-[#0f4c81] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b3860]"
                    >
                      All Absent
                    </button>
                  </div>
                </div>
              </div>

              {/* Student Chips Grid */}
              <div className="flex flex-wrap gap-3">
                {batchStudents.map(student => {
                  const isAbsent = attendanceState[student.studentId] === "absent";
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleStudent(student.studentId)}
                      className={`group relative flex min-w-[72px] items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                        isAbsent
                          ? "border-[#ef4444] bg-[#fef2f2] text-[#dc2626] shadow-sm"
                          : "border-[#d6c796] bg-[#fffdf8] text-[#1b3a6b] shadow-2xs hover:border-[#1b55a8] hover:bg-white"
                      }`}
                      title={`${student.name} (${student.email}) - Click to toggle attendance`}
                    >
                      <span>{student.studentId}</span>
                    </button>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="rounded-2xl bg-[#0f4c81] px-8 py-3.5 text-sm font-bold tracking-wide text-white shadow-md transition hover:bg-[#0b3860]"
                >
                  Submit Attendance
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Attendance Records History Table */}
      <div className="rounded-3xl border border-[#eee6f0] bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f3ebf6] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#2a203e]">
              Attendance Records History ({sessionLogs.length})
            </h2>
            <p className="mt-0.5 text-xs text-[#81758e]">
              Past recorded sessions, attendee breakdowns, and notes.
            </p>
          </div>
        </div>

        {sessionLogs.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#8d8197]">
            No attendance records published yet. Submit your first batch above.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#f0e8f4] text-[11px] font-bold uppercase tracking-[0.1em] text-[#8d8197]">
                  <th className="py-3 pl-2 pr-4">Date</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Present / Absent</th>
                  <th className="py-3 px-4">Absentees</th>
                  <th className="py-3 px-4">Description / Notes</th>
                  <th className="py-3 pr-2 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7f2f9]">
                {sessionLogs.map(log => (
                  <tr key={log.id} className="transition hover:bg-[#fbf9fd]">
                    <td className="py-3.5 pl-2 pr-4 font-semibold text-[#5b3b92]">
                      {log.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-lg bg-[#f0eaf7] px-2.5 py-1 text-xs font-semibold text-[#5b3b92]">
                        {log.department} - Sec {log.section}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1b7e47]">
                          ✓ {log.presentCount}
                        </span>
                        <span className="text-xs font-bold text-[#d93838]">
                          ✗ {log.absentCount}
                        </span>
                        <span className="text-[11px] text-[#8d8197]">
                          ({log.totalStudents} total)
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {log.absentStudentIds.length === 0 ? (
                        <span className="text-[11px] text-[#1b7e47]">All Present</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {log.absentStudentIds.map(id => (
                            <span
                              key={id}
                              className="rounded bg-[#fee2e2] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#dc2626]"
                            >
                              {id}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#71647f]">
                      {log.description}
                    </td>
                    <td className="py-3.5 pr-2 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(log.id)}
                        className="rounded-lg p-1.5 text-[#b83232] transition hover:bg-[#fcedec]"
                        title="Delete record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminWorkspace({ user, onLogout }: { user: User; onLogout: () => void }) {
  const studentEmail = "student@portal.com";
  const [active, setActive] = useState<"Overview" | "Students" | "Attendance" | "Schedule" | "Content">("Attendance");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [subject, setSubject] = useState("Mathematics");
  const [exercise, setExercise] = useState("");
  const [sessionTime, setSessionTime] = useState("4:30 PM");
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const scheduleQuery = trpc.student.schedule.useQuery({ studentEmail });
  const scheduleMutation = trpc.admin.schedule.useMutation({ onSuccess: () => { scheduleQuery.refetch(); setEditingSessionId(null); setExercise(""); setActive("Schedule"); } });
  const schedule = scheduleQuery.data ?? [];
  const saveSchedule = (event: React.FormEvent) => {
    event.preventDefault();
    scheduleMutation.mutate({ id: editingSessionId ?? undefined, studentEmail, sessionDate, subject, exercise, sessionTime });
  };
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDay = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = now.toLocaleString('default', { month: 'long' });
  return <div className="min-h-screen bg-[#f6f2f8] text-[#2a203e]">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#ebe3ef] bg-[#fffdfb] p-6 md:block">
      <Logo />
      <div className="mt-12">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a296ac]">Admin workspace</p>
        {[
          { label: "Overview", icon: <LayoutDashboard size={16} /> },
          { label: "Students", icon: <Users size={16} /> },
          { label: "Attendance", icon: <ClipboardCheck size={16} /> },
          { label: "Schedule", icon: <CalendarDays size={16} /> },
          { label: "Content", icon: <BookOpen size={16} /> },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => setActive(item.label as typeof active)}
            className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
              active === item.label ? "bg-[#f0e9f7] font-semibold text-[#5b3b92]" : "text-[#81758e] hover:bg-[#faf7fc]"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </aside>
    <main className="md:ml-64">
      <header className="flex items-center justify-between border-b border-[#ebe3ef] bg-[#fffdfb]/80 px-5 py-5 backdrop-blur md:px-10">
        <div>
          <p className="text-xs text-[#978ca1]">Admin portal</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Good morning, {user.name.split(" ")[0]}.</h1>
        </div>
        <button onClick={onLogout} className="rounded-full border border-[#e4dce9] bg-white p-2.5 text-[#796c88] transition hover:text-[#5b3b92]" title="Log out">
          <LogOut size={16} />
        </button>
      </header>
      <div className="p-5 md:p-10">
        <div className="mb-8">
          <Pill>{active === "Students" ? "CREATION / MANAGEMENT" : active === "Attendance" ? "LAB ATTENDANCE" : active}</Pill>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#81758e]">
            {active === "Students"
              ? "Comprehensive student enrollment, department batches, single & bulk import management."
              : active === "Attendance"
              ? "Department & section batch attendance with interactive roll number chips and records log."
              : "Manage the linked Student and Parent experience from one protected Admin workspace."}
          </p>
        </div>

        {active === "Overview" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setActive("Students")}
              className="rounded-3xl border border-[#eee6f0] bg-white p-6 text-left transition hover:-translate-y-1 sm:col-span-2"
            >
              <Users className="text-[#6d4b9f]" size={24} />
              <h2 className="mt-6 text-xl font-semibold">Student Creation & Management</h2>
              <p className="mt-2 text-sm text-[#887c91]">
                Full CRUD operations, add departments & sections, single student enrollment & bulk CSV/Excel import.
              </p>
            </button>
            <button
              onClick={() => setActive("Attendance")}
              className="rounded-3xl border border-[#eee6f0] bg-white p-6 text-left transition hover:-translate-y-1"
            >
              <ClipboardCheck className="text-[#6d4b9f]" size={24} />
              <h2 className="mt-6 text-xl font-semibold">LAB Attendance</h2>
              <p className="mt-2 text-sm text-[#887c91]">
                Interactive chip-based batch attendance marking & history logs.
              </p>
            </button>
            <button
              onClick={() => setActive("Schedule")}
              className="rounded-3xl border border-[#eee6f0] bg-white p-6 text-left transition hover:-translate-y-1"
            >
              <CalendarDays className="text-[#6d4b9f]" size={24} />
              <h2 className="mt-6 text-xl font-semibold">Schedule calendar</h2>
              <p className="mt-2 text-sm text-[#887c91]">
                {schedule.length ? `${schedule.length} session${schedule.length === 1 ? "" : "s"} scheduled` : "No sessions yet"}
              </p>
            </button>
            <button
              onClick={() => setActive("Content")}
              className="rounded-3xl border border-[#eee6f0] bg-white p-6 text-left transition hover:-translate-y-1 sm:col-span-2"
            >
              <BookOpen className="text-[#6d4b9f]" size={24} />
              <h2 className="mt-6 text-xl font-semibold">Learning content</h2>
              <p className="mt-2 text-sm text-[#887c91]">
                Manage marks, projects, colleges, and government exams in the database.
              </p>
            </button>
          </div>
        )}

        {active === "Students" && <AdminStudentManager />}

        {active === "Attendance" && <AdminAttendanceManager />}

        {active === "Schedule" && (
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-[#eee6f0] bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">Calendar</p>
                  <h2 className="mt-2 text-2xl font-semibold">{monthName} {currentYear}</h2>
                </div>
                <CalendarDays className="text-[#6d4b9f]" />
              </div>
              <div className="mt-7 grid grid-cols-7 gap-2 text-center">
                <div className="col-span-7 grid grid-cols-7 text-[10px] font-bold uppercase tracking-[0.12em] text-[#aaa0b1]">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                    <span key={`${day}-${index}`}>{day}</span>
                  ))}
                </div>
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dateNum = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
                  const hasSession = !!schedule.find(s => s.sessionDate === dateStr);
                  const isSelected = sessionDate === dateStr;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const s = schedule.find(s => s.sessionDate === dateStr);
                        setSessionDate(dateStr);
                        if (s) {
                          setEditingSessionId(s.id);
                          setSubject(s.subject);
                          setExercise(s.exercise);
                          setSessionTime(s.sessionTime || "");
                        } else {
                          setEditingSessionId(null);
                          setSubject("Mathematics");
                          setExercise("");
                          setSessionTime("4:30 PM");
                        }
                      }}
                      className={`grid h-11 place-items-center rounded-xl text-sm transition ${
                        isSelected
                          ? "bg-[#5b3b92] font-semibold text-white"
                          : hasSession
                          ? "bg-[#f3ecf9] font-semibold text-[#6d4b9f]"
                          : "text-[#81758e] hover:bg-[#faf7fc]"
                      }`}
                    >
                      {dateNum}
                    </button>
                  );
                })}
              </div>
              <p className="mt-5 text-xs text-[#8d8197]">
                Purple dates have an exercise scheduled. Click any date to add or edit a session.
              </p>
            </div>
            <div className="rounded-3xl border border-[#eee6f0] bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">
                {editingSessionId ? "Edit schedule" : "Update schedule"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {editingSessionId ? "Edit scheduled exercise" : "Add a session exercise"}
              </h2>
              <form className="mt-6 space-y-4" onSubmit={saveSchedule}>
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#776c88]">
                  Session date
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={event => setSessionDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#e6deeb] bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#776c88]">
                  Subject
                  <input
                    value={subject}
                    onChange={event => setSubject(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#e6deeb] bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#776c88]">
                  Exercise
                  <textarea
                    required
                    value={exercise}
                    onChange={event => setExercise(event.target.value)}
                    placeholder="e.g. Complete algebra practice set 4"
                    className="mt-2 min-h-24 w-full rounded-2xl border border-[#e6deeb] bg-white px-4 py-3 text-sm"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#776c88]">
                  Time
                  <input
                    value={sessionTime}
                    onChange={event => setSessionTime(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#e6deeb] bg-white px-4 py-3 text-sm"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    disabled={scheduleMutation.isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#5b3b92] py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {scheduleMutation.isPending && <Loader2 className="animate-spin" size={16} />}
                    {editingSessionId ? "Update schedule" : "Save scheduled exercise"}
                  </button>
                  {editingSessionId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSessionId(null);
                        setExercise("");
                      }}
                      className="rounded-2xl border border-[#e4dce9] px-4 text-xs font-semibold text-[#6d4b9f]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {active === "Content" && <AdminContentManager />}
      </div>
    </main>
  </div>;
}

export interface TeacherExamMarkEntry {
  studentId: string;
  studentName: string;
  mark: number;
}

export interface TeacherExamRecord {
  id: string;
  department: string;
  section: string;
  date: string;
  examDescription: string;
  maxMarks: number;
  entries: TeacherExamMarkEntry[];
  recordedAt: string;
}

const INITIAL_TEACHER_EXAM_RECORDS: TeacherExamRecord[] = [
  {
    id: "mark-rec-1",
    department: "BCA",
    section: "A",
    date: "2026-09-14",
    examDescription: "Lab Test 1, Unit Exam",
    maxMarks: 100,
    recordedAt: "11:15 AM",
    entries: [
      { studentId: "BCAA001", studentName: "Arun Kumar", mark: 88 },
      { studentId: "BCAA002", studentName: "Bala Kumar", mark: 76 },
      { studentId: "BCAA003", studentName: "Divya Kumar", mark: 95 },
      { studentId: "BCAA004", studentName: "Elan Kumar", mark: 82 },
      { studentId: "BCAA005", studentName: "Fathima Kumar", mark: 90 },
      { studentId: "BCAA006", studentName: "Ganesh Kumar", mark: 85 },
      { studentId: "BCAA007", studentName: "Harish Kumar", mark: 79 },
      { studentId: "BCAA008", studentName: "Ishwarya Kumar", mark: 94 },
      { studentId: "BCAA009", studentName: "Janani Kumar", mark: 87 },
      { studentId: "BCAA010", studentName: "Kavitha Kumar", mark: 91 },
    ],
  },
  {
    id: "mark-rec-2",
    department: "BSc(CS)",
    section: "A",
    date: "2026-09-13",
    examDescription: "Linear Algebra & Calculus Practical",
    maxMarks: 100,
    recordedAt: "03:45 PM",
    entries: [
      { studentId: "001", studentName: "Aditya Nair", mark: 92 },
      { studentId: "002", studentName: "Bhavna Jain", mark: 86 },
      { studentId: "003", studentName: "Chetan Deshmukh", mark: 80 },
    ],
  },
];

function TeacherWorkspace({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"home" | "attendance_records" | "marks_portal" | "mark_record">("marks_portal");

  // Load shared departments, sections and students
  const [departments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("rasi_admin_departments");
      return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
    } catch {
      return INITIAL_DEPARTMENTS;
    }
  });

  const [sections] = useState<SectionItem[]>(() => {
    try {
      const saved = localStorage.getItem("rasi_admin_sections");
      return saved ? JSON.parse(saved) : INITIAL_SECTIONS;
    } catch {
      return INITIAL_SECTIONS;
    }
  });

  const [students] = useState<ManagedStudent[]>(() => {
    try {
      const saved = localStorage.getItem("rasi_admin_students");
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- ATTENDANCE STATE (Home Tab) ---
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedDept, setSelectedDept] = useState("BCA");
  const [selectedSection, setSelectedSection] = useState("A");
  const [attendanceDescription, setAttendanceDescription] = useState("");
  const [attendanceState, setAttendanceState] = useState<Record<string, "present" | "absent">>({});
  const [sessionLogs, setSessionLogs] = useState<AttendanceSessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem("rasi_attendance_sessions");
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_SESSIONS;
    } catch {
      return INITIAL_ATTENDANCE_SESSIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("rasi_attendance_sessions", JSON.stringify(sessionLogs));
    } catch {}
  }, [sessionLogs]);

  // Available sections for chosen department
  const availableSections = useMemo(() => {
    const matched = sections.filter(s => s.department === selectedDept);
    return matched.length > 0 ? matched : [{ id: "default-a", name: "A", department: selectedDept }];
  }, [sections, selectedDept]);

  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.some(s => s.name === selectedSection)) {
      setSelectedSection(availableSections[0].name);
    }
  }, [availableSections, selectedSection]);

  const batchStudents = useMemo(() => {
    return students.filter(
      s => s.department.toLowerCase() === selectedDept.toLowerCase() &&
           s.section.toLowerCase() === selectedSection.toLowerCase()
    );
  }, [students, selectedDept, selectedSection]);

  useEffect(() => {
    const initialMap: Record<string, "present" | "absent"> = {};
    batchStudents.forEach(s => {
      initialMap[s.studentId] = "present";
    });
    setAttendanceState(initialMap);
  }, [batchStudents]);

  const toggleStudentAttendance = (studentId: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "absent" ? "present" : "absent",
    }));
  };

  const markAllPresent = () => {
    const updated: Record<string, "present" | "absent"> = {};
    batchStudents.forEach(s => {
      updated[s.studentId] = "present";
    });
    setAttendanceState(updated);
  };

  const markAllAbsent = () => {
    const updated: Record<string, "present" | "absent"> = {};
    batchStudents.forEach(s => {
      updated[s.studentId] = "absent";
    });
    setAttendanceState(updated);
  };

  const presentCount = batchStudents.filter(s => (attendanceState[s.studentId] ?? "present") === "present").length;
  const absentCount = batchStudents.filter(s => attendanceState[s.studentId] === "absent").length;
  const absentIds = batchStudents.filter(s => attendanceState[s.studentId] === "absent").map(s => s.studentId);

  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchStudents.length === 0) {
      showToast("No students found in this department and section.");
      return;
    }
    const newRecord: AttendanceSessionRecord = {
      id: `att-sess-${Date.now()}`,
      date: attendanceDate,
      department: selectedDept,
      section: selectedSection,
      description: attendanceDescription.trim() || "Daily attendance record",
      totalStudents: batchStudents.length,
      presentCount,
      absentCount,
      absentStudentIds: absentIds,
      recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSessionLogs([newRecord, ...sessionLogs]);
    showToast(`✅ Attendance saved for ${selectedDept} Sec ${selectedSection} (${presentCount} Present, ${absentCount} Absent)`);
    setAttendanceDescription("");
  };

  const handleDeleteAttendance = (id: string) => {
    if (confirm("Delete this attendance log?")) {
      setSessionLogs(sessionLogs.filter(s => s.id !== id));
      showToast("Attendance record deleted.");
    }
  };

  // --- MARKS PORTAL STATE (Enter Marks Tab - Screenshot 1) ---
  const [marksDept, setMarksDept] = useState("BCA");
  const [marksSection, setMarksSection] = useState("A");
  const [examDescription, setExamDescription] = useState("Lab Test 1, Unit Exam");
  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [marksInputMap, setMarksInputMap] = useState<Record<string, number>>({});

  // Stored Exam Records
  const [examRecords, setExamRecords] = useState<TeacherExamRecord[]>(() => {
    try {
      const saved = localStorage.getItem("rasi_teacher_marks_records");
      return saved ? JSON.parse(saved) : INITIAL_TEACHER_EXAM_RECORDS;
    } catch {
      return INITIAL_TEACHER_EXAM_RECORDS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("rasi_teacher_marks_records", JSON.stringify(examRecords));
    } catch {}
  }, [examRecords]);

  // Available students for Marks Entry
  const marksStudents = useMemo(() => {
    return students.filter(
      s => s.department.toLowerCase() === marksDept.toLowerCase() &&
           s.section.toLowerCase() === marksSection.toLowerCase()
    );
  }, [students, marksDept, marksSection]);

  // Populate or reset marks inputs when batch changes
  useEffect(() => {
    const initialMap: Record<string, number> = {};
    marksStudents.forEach(s => {
      initialMap[s.studentId] = 0;
    });
    setMarksInputMap(initialMap);
  }, [marksStudents]);

  const handleMarkChange = (studentId: string, val: string) => {
    const num = Math.max(0, Math.min(maxMarks, Number(val) || 0));
    setMarksInputMap(prev => ({
      ...prev,
      [studentId]: num,
    }));
  };

  const handleSaveMarks = (e: React.FormEvent) => {
    e.preventDefault();
    if (marksStudents.length === 0) {
      showToast("No students in this department and section to save marks for.");
      return;
    }

    const entries: TeacherExamMarkEntry[] = marksStudents.map(s => ({
      studentId: s.studentId,
      studentName: s.name,
      mark: marksInputMap[s.studentId] ?? 0,
    }));

    const newRecord: TeacherExamRecord = {
      id: `mark-rec-${Date.now()}`,
      department: marksDept,
      section: marksSection,
      date: examDate,
      examDescription: examDescription.trim() || "Unit Exam / Lab Test",
      maxMarks,
      entries,
      recordedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setExamRecords([newRecord, ...examRecords]);
    showToast(`✅ Marks successfully saved for ${marksDept} Sec ${marksSection} (${marksStudents.length} students)!`);
  };

  const quickFillSample = () => {
    const sampleScores = [88, 76, 95, 82, 90, 85, 79, 94, 87, 91, 84, 89];
    const newMap: Record<string, number> = {};
    marksStudents.forEach((s, idx) => {
      newMap[s.studentId] = sampleScores[idx % sampleScores.length];
    });
    setMarksInputMap(newMap);
    showToast("Filled sample test marks.");
  };

  const quickResetMarks = () => {
    const newMap: Record<string, number> = {};
    marksStudents.forEach(s => {
      newMap[s.studentId] = 0;
    });
    setMarksInputMap(newMap);
    showToast("Reset all student marks to 0.");
  };

  // --- MARK RECORD STATE (Search & Analytics Tab - Screenshot 2) ---
  const [fetchDept, setFetchDept] = useState("BCA");
  const [fetchSection, setFetchSection] = useState("A");
  const [fetchDate, setFetchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hasFetched, setHasFetched] = useState(true);
  const [fetchedRecords, setFetchedRecords] = useState<TeacherExamRecord[]>([]);

  // Filter records based on fetch parameters
  const handleFetchRecords = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasFetched(true);
    const matched = examRecords.filter(
      r => r.department.toLowerCase() === fetchDept.toLowerCase() &&
           r.section.toLowerCase() === fetchSection.toLowerCase() &&
           (!fetchDate || r.date === fetchDate)
    );
    // If no exact date match, fall back to all records for that department & section so teacher sees past history
    if (matched.length > 0) {
      setFetchedRecords(matched);
      showToast(`Found ${matched.length} mark record(s) for ${fetchDept} Sec ${fetchSection}`);
    } else {
      const allBatch = examRecords.filter(
        r => r.department.toLowerCase() === fetchDept.toLowerCase() &&
             r.section.toLowerCase() === fetchSection.toLowerCase()
      );
      setFetchedRecords(allBatch);
      if (allBatch.length > 0) {
        showToast(`Showing all ${allBatch.length} saved record(s) for ${fetchDept} Sec ${fetchSection}`);
      } else {
        showToast(`No mark records found for ${fetchDept} Sec ${fetchSection}.`);
      }
    }
  };

  // Automatically fetch on mount or when examRecords change
  useEffect(() => {
    const matched = examRecords.filter(
      r => r.department.toLowerCase() === fetchDept.toLowerCase() &&
           r.section.toLowerCase() === fetchSection.toLowerCase()
    );
    setFetchedRecords(matched);
  }, [examRecords, fetchDept, fetchSection]);

  const handleDeleteExamRecord = (id: string) => {
    if (confirm("Delete this test mark record?")) {
      setExamRecords(examRecords.filter(r => r.id !== id));
      showToast("Mark record removed.");
    }
  };

  // Helper date formatters
  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split("-");
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#1c2434]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-[#0c2340] px-5 py-3.5 text-sm font-medium text-white shadow-2xl transition-all">
          <CheckCircle2 className="text-[#48bb78]" size={18} />
          {toastMessage}
        </div>
      )}

      {/* TOP NAVBAR (Navy background matching screenshots) */}
      <header className="sticky top-0 z-40 bg-[#0c2444] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1e3a61] text-xs font-bold text-white shadow-inner">
              <ClipboardCheck size={18} className="text-[#f6ae8a]" />
            </div>
            <span className="text-base font-bold tracking-tight text-white sm:text-lg">
              LAB Attendance
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-4 md:gap-7 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className={`relative px-2 py-1 transition ${
                activeTab === "home"
                  ? "font-bold text-white after:absolute after:bottom-[-14px] after:left-0 after:right-0 after:h-[3px] after:rounded-t-full after:bg-[#f59e0b]"
                  : "text-[#9cb3d1] hover:text-white"
              }`}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("attendance_records")}
              className={`relative px-2 py-1 transition ${
                activeTab === "attendance_records"
                  ? "font-bold text-white after:absolute after:bottom-[-14px] after:left-0 after:right-0 after:h-[3px] after:rounded-t-full after:bg-[#f59e0b]"
                  : "text-[#9cb3d1] hover:text-white"
              }`}
            >
              Attendance Records
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("marks_portal")}
              className={`relative px-2 py-1 transition ${
                activeTab === "marks_portal"
                  ? "font-bold text-white after:absolute after:bottom-[-14px] after:left-0 after:right-0 after:h-[3px] after:rounded-t-full after:bg-[#f59e0b]"
                  : "text-[#9cb3d1] hover:text-white"
              }`}
            >
              Marks Portal
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("mark_record")}
              className={`relative px-2 py-1 transition ${
                activeTab === "mark_record"
                  ? "font-bold text-white after:absolute after:bottom-[-14px] after:left-0 after:right-0 after:h-[3px] after:rounded-t-full after:bg-[#f59e0b]"
                  : "text-[#9cb3d1] hover:text-white"
              }`}
            >
              Mark Record
            </button>

            {/* Blue Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="ml-2 rounded-xl bg-[#1b55a8] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#14478a] sm:ml-4 sm:px-5"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ========================================================= */}
        {/* TAB 1: HOME (LAB Attendance Taking with Chips)           */}
        {/* ========================================================= */}
        {activeTab === "home" && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-[#eedfce] bg-white p-6 shadow-xs md:p-8">
              {/* Header with Title and Date Badge */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f3ebf6] pb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#1b3a6b]">
                    LAB Attendance
                  </h1>
                  <div className="mt-1.5 h-1 w-14 rounded-full bg-[#ef8656]"></div>
                  <p className="mt-2 text-xs text-[#81758e]">
                    Teacher roll chip marking for daily lab & classroom sessions.
                  </p>
                </div>

                {/* Date Selector Badge */}
                <div className="relative flex items-center gap-2 rounded-2xl border border-[#d8cfe0] bg-[#f8f5fc] px-4 py-2 text-xs font-semibold text-[#5b3b92]">
                  <CalendarDays size={16} className="text-[#1b55a8]" />
                  <span>Date: {formatDateDisplay(attendanceDate)}</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    title="Click to change date"
                  />
                </div>
              </div>

              {/* Form Selectors */}
              <form onSubmit={handleSubmitAttendance} className="mt-6 space-y-6">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#4a3e5c]">
                      DEPARTMENT:
                    </label>
                    <select
                      value={selectedDept}
                      onChange={e => setSelectedDept(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[#e4dce9] bg-white px-4 py-3 text-sm text-[#2a203e] shadow-xs focus:border-[#1b55a8] focus:outline-none"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#4a3e5c]">
                      SECTION:
                    </label>
                    <select
                      value={selectedSection}
                      onChange={e => setSelectedSection(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[#e4dce9] bg-white px-4 py-3 text-sm text-[#2a203e] shadow-xs focus:border-[#1b55a8] focus:outline-none"
                    >
                      {availableSections.map(sec => (
                        <option key={sec.id} value={sec.name}>{sec.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#4a3e5c]">
                      DESCRIPTION:
                    </label>
                    <input
                      type="text"
                      value={attendanceDescription}
                      onChange={e => setAttendanceDescription(e.target.value)}
                      placeholder="e.g. Lab Session 1, Practical Exercises"
                      className="mt-2 w-full rounded-2xl border border-[#e4dce9] bg-white px-4 py-3 text-sm text-[#2a203e] shadow-xs placeholder:text-[#a89cb3] focus:border-[#1b55a8] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Chip Attendance Marking Section */}
                {batchStudents.length === 0 ? (
                  <div className="my-8 rounded-3xl border border-dashed border-[#d8c89b] bg-[#fdfcf7] p-10 text-center">
                    <p className="italic text-[#7a6f58]">
                      No students found for {selectedDept} — Section {selectedSection}
                    </p>
                    <p className="mt-2 text-xs text-[#a0947e]">
                      Switch department/section above, or ask Admin to enroll students.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 pt-2">
                    {/* Summary Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#eee6f0] bg-[#faf7fd] p-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#1b55a8]">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#1b55a8]"></span>
                          Present: {presentCount}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#d93838]">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#d93838]"></span>
                          Absent: {absentCount}
                        </span>
                        <span className="rounded-lg bg-[#fffdf5] px-2.5 py-1 text-xs font-serif font-bold tracking-wider text-[#b8860b] shadow-2xs">
                          {selectedDept.replace(/\s+/g, '')}{selectedSection}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="hidden text-xs text-[#8d8197] md:inline">
                          Tap a chip to mark absent (red)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={markAllPresent}
                            className="rounded-xl bg-[#0f4c81] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b3860]"
                          >
                            All Present
                          </button>
                          <button
                            type="button"
                            onClick={markAllAbsent}
                            className="rounded-xl bg-[#0f4c81] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b3860]"
                          >
                            All Absent
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Student Chips Grid */}
                    <div className="flex flex-wrap gap-3">
                      {batchStudents.map(student => {
                        const isAbsent = attendanceState[student.studentId] === "absent";
                        const shortId = student.studentId.replace(/^[A-Za-z]+/, "");
                        return (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => toggleStudentAttendance(student.studentId)}
                            className={`group relative flex min-w-[72px] items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                              isAbsent
                                ? "border-[#ef4444] bg-[#fef2f2] text-[#dc2626] shadow-sm"
                                : "border-[#d6c796] bg-[#fffdf8] text-[#1b3a6b] shadow-2xs hover:border-[#1b55a8] hover:bg-white"
                            }`}
                            title={`${student.name} (${student.email}) - Click to toggle attendance`}
                          >
                            <span>{shortId || student.studentId}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="rounded-2xl bg-[#0f4c81] px-8 py-3.5 text-sm font-bold tracking-wide text-white shadow-md transition hover:bg-[#0b3860]"
                      >
                        Submit Attendance
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ATTENDANCE RECORDS (Full History)                  */}
        {/* ========================================================= */}
        {activeTab === "attendance_records" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#eee6f0] bg-white p-6 shadow-xs md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f3ebf6] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#1b3a6b]">
                    Attendance Records History ({sessionLogs.length})
                  </h2>
                  <p className="mt-0.5 text-xs text-[#81758e]">
                    Review recorded classroom and practical attendance batches.
                  </p>
                </div>
              </div>

              {sessionLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8d8197]">
                  No attendance records saved yet. Mark attendance under the <strong>Home</strong> tab.
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#f0e8f4] text-[11px] font-bold uppercase tracking-[0.1em] text-[#8d8197]">
                        <th className="py-3 pl-2 pr-4">Date</th>
                        <th className="py-3 px-4">Batch</th>
                        <th className="py-3 px-4">Present / Absent</th>
                        <th className="py-3 px-4">Absentees</th>
                        <th className="py-3 px-4">Description / Notes</th>
                        <th className="py-3 pr-2 pl-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f7f2f9]">
                      {sessionLogs.map(log => (
                        <tr key={log.id} className="transition hover:bg-[#fbf9fd]">
                          <td className="py-3.5 pl-2 pr-4 font-semibold text-[#5b3b92]">
                            {log.date}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="rounded-lg bg-[#f0eaf7] px-2.5 py-1 text-xs font-semibold text-[#5b3b92]">
                              {log.department} - Sec {log.section}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#1b7e47]">
                                ✓ {log.presentCount}
                              </span>
                              <span className="text-xs font-bold text-[#d93838]">
                                ✗ {log.absentCount}
                              </span>
                              <span className="text-[11px] text-[#8d8197]">
                                ({log.totalStudents} total)
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {log.absentStudentIds.length === 0 ? (
                              <span className="text-[11px] text-[#1b7e47]">All Present</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {log.absentStudentIds.map(id => (
                                  <span
                                    key={id}
                                    className="rounded bg-[#fee2e2] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#dc2626]"
                                  >
                                    {id}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[#71647f]">
                            {log.description}
                          </td>
                          <td className="py-3.5 pr-2 pl-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteAttendance(log.id)}
                              className="rounded-lg p-1.5 text-[#b83232] transition hover:bg-[#fcedec]"
                              title="Delete record"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MARKS PORTAL (Enter Marks - Screenshot 1)          */}
        {/* ========================================================= */}
        {activeTab === "marks_portal" && (
          <div className="space-y-6">
            {/* Header: Title & Date Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✏️</span>
                <h1 className="text-2xl font-bold tracking-tight text-[#1b3a6b]">
                  Enter Marks
                </h1>
              </div>

              {/* Date Badge */}
              <div className="relative flex items-center gap-2 rounded-xl border border-[#d2def0] bg-[#edf4fc] px-4 py-2 text-xs font-bold text-[#1b55a8] shadow-2xs">
                <CalendarDays size={16} className="text-[#1b55a8]" />
                <span>{formatDateDisplay(examDate)}</span>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  title="Click to select date"
                />
              </div>
            </div>

            {/* Filter Card: DEPARTMENT, SECTION, DESCRIPTION */}
            <div className="rounded-2xl border border-[#eedfce] bg-white p-6 shadow-2xs">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">
                    DEPARTMENT
                  </label>
                  <select
                    value={marksDept}
                    onChange={e => setMarksDept(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1f2937] focus:border-[#1b55a8] focus:outline-none"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">
                    SECTION
                  </label>
                  <select
                    value={marksSection}
                    onChange={e => setMarksSection(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1f2937] focus:border-[#1b55a8] focus:outline-none"
                  >
                    {availableSections.map(sec => (
                      <option key={sec.id} value={sec.name}>{sec.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">
                    DESCRIPTION (EXAM / TEST NAME)
                  </label>
                  <input
                    type="text"
                    required
                    value={examDescription}
                    onChange={e => setExamDescription(e.target.value)}
                    placeholder="e.g. Lab Test 1, Unit Exam..."
                    className="mt-2 w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-2.5 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#1b55a8] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Students Marks Table Card */}
            <div className="rounded-2xl border border-[#eedfce] bg-white p-1 shadow-xs">
              <form onSubmit={handleSaveMarks}>
                {marksStudents.length === 0 ? (
                  <div className="p-12 text-center text-xs text-[#6b7280]">
                    No students enrolled for {marksDept} — Section {marksSection}.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-[#0c2444] text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                          <th className="w-16 py-3.5 pl-6 pr-4">#</th>
                          <th className="py-3.5 px-6">STUDENT ID</th>
                          <th className="py-3.5 px-6">NAME</th>
                          <th className="w-48 py-3.5 px-6 text-center">MARK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f3f6]">
                        {marksStudents.map((student, index) => {
                          const currentVal = marksInputMap[student.studentId] ?? 0;
                          return (
                            <tr
                              key={student.id}
                              className={`transition ${
                                index === 2 ? "bg-[#fff9e6]" : "hover:bg-[#fbfcfe]"
                              }`}
                            >
                              <td className="py-4 pl-6 pr-4 text-xs font-semibold text-[#4b5563]">
                                {index + 1}
                              </td>
                              <td className="py-4 px-6 font-mono font-medium text-[#1e293b]">
                                {student.studentId}
                              </td>
                              <td className="py-4 px-6 font-medium text-[#1e293b]">
                                {student.name}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={maxMarks}
                                  value={currentVal}
                                  onChange={e => handleMarkChange(student.studentId, e.target.value)}
                                  className="w-24 rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 text-center text-sm font-semibold text-[#1e293b] focus:border-[#1b55a8] focus:outline-none"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Bottom Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f0f2f5] p-5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={quickFillSample}
                      className="rounded-xl border border-[#d1d5db] bg-[#f9fafb] px-3.5 py-2 text-xs font-semibold text-[#4b5563] hover:bg-[#f3f4f6]"
                    >
                      Fill Sample Scores
                    </button>
                    <button
                      type="button"
                      onClick={quickResetMarks}
                      className="rounded-xl border border-[#d1d5db] bg-[#f9fafb] px-3.5 py-2 text-xs font-semibold text-[#4b5563] hover:bg-[#f3f4f6]"
                    >
                      Reset All to 0
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="rounded-2xl bg-[#0f4c81] px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0b3860]"
                  >
                    Save Marks Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MARK RECORD (Search & Report - Screenshot 2)       */}
        {/* ========================================================= */}
        {activeTab === "mark_record" && (
          <div className="space-y-6">
            {/* Header: Title */}
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📊</span>
              <h1 className="text-2xl font-bold tracking-tight text-[#1b3a6b]">
                Mark Record
              </h1>
            </div>

            {/* Filter Card: DEPARTMENT, SECTION, DATE, FETCH BUTTON */}
            <div className="rounded-2xl border border-[#eedfce] bg-white p-6 shadow-2xs">
              <form onSubmit={handleFetchRecords} className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">
                    DEPARTMENT
                  </label>
                  <select
                    value={fetchDept}
                    onChange={e => setFetchDept(e.target.value)}
                    className="mt-2 w-36 rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2 text-sm font-semibold text-[#1f2937] focus:border-[#1b55a8] focus:outline-none"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">
                    SECTION
                  </label>
                  <select
                    value={fetchSection}
                    onChange={e => setFetchSection(e.target.value)}
                    className="mt-2 w-28 rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2 text-sm font-semibold text-[#1f2937] focus:border-[#1b55a8] focus:outline-none"
                  >
                    {availableSections.map(sec => (
                      <option key={sec.id} value={sec.name}>{sec.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">
                    DATE
                  </label>
                  <input
                    type="date"
                    value={fetchDate}
                    onChange={e => setFetchDate(e.target.value)}
                    className="mt-2 w-44 rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2 text-sm font-semibold text-[#1f2937] focus:border-[#1b55a8] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1b55a8] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-sm transition hover:bg-[#15468d]"
                >
                  <Search size={14} />
                  Fetch
                </button>
              </form>
            </div>

            {/* Fetched Records Output */}
            {hasFetched && (
              <div className="space-y-6">
                {fetchedRecords.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#d8c89b] bg-white p-12 text-center">
                    <p className="text-sm font-semibold text-[#4a3e5c]">
                      No mark records found for {fetchDept} Section {fetchSection} on {formatDateDisplay(fetchDate)}.
                    </p>
                    <p className="mt-1 text-xs text-[#8d8197]">
                      Enter marks under the <strong>Marks Portal</strong> tab to record assessment results.
                    </p>
                  </div>
                ) : (
                  fetchedRecords.map(record => {
                    const totalStudents = record.entries.length;
                    const totalScore = record.entries.reduce((acc, curr) => acc + curr.mark, 0);
                    const avgScore = totalStudents > 0 ? (totalScore / totalStudents).toFixed(1) : "0";
                    const highestScore = Math.max(...record.entries.map(e => e.mark), 0);
                    const topScorer = record.entries.find(e => e.mark === highestScore)?.studentName || "—";
                    const passCount = record.entries.filter(e => (e.mark / record.maxMarks) >= 0.4).length;
                    const passRate = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;

                    return (
                      <div
                        key={record.id}
                        className="rounded-3xl border border-[#eedfce] bg-white p-6 shadow-xs space-y-6"
                      >
                        {/* Record Header & Analytics */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f3ebf6] pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg bg-[#e9f0fc] px-2.5 py-1 text-xs font-bold text-[#1b55a8]">
                                {record.department} - Sec {record.section}
                              </span>
                              <span className="text-xs text-[#6b7280]">
                                Recorded on {formatDateDisplay(record.date)} at {record.recordedAt}
                              </span>
                            </div>
                            <h2 className="mt-1.5 text-lg font-bold text-[#1b3a6b]">
                              {record.examDescription}
                            </h2>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteExamRecord(record.id)}
                              className="rounded-xl border border-[#fee2e2] bg-[#fef2f2] p-2 text-[#dc2626] hover:bg-[#fecaca]"
                              title="Delete Record"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Analytics Summary Cards */}
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafbfd] p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7280]">
                              Total Assessed
                            </p>
                            <p className="mt-1 text-2xl font-bold text-[#1b3a6b]">
                              {totalStudents} <span className="text-xs text-[#9ca3af]">Students</span>
                            </p>
                          </div>

                          <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafbfd] p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7280]">
                              Class Average
                            </p>
                            <p className="mt-1 text-2xl font-bold text-[#5b3b92]">
                              {avgScore} <span className="text-xs text-[#9ca3af]">/ {record.maxMarks}</span>
                            </p>
                          </div>

                          <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafbfd] p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7280]">
                              Top Mark
                            </p>
                            <p className="mt-1 text-2xl font-bold text-[#1b7e47]">
                              {highestScore} <span className="text-xs text-[#9ca3af]">({topScorer})</span>
                            </p>
                          </div>

                          <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafbfd] p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7280]">
                              Pass Rate
                            </p>
                            <p className="mt-1 text-2xl font-bold text-[#ef8656]">
                              {passRate}% <span className="text-xs text-[#9ca3af]">({passCount}/{totalStudents})</span>
                            </p>
                          </div>
                        </div>

                        {/* Student Breakdown Table */}
                        <div className="overflow-x-auto rounded-2xl border border-[#e5e7eb]">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-[#0c2444] text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                                <th className="py-3 pl-4 pr-3">#</th>
                                <th className="py-3 px-4">Student ID</th>
                                <th className="py-3 px-4">Student Name</th>
                                <th className="py-3 px-4">Score</th>
                                <th className="py-3 px-4">Percentage</th>
                                <th className="py-3 px-4">Grade</th>
                                <th className="py-3 pr-4 pl-3 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f1f3f6]">
                              {record.entries.map((entry, idx) => {
                                const pct = Math.round((entry.mark / record.maxMarks) * 100);
                                const isPassed = pct >= 40;
                                const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 40 ? "D" : "F";
                                return (
                                  <tr key={entry.studentId} className="hover:bg-[#fbfcfe]">
                                    <td className="py-3 pl-4 pr-3 font-medium text-[#6b7280]">
                                      {idx + 1}
                                    </td>
                                    <td className="py-3 px-4 font-mono font-semibold text-[#1e293b]">
                                      {entry.studentId}
                                    </td>
                                    <td className="py-3 px-4 font-medium text-[#1e293b]">
                                      {entry.studentName}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-[#1b3a6b]">
                                      {entry.mark} / {record.maxMarks}
                                    </td>
                                    <td className="py-3 px-4 font-semibold text-[#5b3b92]">
                                      {pct}%
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className={`rounded-md px-2 py-0.5 font-bold ${
                                        grade === "A+" || grade === "A"
                                          ? "bg-[#e8f6ed] text-[#1c7e47]"
                                          : grade === "B" || grade === "C"
                                          ? "bg-[#edf4fc] text-[#1b55a8]"
                                          : "bg-[#fdf2e9] text-[#c25b28]"
                                      }`}>
                                        {grade}
                                      </span>
                                    </td>
                                    <td className="py-3 pr-4 pl-3 text-right">
                                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                        isPassed
                                          ? "bg-[#e8f6ed] text-[#1c7e47]"
                                          : "bg-[#fef2f2] text-[#dc2626]"
                                      }`}>
                                        {isPassed ? "Pass" : "Fail"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [active, setActive] = useState("Overview"); const isAdmin = user.role === "admin";
  const metrics = user.role === "admin" ? [["48", "Active students", Users], ["94%", "Attendance average", ClipboardCheck], ["12", "Batches running", BookOpen], ["6", "New requests", MessageCircle]] : user.role === "student" ? [["92%", "Attendance", ClipboardCheck], ["86%", "Average score", BarChart3], ["04", "Upcoming classes", CalendarDays], ["07", "Open projects", NotebookPen]] : [["92%", "Child attendance", ClipboardCheck], ["86%", "Current average", BarChart3], ["03", "Projects this term", NotebookPen], ["04", "Updates this week", MessageCircle]];
  return <div className="min-h-screen bg-[#f6f2f8] text-[#2a203e]"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#ebe3ef] bg-[#fffdfb] p-6 md:block"><Logo /><div className="mt-12"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a296ac]">Your workspace</p>{navItems(user.role).map((item, i) => <button key={item} onClick={() => setActive(item)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${active === item ? "bg-[#f0e9f7] font-semibold text-[#5b3b92]" : "text-[#81758e] hover:bg-[#faf7fc]"}`}><span className="text-xs">{i === 0 ? <LayoutDashboard size={16} /> : i === 1 ? <Users size={16} /> : i === 2 ? <BarChart3 size={16} /> : <BookOpen size={16} />}</span>{item}</button>)}</div><div className="absolute bottom-6 left-6 right-6"><div className="rounded-2xl bg-[#f7f1fb] p-4"><p className="text-xs font-semibold">Need help?</p><p className="mt-1 text-[11px] leading-4 text-[#8d8197]">Talk to the centre team about your learning plan.</p><button className="mt-3 text-xs font-semibold text-[#5b3b92]">Message team <ArrowRight className="ml-1 inline" size={12} /></button></div></div></aside><main className="md:ml-64"><header className="flex items-center justify-between border-b border-[#ebe3ef] bg-[#fffdfb]/80 px-5 py-5 backdrop-blur md:px-10"><div><p className="text-xs text-[#978ca1]">{isAdmin ? "System controller" : user.role === "parent" ? "Parent portal" : "Student portal"}</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Good morning, {user.name.split(" ")[0]}.</h1></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-xs font-semibold">{user.name}</p><p className="text-[11px] text-[#94889e]">{user.email}</p></div><button onClick={onLogout} className="rounded-full border border-[#e4dce9] bg-white p-2.5 text-[#796c88] hover:text-[#5b3b92]" title="Log out"><LogOut size={16} /></button></div></header><div className="p-5 md:p-10"><div className="mb-8 flex items-center justify-between"><div><Pill>{active}</Pill><p className="mt-3 max-w-lg text-sm leading-6 text-[#81758e]">{active === "Overview" ? isAdmin ? "A clear view of what is happening across Rasi Maths today." : "Everything you need to keep learning steady and visible." : `${active} is ready for your ${user.role === "admin" ? "management" : "review"}.`}</p></div><div className="hidden rounded-2xl bg-[#f4e9dd] p-4 text-[#a7633e] md:block"><ShieldCheck size={20} /><p className="mt-2 text-[11px] font-semibold">Privacy-first access</p></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([value, label, Icon]) => <div key={label as string} className="rounded-3xl border border-[#eee6f0] bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-3xl font-semibold text-[#5b3b92]">{value as string}</p><span className="rounded-xl bg-[#f4edf9] p-2 text-[#8060ac]"><Icon size={17} /></span></div><p className="mt-6 text-xs text-[#877b91]">{label as string}</p></div>)}</div><div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><div className="rounded-3xl border border-[#eee6f0] bg-white p-6"><div className="flex items-center justify-between"><h2 className="font-semibold">{isAdmin ? "Recent activity" : "Your learning snapshot"}</h2><button className="text-xs font-semibold text-[#6d4b9f]">View all <ChevronRight className="inline" size={14} /></button></div><div className="mt-6 space-y-4">{(isAdmin ? [["New marks uploaded", "Grade 10 Mathematics · 12 minutes ago"], ["Attendance updated", "Physics batch · Today, 9:40 AM"], ["Demo request received", "Parent enquiry · Yesterday"]] : [["Mathematics", "Unit test · 18 / 20", "On track"], ["Physics", "Next class · Tuesday, 5:00 PM", "Upcoming"], ["Study plan", "3 tasks due this week", "Keep going"]]).map((r, i) => <div className="flex items-center justify-between rounded-2xl bg-[#faf7fc] p-4" key={r[0]}><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9ddf4] text-[#6e4b9e]"><Check size={16} /></span><div><p className="text-sm font-semibold">{r[0]}</p><p className="mt-1 text-xs text-[#8d8197]">{r[1]}</p></div></div><span className="text-[11px] font-semibold text-[#ef8656]">{r[2]}</span></div>)}</div></div><div className="rounded-3xl bg-[#5b3b92] p-6 text-white"><Sparkles className="text-[#f8b08b]" size={20} /><h2 className="mt-8 text-2xl font-semibold">Small steps,<br /><em className="font-serif font-normal">strong habits.</em></h2><p className="mt-4 text-sm leading-6 text-white/65">Consistency makes the difference. Keep showing up for the next question.</p><button className="mt-8 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-[#5b3b92]">Open learning plan <ArrowRight className="ml-1 inline" size={13} /></button></div></div></div></main></div>;
}

export default function Home() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedEmail = sessionStorage.getItem("demo-user-email");
      if (savedEmail && demoUsers[savedEmail]) {
        return demoUsers[savedEmail];
      }
    } catch {}
    return null;
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activePortal, setActivePortal] = useState(false);

  const isPortalUrl = typeof window !== "undefined" && window.location.pathname.startsWith("/portal");
  const secureUser = auth.user && ["admin", "student", "parent", "teacher"].includes(auth.user.role)
    ? { role: auth.user.role as Role, name: auth.user.name ?? auth.user.email ?? "Portal user", email: auth.user.email ?? "" }
    : null;
  const currentUser = secureUser || user;

  const logout = () => {
    if (secureUser) void auth.logout();
    try {
      sessionStorage.removeItem("demo-user-email");
    } catch {}
    setUser(null);
    setActivePortal(false);
  };

  if (currentUser && (activePortal || isPortalUrl)) {
    if (currentUser.role === "student") return <StudentWorkspace user={currentUser} onLogout={logout} />;
    if (currentUser.role === "parent") return <ParentWorkspace user={currentUser} onLogout={logout} />;
    if (currentUser.role === "teacher") return <TeacherWorkspace user={currentUser} onLogout={logout} />;
    if (currentUser.role === "admin") return <AdminWorkspace user={currentUser} onLogout={logout} />;
  }

  if (selectedRole) {
    return (
      <RoleLoginPage
        role={selectedRole}
        onBack={() => setSelectedRole(null)}
        onLogin={(u) => {
          setUser(u);
          setActivePortal(true);
        }}
      />
    );
  }

  return (
    <>
      <Portfolio
        onLogin={() => setLoginOpen(true)}
        user={currentUser}
        onGoToPortal={() => setActivePortal(true)}
        onLogout={logout}
      />
      {(loginOpen || (isPortalUrl && !currentUser)) && (
        <RoleChooser
          onClose={() => setLoginOpen(false)}
          onChoose={(role) => {
            setLoginOpen(false);
            setSelectedRole(role);
          }}
        />
      )}
    </>
  );
}

