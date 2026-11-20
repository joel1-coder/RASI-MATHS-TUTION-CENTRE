import { ArrowLeft, ExternalLink } from "lucide-react";
import { defaultGovExams, type GovExam } from "@/lib/siteData";

function ExamTable({ exams }: { exams: GovExam[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#ede6f8] bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-[#e8e0f0]">
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#8d7aa5]">Approx. month</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#8d7aa5]">Examination</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#8d7aa5]">Required qualification</th>
            <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#8d7aa5] sm:table-cell">Conducting body</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#8d7aa5]">Details</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => (
            <tr key={exam.id} className="border-b border-[#f0e8f8] transition hover:bg-[#faf6ff]">
              <td className="px-4 py-3.5 font-semibold text-[#5b3b92]">{exam.month}</td>
              <td className="px-4 py-3.5">
                <p className="font-semibold text-[#2f1f4a]">{exam.name}</p>
                <p className="mt-0.5 text-xs text-[#8d7aa5]">{exam.group}</p>
              </td>
              <td className="px-4 py-3.5 text-[#6b5a82]">{exam.eligibility || "12th pass; verify the notification"}</td>
              <td className="hidden px-4 py-3.5 text-[#6b5a82] sm:table-cell">{exam.group === "Tamil Nadu Government" ? "Tamil Nadu Government" : "Central Government"}</td>
              <td className="px-4 py-3.5">
                {exam.link ? <a href={exam.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b3b92] hover:underline">Official portal <ExternalLink size={11} /></a> : <span className="text-xs text-[#c0b5d0]">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GovernmentExamsPage() {
  return (
    <div className="min-h-screen bg-[#faf7fc]">
      <header className="sticky top-0 z-20 border-b border-[#ede6f8] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[#5b3b92] transition hover:bg-[#f0e8f8]"><ArrowLeft size={15} /> Back to home</a>
          <div className="flex-1" />
          <span className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#2f315d] text-[10px] font-bold text-white">RM</span><span className="hidden text-sm font-semibold text-[#2f1f4a] sm:block">Rasi Maths Tuition Centre</span></span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">Career &amp; aspirations</p>
          <h1 className="mt-2 text-3xl font-bold text-[#2f1f4a] sm:text-4xl">Government Exam Details</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#8d7aa5]">Approximate recurring months for 12th-pass-eligible Central and Tamil Nadu government examinations. Dates, vacancies and post-wise qualifications change each year, so verify the official notification.</p>
        </div>
        <ExamTable exams={defaultGovExams} />
        <div className="mt-6 rounded-2xl bg-[#fff5ed] p-4 text-xs leading-5 text-[#8b6b5c]">
          <strong className="block text-[#5d3c2a]">Important</strong>
          The month shown is an approximate recurring period, not a confirmed examination date. TNPSC, TNUSRB and department recruitments are notification-based and may not be conducted every year.
        </div>
      </main>

      <footer className="mt-8 border-t border-[#ede6f8] py-6 text-center text-xs text-[#a09ab0]">© 2026 Rasi Maths Tuition Centre · Learning, thoughtfully.</footer>
    </div>
  );
}
