import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { CourseAttendanceEntry } from "@shared/courses";
import {
  Lock, LogOut, Download, Users, BookOpen, TrendingUp,
  AlertCircle, Trash2, Trash, X, Search, ChevronDown, ChevronUp,
} from "lucide-react";

const STORAGE_KEY = "fyp_admin_pw";

type Submission = {
  id: number;
  fullName: string;
  studentId: string;
  intakeYear: "2026/2027 October" | "2026/27 March";
  semester: string;
  courseAttendance: CourseAttendanceEntry[];
  gpa: string | null;
  cgpa: string | null;
  createdAt: Date | string;
};

export default function Admin() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(STORAGE_KEY) ?? "");
  const [inputPw, setInputPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterSemester, setFilterSemester] = useState("");

  const isLoggedIn = password.length > 0;
  const utils = trpc.useUtils();

  const login = trpc.admin.login.useMutation({
    onSuccess: () => { sessionStorage.setItem(STORAGE_KEY, inputPw); setPassword(inputPw); setLoginError(""); },
    onError: (err) => setLoginError(err.message),
  });

  const { data: rawSubmissions, isLoading, error } = trpc.admin.getSubmissions.useQuery(
    { password },
    { enabled: isLoggedIn, retry: false }
  );

  const submissions = (rawSubmissions as Submission[] | undefined);

  const deleteMutation = trpc.admin.deleteSubmission.useMutation({
    onSuccess: () => { utils.admin.getSubmissions.invalidate(); setConfirmDeleteId(null); },
  });

  const deleteAllMutation = trpc.admin.deleteAll.useMutation({
    onSuccess: () => { utils.admin.getSubmissions.invalidate(); setConfirmDeleteAll(false); },
  });

  const handleLogout = () => { sessionStorage.removeItem(STORAGE_KEY); setPassword(""); setInputPw(""); };

  const handleExportCSV = () => {
    if (!submissions?.length) return;
    const maxCourses = Math.max(...submissions.map(s => s.courseAttendance?.length ?? 0));
    const courseHeaders = Array.from({ length: maxCourses }, (_, i) =>
      [`Course ${i + 1} Code`, `Course ${i + 1} Name`, `Course ${i + 1} Attendance (%)`]
    ).flat();
    const headers = ["#", "Full Name", "Student ID", "Intake Year", "Semester", ...courseHeaders, "GPA", "CGPA", "Submitted At"];
    const rows = submissions.map((s, i) => {
      const ca = s.courseAttendance ?? [];
      const courseCols = Array.from({ length: maxCourses }, (_, ci) => {
        const c = ca[ci];
        return c ? [c.courseCode, `"${c.courseName}"`, c.attendancePercentage] : ["", "", ""];
      }).flat();
      return [i + 1, `"${s.fullName}"`, s.studentId, `"${s.intakeYear}"`, s.semester,
        ...courseCols, s.gpa ?? "", s.cgpa ?? "", new Date(s.createdAt).toLocaleString()];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aiu-data-collection-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter logic
  const filtered = submissions?.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q);
    const matchSemester = !filterSemester || s.semester === filterSemester;
    return matchSearch && matchSemester;
  }) ?? [];

  const semesterOptions = [...new Set(submissions?.map(s => s.semester) ?? [])].sort();

  // Stats
  const totalCourses = submissions?.reduce((sum, s) => sum + (s.courseAttendance?.length ?? 0), 0) ?? 0;
  const avgGpa = submissions?.length
    ? (submissions.reduce((sum, s) => sum + (s.gpa ? parseFloat(s.gpa) : 0), 0) / submissions.length).toFixed(2)
    : "—";

  // ── Login ──
  if (!isLoggedIn) {
    return (
      <main className="admin-shell">
        <div className="admin-login-card">
          <div className="admin-login-icon"><Lock size={22} /></div>
          <h1>Admin access</h1>
          <p>Enter the admin password to manage submissions.</p>
          <form onSubmit={e => { e.preventDefault(); login.mutate({ password: inputPw }); }} className="admin-login-form">
            <input type="password" placeholder="Password" value={inputPw}
              onChange={e => { setInputPw(e.target.value); setLoginError(""); }} autoFocus required />
            {loginError && <p className="admin-error"><AlertCircle size={13} /> {loginError}</p>}
            <button type="submit" disabled={login.isPending || !inputPw}>
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
            <strong>Data Collection Admin</strong>
            <span>AIU · Academic Research</span>
          </div>
        </div>
        <div className="admin-topbar-actions">
          <button className="admin-export-btn" onClick={handleExportCSV} disabled={!submissions?.length}>
            <Download size={15} /> Export CSV
          </button>
          <button className="admin-delete-all-btn" onClick={() => setConfirmDeleteAll(true)} disabled={!submissions?.length}>
            <Trash size={15} /> Delete all
          </button>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-icon"><Users size={18} /></div>
          <div>
            <span className="admin-stat-value">{submissions?.length ?? "—"}</span>
            <span className="admin-stat-label">Total students</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon"><BookOpen size={18} /></div>
          <div>
            <span className="admin-stat-value">{totalCourses}</span>
            <span className="admin-stat-label">Total course entries</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon"><TrendingUp size={18} /></div>
          <div>
            <span className="admin-stat-value">{avgGpa}</span>
            <span className="admin-stat-label">Average GPA</span>
          </div>
        </div>
      </div>

      {/* Delete all confirm */}
      {confirmDeleteAll && (
        <div className="admin-confirm-bar">
          <AlertCircle size={15} />
          <span>Delete <strong>all {submissions?.length} submissions</strong>? This cannot be undone.</span>
          <button className="admin-confirm-yes" onClick={() => deleteAllMutation.mutate({ password })} disabled={deleteAllMutation.isPending}>
            {deleteAllMutation.isPending ? "Deleting…" : "Yes, delete all"}
          </button>
          <button className="admin-confirm-no" onClick={() => setConfirmDeleteAll(false)}>Cancel</button>
        </div>
      )}

      {/* Search + filter */}
      {submissions && submissions.length > 0 && (
        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <Search size={14} className="admin-search-icon" />
            <input
              className="admin-search"
              type="text"
              placeholder="Search by name or student ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="admin-filter-select"
            value={filterSemester}
            onChange={e => setFilterSemester(e.target.value)}
          >
            <option value="">All semesters</option>
            {semesterOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || filterSemester) && (
            <button className="admin-clear-filter" onClick={() => { setSearch(""); setFilterSemester(""); }}>
              <X size={13} /> Clear
            </button>
          )}
          <span className="admin-result-count">{filtered.length} of {submissions.length} shown</span>
        </div>
      )}

      {isLoading && <p className="admin-loading">Loading submissions…</p>}
      {error && <p className="admin-error-block"><AlertCircle size={14} /> Could not load submissions.</p>}
      {submissions?.length === 0 && <p className="admin-empty">No submissions yet.</p>}

      {/* Cards */}
      <div className="admin-cards">
        {filtered.map((s, i) => {
          const courses = s.courseAttendance ?? [];
          const isExpanded = expandedId === s.id;
          const avgAttendance = courses.length
            ? (courses.reduce((sum, c) => sum + c.attendancePercentage, 0) / courses.length).toFixed(1)
            : null;

          return (
            <div key={s.id} className="admin-card">
              {/* Card header */}
              <div className="admin-card-header">
                <div className="admin-card-avatar">{s.fullName.charAt(0).toUpperCase()}</div>
                <div className="admin-card-identity">
                  <strong>{s.fullName}</strong>
                  <span>{s.studentId}</span>
                </div>
                <div className="admin-card-badges">
                  <span className="admin-badge admin-badge-intake">{s.intakeYear}</span>
                  <span className="admin-badge admin-badge-semester">{s.semester}</span>
                </div>
                <div className="admin-card-actions">
                  {confirmDeleteId === s.id ? (
                    <>
                      <button className="admin-action-confirm-del"
                        onClick={() => deleteMutation.mutate({ password, id: s.id })}
                        disabled={deleteMutation.isPending}>
                        {deleteMutation.isPending ? "…" : "Confirm delete"}
                      </button>
                      <button className="admin-action-cancel" onClick={() => setConfirmDeleteId(null)}><X size={13} /></button>
                    </>
                  ) : (
                    <button className="admin-action-delete" onClick={() => setConfirmDeleteId(s.id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* GPA row */}
              <div className="admin-card-gpa-row">
                <div className="admin-card-gpa-item">
                  <span className="admin-card-gpa-label">GPA</span>
                  <span className="admin-card-gpa-value">{s.gpa ?? "—"}</span>
                </div>
                <div className="admin-card-gpa-divider" />
                <div className="admin-card-gpa-item">
                  <span className="admin-card-gpa-label">CGPA</span>
                  <span className="admin-card-gpa-value">{s.cgpa ?? "—"}</span>
                </div>
                <div className="admin-card-gpa-divider" />
                <div className="admin-card-gpa-item">
                  <span className="admin-card-gpa-label">Avg Attendance</span>
                  <span className="admin-card-gpa-value">{avgAttendance ? `${avgAttendance}%` : "—"}</span>
                </div>
                <div className="admin-card-gpa-divider" />
                <div className="admin-card-gpa-item">
                  <span className="admin-card-gpa-label">Submitted</span>
                  <span className="admin-card-gpa-value">{new Date(s.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Course toggle */}
              <button
                className="admin-card-course-toggle"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
              >
                <BookOpen size={13} />
                <span>{courses.length} registered course{courses.length !== 1 ? "s" : ""}</span>
                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {/* Course table */}
              {isExpanded && (
                <div className="admin-card-courses">
                  <table className="admin-courses-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Attendance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((c, ci) => {
                        const pct = c.attendancePercentage;
                        const status = pct >= 80 ? "good" : pct >= 60 ? "warning" : "low";
                        const statusLabel = pct >= 80 ? "Good" : pct >= 60 ? "At risk" : "Low";
                        return (
                          <tr key={ci}>
                            <td className="admin-td-num">{ci + 1}</td>
                            <td className="admin-td-mono">{c.courseCode}</td>
                            <td>{c.courseName}</td>
                            <td className="admin-td-pct"><strong>{pct}%</strong></td>
                            <td><span className={`admin-att-badge admin-att-${status}`}>{statusLabel}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
