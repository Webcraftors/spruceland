export interface SOP {
  slug: string;
  title: string;
  category: "Calibration" | "Installation" | "Diagnostics" | "Safety";
  summary: string;
  steps: { title: string; body: string }[];
}

export const SOPS: SOP[] = [
  {
    slug: "platform-scale-calibration",
    title: "Platform Scale Calibration (up to 1000kg)",
    category: "Calibration",
    summary: "Standard span & linearity calibration for platform scales using F1/M1 test weights.",
    steps: [
      { title: "Site & safety check", body: "Confirm level surface. Clear traffic. PPE: gloves, safety shoes, hi-vis." },
      { title: "Warm-up", body: "Power the indicator for at least 15 minutes before calibration." },
      { title: "Zero the scale", body: "With platform empty, press ZERO. Confirm centre-of-zero indicator is stable." },
      { title: "Enter calibration mode", body: "Rinstrum R320: hold SETUP then enter passcode. Navigate to CAL menu." },
      { title: "Zero calibration", body: "Confirm 'ZERO' step. Wait for stable, press OK." },
      { title: "Span calibration", body: "Load rated capacity (or nearest available test weight). Enter value. Press OK when stable." },
      { title: "Linearity check", body: "Apply weights at 25%, 50%, 75%, 100% of capacity. Record readings — max error ±0.05% of applied load." },
      { title: "Corner (shift) test", body: "Apply 1/3 capacity to each corner. Max deviation between corners ≤ 1 division." },
      { title: "Seal & document", body: "Re-apply calibration seal. Log serial no, technician, weights used, deviations." },
    ],
  },
  {
    slug: "weighbridge-calibration",
    title: "Weighbridge Calibration (80T)",
    category: "Calibration",
    summary: "Full E1–E5 point calibration for pit / above-ground weighbridges.",
    steps: [
      { title: "Pre-check", body: "Inspect deck, load cells, junction box, cable glands. Photograph any damage." },
      { title: "Empty deck & zero", body: "Confirm deck clear. Zero indicator (R420). Verify all cell mV/V readings within 0.5% of each other." },
      { title: "Cell corner test", body: "Position 10T test truck over each cell in turn. Adjust corner trim pots to equalise readings within 0.1%." },
      { title: "Span calibration", body: "Load full capacity in stages: 20T, 40T, 60T, 80T using stacked test weight fleet." },
      { title: "Repeatability", body: "Run three loaded passes. Deviation must be ≤ 20kg between passes." },
      { title: "Return-to-zero", body: "Remove load. Reading must return to within ±10kg of zero." },
      { title: "Documentation & seal", body: "Complete ZWMA certificate. Fit tamper-evident seal on indicator." },
    ],
  },
  {
    slug: "diagnostic-flow",
    title: "Diagnostic Flow — Erratic Readings",
    category: "Diagnostics",
    summary: "Standard triage for unstable, drifting or non-repeating weight readings.",
    steps: [
      { title: "Environment", body: "Check for airflow, vibration, sloping surface, and nearby RF sources." },
      { title: "Cable & junction", body: "Open J-box. Inspect for moisture, corrosion, loose terminals. Measure resistances." },
      { title: "Cell mV/V test", body: "Measure each cell output at zero and under known load. Compare against nameplate." },
      { title: "Indicator self-test", body: "Run indicator diagnostic mode (Rinstrum: SETUP > TEST). Check ADC counts." },
      { title: "Isolate suspect cell", body: "If one cell reads off-band, isolate and re-test scale. Swap with known-good if available." },
      { title: "Escalate if unresolved", body: "If problem persists after cell + junction verification, log escalation to Head of Tech." },
    ],
  },
  {
    slug: "site-safety",
    title: "Site Safety SOP",
    category: "Safety",
    summary: "Baseline site safety for all field visits.",
    steps: [
      { title: "Pre-arrival", body: "Confirm client site induction requirements. Carry PPE, first aid, LOTO kit." },
      { title: "Sign-in", body: "Sign into site register. Confirm scope with client contact." },
      { title: "Isolate power", body: "Lock out & tag out indicator supply before opening enclosures." },
      { title: "Work at height", body: "For weighbridge pit work: barricade, use harness where applicable, no lone working." },
      { title: "Incident reporting", body: "Any near-miss or incident logged in Spruceland Ops within 2 hours." },
    ],
  },
];

export function sopBySlug(slug: string) { return SOPS.find(s => s.slug === slug); }
