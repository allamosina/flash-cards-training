import { parse } from "csv-parse/sync";

export function parseCSV(content: string): { question: string; answer: string }[] {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  return records
    .filter((r) => r.question && r.answer)
    .map((r) => ({ question: r.question, answer: r.answer }));
}
