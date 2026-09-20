import { formatMoney, listNationalities, type RequirementRule } from "@/engine";

const COUNTRY_NAMES = new Map(listNationalities().map((country) => [country.code, country.name]));

function sectorLabel(sector: string): string {
  if (sector === "all-except-financial-services") return "All sectors except financial services";
  return sector
    .split("-")
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function RuleDetails({ rule }: { rule: RequirementRule }) {
  if (rule.kind === "salary-floor") {
    const lastIndex = rule.byAge.length - 1;
    const period = rule.period === "month" ? "monthly" : "yearly";

    return (
      <div className="mt-4">
        <p className="text-caption text-muted-foreground">
          {sectorLabel(rule.sector)}, {period}
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 border-y border-border py-3 text-small tabular-nums sm:grid-cols-3 lg:grid-cols-4">
          {rule.byAge.map(({ age, amount }, index) => (
            <div key={age} className="flex min-w-0 justify-between gap-3">
              <dt className="text-muted-foreground">
                {index === 0 ? `${age} or below` : index === lastIndex ? `${age} or above` : age}
              </dt>
              <dd className="font-medium">{formatMoney(amount, rule.currency)}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (rule.kind === "nationality-list") {
    return (
      <div className="mt-4 text-small">
        <p className="font-medium">{rule.listName}</p>
        <p className="mt-1 text-muted-foreground">
          {rule.codes.map((code) => COUNTRY_NAMES.get(code) ?? code).join(", ")}
        </p>
      </div>
    );
  }

  return null;
}