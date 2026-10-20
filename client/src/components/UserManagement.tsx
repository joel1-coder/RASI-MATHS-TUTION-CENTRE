import { useState, useEffect, useMemo } from "react";
import { Edit3, Plus, Trash2, Eye, EyeOff, RefreshCw, Search, Shield, User, Users, GraduationCap, Sparkles, Check, X, Calendar, BookOpen, Layers, Clock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { INITIAL_DEPARTMENTS, loadStoredSections } from "../pages/Home";

export type UserRole = "teacher" | "admin" | "student" | "parent";

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  linkedStudentEmail?: string;
  department?: string;
  section?: string;
  session?: string;
  joinedDate?: string;
  subject?: string;
};

/** Adapt DB user rows to UI UserAccount shape */
function dbUserToAccount(u: any): UserAccount {
  return {
    id: u.openId || String(u.id),
    name: u.name ?? "",
    email: u.email ?? "",
    password: u.portalPassword ?? "",
    role: (u.role as UserRole) || "student",
    linkedStudentEmail: u.linkedStudentEmail ?? undefined,
    department: u.department ?? undefined,
    section: u.section ?? undefined,
    session: u.session ?? undefined,
    joinedDate: u.joinedDate ?? (u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : undefined),
    subject: u.subject ?? undefined,
  };
}

const COMMON_SESSIONS = [
  "Morning Session (6:00 AM – 8:00 AM)",
  "Evening Session (5:00 PM – 7:00 PM)",
  "Regular Day Batch",
  "Weekend Intensive",
  "2026–2027 Academic Year",
];

