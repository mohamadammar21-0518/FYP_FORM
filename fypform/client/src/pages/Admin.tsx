import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Lock, LogOut, Download, Users, CheckCircle2,
  AlertCircle, Pencil, Trash2, Trash, Save, X
} from "lucide-react";

const STORAGE_KEY = "fyp_admin_pw";

type Submission = {
  id: number;
  fullName: string;
  studentId: string;
  intakeYear: "2026/2027 October" | "2026/27 March";
  course1: string | null;
  course2: string | null;
  course3: string | null;
  course4: string | null;
  course5: string | null;
  gpa: string | null;
  cgpa: string | null;
  createdAt: Date;
};

type EditState = Omit<Submission, "id" | "createdAt">;

export default function Admin() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(STORAGE_KEY) ?? "");
  const [inputPw, setInputPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<EditState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const isLoggedIn = password.length > 0;
  const utils = trpc.useUtils();

  const login = trpc.admin.login.useMutation({
    onSuccess: () => {
      sessionStorage.setItem(STORAGE_KEY, inputPw);
      setPassword(inputPw);
      setLoginError("");
    },
    onError: (err) => setLoginError(err.message),
  });

  const { data: submissions, isLoading, error } = trpc.admin.getSubmissions.useQuery(
    { password },
    { enabled: isLoggedIn, retry: false }
  );

  const updateMutation = trpc.admin.updateSubmission.useMutation({
    onSuccess: () => {
      utils.admin.getSubmissions.invalidate();
      setEditingId(null);
      setEditValues(null);
    },
  });

  const deleteMutation = trpc.admin.deleteSubmission.useMutation({
    onSuccess: () => {
      utils.admin.getSubmissions.invalidate();
      setConfirmDeleteId(null);
    },
  });

  const deleteAllMutation = trpc.admin.deleteAll.useMutation({
    onSuccess: () => {
      utils.admin.getSubmissions.invalidate();
      setConfirmDeleteAll(false);
    },
  });

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword("");
    setInputPw("");
  };

  const handleExportCSV = () => {
    if (!submissions?.length) return;
    const headers = ["#", "Full Name", "Student ID", "Intake Year", "Course 1 (%)", "Course 2 (%)", "Course 3 (%)", "Course 4 (%)", "Course 5 (%)", "GPA", "CGPA", "Submitted At"];
    const rows = submissions.map((s, i) => [
      i + 1,
      `"${s.fullName}"`,
      s.studentId,
      `"${s.intakeYear}"`,
      s.course1 ?? "",
      s.course2 ?? "",
      s.course3 ?? "",
      s.course4 ?? "",
      s.course5 ?? "",
      s.gpa ?? "",
      s.cgpa ?? "",
      new Date(s.createdAt).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fyp-attendance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (s: Submission) => {
    setEditingId(s.id);
    setEditValues({
      fullName: s.fullName,
      studentId: s.studentId,
      intakeYear: s.intakeYear,
      course1: s.course1,
      course2: s.course2,
      course3: s.course3,
      course4: s.course4,
      course5: s.course5,
      gpa: s.gpa,
      cgpa: s.cgpa,
    });
  };

  const saveEdit = (id: number) => {
    if (!editValues) return;
    updateMutation.mutate({
      password,
      id,
      fullName: editValues.fullName,
      studentId: editValues.studentId,
      intakeYear: editValues.intakeYear,
      course1: editValues.course1 ?? "",
      course2: editValues.course2 ?? "",
      course3: editValues.course3 ?? "",
      course4: editValues.course4 ?? "",
      course5: editValues.course5 ?? "",
      gpa: editValues.gpa,
      cgpa: editValues.cgpa,
    });
  };

  const updateField = (field: keyof EditState, value: string) => {
    setEditValues(prev => prev ? { ...prev, [field]: value || null } : prev);
  };

  // ── Login screen ──
  if (!isLoggedIn) {
    return (
      <main className="admin-shell">
        <div className="admin-login-card">
          <div className="admin-login-icon"><Lock size={22} /></div>
          <h1>Admin access</h1>
          <p>Enter the admin password to manage submissions.</p>
          <form
            onSubmit={(e) => { e.preventDefault(); login.mutate({ password: inputPw }); }}
            className="admin-login-form"
          >
            <input
              type="password"
              placeholder="Password"
              value={inputPw}
              onChange={e => { setInputPw(e.target.value); setLoginError(""); }}
              autoFocus
              required
            />
            {loginError && <p className="admin-error"><AlertCircle size={13} /> {loginError}</p>}
            <button type="submit" disabled={login.isPending || inputPw.length === 0}>
              {login.isPending ? "Checking…" : "Sign in"}
            </button>
          </form>
          <a href="/" className="admin-back-link">← Back to form</a>
        </div>
      </main>
    );
  }

  // ── Dashboard ──
  return (
    <main className="admin-shell">
      {/* Topbar */}
      <div className="admin-topbar">
        <div className="admin-brand">
          <img src="/aiu-official-logo-trim.png" alt="AIU" className="admin-logo" />
          <div>
            <strong>FYP Admin</strong>
            <span>Attendance submissions</span>
          </div>
        </div>
        <div className="admin-topbar-actions">
          <button className="admin-export-btn" onClick={handleExportCSV} disabled={!submissions?.length}>
            <Download size={15} /> Export CSV
          </button>
          <button
            className="admin-delete-all-btn"
            onClick={() => setConfirmDeleteAll(true)}
            disabled={!submissions?.length}
          >
            <Trash size={15} /> Delete all
          </button>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <Users size={18} />
          <div>
            <span className="admin-stat-value">{submissions?.length ?? "—"}</span>
            <span className="admin-stat-label">Total submissions</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <CheckCircle2 size={18} />
          <div>
            <span className="admin-stat-value">
              {submissions ? submissions.filter(s => s.gpa !== null).length : "—"}
            </span>
            <span className="admin-stat-label">With GPA/CGPA</span>
          </div>
        </div>
      </div>

      {/* Delete all confirmation */}
      {confirmDeleteAll && (
        <div className="admin-confirm-bar">
          <AlertCircle size={15} />
          <span>Delete <strong>all {submissions?.length} submissions</strong>? This cannot be undone.</span>
          <button
            className="admin-confirm-yes"
            onClick={() => deleteAllMutation.mutate({ password })}
            disabled={deleteAllMutation.isPending}
          >
            {deleteAllMutation.isPending ? "Deleting…" : "Yes, delete all"}
          </button>
          <button className="admin-confirm-no" onClick={() => setConfirmDeleteAll(false)}>Cancel</button>
        </div>
      )}

      {isLoading && <p className="admin-loading">Loading submissions…</p>}
      {error && <p className="admin-error-block"><AlertCircle size={14} /> Could not load submissions.</p>}
      {submissions && submissions.length === 0 && <p className="admin-empty">No submissions yet.</p>}

      {/* Table */}
      {submissions && submissions.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Student ID</th>
                <th>Intake</th>
                <th>C1 %</th>
                <th>C2 %</th>
                <th>C3 %</th>
                <th>C4 %</th>
                <th>C5 %</th>
                <th>GPA</th>
                <th>CGPA</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => {
                const isEditing = editingId === s.id;
                return (
                  <tr key={s.id} className={isEditing ? "admin-row-editing" : ""}>
                    <td className="admin-td-num">{i + 1}</td>

                    {/* Full Name */}
                    <td className="admin-td-name">
                      {isEditing ? (
                        <input className="admin-inline-input" value={editValues?.fullName ?? ""} onChange={e => updateField("fullName", e.target.value)} />
                      ) : s.fullName}
                    </td>

                    {/* Student ID */}
                    <td className="admin-td-mono">
                      {isEditing ? (
                        <input className="admin-inline-input admin-inline-mono" value={editValues?.studentId ?? ""} onChange={e => updateField("studentId", e.target.value)} maxLength={11} />
                      ) : s.studentId}
                    </td>

                    {/* Intake */}
                    <td>
                      {isEditing ? (
                        <select className="admin-inline-select" value={editValues?.intakeYear ?? ""} onChange={e => updateField("intakeYear", e.target.value)}>
                          <option value="2026/2027 October">2026/2027 October</option>
                          <option value="2026/27 March">2026/27 March</option>
                        </select>
                      ) : s.intakeYear}
                    </td>

                    {/* Courses */}
                    {(["course1", "course2", "course3", "course4", "course5"] as const).map(c => (
                      <td key={c} className="admin-td-pct">
                        {isEditing ? (
                          <input className="admin-inline-input admin-inline-pct" type="number" min="0" max="100" step="0.01"
                            value={editValues?.[c] ?? ""} onChange={e => updateField(c, e.target.value)} />
                        ) : `${s[c] ?? "—"}%`}
                      </td>
                    ))}

                    {/* GPA */}
                    <td className="admin-td-mono">
                      {isEditing ? (
                        <input className="admin-inline-input admin-inline-pct" type="number" min="0" max="4" step="0.01"
                          value={editValues?.gpa ?? ""} onChange={e => updateField("gpa", e.target.value)} placeholder="—" />
                      ) : (s.gpa ?? "—")}
                    </td>

                    {/* CGPA */}
                    <td className="admin-td-mono">
                      {isEditing ? (
                        <input className="admin-inline-input admin-inline-pct" type="number" min="0" max="4" step="0.01"
                          value={editValues?.cgpa ?? ""} onChange={e => updateField("cgpa", e.target.value)} placeholder="—" />
                      ) : (s.cgpa ?? "—")}
                    </td>

                    <td className="admin-td-date">{new Date(s.createdAt).toLocaleDateString()}</td>

                    {/* Actions */}
                    <td className="admin-td-actions">
                      {isEditing ? (
                        <>
                          <button
                            className="admin-action-save"
                            onClick={() => saveEdit(s.id)}
                            disabled={updateMutation.isPending}
                            title="Save"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            className="admin-action-cancel"
                            onClick={() => { setEditingId(null); setEditValues(null); }}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="admin-action-edit"
                            onClick={() => startEdit(s as Submission)}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          {confirmDeleteId === s.id ? (
                            <>
                              <button
                                className="admin-action-confirm-del"
                                onClick={() => deleteMutation.mutate({ password, id: s.id })}
                                disabled={deleteMutation.isPending}
                                title="Confirm delete"
                              >
                                {deleteMutation.isPending ? "…" : "Yes"}
                              </button>
                              <button
                                className="admin-action-cancel"
                                onClick={() => setConfirmDeleteId(null)}
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <button
                              className="admin-action-delete"
                              onClick={() => setConfirmDeleteId(s.id)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
