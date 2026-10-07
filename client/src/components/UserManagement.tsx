import { useState, useEffect } from "react";
import { Edit3, Plus, Trash2, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { INITIAL_DEPARTMENTS } from "../pages/Home";

type UserRole = "student" | "teacher" | "parent";

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  linkedStudentEmail?: string;
  grade?: string;
  section?: string;
  subject?: string;
};

/** Adapt DB user rows to UI UserAccount shape */
function dbUserToAccount(u: {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  portalPassword: string | null;
  role: string;
  linkedStudentEmail: string | null;
}): UserAccount {
  return {
    id: u.openId,
    name: u.name ?? "",
    email: u.email ?? "",
    password: u.portalPassword ?? "",
    role: u.role as UserRole,
    linkedStudentEmail: u.linkedStudentEmail ?? undefined,
  };
}

export function UserManagement() {
  const [activeTab, setActiveTab] = useState<UserRole>("student");
  const [isEditing, setIsEditing] = useState<UserAccount | null>(null);
  const [showForm, setShowForm] = useState(false);

  // ── Server data ────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();
  const { data: rawUsers = [], isLoading, refetch } = trpc.admin.listPortalUsers.useQuery({});

  const createMutation  = trpc.admin.createPortalUser.useMutation();
  const updateMutation  = trpc.admin.updatePortalUser.useMutation();
  const deleteMutation  = trpc.admin.deletePortalUser.useMutation();

  // Map all DB users to UI shape
  const accounts: UserAccount[] = (rawUsers as any[]).map(dbUserToAccount);
  const filteredAccounts = accounts.filter(a => a.role === activeTab);

  // ── Sync to localStorage for offline / same-device fallback ───────────────
  useEffect(() => {
    if (accounts.length > 0) {
      try {
        localStorage.setItem("rasi_user_accounts", JSON.stringify(accounts));
      } catch {}
    }
  }, [rawUsers]);

  const handleSave = async (acc: UserAccount) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          email: acc.email,
          name: acc.name,
          password: acc.password,
          role: acc.role,
          linkedStudentEmail: acc.linkedStudentEmail ?? null,
        });
        toast.success("Account updated in database ✓");
      } else {
        await createMutation.mutateAsync({
          email: acc.email,
          name: acc.name,
          password: acc.password,
          role: acc.role,
          linkedStudentEmail: acc.linkedStudentEmail ?? null,
        });
        toast.success("Account created in database ✓");
      }
      await utils.admin.listPortalUsers.invalidate();
      setShowForm(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save account");
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      await deleteMutation.mutateAsync({ email });
      await utils.admin.listPortalUsers.invalidate();
      toast.success("Account deleted ✓");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete account");
    }
  };

  return (
    <div className="rounded-3xl border border-[#e5dbcf] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#322743]">User Management</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-[#e2d8cc] px-3 py-2 text-xs font-bold text-[#756a7a] hover:bg-[#faf7f4]"
            title="Refresh from database"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => { setIsEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 rounded-xl bg-[#2f315d] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_0_#e9b08f] transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_#e9b08f]"
          >
            <Plus size={16} /> Add {activeTab === "student" ? "Student" : activeTab === "teacher" ? "Teacher" : "Parent"}
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-[#e2d8cc] pb-4">
        {(["student", "teacher", "parent"] as const).map(role => (
          <button
            key={role}
            onClick={() => setActiveTab(role)}
            className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${
              activeTab === role
                ? "bg-[#5968a9] text-white"
                : "border border-[#e4dce9] bg-white text-[#756a7a] hover:bg-[#ede7df]"
            }`}
          >
            {role}s ({accounts.filter(a => a.role === role).length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-sm text-[#8d8197]">Loading from database…</div>
      ) : showForm ? (
        <UserForm
          role={activeTab}
          initialData={isEditing}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          allAccounts={accounts}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      ) : (
        <div className="overflow-x-auto">
          {filteredAccounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8cee6] bg-[#faf7fc] p-10 text-center text-[#756a7a]">
              No {activeTab} accounts found. Click "Add {activeTab}" to create one.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#e5dbcf] bg-[#f9f7f4] text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
                <tr>
                  <th className="px-4 py-3">Name &amp; Email (Login ID)</th>
                  {activeTab === "student" && <th className="px-4 py-3">Class/Section</th>}
                  {activeTab === "teacher" && <th className="px-4 py-3">Subject</th>}
                  {activeTab === "parent" && <th className="px-4 py-3">Linked Student</th>}
                  <th className="px-4 py-3">Password</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(account => (
                  <tr key={account.id} className="border-b border-[#f0ece5] last:border-0 hover:bg-[#fcfbfc]">
                    <td className="px-4 py-4">
                      <div className="font-bold text-[#322743]">{account.name}</div>
                      <div className="text-xs text-[#887b89]">{account.email}</div>
                    </td>
                    {activeTab === "student" && (
                      <td className="px-4 py-4 font-medium text-[#5968a9]">{account.grade ?? "—"} {account.section ? `- ${account.section}` : ""}</td>
                    )}
                    {activeTab === "teacher" && (
                      <td className="px-4 py-4 font-medium text-[#5968a9]">{account.subject ?? "—"}</td>
                    )}
                    {activeTab === "parent" && (
                      <td className="px-4 py-4 font-medium text-[#5968a9]">
                        {account.linkedStudentEmail || "None"}
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <PasswordDisplay password={account.password} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => { setIsEditing(account); setShowForm(true); }} className="mr-2 text-[#5968a9] hover:text-[#2f315d]">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(account.email)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function PasswordDisplay({ password }: { password: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded bg-[#f5f0fb] px-2 py-1 font-mono text-xs text-[#6d4b9f] w-max">
      {show ? password : "••••••••"}
      <button onClick={() => setShow(!show)} className="opacity-50 hover:opacity-100">
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    </div>
  );
}

function UserForm({
  role,
  initialData,
  onSave,
  onCancel,
  allAccounts,
  isSaving,
}: {
  role: UserRole;
  initialData: UserAccount | null;
  onSave: (data: UserAccount) => void;
  onCancel: () => void;
  allAccounts: UserAccount[];
  isSaving?: boolean;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState(initialData?.password || "");
  const [grade, setGrade] = useState(initialData?.grade || INITIAL_DEPARTMENTS[4]);
  const [section, setSection] = useState(initialData?.section || "A");
  const [subject, setSubject] = useState(initialData?.subject || "Mathematics");
  const [linkedStudentEmail, setLinkedStudentEmail] = useState(initialData?.linkedStudentEmail || "");

  const studentAccounts = allAccounts.filter(a => a.role === "student");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id ?? crypto.randomUUID(),
      role,
      name,
      email,
      password,
      ...(role === "student" && { grade, section }),
      ...(role === "teacher" && { subject }),
      ...(role === "parent" && { linkedStudentEmail }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#e5dbcf] bg-[#fffdfa] p-6">
      <h3 className="mb-4 text-lg font-bold text-[#322743]">
        {initialData ? "Edit" : "Create"} {role} account
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
          Full Name
          <input required type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#ded4c8] px-3 py-2 text-sm outline-none focus:border-[#5968a9]" />
        </label>

        <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
          Login Email / ID
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!!initialData} className="mt-1 w-full rounded-xl border border-[#ded4c8] px-3 py-2 text-sm outline-none focus:border-[#5968a9] disabled:bg-[#f5f0f8] disabled:text-[#9a8faa]" />
        </label>

        <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
          Password
          <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-[#ded4c8] px-3 py-2 text-sm outline-none focus:border-[#5968a9]" placeholder="min. 4 characters" />
        </label>

        {role === "student" && (
          <>
            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
              Grade
              <select value={grade} onChange={e => setGrade(e.target.value)} className="mt-1 w-full rounded-xl border border-[#ded4c8] px-3 py-2 text-sm outline-none focus:border-[#5968a9]">
                {INITIAL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
              Section
              <input type="text" value={section} onChange={e => setSection(e.target.value)} className="mt-1 w-full rounded-xl border border-[#ded4c8] px-3 py-2 text-sm outline-none focus:border-[#5968a9]" />
            </label>
          </>
        )}

        {role === "teacher" && (
          <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
            Subject
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full rounded-xl border border-[#ded4c8] px-3 py-2 text-sm outline-none focus:border-[#5968a9]" />
          </label>
        )}

        {role === "parent" && (
          <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
            Linked Student
            <select value={linkedStudentEmail} onChange={e => setLinkedStudentEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-[#ded4c8] px-3 py-2 text-sm outline-none focus:border-[#5968a9]">
              <option value="">Select a student...</option>
              {studentAccounts.map(s => (
                <option key={s.email} value={s.email}>{s.name} ({s.email})</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-sm font-bold text-[#756a7a] hover:bg-[#ede7df]">
          Cancel
        </button>
        <button type="submit" disabled={isSaving} className="rounded-xl bg-[#5968a9] px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-[#2f315d] disabled:opacity-60">
          {isSaving ? "Saving…" : "Save to Database"}
        </button>
      </div>
    </form>
  );
}
