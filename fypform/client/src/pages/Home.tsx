import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, RotateCcw, Plus, Trash2 } from "lucide-react";
import { courseList, semesterList } from "@shared/courses";
import { trpc } from "@/lib/trpc";

type CourseRow = {
  courseCode: string;
  courseName: string;
  attendancePercentage: string;
};

type FormValues = {
  fullName: string;
  studentId: string;
  intakeYear: string;
  semester: string;
  courses: CourseRow[];
  gpa: string;
  cgpa: string;
};

type Step = 1 | 2 | 3;

const emptyCourse = (): CourseRow => ({ courseCode: "", courseName: "", attendancePercentage: "" });

const emptyForm: FormValues = {
  fullName: "",
  studentId: "",
  intakeYear: "",
  semester: "",
  courses: [emptyCourse()],
  gpa: "",
  cgpa: "",
};

const stepLabels: Record<Step, string> = {
  1: "Your details",
  2: "Course attendance",
  3: "Review and submit",
};

export default function Home() {
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const hasVisitedStep = useRef(false);

  const isFirstSemester = values.semester === "Semester 1";

  const completedRequired = useMemo(() => {
    const detailCount =
      Number(values.fullName.trim().length > 0) +
      Number(values.studentId.trim().length > 0) +
      Number(values.intakeYear.length > 0) +
      Number(values.semester.length > 0);
    const courseCount = values.courses.filter(
      c => c.courseCode && c.attendancePercentage.trim() !== ""
    ).length;
    const gpaCount = Number(values.gpa.trim() !== "") + Number(values.cgpa.trim() !== "");
    return detailCount + courseCount + gpaCount;
  }, [values]);

  const totalRequired = 4 + values.courses.length + 2;

  useEffect(() => {
    if (!hasVisitedStep.current) { hasVisitedStep.current = true; return; }
    stepHeadingRef.current?.focus();
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [step]);

  // Auto-fill GPA/CGPA when semester 1 is selected
  useEffect(() => {
    if (isFirstSemester) {
      setValues(v => ({ ...v, gpa: "4", cgpa: "4" }));
    }
  }, [isFirstSemester]);

  const submit = trpc.studentSurvey.submit.useMutation({
    onSuccess: () => {
      setFormError("");
      setSubmitted(true);
    },
    onError: () => {
      setFormError("We couldn't save your response. Please check your connection and try again.");
    },
  });

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues(v => ({ ...v, [key]: value }));
    if (formError) setFormError("");
  };

  const updateCourse = (index: number, field: keyof CourseRow, value: string) => {
    setValues(v => {
      const courses = v.courses.map((c, i) => {
        if (i !== index) return c;
        if (field === "courseCode") {
          const found = courseList.find(cl => cl.code === value);
          return { ...c, courseCode: value, courseName: found?.name ?? "" };
        }
        return { ...c, [field]: value };
      });
      return { ...v, courses };
    });
    if (formError) setFormError("");
  };

  const addCourse = () => {
    if (values.courses.length >= 8) return;
    setValues(v => ({ ...v, courses: [...v.courses, emptyCourse()] }));
  };

  const removeCourse = (index: number) => {
    if (values.courses.length <= 1) return;
    setValues(v => ({ ...v, courses: v.courses.filter((_, i) => i !== index) }));
  };

  const handleContinue = () => {
    if (!formRef.current?.reportValidity()) return;
    // Extra validation for step 2
    if (step === 2) {
      const invalid = values.courses.some(c => !c.courseCode || c.attendancePercentage.trim() === "");
      if (invalid) { setFormError("Please select a course and enter attendance for all rows."); return; }
      const codes = values.courses.map(c => c.courseCode);
      if (new Set(codes).size !== codes.length) { setFormError("You have selected the same course more than once."); return; }
    }
    setFormError("");
    setStep(s => s === 1 ? 2 : 3);
  };

  const handleBack = () => {
    setFormError("");
    setStep(s => s === 3 ? 2 : 1);
  };

  const handleSubmit = () => {
    setFormError("");
    if (step !== 3) return;
    submit.mutate({
      fullName: values.fullName.trim(),
      studentId: values.studentId.trim(),
      intakeYear: values.intakeYear as "2026/2027 October" | "2026/27 March",
      semester: values.semester as typeof semesterList[number],
      courseAttendance: values.courses.map(c => ({
        courseCode: c.courseCode,
        courseName: c.courseName,
        attendancePercentage: Number(c.attendancePercentage),
      })),
      gpa: Number(values.gpa),
      cgpa: Number(values.cgpa),
    });
  };

  const startAnother = () => {
    setSubmitted(false);
    setFormError("");
    setValues(emptyForm);
    setStep(1);
    submit.reset();
  };

  // Used courses to prevent duplicate selection
  const usedCodes = values.courses.map(c => c.courseCode).filter(Boolean);

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Student data collection home">
          <img className="brand-logo" src="/aiu-official-logo-trim.png" alt="Albukhary International University" />
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-copy">
            <strong>Student Data Collection</strong>
            <span>AIU · ACADEMIC RESEARCH</span>
          </span>
        </a>
        <span className="project-badge"><span aria-hidden="true" /> Research Survey</span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div className="intro-copy">
          <p className="eyebrow"><span className="eyebrow-mark" aria-hidden="true" /> FOR AIU STUDENTS · ACADEMIC RESEARCH</p>
          <h1 id="page-title">Share your academic data.</h1>
          <p className="intro-text">
            Select your enrolled courses, enter attendance percentages from Student Hub,
            and provide your GPA and CGPA. Your data supports academic research.
          </p>
        </div>
        <div className="intro-aside" aria-hidden="true">
          <span className="intro-aside-mark">AIU</span>
          <span>THREE SHORT STEPS</span>
        </div>
      </section>

      <section className="form-panel" aria-label="Student data collection">
        {submitted ? (
          <div className="success-view" role="status" aria-live="polite">
            <div className="success-icon"><CheckCircle2 size={30} strokeWidth={1.9} /></div>
            <p className="eyebrow"><span className="eyebrow-mark" aria-hidden="true" /> RESPONSE RECORDED</p>
            <h2>Thank you for your contribution.</h2>
            <p className="success-copy">
              Your academic data has been saved successfully. You may close this page or submit another response.
            </p>
            <div className="success-actions">
              <button className="secondary-button" type="button" onClick={startAnother}>
                <RotateCcw size={16} aria-hidden="true" /> Submit another response
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="panel-heading">
              <div className="panel-title-wrap">
                <span className="panel-kicker">STEP {step} OF 3</span>
                <h2 ref={stepHeadingRef} tabIndex={-1}>{stepLabels[step]}</h2>
              </div>
              <div className="required-progress">
                <span className="progress-label" aria-live="polite">
                  {completedRequired} of {totalRequired} fields complete
                </span>
                <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={totalRequired} aria-valuenow={completedRequired}>
                  <span style={{ width: `${Math.min((completedRequired / totalRequired) * 100, 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="stepper" role="group" aria-label="Form steps">
              <div className="stepper-track" aria-hidden="true">
                <span style={{ width: `${((step - 1) / 2) * 100}%` }} />
              </div>
              {([1, 2, 3] as const).map(n => {
                const isComplete = n < step;
                const isCurrent = n === step;
                return (
                  <button
                    key={n}
                    type="button"
                    className={`step-item${isComplete ? " is-complete" : ""}${isCurrent ? " is-current" : ""}`}
                    disabled={n > step}
                    aria-current={isCurrent ? "step" : undefined}
                    onClick={() => { if (n < step) { setFormError(""); setStep(n); } }}
                  >
                    <span className="step-marker" aria-hidden="true">
                      {isComplete ? <Check size={15} strokeWidth={2.5} /> : `0${n}`}
                    </span>
                    <span className="step-label">{stepLabels[n]}</span>
                  </button>
                );
              })}
            </div>

            <form ref={formRef} noValidate onSubmit={e => e.preventDefault()}>

              {/* ── Step 1: Your details ── */}
              {step === 1 && (
                <section className="form-section" aria-label="Step 1: Your details">
                  <div className="section-heading">
                    <span className="section-number">01</span>
                    <div>
                      <h3>About you</h3>
                      <p>Your personal and academic details.</p>
                    </div>
                  </div>

                  <div className="field-grid">
                    <div className="field field-wide">
                      <label htmlFor="full-name">Full name <span className="required-mark">*</span></label>
                      <input
                        id="full-name" name="fullName" type="text" autoComplete="name"
                        placeholder="Enter your full name"
                        value={values.fullName}
                        onChange={e => update("fullName", e.target.value)}
                        maxLength={150} required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="student-id">Student ID <span className="required-mark">*</span></label>
                      <input
                        id="student-id" name="studentId" type="text" autoComplete="off"
                        placeholder="AIU26102205"
                        value={values.studentId}
                        onChange={e => update("studentId", e.target.value.toUpperCase().slice(0, 11))}
                        maxLength={11}
                        pattern="[Aa][Ii][Uu].{8}"
                        title="Must be 11 characters starting with AIU"
                        required
                        style={{ fontFamily: "var(--mono)", letterSpacing: ".02em" }}
                      />
                      <span className="field-help">11 characters, starts with AIU</span>
                    </div>

                    <div className="field">
                      <label htmlFor="intake-year">Intake year <span className="required-mark">*</span></label>
                      <select id="intake-year" name="intakeYear" value={values.intakeYear} onChange={e => update("intakeYear", e.target.value)} required>
                        <option value="" disabled>Select intake</option>
                        <option value="2026/2027 October">2026/2027 October</option>
                        <option value="2026/27 March">2026/27 March</option>
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="semester">Current semester <span className="required-mark">*</span></label>
                      <select id="semester" name="semester" value={values.semester} onChange={e => update("semester", e.target.value)} required>
                        <option value="" disabled>Select semester</option>
                        {semesterList.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
              )}

              {/* ── Step 2: Course attendance ── */}
              {step === 2 && (
                <section className="form-section" aria-label="Step 2: Course attendance">
                  <div className="section-heading">
                    <span className="section-number">02</span>
                    <div>
                      <h3>Course attendance</h3>
                      <p>Select each course and enter its attendance from Student Hub.</p>
                    </div>
                  </div>

                  <div className="course-builder">
                    {values.courses.map((course, index) => (
                      <div key={index} className="course-builder-row">
                        <div className="course-builder-num">{String(index + 1).padStart(2, "0")}</div>

                        <div className="course-builder-fields">
                          <div className="field">
                            <label htmlFor={`course-${index}`}>Course <span className="required-mark">*</span></label>
                            <select
                              id={`course-${index}`}
                              value={course.courseCode}
                              onChange={e => updateCourse(index, "courseCode", e.target.value)}
                              required
                            >
                              <option value="" disabled>Select a course</option>
                              {courseList.map(cl => (
                                <option
                                  key={cl.code}
                                  value={cl.code}
                                  disabled={usedCodes.includes(cl.code) && course.courseCode !== cl.code}
                                >
                                  {cl.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="field course-pct-field">
                            <label htmlFor={`att-${index}`}>Attendance % <span className="required-mark">*</span></label>
                            <div className="percentage-input">
                              <input
                                id={`att-${index}`}
                                type="number" inputMode="decimal"
                                min="0" max="100" step="0.01"
                                placeholder="0.00"
                                value={course.attendancePercentage}
                                onChange={e => updateCourse(index, "attendancePercentage", e.target.value)}
                                required
                              />
                              <span aria-hidden="true">%</span>
                            </div>
                          </div>
                        </div>

                        {values.courses.length > 1 && (
                          <button type="button" className="course-remove-btn" onClick={() => removeCourse(index)} aria-label="Remove course">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {values.courses.length < 8 && (
                    <button type="button" className="course-add-btn" onClick={addCourse}>
                      <Plus size={15} /> Add another course
                    </button>
                  )}

                  <p className="field-hint" style={{ marginLeft: 0, marginTop: 14 }}>
                    You can add up to 8 courses. Enter the percentage shown in Student Hub (0–100).
                  </p>
                </section>
              )}

              {/* ── Step 3: GPA/CGPA + Review ── */}
              {step === 3 && (
                <section className="form-section" aria-label="Step 3: Academic results and review">
                  <div className="section-heading">
                    <span className="section-number">03</span>
                    <div>
                      <h3>Academic results</h3>
                      <p>Your GPA and CGPA from Student Hub.</p>
                    </div>
                  </div>

                  {isFirstSemester && (
                    <div className="semester1-notice">
                      <Check size={14} /> You selected <strong>Semester 1</strong> — GPA and CGPA have been set to <strong>4.00</strong>. Change them if needed.
                    </div>
                  )}

                  <div className="field-grid result-grid" style={{ marginLeft: 0 }}>
                    <div className="field">
                      <label htmlFor="gpa">GPA <span className="required-mark">*</span></label>
                      <input
                        id="gpa" name="gpa" type="number" inputMode="decimal"
                        min="0" max="4" step="0.01" placeholder="e.g. 3.75"
                        value={values.gpa}
                        onChange={e => update("gpa", e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="cgpa">CGPA <span className="required-mark">*</span></label>
                      <input
                        id="cgpa" name="cgpa" type="number" inputMode="decimal"
                        min="0" max="4" step="0.01" placeholder="e.g. 3.60"
                        value={values.cgpa}
                        onChange={e => update("cgpa", e.target.value)}
                        required
                      />
                    </div>
                    <p className="field-hint results-hint">
                      Enter your GPA and CGPA (0.00 – 4.00 scale). If this is your 1st semester, enter 4.00 for both.
                    </p>
                  </div>

                  {/* Review card */}
                  <div className="review-card" aria-labelledby="review-heading">
                    <div className="review-heading-row">
                      <div>
                        <span className="review-kicker">FINAL CHECK</span>
                        <h3 id="review-heading">Review your response</h3>
                      </div>
                      <span className="review-badge"><Check size={13} aria-hidden="true" /> Ready to submit</span>
                    </div>
                    <dl className="review-identity">
                      <div><dt>Full name</dt><dd>{values.fullName.trim()}</dd></div>
                      <div><dt>Student ID</dt><dd>{values.studentId.trim()}</dd></div>
                      <div><dt>Intake</dt><dd>{values.intakeYear}</dd></div>
                      <div><dt>Semester</dt><dd>{values.semester}</dd></div>
                      <div><dt>GPA</dt><dd>{values.gpa || "—"}</dd></div>
                      <div><dt>CGPA</dt><dd>{values.cgpa || "—"}</dd></div>
                    </dl>
                    <ul className="review-courses" aria-label="Course attendance summary">
                      {values.courses.map((c, i) => (
                        <li key={i}>
                          <span>{c.courseName || c.courseCode || `Course ${i + 1}`}</span>
                          <strong>{c.attendancePercentage ? `${c.attendancePercentage}%` : "—"}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              <div className="form-actions">
                {step > 1 ? (
                  <button className="back-button" type="button" onClick={handleBack}>
                    <ArrowLeft size={16} aria-hidden="true" /> Back
                  </button>
                ) : (
                  <span className="required-note"><span className="required-mark">*</span> Required fields</span>
                )}
                <div className="form-actions-end">
                  {step < 3 ? (
                    <button className="primary-button" type="button" onClick={handleContinue}>
                      <span>{step === 1 ? "Continue to attendance" : "Review your response"}</span>
                      <ArrowRight size={17} aria-hidden="true" />
                    </button>
                  ) : (
                    <button className="primary-button" type="button" disabled={submit.isPending} onClick={handleSubmit}>
                      <span>{submit.isPending ? "Saving…" : "Submit response"}</span>
                      {!submit.isPending && <ArrowRight size={17} aria-hidden="true" />}
                      {submit.isPending && <span className="button-spinner" aria-hidden="true" />}
                    </button>
                  )}
                </div>
              </div>

              {formError && <p className="form-error" role="alert">{formError}</p>}
            </form>
          </>
        )}
      </section>

      <footer className="page-footer">
        <span>AIU · ACADEMIC RESEARCH</span>
        <span>Student data collection · Not an official AIU portal</span>
      </footer>
    </main>
  );
}
