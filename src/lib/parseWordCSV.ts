import { parse } from "csv-parse/sync";

export interface WordRow {
  czech: string;
  russian: string;
  gender: string | null;
  wordType: string;
  topic: string | null;
}

const VALID_TYPES = new Set(["noun", "verb", "phrase", "adjective", "adverb"]);
const VALID_GENDERS = new Set(["masculine", "feminine", "neuter", "n/a"]);

export function parseWordCSV(content: string): WordRow[] {
  const cleaned = content.replace(/^\uFEFF/, "");

  const records = parse(cleaned, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  return records
    .filter((r) => r.czech && r.russian && r.type)
    .map((r) => {
      const gender = r.gender?.toLowerCase();
      const type = r.type?.toLowerCase();
      return {
        czech: r.czech,
        russian: r.russian,
        gender: VALID_GENDERS.has(gender) ? gender : null,
        wordType: VALID_TYPES.has(type) ? type : "phrase",
        topic: r.topic || null,
      };
    });
}
