import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, Edit3, FilePlus2, LogOut, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SubjectRecord } from "./Home";

type SubjectForm = Omit<SubjectRecord, "id">;

const blankSubject: SubjectForm = {
  name: "",
  code: "",
  summary: "",
  paperLabel: "Practice paper",
  durationMinutes: 60,
  questionCount: 20,
  accentColor: "#5968a9",
  isFeatured: 0,
  sortOrder: 10,
};

function Logo() {
  return <a href="/" className="flex items-center gap-3 text-[#251f37]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2f315d] text-xs font-bold tracking-[0.12em] text-white shadow-[0_8px_0_#e9b08f]">RM</span><span className="leading-tight"><strong className="block text-sm font-bold">Rasi Maths</strong><small className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#90859b]">Tuition centre</small></span></a>;
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#756a7a]">{label}<input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-[#ded4c8] bg-[#fffdfa] px-3 py-2.5 text-sm font-normal tracking-normal text-[#322743] outline-none transition focus:border-[#5968a9] focus:ring-2 focus:ring-[#5968a9]/10" /></label>;
}

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const subjectsQuery = trpc.subjects.all.useQuery(undefined, { retry: false, enabled: Boolean(user?.role === "admin") });
  const utils = trpc.useUtils();
  const createMutation = trpc.subjects.create.useMutation({ onSuccess: () => { utils.subjects.all.invalidate(); utils.subjects.featured.invalidate(); closeEditor(); } });
  const updateMutation = trpc.subjects.update.useMutation({ onSuccess: () => { utils.subjects.all.invalidate(); utils.subjects.featured.invalidate(); closeEditor(); } });
  const deleteMutation = trpc.subjects.delete.useMutation({ onSuccess: () => { utils.subjects.all.invalidate(); utils.subjects.featured.invalidate(); } });
  const [editing, setEditing] = useState<SubjectRecord | null>(null);
  const [form, setForm] = useState<SubjectForm>(blankSubject);
  const [formError, setFormError] = useState("");

  function closeEditor() {
    setEditing(null);
    setForm(blankSubject);
    setFormError("");
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...blankSubject, sortOrder: (subjectsQuery.data?.length ?? 0) + 1 });
    setFormError("");
  }

  function openEdit(subject: SubjectRecord) {
    setEditing(subject);
    setForm({ ...subject });
    setFormError("");
  }

  useEffect(() => {
    const message = createMutation.error?.message || updateMutation.error?.message;
    if (message) setFormError(message);
  }, [createMutation.error, updateMutation.error]);

  const featuredCount = useMemo(() => subjectsQuery.data?.filter(subject => subject.isFeatured === 1).length ?? 0, [subjectsQuery.data]);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function updateForm<Key extends keyof SubjectForm>(key: Key, value: SubjectForm[Key]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    const input = { ...form, durationMinutes: Number(form.durationMinutes), questionCount: Number(form.questionCount), isFeatured: Number(form.isFeatured), sortOrder: Number(form.sortOrder) };
    if (!input.name.trim() || !input.code.trim() || !input.summary.trim()) {
      setFormError("Name, code, and summary are required.");
      return;
    }
    if (editing) updateMutation.mutate({ id: editing.id, ...input });
    else createMutation.mutate(input);
  }

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f6f1e9] text-sm text-[#756a7a]">Checking admin access…</div>;
  if (!user) return <SignInState />;
  if (user.role !== "admin") return <AccessDenied onLogout={logout} />;

  return <div className="min-h-screen bg-[#f6f1e9] text-[#282039]">
    <header className="border-b border-[#e5dbcf] bg-[#f6f1e9]"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8"><Logo /><div className="flex items-center gap-3"><span className="hidden text-xs text-[#887b89] sm:inline">Signed in as {user.name || user.email}</span><button type="button" onClick={logout} className="flex items-center gap-2 rounded-full border border-[#d9cfc3] bg-[#fffdfa] px-3 py-2 text-xs font-bold text-[#6c6072] transition hover:border-[#aaa0c0]"><LogOut size={14} /> Sign out</button></div></div></header>
    <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#e0784f]"><ShieldCheck size={14} /> Centre admin</div><h1 className="mt-3 text-4xl font-extrabold tracking-[-0.07em] text-[#282039]">Question paper desk</h1><p className="mt-3 max-w-lg text-sm leading-6 text-[#756a7a]">Create, edit, reorder, feature, or remove subjects. The student page always shows exactly three featured papers.</p></div><button type="button" onClick={openCreate} className="flex items-center justify-center gap-2 rounded-xl bg-[#2f315d] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_#e9b08f] transition hover:bg-[#25274e] active:translate-y-px"><Plus size={17} /> Add subject</button></div>
      <div className="mt-9 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-[#e2d8cc] bg-[#fffdfa] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#918596]">Total papers</p><p className="mt-3 text-3xl font-extrabold text-[#2f315d]">{subjectsQuery.data?.length ?? 0}</p></div><div className="rounded-2xl border border-[#e2d8cc] bg-[#fffdfa] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#918596]">Featured on home</p><p className="mt-3 text-3xl font-extrabold text-[#e0784f]">{featuredCount} <span className="text-base font-semibold text-[#918596]">/ 3</span></p></div><div className="rounded-2xl border border-[#e2d8cc] bg-[#fffdfa] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#918596]">Access level</p><p className="mt-3 text-lg font-extrabold text-[#3c8e83]">Admin only</p></div></div>
      <section className="mt-8 overflow-hidden rounded-2xl border border-[#e2d8cc] bg-[#fffdfa] shadow-[0_16px_35px_rgba(62,45,70,0.05)]"><div className="flex items-center justify-between border-b border-[#e8ded3] px-5 py-4"><div><h2 className="font-bold text-[#2f315d]">Subject catalogue</h2><p className="mt-1 text-xs text-[#918596]">Keep three papers featured; additional subjects stay available in the admin catalogue.</p></div><FilePlus2 size={18} className="text-[#e0784f]" /></div>{subjectsQuery.isLoading ? <div className="p-8 text-sm text-[#887b89]">Loading subject catalogue…</div> : subjectsQuery.error ? <div className="p-8 text-sm text-red-600">Could not load subjects. Check that your admin account is connected.</div> : <div className="divide-y divide-[#eee6dd]">{subjectsQuery.data?.map(subject => <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between" key={subject.id}><div className="flex min-w-0 items-start gap-4"><span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: subject.accentColor }} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#332746]">{subject.name}</h3><span className="rounded-full bg-[#f3ece4] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a7d8c]">{subject.code}</span>{subject.isFeatured === 1 && <span className="rounded-full bg-[#e8f3ed] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#3c8e83]">Featured</span>}</div><p className="mt-2 max-w-2xl truncate text-sm text-[#827687]">{subject.summary}</p><p className="mt-2 text-xs text-[#9a8d98]">{subject.questionCount} questions · {subject.durationMinutes} minutes · {subject.paperLabel}</p></div></div><div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => openEdit(subject)} className="flex items-center gap-2 rounded-lg border border-[#dcd1c5] px-3 py-2 text-xs font-bold text-[#5968a9] transition hover:bg-[#f3f0f8]"><Edit3 size={14} /> Edit</button><button type="button" onClick={() => { if (window.confirm(`Delete ${subject.name}?`)) deleteMutation.mutate({ id: subject.id }); }} className="grid h-9 w-9 place-items-center rounded-lg border border-[#edd5d2] text-[#c36661] transition hover:bg-[#fff1ef]" aria-label={`Delete ${subject.name}`}><Trash2 size={14} /></button></div></div>)}{subjectsQuery.data?.length === 0 && <div className="p-8 text-center text-sm text-[#887b89]">No subjects yet. Add the first question paper.</div>}</div>}</section>
    </main>
    {(editing || form.name !== "" || form.code !== "" || form.summary !== "") && <div className="fixed inset-0 z-40 grid place-items-center bg-[#24203b]/45 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/50 bg-[#f6f1e9] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e0784f]">{editing ? "Edit paper" : "New paper"}</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-[#2f315d]">{editing ? `Update ${editing.name}` : "Add a subject paper"}</h2></div><button type="button" onClick={closeEditor} className="grid h-9 w-9 place-items-center rounded-full bg-[#fffdfa] text-[#776b7b]" aria-label="Close editor"><X size={17} /></button></div><form onSubmit={submit} className="mt-6 space-y-5"><div className="grid gap-4 sm:grid-cols-[1fr_150px]"><Field label="Subject name" value={form.name} onChange={value => updateForm("name", value)} placeholder="e.g. MATHS" /><Field label="Code" value={form.code} onChange={value => updateForm("code", value)} placeholder="MTH-01" /></div><Field label="Summary" value={form.summary} onChange={value => updateForm("summary", value)} placeholder="A short description for the student card" /><div className="grid gap-4 sm:grid-cols-3"><Field label="Paper label" value={form.paperLabel} onChange={value => updateForm("paperLabel", value)} placeholder="Foundation paper" /><Field label="Questions" type="number" value={form.questionCount} onChange={value => updateForm("questionCount", Number(value))} /><Field label="Minutes" type="number" value={form.durationMinutes} onChange={value => updateForm("durationMinutes", Number(value))} /></div><div className="grid gap-4 sm:grid-cols-[150px_150px_1fr]"><Field label="Sort order" type="number" value={form.sortOrder} onChange={value => updateForm("sortOrder", Number(value))} /><label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#756a7a]">Accent<input type="color" value={form.accentColor} onChange={event => updateForm("accentColor", event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-[#ded4c8] bg-[#fffdfa] p-1" /></label><label className="flex items-center gap-3 self-end rounded-xl border border-[#ded4c8] bg-[#fffdfa] px-3 py-3 text-xs font-bold text-[#756a7a]"><input type="checkbox" checked={form.isFeatured === 1} onChange={event => updateForm("isFeatured", event.target.checked ? 1 : 0)} className="h-4 w-4 accent-[#2f315d]" /> Show as one of the three featured papers</label></div>{formError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{formError}</p>}<div className="flex justify-end gap-3 border-t border-[#ded4c8] pt-5"><button type="button" onClick={closeEditor} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#756a7a]">Cancel</button><button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-[#2f315d] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{isSaving ? "Saving…" : <><Check size={15} /> Save paper</>}</button></div></form></div></div>}
  </div>;
}

function SignInState() {
  return <div className="grid min-h-screen place-items-center bg-[#f6f1e9] px-5"><div className="w-full max-w-md rounded-2xl border border-[#e2d8cc] bg-[#fffdfa] p-8 text-center shadow-[0_18px_40px_rgba(62,45,70,0.08)]"><Logo /><div className="mx-auto mt-10 grid h-14 w-14 place-items-center rounded-2xl bg-[#ece8f6] text-[#5968a9]"><ShieldCheck size={24} /></div><h1 className="mt-6 text-3xl font-extrabold tracking-[-0.06em] text-[#2f315d]">Admin access</h1><p className="mt-3 text-sm leading-6 text-[#756a7a]">Sign in with the centre’s authorised account to manage the subject papers.</p><button type="button" onClick={() => startLogin()} className="mt-7 w-full rounded-xl bg-[#2f315d] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_#e9b08f]">Sign in to continue</button><a href="/" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#5968a9]"><ArrowLeft size={14} /> Back to question papers</a></div></div>;
}

function AccessDenied({ onLogout }: { onLogout: () => void }) {
  return <div className="grid min-h-screen place-items-center bg-[#f6f1e9] px-5"><div className="w-full max-w-md rounded-2xl border border-[#edd5d2] bg-[#fffdfa] p-8 text-center"><ShieldCheck className="mx-auto text-[#c36661]" size={26} /><h1 className="mt-5 text-2xl font-extrabold text-[#2f315d]">Admin access required</h1><p className="mt-3 text-sm leading-6 text-[#756a7a]">This account is signed in, but it does not have permission to edit question papers.</p><div className="mt-7 flex justify-center gap-3"><a href="/" className="rounded-xl border border-[#dcd1c5] px-4 py-2.5 text-sm font-bold text-[#5968a9]">Back home</a><button type="button" onClick={onLogout} className="rounded-xl bg-[#2f315d] px-4 py-2.5 text-sm font-bold text-white">Sign out</button></div></div></div>;
}
