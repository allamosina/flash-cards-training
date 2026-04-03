import { parse } from "csv-parse/sync";

export function parseCSV(content: string): { question: string; answer: string }[] {
  // Strip UTF-8 BOM if present
  const cleaned = content.replace(/^\uFEFF/, "");

  const records = parse(cleaned, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  return records
    .filter((r) => (r.question || r.front) && (r.answer || r.back))
    .map((r) => ({ question: r.question ?? r.front, answer: r.answer ?? r.back }));
}
