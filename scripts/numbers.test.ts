import { describe, expect, it } from "vitest";
import { numbers, splitOnNumbers, toAsciiDigits } from "./numbers";

describe("numbers", () => {
  it("strips currency symbols and thousands separators", () => {
    expect(numbers("at least S$5,600 if you are 23 or below")).toEqual(["5600", "23"]);
    expect(numbers("no figures here")).toEqual([]);
  });

  it("reads the full-width digits Japanese official pages use", () => {
    expect(numbers("カテゴリー３又は４")).toEqual(["3", "4"]);
    expect(numbers("ＣＥＦＲ・Ｂ２相当")).toEqual(["2"]);
    expect(numbers("４００点以上")).toEqual(["400"]);
    expect(numbers("源泉徴収税額が１，０００万円以上")).toEqual(["1000"]);
    expect(numbers("令和８年４月１５日")).toEqual(["8", "4", "15"]);
  });

  it("grounds an English sentence against a full-width quote", () => {
    const quoted = new Set(numbers("カテゴリー３又は４に該当する場合"));
    expect(numbers("Category 3 or 4").every((n) => quoted.has(n))).toBe(true);
  });

  it("does not read numbers written as kanji", () => {
    expect(numbers("十年以上の実務経験")).toEqual([]);
  });

  it("keeps decimals together", () => {
    expect(numbers("3.5 years")).toEqual(["3.5"]);
    expect(toAsciiDigits("３．５")).toBe("3.5");
  });
});

describe("splitOnNumbers", () => {
  it("puts the numbers on odd indexes and leaves them exactly as written", () => {
    expect(splitOnNumbers("at least S$5,600 a month")).toEqual([
      "at least S$",
      "5,600",
      " a month",
    ]);
    expect(splitOnNumbers("カテゴリー３又は４")).toEqual(["カテゴリー", "３", "又は", "４", ""]);
  });

  it("returns a single part when there is no number", () => {
    expect(splitOnNumbers("no figures here")).toEqual(["no figures here"]);
  });
});
