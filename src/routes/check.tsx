import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DESTINATIONS,
  encodeProfile,
  listNationalities,
  type DegreeLevel,
  type Destination,
  type LanguageLevel,
  type Profile,
} from "@/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "Check your work visa options | Visa Routes" },
      {
        name: "description",
        content:
          "Answer a few short questions about your nationality, age, degree and experience to see the work visa routes open to you.",
      },
      { property: "og:title", content: "Check your work visa options | Visa Routes" },
      {
        property: "og:description",
        content: "A short form. Nothing is stored: your answers stay in the page address.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/check" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/check" }],
  }),
  component: CheckPage,
});

const DEGREES: { value: DegreeLevel; label: string }[] = [
  { value: "none", label: "No degree" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelor", label: "Bachelor's degree" },
  { value: "master", label: "Master's degree" },
  { value: "doctorate", label: "Doctorate" },
];

const LANGUAGES: { code: string; name: string }[] = [
  { code: "en", name: "English" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ms", name: "Malay" },
  { code: "ta", name: "Tamil" },
];

const LEVELS: { value: LanguageLevel; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "conversational", label: "Conversational" },
  { value: "business", label: "Business" },
  { value: "native", label: "Native" },
];

const SALARY_LABEL: Record<Destination, string> = {
  SG: "Expected salary in Singapore, SGD per month",
  JP: "Expected salary in Japan, JPY per year",
};

type FormState = {
  nationality: string;
  secondNationality: string;
  age: string;
  degree: DegreeLevel;
  university: string;
  graduationYear: string;
  field: string;
  yearsExperience: string;
  languages: Record<string, LanguageLevel | "">;
  salary: Record<string, string>;
};

const STEP_TITLES = [
  "Nationality",
  "Age",
  "Education",
  "Work experience",
  "Languages",
  "Expected salary",
];

const selectClass =
  "h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground sm:h-10";

function CheckPage() {
  const navigate = useNavigate();
  const nationalities = useMemo(() => listNationalities(), []);
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(step);
  const invalidFieldRef = useRef<string | null>(null);
  const [form, setForm] = useState<FormState>({
    nationality: "",
    secondNationality: "",
    age: "",
    degree: "bachelor",
    university: "",
    graduationYear: "",
    field: "",
    yearsExperience: "0",
    languages: { en: "business" },
    salary: {},
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return nationalities;
    return nationalities.filter(
      (n) => n.name.toLowerCase().includes(q) || n.code.toLowerCase() === q,
    );
  }, [nationalities, search]);

  const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    if (previousStepRef.current === step) return;
    previousStepRef.current = step;
    if (invalidFieldRef.current) {
      document.getElementById(invalidFieldRef.current)?.focus();
      invalidFieldRef.current = null;
      return;
    }
    stepHeadingRef.current?.focus();
  }, [step]);

  function focusInvalidField(current: number) {
    const fieldId =
      current === 0 ? "nationality" : current === 1 ? "age" : current === 3 ? "years" : null;
    if (!fieldId) return;
    if (current === step) {
      document.getElementById(fieldId)?.focus();
      return;
    }
    invalidFieldRef.current = fieldId;
  }

  function validateStep(current: number): string | null {
    if (current === 0 && !form.nationality) return "Choose your nationality to continue.";
    if (current === 1) {
      const age = Number(form.age);
      if (!form.age || !Number.isFinite(age) || age < 14 || age > 100) {
        return "Enter an age between 14 and 100.";
      }
    }
    if (current === 3) {
      const years = Number(form.yearsExperience);
      if (form.yearsExperience === "" || !Number.isFinite(years) || years < 0) {
        return "Enter your years of work experience, or 0.";
      }
    }
    return null;
  }

  function next() {
    const problem = validateStep(step);
    if (problem) {
      setError(problem);
      focusInvalidField(step);
      return;
    }
    setError(null);
    invalidFieldRef.current = null;
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  }

  function back() {
    setError(null);
    invalidFieldRef.current = null;
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    for (let i = 0; i < STEP_TITLES.length; i += 1) {
      const problem = validateStep(i);
      if (problem) {
        setStep(i);
        setError(problem);
        focusInvalidField(i);
        return;
      }
    }
    const profile: Profile = {
      nationalities: [form.nationality, form.secondNationality].filter(Boolean) as string[],
      age: Number(form.age),
      degree: form.degree,
      yearsExperience: Number(form.yearsExperience),
      languages: Object.entries(form.languages)
        .filter(([, level]) => level)
        .map(([code, level]) => ({ code, level: level as LanguageLevel })),
    };
    if (form.university.trim()) profile.university = form.university.trim();
    if (form.graduationYear.trim()) profile.graduationYear = Number(form.graduationYear);
    if (form.field.trim()) profile.field = form.field.trim();
    const salary: Partial<Record<Destination, number>> = {};
    for (const d of DESTINATIONS) {
      const raw = form.salary[d.code];
      if (raw && Number.isFinite(Number(raw))) salary[d.code] = Number(raw);
    }
    if (Object.keys(salary).length) profile.expectedSalary = salary;

    void navigate({ to: "/results", search: { p: encodeProfile(profile) } });
  }

  const isLast = step === STEP_TITLES.length - 1;

  return (
    <div className="mx-auto min-w-0 max-w-2xl px-4 py-10 sm:px-5 sm:py-12">
      <h1 className="text-3xl font-semibold">Check your options</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Six short steps. Your answers stay in the page address and are not stored.
      </p>

      <div className="mt-8">
        <div
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          <h2
            ref={stepHeadingRef}
            tabIndex={-1}
            className="min-w-0 font-sans text-sm font-medium outline-none"
          >
            {STEP_TITLES[step]}
          </h2>
          <span className="shrink-0 text-muted-foreground">
            Step {step + 1} of {STEP_TITLES.length}
          </span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEP_TITLES.length}
          aria-valuenow={step + 1}
          aria-label="Form progress"
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
          />
        </div>
      </div>

      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (isLast) submit();
          else next();
        }}
      >
        {step === 0 && (
          <fieldset className="space-y-4">
            <legend className="sr-only">Nationality</legend>
            <div className="space-y-2">
              <Label htmlFor="nationality-search">Search nationalities</Label>
              <Input
                id="nationality-search"
                className="h-11 sm:h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a country name"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Your nationality</Label>
              <select
                id="nationality"
                className={selectClass}
                value={form.nationality}
                onChange={(e) => update({ nationality: e.target.value })}
              >
                <option value="">Choose a nationality</option>
                {filtered.map((n) => (
                  <option key={n.code} value={n.code}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality-2">Second nationality, optional</Label>
              <select
                id="nationality-2"
                className={selectClass}
                value={form.secondNationality}
                onChange={(e) => update({ secondNationality: e.target.value })}
              >
                <option value="">None</option>
                {nationalities
                  .filter((n) => n.code !== form.nationality)
                  .map((n) => (
                    <option key={n.code} value={n.code}>
                      {n.name}
                    </option>
                  ))}
              </select>
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <div className="space-y-2">
            <Label htmlFor="age">Your age</Label>
            <Input
              id="age"
              className="h-11 sm:h-10"
              type="number"
              min={14}
              max={100}
              inputMode="numeric"
              value={form.age}
              onChange={(e) => update({ age: e.target.value })}
            />
          </div>
        )}

        {step === 2 && (
          <fieldset className="space-y-4">
            <legend className="sr-only">Education</legend>
            <div className="space-y-2">
              <Label htmlFor="degree">Highest degree</Label>
              <select
                id="degree"
                className={selectClass}
                value={form.degree}
                onChange={(e) => update({ degree: e.target.value as DegreeLevel })}
              >
                {DEGREES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="university">University, optional</Label>
              <Input
                id="university"
                className="h-11 sm:h-10"
                value={form.university}
                onChange={(e) => update({ university: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="graduation-year">Graduation year, optional</Label>
              <Input
                id="graduation-year"
                className="h-11 sm:h-10"
                type="number"
                inputMode="numeric"
                min={1950}
                max={2100}
                value={form.graduationYear}
                onChange={(e) => update({ graduationYear: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field">Field of study, optional</Label>
              <Input
                id="field"
                className="h-11 sm:h-10"
                value={form.field}
                onChange={(e) => update({ field: e.target.value })}
              />
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <div className="space-y-2">
            <Label htmlFor="years">Years of work experience</Label>
            <Input
              id="years"
              className="h-11 sm:h-10"
              type="number"
              min={0}
              max={60}
              inputMode="numeric"
              value={form.yearsExperience}
              onChange={(e) => update({ yearsExperience: e.target.value })}
            />
          </div>
        )}

        {step === 4 && (
          <fieldset className="space-y-4">
            <legend className="mb-2 text-sm text-muted-foreground">
              Choose a level for each language you speak. Leave a language blank if you do not speak
              it.
            </legend>
            {LANGUAGES.map((lang) => (
              <div key={lang.code} className="space-y-2">
                <Label htmlFor={`lang-${lang.code}`}>{lang.name}</Label>
                <select
                  id={`lang-${lang.code}`}
                  className={selectClass}
                  value={form.languages[lang.code] ?? ""}
                  onChange={(e) =>
                    update({
                      languages: {
                        ...form.languages,
                        [lang.code]: e.target.value as LanguageLevel | "",
                      },
                    })
                  }
                >
                  <option value="">Not spoken</option>
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </fieldset>
        )}

        {step === 5 && (
          <fieldset className="space-y-4">
            <legend className="mb-2 text-sm text-muted-foreground">
              Optional. Leave blank if you do not know yet.
            </legend>
            {DESTINATIONS.map((d) => (
              <div key={d.code} className="space-y-2">
                <Label htmlFor={`salary-${d.code}`}>{SALARY_LABEL[d.code]}</Label>
                <Input
                  id={`salary-${d.code}`}
                  className="h-11 sm:h-10"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.salary[d.code] ?? ""}
                  onChange={(e) => update({ salary: { ...form.salary, [d.code]: e.target.value } })}
                />
              </div>
            ))}
          </fieldset>
        )}

        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
          <Button
            className="min-h-11 sm:min-h-10"
            type="button"
            variant="outline"
            onClick={back}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button className="min-h-11 sm:min-h-10" type="submit">
            {isLast ? "See my routes" : "Next"}
          </Button>
        </div>
      </form>
    </div>
  );
}
