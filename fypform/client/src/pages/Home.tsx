import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { courseNames } from "@shared/courses";
import { trpc } from "@/lib/trpc";

type FormValues = {
  fullName: string;
  studentId: string;
  intakeYear: string;
  attendance: string[];
  gpa: string;
  cgpa: string;
};

type Step = 1 | 2 | 3;

const emptyForm: FormValues = {
  fullName: "",
  studentId: "",
  intakeYear: "",
  attendance: ["", "", "", "", ""],
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

  const completedRequired = useMemo(() => {
    const identityCount = Number(values.fullName.trim().length > 0)
      + Number(values.studentId.trim().length > 0)
      + Number(values.intakeYear.length > 0);
    const attendanceCount = values.attendance.filter(value => value.trim() !== "").length;
    return identityCount + attendanceCount;
  }, [values]);

  useEffect(() => {
    if (!hasVisitedStep.current) {
      hasVisitedStep.current = true;
      return;
    }

    stepHeadingRef.current?.focus();
    const reduceMotion = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [step]);

  const submit = trpc.studentSurvey.submit.useMutation({
    onSuccess: () => {
      setFormError("");
      setSubmitted(true);
      setValues({ ...emptyForm, attendance: [...emptyForm.attendance] });
    },
    onError: () => {
      setFormError("We couldn’t save your response just now. Please check your connection and try again.");
    },
  });

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues(current => ({ ...current, [key]: value }));
    if (formError) setFormError("");
  };

  const updateAttendance = (index: number, value: string) => {
    setValues(current => ({
      ...current,
      attendance: current.attendance.map((item, itemIndex) => itemIndex === index ? value : item),
    }));
    if (formError) setFormError("");
  };

  const handleContinue = () => {
    if (!formRef.current?.reportValidity()) return;
    setFormError("");
    setStep(current => current === 1 ? 2 : 3);
  };

  const handleBack = () => {
    setFormError("");
    setStep(current => current === 3 ? 2 : 1);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    // Only allow submission from step 3
    if (step !== 3) {
      handleContinue();
      return;
    }

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const optionalNumber = (raw: string) => raw.trim() === "" ? undefined : Number(raw);
    submit.mutate({
      fullName: values.fullName.trim(),
      studentId: values.studentId.trim(),
      intakeYear: values.intakeYear as "2026/2027 October" | "2026/27 March",
      attendance: values.attendance.map(Number),
      gpa: optionalNumber(values.gpa),
      cgpa: optionalNumber(values.cgpa),
    });
  };

  const startAnother = () => {
    setSubmitted(false);
    setFormError("");
    setValues({ ...emptyForm, attendance: [...emptyForm.attendance] });
    setStep(1);
    submit.reset();
  };

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="FYP student attendance form home">
          <img
            className="brand-logo"
            src="/aiu-official-logo-trim.png"
            alt="Albukhary International University"
          />
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-copy">
            <strong>FYP attendance form</strong>
            <span>STUDENT DATA COLLECTION</span>
          </span>
        </a>
        <span className="project-badge"><span aria-hidden="true" /> Student FYP project</span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div className="intro-copy">
          <p className="eyebrow"><span className="eyebrow-mark" aria-hidden="true" /> FOR AIU STUDENTS · FYP RESEARCH</p>
          <h1 id="page-title">Share your attendance details.</h1>
          <p className="intro-text">
            Enter the five attendance percentages shown in Student Hub for your assigned courses.
            GPA and CGPA are optional.
          </p>
        </div>
        <div className="intro-aside" aria-hidden="true">
          <span className="intro-aside-mark">AIU</span>
          <span>THREE SHORT STEPS</span>
        </div>
      </section>

      <section className="form-panel" aria-label="Student attendance response">
        {submitted ? (
          <div className="success-view" role="status" aria-live="polite">
            <div className="success-icon"><CheckCircle2 size={30} strokeWidth={1.9} /></div>
            <p className="eyebrow"><span className="eyebrow-mark" aria-hidden="true" /> RESPONSE RECORDED</p>
            <h2>Thank you for helping.</h2>
            <p className="success-copy">
              Your response has been saved for our FYP. You can close this page or submit another response.
            </p>
            <button className="secondary-button" type="button" onClick={startAnother}>
              <RotateCcw size={16} aria-hidden="true" /> Submit another response
            </button>
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
                  {completedRequired} of 8 required fields complete
                </span>
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label="Required fields completed"
                  aria-valuemin={0}
                  aria-valuemax={8}
                  aria-valuenow={completedRequired}
                >
                  <span style={{ width: `${(completedRequired / 8) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="stepper" role="group" aria-label="Form steps">
              <div className="stepper-track" aria-hidden="true">
                <span style={{ width: `${((step - 1) / 2) * 100}%` }} />
              </div>
              {([1, 2, 3] as const).map(stepNumber => {
                const isComplete = stepNumber < step;
                const isCurrent = stepNumber === step;
                return (
                  <button
                    className={`step-item${isComplete ? " is-complete" : ""}${isCurrent ? " is-current" : ""}`}
                    type="button"
                    key={stepNumber}
                    disabled={stepNumber > step}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`Step ${stepNumber}: ${stepLabels[stepNumber]}`}
                    onClick={() => {
                      if (stepNumber < step) {
                        setFormError("");
                        setStep(stepNumber);
                      }
                    }}
                  >
                    <span className="step-marker" aria-hidden="true">
                      {isComplete ? <Check size={15} strokeWidth={2.5} /> : `0${stepNumber}`}
                    </span>
                    <span className="step-label">{stepLabels[stepNumber]}</span>
                  </button>
                );
              })}
            </div>

            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              {step === 1 && (
                <section className="form-section" aria-label="Step 1 of 3: Your details">
                  <div className="section-heading">
                    <span className="section-number">01</span>
                    <div>
                      <h3>About you</h3>
                      <p>A few details to label your response.</p>
                    </div>
                  </div>

                  <div className="field-grid">
                    <div className="field field-wide">
                      <label htmlFor="full-name">Full name <span className="required-mark">*</span></label>
                      <input
                        id="full-name"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        placeholder="Enter your full name"
                        value={values.fullName}
                        onChange={event => update("fullName", event.target.value)}
                        maxLength={150}
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="student-id">Student ID <span className="required-mark">*</span></label>
                      <input
                        id="student-id"
                        name="studentId"
                        type="text"
                        autoComplete="off"
                        placeholder="e.g. 20261234"
                        value={values.studentId}
                        onChange={event => update("studentId", event.target.value)}
                        maxLength={80}
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="intake-year">Intake year <span className="required-mark">*</span></label>
                      <select
                        id="intake-year"
                        name="intakeYear"
                        value={values.intakeYear}
                        onChange={event => update("intakeYear", event.target.value)}
                        required
                      >
                        <option value="" disabled>Select your intake</option>
                        <option value="2026/2027 October">2026/2027 October</option>
                        <option value="2026/27 March">2026/27 March</option>
                      </select>
                    </div>
                  </div>
                </section>
              )}

              {step === 2 && (
                <section className="form-section courses-section" aria-label="Step 2 of 3: Course attendance">
                  <div className="section-heading">
                    <span className="section-number">02</span>
                    <div>
                      <h3>Course attendance</h3>
                      <p>Check Student Hub, then enter each percentage.</p>
                    </div>
                  </div>

                  <div className="course-list">
                    {courseNames.map((courseName, index) => (
                      <div className="course-row" key={courseName}>
                        <div className="course-name">
                          <span className="course-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                          <label htmlFor={`attendance-${index}`}>
                            {courseName}<span className="required-mark">*</span>
                          </label>
                        </div>
                        <div className="percentage-input">
                          <input
                            id={`attendance-${index}`}
                            name={`attendance-${index + 1}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0.00"
                            value={values.attendance[index]}
                            onChange={event => updateAttendance(index, event.target.value)}
                            aria-label={`${courseName} attendance percentage from Student Hub`}
                            required
                          />
                          <span aria-hidden="true">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="field-hint">Use the attendance percentage shown in Student Hub, from 0 to 100.</p>
                </section>
              )}

              {step === 3 && (
                <section className="form-section results-section" aria-label="Step 3 of 3: Optional results and review">
                  <div className="section-heading">
                    <span className="section-number">03</span>
                    <div>
                      <h3>Academic results <span className="optional-tag">OPTIONAL</span></h3>
                      <p>Share these only if you’re comfortable.</p>
                    </div>
                  </div>

                  <div className="field-grid result-grid">
                    <div className="field">
                      <label htmlFor="gpa">GPA <span className="optional-label">Optional</span></label>
                      <input
                        id="gpa"
                        name="gpa"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="4"
                        step="0.01"
                        placeholder="e.g. 3.75"
                        value={values.gpa}
                        onChange={event => update("gpa", event.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="cgpa">CGPA <span className="optional-label">Optional</span></label>
                      <input
                        id="cgpa"
                        name="cgpa"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="4"
                        step="0.01"
                        placeholder="e.g. 3.60"
                        value={values.cgpa}
                        onChange={event => update("cgpa", event.target.value)}
                      />
                    </div>
                    <p className="field-hint results-hint">Enter the value on your institution’s scale, or leave it blank.</p>
                  </div>

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
                      <div><dt>GPA / CGPA</dt><dd>{values.gpa || values.cgpa ? [values.gpa && `GPA ${values.gpa}`, values.cgpa && `CGPA ${values.cgpa}`].filter(Boolean).join(" · ") : "Not provided"}</dd></div>
                    </dl>
                    <ul className="review-courses" aria-label="Course attendance summary">
                      {courseNames.map((courseName, index) => (
                        <li key={courseName}>
                          <span>{courseName}</span>
                          <strong>{values.attendance[index] ? `${values.attendance[index]}%` : "Not entered"}</strong>
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
                    <button className="primary-button" type="submit" disabled={submit.isPending}>
                      <span>{submit.isPending ? "Saving your response…" : "Submit response"}</span>
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
        <span>FYP · STUDENT DATA COLLECTION</span>
        <span>Student project · Not an official AIU portal</span>
      </footer>
    </main>
  );
}
