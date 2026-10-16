import fs from "node:fs";
import path from "node:path";
import type { Issue, Prediction } from "./types";

const DIR = path.join(process.cwd(), "content/radar");

export function listIssueDates(): string[] {
  const dir = path.join(DIR, "issues");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.slice(0, 10))
    .sort()
    .reverse();
}

export function getIssue(date: string): Issue {
  return JSON.parse(fs.readFileSync(path.join(DIR, "issues", `${date}.json`), "utf8")) as Issue;
}

export function getLedger(): Prediction[] {
  const file = path.join(DIR, "ledger.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8")) as Prediction[];
}

export const SITE = "https://nodeman.io";

export function formatKDate(date: string): string {
  const wd = ["일", "월", "화", "수", "목", "금", "토"][new Date(`${date}T12:00:00Z`).getUTCDay()];
  const [y, m, dd] = date.split("-").map(Number);
  return `${y}년 ${m}월 ${dd}일 ${wd}요일`;
}
