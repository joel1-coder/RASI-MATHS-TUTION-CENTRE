import { useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { readSiteData, defaultTechnicalColleges, defaultNonTechnicalColleges, type CollegeItem } from "@/lib/siteData";

type Category = "technical" | "non-technical";
type Tier = "Tier 1" | "Tier 2" | "Tier 3";

const TIER_COLORS: Record<Tier, { bg: string; text: string; border: string; dot: string }> = {
  "Tier 1": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  "Tier 2": { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
  "Tier 3": { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-400"   },
};

function TierBadge({ tier }: { tier: Tier }) {
  const c = TIER_COLORS[tier];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text} border ${c.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {tier}
    </span>
  );
}

function CollegeTable({ colleges, sno_offset = 0 }: { colleges: CollegeItem[]; sno_offset?: number }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b-2 border-[#e8e0f0]">
          <th className="py-3 pl-4 pr-2 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#8d7aa5] w-12">S.No</th>
          <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#8d7aa5]">Name of College</th>
          <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#8d7aa5] hidden sm:table-cell">Location</th>
          <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#8d7aa5]">Tier</th>
          <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#8d7aa5]">Cutoff</th>
          <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#8d7aa5] hidden md:table-cell">Website</th>
        </tr>
      </thead>
      <tbody>
        {colleges.map((college, idx) => (
          <tr key={college.id} className="border-b border-[#f0e8f8] transition hover:bg-[#faf6ff]">
            <td className="py-3.5 pl-4 pr-2 text-center text-sm font-medium text-[#a09ab0]">
              {sno_offset + idx + 1}
            </td>
            <td className="py-3.5 px-4">
              <p className="font-semibold text-[#2f1f4a]">{college.name}</p>
              <p className="mt-0.5 text-xs text-[#8d7aa5] sm:hidden">{college.location}</p>
            </td>
            <td className="py-3.5 px-4 text-[#6b5a82] hidden sm:table-cell">{college.location}</td>
            <td className="py-3.5 px-4"><TierBadge tier={college.tier} /></td>
            <td className="py-3.5 px-4 font-semibold text-[#5b3b92]">{college.cutoff}</td>
            <td className="py-3.5 px-4 hidden md:table-cell">
              {college.link ? (
                <a href={college.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b3b92] hover:underline">
                  Visit <ExternalLink size={11} />
                </a>
              ) : <span className="text-xs text-[#c0b5d0]">—</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TierSection({ tier, colleges, sno_offset }: { tier: Tier; colleges: CollegeItem[]; sno_offset: number }) {
  if (!colleges.length) return null;
  const c = TIER_COLORS[tier];
  return (
    <div className="mb-8">
      <div className={`mb-3 flex items-center gap-2 rounded-xl px-4 py-2.5 ${c.bg} border ${c.border}`}>
        <span className={`h-2 w-2 rounded-full ${c.dot}`} />
        <h3 className={`text-sm font-bold ${c.text}`}>{tier}</h3>
        <span className={`ml-auto text-xs font-semibold ${c.text} opacity-70`}>{colleges.length} college{colleges.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[#ede6f8]">
        <CollegeTable colleges={colleges} sno_offset={sno_offset} />
      </div>
    </div>
  );
}

export default function CollegesPage() {
  const siteData = readSiteData();
  const [activeTab, setActiveTab] = useState<Category>("technical");

  const rawTechnical = siteData.technicalColleges;
  const rawNonTechnical = siteData.nonTechnicalColleges;

  // Fallback to hardcoded defaults if localStorage data is empty/stale
  const allTechnical = rawTechnical.length > 0 ? rawTechnical : defaultTechnicalColleges;
  const allNonTechnical = rawNonTechnical.length > 0 ? rawNonTechnical : defaultNonTechnicalColleges;

  const colleges = activeTab === "technical" ? allTechnical : allNonTechnical;
  const tier1 = colleges.filter(c => c.tier === "Tier 1");
  const tier2 = colleges.filter(c => c.tier === "Tier 2");
  const tier3 = colleges.filter(c => c.tier === "Tier 3");

  return (
    <div className="min-h-screen bg-[#faf7fc]">
      <header className="sticky top-0 z-20 border-b border-[#ede6f8] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[#5b3b92] transition hover:bg-[#f0e8f8]">
            <ArrowLeft size={15} />
            Back to home
          </a>
          <div className="flex-1" />
          <span className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#2f315d] text-[10px] font-bold text-white">RM</span>
            <span className="hidden text-sm font-semibold text-[#2f1f4a] sm:block">Rasi Maths Tuition Centre</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef8656]">Where our students go</p>
          <h1 className="mt-2 text-3xl font-bold text-[#2f1f4a] sm:text-4xl">College Details</h1>
          <p className="mt-2 text-sm text-[#8d7aa5]">
            Browse Technical and Non-Technical institutions by tier. Cutoff figures are indicative — check official notifications for the latest data.
          </p>
        </div>

        <div className="mb-8 flex gap-2">
          <button
            onClick={() => setActiveTab("technical")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === "technical" ? "bg-[#5b3b92] text-white shadow-md" : "border border-[#e4dce9] bg-white text-[#6d4b9f] hover:bg-[#f0e8f8]"}`}
          >
            Technical ({allTechnical.length})
          </button>
          <button
            onClick={() => setActiveTab("non-technical")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === "non-technical" ? "bg-[#5b3b92] text-white shadow-md" : "border border-[#e4dce9] bg-white text-[#6d4b9f] hover:bg-[#f0e8f8]"}`}
          >
            Non-Technical ({allNonTechnical.length})
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          {(["Tier 1", "Tier 2", "Tier 3"] as Tier[]).map(tier => (
            <div key={tier} className="flex items-center gap-1.5 text-xs text-[#8d7aa5]">
              <span className={`h-2 w-2 rounded-full ${TIER_COLORS[tier].dot}`} />
              <span className="font-semibold">{tier}</span>
              <span className="opacity-60">—</span>
              <span>{tier === "Tier 1" ? "Premier / highly competitive" : tier === "Tier 2" ? "Well-established, moderate cutoff" : "Accessible, broad intake"}</span>
            </div>
          ))}
        </div>

        <TierSection tier="Tier 1" colleges={tier1} sno_offset={0} />
        <TierSection tier="Tier 2" colleges={tier2} sno_offset={tier1.length} />
        <TierSection tier="Tier 3" colleges={tier3} sno_offset={tier1.length + tier2.length} />

        <div className="mt-6 rounded-2xl bg-[#fff5ed] p-4 text-xs leading-5 text-[#8b6b5c]">
          <strong className="block text-[#5d3c2a]">Disclaimer</strong>
          Cutoff figures shown are indicative and based on historical data. Official cutoffs vary by year, branch, and reservation category. Always verify with the institution's official notification before applying.
        </div>
      </main>

      <footer className="mt-8 border-t border-[#ede6f8] py-6 text-center text-xs text-[#a09ab0]">
        © 2026 Rasi Maths Tuition Centre · Learning, thoughtfully.
      </footer>
    </div>
  );
}
