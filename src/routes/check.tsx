import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
      { title: "Check your work visa options" },
      {
        name: "description",
        content:
          "Answer a few short questions about your nationality, age, degree and experience to see the work visa routes open to you.",
      },
      { property: "og:title", content: "Check your work visa options" },
      {
        property: "og:description",
        content: "A short form. Nothing is stored: your answers stay in the page address.",
      },
    ],
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
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

function CheckPage() {
  const navigate = useNavigate();
  const nationalities = useMemo(() => listNationalities(), []);
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    for (let i = 0; i < STEP_TITLES.length; i += 1) {
      const problem = validateStep(i);
      if (problem) {
        setStep(i);
        setError(problem);
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
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-semibold">Check your options</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Six short steps. Your answers stay in the page address and are not stored.
      </p>

      <div className="mt-8">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{STEP_TITLES[step]}</span>
          <span className="text-muted-foreground">
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
                value={form.university}
                onChange={(e) => update({ university: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="graduation-year">Graduation year, optional</Label>
              <Input
                id="graduation-year"
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

        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
            Back
          </Button>
          <Button type="submit">{isLast ? "See my routes" : "Next"}</Button>
        </div>
      </form>
    </div>
  );
}