export function UserManagement() {
  const [activeTab, setActiveTab] = useState<UserRole | "all">("all");
  const [isEditing, setIsEditing] = useState<UserAccount | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Server data ────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();
  const { data: rawUsers = [], isLoading, refetch } = trpc.admin.listPortalUsers.useQuery({}, {
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  const createMutation = trpc.admin.createPortalUser.useMutation();
  const updateMutation = trpc.admin.updatePortalUser.useMutation();
  const deleteMutation = trpc.admin.deletePortalUser.useMutation();

  // Map all DB users to UI shape
  const accounts: UserAccount[] = useMemo(() => {
    return (rawUsers as any[]).map(dbUserToAccount);
  }, [rawUsers]);

  // Sync to localStorage for offline fallback & integration with other tabs
  useEffect(() => {
    if (accounts.length > 0) {
      try {
        localStorage.setItem("rasi_user_accounts", JSON.stringify(accounts));

        // Also sync students into rasi_v2_admin_students
        const existingStudentsRaw = localStorage.getItem("rasi_v2_admin_students");
        let existingStudents: any[] = existingStudentsRaw ? JSON.parse(existingStudentsRaw) : [];
        const studentAccounts = accounts.filter(a => a.role === "student");

        studentAccounts.forEach(stu => {
          const idx = existingStudents.findIndex(s => s.email?.toLowerCase() === stu.email?.toLowerCase());
          const mappedStudent = {
            id: `stu-${stu.id}`,
            studentId: stu.email.split("@")[0].toUpperCase(),
            name: stu.name,
            email: stu.email,
            department: stu.department || "Grade 10",
            section: stu.section || "A",
            status: "active",
            joinedDate: stu.joinedDate || new Date().toISOString().split("T")[0],
            studentPassword: stu.password,
          };
          if (idx >= 0) {
            existingStudents[idx] = { ...existingStudents[idx], ...mappedStudent };
          } else {
            existingStudents.push(mappedStudent);
          }
        });
        localStorage.setItem("rasi_v2_admin_students", JSON.stringify(existingStudents));
      } catch {}
    }
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      const matchesTab = activeTab === "all" ? true : a.role === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.department && a.department.toLowerCase().includes(q)) ||
        (a.section && a.section.toLowerCase().includes(q)) ||
        (a.session && a.session.toLowerCase().includes(q));
      return matchesTab && matchesSearch;
    });
  }, [accounts, activeTab, searchQuery]);

  const handleSave = async (acc: UserAccount) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          currentEmail: isEditing.email,
          email: acc.email,
          name: acc.name,
          password: acc.password,
          role: acc.role,
          linkedStudentEmail: acc.linkedStudentEmail ?? null,
          department: acc.department ?? null,
          section: acc.section ?? null,
          session: acc.session ?? null,
          joinedDate: acc.joinedDate ?? null,
        });
        toast.success(`Account for ${acc.name} updated in Supabase database ✓`);
      } else {
        await createMutation.mutateAsync({
          email: acc.email,
          name: acc.name,
          password: acc.password,
          role: acc.role,
          linkedStudentEmail: acc.linkedStudentEmail ?? null,
          department: acc.department ?? null,
          section: acc.section ?? null,
          session: acc.session ?? null,
          joinedDate: acc.joinedDate ?? null,
        });
        toast.success(`New ${acc.role} account created in Supabase database ✓`);
      }
      await utils.admin.listPortalUsers.invalidate();
      setShowForm(false);
      setIsEditing(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save user account");
    }
  };

  const handleDelete = async (acc: UserAccount) => {
    if (!confirm(`Are you sure you want to remove ${acc.name} (${acc.role}) from the portal database?`)) return;
    try {
      await deleteMutation.mutateAsync({ email: acc.email });
      await utils.admin.listPortalUsers.invalidate();
      toast.success(`User ${acc.name} removed successfully ✓`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete account");
    }
  };

  const counts = {
    all: accounts.length,
    teacher: accounts.filter(a => a.role === "teacher").length,
    admin: accounts.filter(a => a.role === "admin").length,
    student: accounts.filter(a => a.role === "student").length,
    parent: accounts.filter(a => a.role === "parent").length,
  };

  return (
    <div className="rounded-3xl border border-[#e5dbcf] bg-white p-6 shadow-sm">
      {/* Header bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.03em] text-[#322743]">User Management</h2>
          <p className="mt-1 text-xs text-[#8a7d92]">
            Create and manage access credentials for Teachers, Admins, Students, and Parents.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-[#e2d8cc] bg-[#fbf9f6] px-3 py-2 text-xs font-bold text-[#756a7a] transition hover:bg-[#ede7df]"
            title="Refresh accounts from Supabase"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => {
              setIsEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#2f315d] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_0_#e9b08f] transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_#e9b08f]"
          >
            <Plus size={16} /> Add User Account
          </button>
        </div>
      </div>

      {/* Role filter pills + Search */}
      <div className="mb-6 flex flex-col gap-3 border-b border-[#e2d8cc] pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "all"
                ? "bg-[#2f315d] text-white shadow-sm"
                : "border border-[#e4dce9] bg-[#faf7fc] text-[#756a7a] hover:bg-[#f0e8f8]"
            }`}
          >
            All Accounts ({counts.all})
          </button>
          <button
            onClick={() => setActiveTab("teacher")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "teacher"
                ? "bg-[#6d4b9f] text-white shadow-sm"
                : "border border-[#e4dce9] bg-white text-[#6d4b9f] hover:bg-[#f5effb]"
            }`}
          >
            Teachers ({counts.teacher})
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "admin"
                ? "bg-[#1e293b] text-white shadow-sm"
                : "border border-[#e4dce9] bg-white text-[#334155] hover:bg-[#f1f5f9]"
            }`}
          >
            Admins ({counts.admin})
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "student"
                ? "bg-[#0284c7] text-white shadow-sm"
                : "border border-[#e4dce9] bg-white text-[#0369a1] hover:bg-[#e0f2fe]"
            }`}
          >
            Students ({counts.student})
          </button>
          <button
            onClick={() => setActiveTab("parent")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "parent"
                ? "bg-[#d97706] text-white shadow-sm"
                : "border border-[#e4dce9] bg-white text-[#b45309] hover:bg-[#fef3c7]"
            }`}
          >
            Parents ({counts.parent})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8ea4]" />
          <input
            type="text"
            placeholder="Search name, email, class, section…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#ded4c8] bg-[#fdfcfb] py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#5968a9]"
          />
        </div>
      </div>

      {/* Main Form or List View */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-[#8d8197]">
          <RefreshCw className="mx-auto mb-2 animate-spin text-[#6d4b9f]" size={20} />
          Loading user accounts from database…
        </div>
      ) : showForm ? (
        <UserForm
          initialData={isEditing}
          defaultRole={activeTab === "all" ? "teacher" : activeTab}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setIsEditing(null);
          }}
          allAccounts={accounts}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      ) : (
        <div className="overflow-x-auto">
          {filteredAccounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8cee6] bg-[#faf7fc] p-12 text-center text-[#756a7a]">
              <Users className="mx-auto mb-2 text-[#a597b4]" size={28} />
              <p className="font-semibold text-[#322743]">No accounts found.</p>
              <p className="mt-1 text-xs text-[#8d8097]">
                Click "Add User Account" above to register a Teacher, Admin, Student, or Parent.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#e5dbcf] bg-[#f9f7f4] text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
                <tr>
                  <th className="px-4 py-3">User &amp; Email ID</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Password</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(account => (
                  <tr
                    key={account.id + account.role + account.email}
                    className="border-b border-[#f0ece5] transition last:border-0 hover:bg-[#fcfbfc]"
                  >
                    {/* User & Email */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#322743]">{account.name}</div>
                      <div className="text-xs text-[#887b89]">{account.email}</div>
                      {account.role === "parent" && account.linkedStudentEmail && (
                        <div className="mt-0.5 text-[11px] font-medium text-[#b45309]">
                          Linked: {account.linkedStudentEmail}
                        </div>
                      )}
                      {account.role === "teacher" && account.subject && (
                        <div className="mt-0.5 text-[11px] font-medium text-[#6d4b9f]">
                          Subject: {account.subject}
                        </div>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-3.5">
                      <RoleBadge role={account.role} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-xs text-[#5d5267]">
                      {account.joinedDate ? (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} className="text-[#a597b4]" />
                          {account.joinedDate}
                        </span>
                      ) : (
                        <span className="text-[#b0a5ba]">—</span>
                      )}
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5 text-xs font-semibold text-[#443854]">
                      {account.department || (account.role === "teacher" ? account.subject : "—")}
                    </td>

                    {/* Section */}
                    <td className="px-4 py-3.5 text-xs font-semibold text-[#5968a9]">
                      {account.section || "—"}
                    </td>

                    {/* Session */}
                    <td className="px-4 py-3.5 text-xs text-[#5b4f69]">
                      {account.session || "Regular"}
                    </td>

                    {/* Password */}
                    <td className="px-4 py-3.5">
                      <PasswordDisplay password={account.password} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setIsEditing(account);
                          setShowForm(true);
                        }}
                        className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4dce9] text-[#5968a9] transition hover:bg-[#ede7f5]"
                        title="Edit user"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(account)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#f4d5d3] text-red-500 transition hover:bg-[#fdf2f2]"
                        title="Delete user"
                      >
                        <Trash2 size={14} />
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

function RoleBadge({ role }: { role: UserRole }) {
  switch (role) {
    case "teacher":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f3ecf9] px-2.5 py-0.5 text-[11px] font-bold text-[#6d4b9f]">
          <BookOpen size={11} /> Teacher
        </span>
      );
    case "admin":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#0f172a] px-2.5 py-0.5 text-[11px] font-bold text-white">
          <Shield size={11} /> Admin
        </span>
      );
    case "student":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#e0f2fe] px-2.5 py-0.5 text-[11px] font-bold text-[#0369a1]">
          <GraduationCap size={11} /> Student
        </span>
      );
    case "parent":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[11px] font-bold text-[#b45309]">
          <Users size={11} /> Parent
        </span>
      );
  }
}

function PasswordDisplay({ password }: { password: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-[#f5f0fb] px-2.5 py-1 font-mono text-xs text-[#6d4b9f] w-max">
      {show ? password : "••••••••"}
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="opacity-50 transition hover:opacity-100"
        title={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  );
}

function UserForm({
  initialData,
  defaultRole,
  onSave,
  onCancel,
  allAccounts,
  isSaving,
}: {
  initialData: UserAccount | null;
  defaultRole: UserRole;
  onSave: (data: UserAccount) => void;
  onCancel: () => void;
  allAccounts: UserAccount[];
  isSaving?: boolean;
}) {
  const [role, setRole] = useState<UserRole>(initialData?.role || defaultRole);
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState(initialData?.password || "");
  const [subject, setSubject] = useState(initialData?.subject || "Mathematics");

  // Academic fields for Student & Parent
  const today = new Date().toISOString().split("T")[0];
  const [joinedDate, setJoinedDate] = useState(initialData?.joinedDate || today);
  const [department, setDepartment] = useState(initialData?.department || INITIAL_DEPARTMENTS[4] || "Grade 10");
  const [section, setSection] = useState(initialData?.section || "A");
  const [session, setSession] = useState(initialData?.session || "Evening Session (5:00 PM – 7:00 PM)");
  const [linkedStudentEmail, setLinkedStudentEmail] = useState(initialData?.linkedStudentEmail || "");

  const studentAccounts = allAccounts.filter(a => a.role === "student");

  // When a parent picks a linked student, sync the student's department & section
  const handleLinkedStudentChange = (selectedEmail: string) => {
    setLinkedStudentEmail(selectedEmail);
    const matched = studentAccounts.find(s => s.email.toLowerCase() === selectedEmail.toLowerCase());
    if (matched) {
      if (matched.department) setDepartment(matched.department);
      if (matched.section) setSection(matched.section);
      if (matched.session) setSession(matched.session);
      if (matched.joinedDate) setJoinedDate(matched.joinedDate);
    }
  };

  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let rand = "";
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(rand);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in Name, Email, and Password.");
      return;
    }

    onSave({
      id: initialData?.id ?? crypto.randomUUID(),
      role,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      subject: role === "teacher" ? subject.trim() : undefined,
      linkedStudentEmail: role === "parent" ? linkedStudentEmail : undefined,
      department: (role === "student" || role === "parent") ? department : undefined,
      section: (role === "student" || role === "parent") ? section : undefined,
      session: (role === "student" || role === "parent") ? session : undefined,
      joinedDate: (role === "student" || role === "parent") ? joinedDate : undefined,
    });
  };

  const isLearnerOrParent = role === "student" || role === "parent";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#e5dbcf] bg-[#fffdfa] p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b border-[#eee4d6] pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ef8656]">
            {initialData ? "Edit User Account" : "Add New User Account"}
          </span>
          <h3 className="mt-1 text-xl font-extrabold text-[#322743]">
            {initialData ? `Update ${initialData.name}` : `Create ${role} portal login`}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-[#f2ecf6] p-2 text-[#756a7a] hover:bg-[#e4d9eb]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Role Picker */}
      <div className="mb-6">
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
          Select Account Role
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["teacher", "admin", "student", "parent"] as const).map(r => (
            <button
              key={r}
              type="button"
              disabled={!!initialData}
              onClick={() => setRole(r)}
              className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold capitalize transition ${
                role === r
                  ? "border-[#5968a9] bg-[#5968a9] text-white shadow-sm"
                  : "border-[#e5dbcf] bg-white text-[#756a7a] hover:bg-[#faf7f4]"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <RoleBadge role={r} />
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Top Line / Fields for Teacher, Admin, and common credentials */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
          Full Name *
          <input
            required
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Ramanan P S, Joel A"
            className="mt-1 w-full rounded-xl border border-[#ded4c8] bg-white px-3 py-2.5 text-sm text-[#322743] outline-none focus:border-[#5968a9]"
          />
        </label>

        <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
          Login Email / User ID *
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={!!initialData}
            placeholder="e.g. teacher@rasi.com, stu@portal.com"
            className="mt-1 w-full rounded-xl border border-[#ded4c8] bg-white px-3 py-2.5 text-sm text-[#322743] outline-none focus:border-[#5968a9] disabled:bg-[#f5f0f8] disabled:text-[#9a8faa]"
          />
        </label>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
              Password *
            </label>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="flex items-center gap-1 text-[11px] font-bold text-[#6d4b9f] hover:underline"
            >
              <Sparkles size={12} /> Auto-generate strong password
            </button>
          </div>
          <input
            required
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="min. 4 characters"
            className="mt-1 w-full rounded-xl border border-[#ded4c8] bg-white px-3 py-2.5 font-mono text-sm text-[#322743] outline-none focus:border-[#5968a9]"
          />
        </div>

        {/* Teacher Specific Subject Field */}
        {role === "teacher" && (
          <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a] md:col-span-2">
            Subject Taught
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Mathematics, Advanced Calculus, Physics"
              className="mt-1 w-full rounded-xl border border-[#ded4c8] bg-white px-3 py-2.5 text-sm text-[#322743] outline-none focus:border-[#5968a9]"
            />
          </label>
        )}

        {/* Admin Note */}
        {role === "admin" && (
          <div className="rounded-xl border border-[#d6e0ea] bg-[#f0f6fc] p-3 text-xs text-[#334155] md:col-span-2">
            <span className="font-bold">Admin Privileges:</span> This account will have full access to manage students, attendance, schedules, question papers, and user accounts.
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          CONDITION FOR PARENT AND STUDENT:
          "It need to have a seperate line under the adding Teacher and admin.. 
           so that you need to add the Date,Department, Section and session.."
         ───────────────────────────────────────────────────────────────────────── */}
      {isLearnerOrParent && (
        <div className="relative mt-8 rounded-2xl border-2 border-dashed border-[#d8cde3] bg-[#faf6fd] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#e9e0f2] pb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6d4b9f] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                <Layers size={13} /> {role === "student" ? "Student Academic Details" : "Parent & Student Link Details"}
              </span>
              <span className="text-xs font-semibold text-[#7e6e8e]">
                (Separate enrollment line for {role} accounts)
              </span>
            </div>
            <span className="text-[11px] text-[#978ca1]">
              Saved to Supabase database
            </span>
          </div>

          {/* Linked student selection for Parent */}
          {role === "parent" && (
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
                Linked Student Account *
                <select
                  value={linkedStudentEmail}
                  onChange={e => handleLinkedStudentChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d8cde3] bg-white px-3 py-2.5 text-sm text-[#322743] outline-none focus:border-[#6d4b9f]"
                >
                  <option value="">Select registered student to link with this parent…</option>
                  {studentAccounts.map(s => (
                    <option key={s.email} value={s.email}>
                      {s.name} ({s.email}) — {s.department || "Grade 10"} {s.section ? `Sec ${s.section}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-1 text-[11px] text-[#9181a0]">
                Selecting a student will automatically populate their admission date, department, section, and session below.
              </p>
            </div>
          )}

          {/* The 4 fields in a dedicated line / grid: Date, Department, Section, Session */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Date */}
            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-[#6d4b9f]" /> Date (Admission / Joining)
              </span>
              <input
                required
                type="date"
                value={joinedDate}
                onChange={e => setJoinedDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d8cde3] bg-white px-3 py-2 text-sm text-[#322743] outline-none focus:border-[#6d4b9f]"
              />
            </label>

            {/* 2. Department */}
            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
              <span className="flex items-center gap-1.5">
                <BookOpen size={13} className="text-[#6d4b9f]" /> Department
              </span>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d8cde3] bg-white px-3 py-2 text-sm text-[#322743] outline-none focus:border-[#6d4b9f]"
              >
                {INITIAL_DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>

            {/* 3. Section */}
            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
              <span className="flex items-center gap-1.5">
                <Layers size={13} className="text-[#6d4b9f]" /> Section
              </span>
              <input
                type="text"
                value={section}
                onChange={e => setSection(e.target.value)}
                placeholder="e.g. A, B, Morning Batch"
                className="mt-1 w-full rounded-xl border border-[#d8cde3] bg-white px-3 py-2 text-sm text-[#322743] outline-none focus:border-[#6d4b9f]"
              />
            </label>

            {/* 4. Session */}
            <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#756a7a]">
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-[#6d4b9f]" /> Session
              </span>
              <input
                type="text"
                list="session-options"
                value={session}
                onChange={e => setSession(e.target.value)}
                placeholder="e.g. Morning Session, Evening Session"
                className="mt-1 w-full rounded-xl border border-[#d8cde3] bg-white px-3 py-2 text-sm text-[#322743] outline-none focus:border-[#6d4b9f]"
              />
              <datalist id="session-options">
                {COMMON_SESSIONS.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="mt-8 flex items-center justify-end gap-3 border-t border-[#eee4d6] pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-[#e2d8cc] bg-white px-4 py-2.5 text-xs font-bold text-[#756a7a] transition hover:bg-[#ede7df]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-[#2f315d] px-6 py-2.5 text-xs font-bold text-white shadow-[0_4px_0_#e9b08f] transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_#e9b08f] disabled:opacity-60"
        >
          {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
          {isSaving ? "Saving to Database…" : initialData ? "Update Account" : "Save User to Database"}
        </button>
      </div>
    </form>
  );
}
