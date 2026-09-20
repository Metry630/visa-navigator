import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  encodeProfile,
  listNationalities,
  type DegreeLevel,
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
          "Answer a few short questions about your nationality, age and degree to see the work visa rules that apply to you.",
      },
      { property: "og:title", content: "Check your work visa options | Visa Routes" },
      {
        property: "og:description",
        content: "A short form. Nothing is stored: your answers stay in the page address.",
      },
      { property: "og:url", content: "/check" },
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
  { code: "id", name: "Bahasa Indonesia" },
  { code: "zh", name: "Chinese" },
  { code: "hi", name: "Hindi" },
  { code: "ja", name: "Japanese" },
  { code: "ms", name: "Malay" },
  { code: "tl", name: "Tagalog" },
  { code: "ta", name: "Tamil" },
];

const LEVELS: { value: LanguageLevel; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "conversational", label: "Conversational" },
  { value: "business", label: "Business" },
  { value: "native", label: "Native" },
];

type FormState = {
  nationality: string;
  secondNationality: string;
  age: string;
  degree: DegreeLevel;
  university: string;
  universityCountry: string;
  graduationYear: string;
  field: string;
  yearsExperience: string;
  hasJobOffer: "yes" | "no" | "";
  languages: Record<string, LanguageLevel | "">;
};

const selectClass =
  "h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-body text-foreground sm:h-10";

