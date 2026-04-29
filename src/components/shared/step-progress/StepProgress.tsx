"use client";

/* ============================================================================
   StepProgress
   The emotional spine of every multi-step workflow in TCoEFS Portal.
   Used on: Postgraduate application (7 steps), Training registration (7 steps).

   Each step can be: complete | active | inactive
   The connector line between steps fills green once the left step completes.

   Checkmark animation: SVG polyline draws in via stroke-dashoffset (500ms),
   the circle pops with a spring cubic-bezier on completion.
   ============================================================================ */

export type StepStatus = "complete" | "active" | "inactive";

export interface Step {
  /** Step number (1-based, displayed inside the circle when not complete) */
  number: number;
  /** Short label rendered below the circle */
  label: string;
  /** Current state of this step */
  status: StepStatus;
}

interface StepProgressProps {
  steps: Step[];
  /** Optional className for the outer wrapper */
  className?: string;
}

/* ── Keyframes injected once (idempotent style tag) ──────────────────────── */

const STEP_KEYFRAMES = `
@keyframes tcoefs-checkmark-draw {
  0%   { stroke-dashoffset: 24; opacity: 0; }
  25%  { opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 1; }
}
@keyframes tcoefs-checkmark-pop {
  0%   { transform: scale(0.3); opacity: 0; }
  50%  { transform: scale(1.22); opacity: 1; }
  72%  { transform: scale(0.91); }
  88%  { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes tcoefs-connector-fill {
  0%   { transform: scaleX(0); transform-origin: left; }
  100% { transform: scaleX(1); transform-origin: left; }
}
`;

function injectKeyframes() {
  if (
    typeof document !== "undefined" &&
    !document.getElementById("tcoefs-step-keyframes")
  ) {
    const style = document.createElement("style");
    style.id = "tcoefs-step-keyframes";
    style.textContent = STEP_KEYFRAMES;
    document.head.appendChild(style);
  }
}

/* ── Animated checkmark SVG ─────────────────────────────────────────────── */

function AnimatedCheck() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      style={{
        animation:
          "tcoefs-checkmark-pop 480ms cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      <polyline
        points="3,9.5 7.5,14 15,5"
        stroke="#fff"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={24}
        strokeDashoffset={24}
        style={{
          animation:
            "tcoefs-checkmark-draw 600ms cubic-bezier(0.22,1,0.36,1) 80ms forwards",
        }}
      />
    </svg>
  );
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function StepProgress({ steps, className }: StepProgressProps) {
  // Inject keyframes on first render (client-side only)
  if (typeof window !== "undefined") {
    injectKeyframes();
  }

  return (
    <nav aria-label="Application progress" className={className}>
      <ol className="step-progress" role="list">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.number}
              className={`step-progress__item step-progress__item--${step.status}`}
              aria-current={step.status === "active" ? "step" : undefined}
              aria-label={`Step ${step.number}: ${step.label} — ${step.status}`}
            >
              {/* ── Circle ──────────────────────────────────────────────── */}
              {/*
                Key includes status so React remounts the circle when a step
                transitions to "complete", guaranteeing the checkmark animation
                fires fresh every time rather than being skipped as a no-op diff.
              */}
              <div
                key={`${step.number}-${step.status}`}
                className="step-progress__circle"
                aria-hidden="true"
                style={{
                  transition:
                    "transform 380ms cubic-bezier(0.34,1.56,0.64,1), background 350ms ease, box-shadow 350ms ease",
                }}
              >
                {step.status === "complete" ? <AnimatedCheck /> : step.number}
              </div>

              {/* ── Connector line ───────────────────────────────────────── */}
              {/*
                When the left step is complete we overlay a green fill that
                animates in via scaleX, giving the "track filling" illusion.
              */}
              {!isLast && (
                <div className="step-progress__connector" aria-hidden="true">
                  {step.status === "complete" && (
                    <div
                      className="step-progress__connector-fill"
                      aria-hidden="true"
                      style={{
                        animation:
                          "tcoefs-connector-fill 350ms cubic-bezier(0.22,1,0.36,1) 120ms both",
                      }}
                    />
                  )}
                </div>
              )}

              {/* ── Label ───────────────────────────────────────────────── */}
              <span className="step-progress__label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ── Preset step definitions ─────────────────────────────────────────────── */

/** The canonical 7-step postgraduate application workflow */
export const POSTGRADUATE_STEPS: Omit<Step, "status">[] = [
  { number: 1, label: "Programme" },
  { number: 2, label: "Personal Info" },
  { number: 3, label: "Qualifications" },
  { number: 4, label: "Documents" },
  { number: 5, label: "Invoice" },
  { number: 6, label: "Payment" },
  { number: 7, label: "Review" },
];

/** The canonical 7-step training registration workflow */
export const TRAINING_STEPS: Omit<Step, "status">[] = [
  { number: 1, label: "Programme" },
  { number: 2, label: "Personal Info" },
  { number: 3, label: "Organisation" },
  { number: 4, label: "Documents" },
  { number: 5, label: "Invoice" },
  { number: 6, label: "Payment" },
  { number: 7, label: "Confirm" },
];

/**
 * Helper: given a 1-based active step number and the base step definitions,
 * returns the full Step array with statuses applied.
 *
 * @example
 * const steps = buildSteps(POSTGRADUATE_STEPS, 3);
 * // steps 1–2 → complete, step 3 → active, steps 4–7 → inactive
 */
export function buildSteps(
  base: Omit<Step, "status">[],
  activeStep: number,
): Step[] {
  return base.map((s) => ({
    ...s,
    status:
      s.number < activeStep
        ? "complete"
        : s.number === activeStep
          ? "active"
          : "inactive",
  }));
}
