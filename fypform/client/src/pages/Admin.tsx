import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Lock, LogOut, Download, Users, CheckCircle2, AlertCircle } from "lucide-react";

const STORAGE_KEY = "fyp_admin_pw";

export default function Admin() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(STORAGE_KEY) ?? "");
  const [inputPw, setInputPw] = useState("");
  const [loginError, setLoginError] = useState("");

  const isLoggedIn = password.length > 0;

  const login = trpc.admin.login.useMutation({
    onSuccess: () => {
      sessionStorage.setItem(STORAGE_KEY, inputPw);
      setPassword(inputPw);
      setLoginError("");
    },
    onError: (err) => {
      setLoginError(err.message);
    },
  });

  const { data: submissions, isLoading, error } = trpc.admin.getSubmissions.useQuery(
    { password },
    { enabled: isLoggedIn, retry: false }
  );

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword("");
    setInputPw("");
  };

  const handleExportCSV = () => {
    if (!submissions?.length) return;
    const headers = ["ID", "Full Name", "Student ID", "Intake Year", "Course 1 (%)", "Course 2 (%)", "Course 3 (%)", "Course 4 (%)", "Course 5 (%)", "GPA", "CGPA", "Submitted At"];
    const rows = submissions.map(s => [
      s.id,
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

  // ── Login screen ──
  if (!isLoggedIn) {
    return (
      <main className="admin-shell">
        <div className="admin-login-card">
          <div className="admin-login-icon">
            <Lock size={22} />
          </div>
          <h1>Admin access</h1>
          <p>Enter the admin password to view submissions.</p>
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
            {loginError && (
              <p className="admin-error">
                <AlertCircle size={13} /> {loginError}
              </p>
            )}
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
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

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

      {isLoading && <p className="admin-loading">Loading submissions…</p>}
      {error && <p className="admin-error-block"><AlertCircle size={14} /> Could not load submissions. Try signing out and back in.</p>}

      {submissions && submissions.length === 0 && (
        <p className="admin-empty">No submissions yet.</p>
      )}

      {submissions && submissions.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Student ID</th>
                <th>Intake</th>
                <th>Course 1</th>
                <th>Course 2</th>
                <th>Course 3</th>
                <th>Course 4</th>
                <th>Course 5</th>
                <th>GPA</th>
                <th>CGPA</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => (
                <tr key={s.id}>
                  <td className="admin-td-num">{i + 1}</td>
                  <td className="admin-td-name">{s.fullName}</td>
                  <td className="admin-td-mono">{s.studentId}</td>
                  <td>{s.intakeYear}</td>
                  <td className="admin-td-pct">{s.course1 ?? "—"}%</td>
                  <td className="admin-td-pct">{s.course2 ?? "—"}%</td>
                  <td className="admin-td-pct">{s.course3 ?? "—"}%</td>
                  <td className="admin-td-pct">{s.course4 ?? "—"}%</td>
                  <td className="admin-td-pct">{s.course5 ?? "—"}%</td>
                  <td className="admin-td-mono">{s.gpa ?? "—"}</td>
                  <td className="admin-td-mono">{s.cgpa ?? "—"}</td>
                  <td className="admin-td-date">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