function CheckPage() {
  const navigate = useNavigate();
  const nationalities = useMemo(() => listNationalities(), []);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    nationality: "",
    secondNationality: "",
    age: "",
    degree: "bachelor",
    university: "",
    universityCountry: "",
    graduationYear: "",
    field: "",
    yearsExperience: "0",
    hasJobOffer: "",
    languages: { en: "business" },
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return nationalities;
    return nationalities.filter(
      (nationality) =>
        nationality.name.toLowerCase().includes(query) || nationality.code.toLowerCase() === query,
    );
  }, [nationalities, search]);

  const update = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

  function fail(message: string, fieldId: string) {
    setError(message);
    window.requestAnimationFrame(() => document.getElementById(fieldId)?.focus());
  }

  function submit() {
    if (!form.nationality) {
      fail("Choose your nationality to continue.", "nationality");
      return;
    }

    const age = Number(form.age);
    if (!form.age || !Number.isFinite(age) || age < 14 || age > 100) {
      fail("Enter an age between 14 and 100.", "age");
      return;
    }

    if (form.hasJobOffer === "") {
      fail("Choose whether you already have a job offer.", "offer-no");
      return;
    }

    setError(null);
    const experience = Number(form.yearsExperience);
    const profile: Profile = {
      nationalities: [form.nationality, form.secondNationality].filter(Boolean) as string[],
      age,
      degree: form.degree,
      yearsExperience:
        Number.isFinite(experience) && experience >= 0 && experience <= 60 ? experience : 0,
      languages: Object.entries(form.languages)
        .filter(([, level]) => level)
        .map(([code, level]) => ({ code, level: level as LanguageLevel })),
      hasOffer: form.hasJobOffer === "yes",
    };
    if (form.university.trim()) profile.university = form.university.trim();
    if (form.universityCountry) profile.universityCountry = form.universityCountry;
    const graduationYear = Number(form.graduationYear);
    if (
      form.graduationYear.trim() &&
      Number.isInteger(graduationYear) &&
      graduationYear >= 1950 &&
      graduationYear <= 2100
    ) {
      profile.graduationYear = graduationYear;
    }
    if (form.field.trim()) profile.field = form.field.trim();

    void navigate({ to: "/results", search: { p: encodeProfile(profile) } });
  }

  return (
    <div className="mx-auto min-w-0 max-w-2xl px-4 py-10 sm:px-5 sm:py-12">
      <h1 className="text-title font-semibold">Check your options</h1>
      <p className="mt-2 text-small text-muted-foreground">
        Your answers stay in the page address and are not stored.
      </p>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {error ? "The form needs attention." : ""}
      </div>

      <form
        className="mt-8 space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <fieldset className="space-y-4">
          <legend className="sr-only">Your nationality</legend>
          <div className="space-y-2">
            <Label htmlFor="nationality-search">Search nationalities</Label>
            <Input
              id="nationality-search"
              className="h-11 sm:h-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
              onChange={(event) => update({ nationality: event.target.value })}
            >
              <option value="">Choose a nationality</option>
              {filtered.map((nationality) => (
                <option key={nationality.code} value={nationality.code}>
                  {nationality.name}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

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
            onChange={(event) => update({ age: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="degree">Highest degree</Label>
          <select
            id="degree"
            className={selectClass}
            value={form.degree}
            onChange={(event) => update({ degree: event.target.value as DegreeLevel })}
          >
            {DEGREES.map((degree) => (
              <option key={degree.value} value={degree.value}>
                {degree.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-body font-medium">Do you already have a job offer?</legend>
          <div className="flex flex-wrap gap-4">
            {(["no", "yes"] as const).map((answer) => (
              <label key={answer} className="flex min-h-11 cursor-pointer items-center gap-2">
                <input
                  id={`offer-${answer}`}
                  type="radio"
                  name="job-offer"
                  value={answer}
                  checked={form.hasJobOffer === answer}
                  onChange={() => update({ hasJobOffer: answer })}
                />
                {answer === "yes" ? "Yes" : "No"}
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-body font-medium text-destructive">
            {error}
          </p>
        )}

        <Button className="min-h-11 sm:min-h-10" type="submit">
          See my routes
        </Button>

        <details className="group border-t border-border pt-5">
          <summary className="min-h-11 cursor-pointer list-none rounded-sm py-2 font-medium text-primary underline-offset-2 underline marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Add more about yourself</span>
            <span className="hidden group-open:inline">Hide extra details</span>
          </summary>
          <div className="mt-4 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nationality-2">Second nationality, optional</Label>
              <select
                id="nationality-2"
                className={selectClass}
                value={form.secondNationality}
                onChange={(event) => update({ secondNationality: event.target.value })}
              >
                <option value="">None</option>
                {nationalities
                  .filter((nationality) => nationality.code !== form.nationality)
                  .map((nationality) => (
                    <option key={nationality.code} value={nationality.code}>
                      {nationality.name}
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
                onChange={(event) => update({ university: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="university-country">University country, optional</Label>
              <select
                id="university-country"
                className={selectClass}
                value={form.universityCountry}
                onChange={(event) => update({ universityCountry: event.target.value })}
              >
                <option value="">Choose a country</option>
                {nationalities.map((nationality) => (
                  <option key={nationality.code} value={nationality.code}>
                    {nationality.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
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
                  onChange={(event) => update({ graduationYear: event.target.value })}
                />
              </div>
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
                  onChange={(event) => update({ yearsExperience: event.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field">Field of study, optional</Label>
              <Input
                id="field"
                className="h-11 sm:h-10"
                value={form.field}
                onChange={(event) => update({ field: event.target.value })}
              />
            </div>

            <fieldset>
              <legend className="text-body font-medium">Languages, optional</legend>
              <div className="mt-2 grid gap-x-5 gap-y-2 rounded-md border border-border p-3 sm:grid-cols-2">
                {LANGUAGES.map((language) => (
                  <div
                    key={language.code}
                    className="grid grid-cols-[minmax(0,1fr)_8.5rem] items-center gap-2"
                  >
                    <Label className="text-small" htmlFor={`lang-${language.code}`}>
                      {language.name}
                    </Label>
                    <select
                      id={`lang-${language.code}`}
                      className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-small text-foreground"
                      value={form.languages[language.code] ?? ""}
                      onChange={(event) =>
                        update({
                          languages: {
                            ...form.languages,
                            [language.code]: event.target.value as LanguageLevel | "",
                          },
                        })
                      }
                    >
                      <option value="">Not spoken</option>
                      {LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        </details>
      </form>
    </div>
  );
}
