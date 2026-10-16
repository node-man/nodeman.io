// Tech Radar issue format. One file per day: content/radar/issues/<YYYY-MM-DD>.json
// The daily writer produces DATA ONLY; every visual comes from fixed renderers in
// src/app/radar/_components. scripts/radar/validate.mjs enforces this shape.

export type Link = { title: string; url: string };

/** Inline markup allowed in any text field: **bold** only. */
export type Text = string;

export type Block =
  | { type: "p"; text: Text; dropcap?: boolean }
  | { type: "pull"; text: Text }
  | { type: "stats"; items: { value: string; label: Text }[] }
  | {
      type: "cards";
      title?: string;
      items: {
        name: string;
        sub?: string;
        /** e.g. thrusters 4 of 10 */
        dots?: { on: number; total: number; label?: string };
        rows?: [string, string][];
        highlight?: { label: string; value: string; tone?: "risk" };
      }[];
      footer?: Text;
    }
  | {
      type: "timeline";
      title: string;
      /** ISO-ish dates: YYYY, YYYY-MM or YYYY-MM-DD. Positions are computed from dates. */
      points: { date: string; label: string; note?: string; kind?: "past" | "missed" | "now" | "future" }[];
      gaps?: { from: string; to: string; label: string }[];
    }
  | { type: "bars"; title: string; unit?: string; items: { label: string; value: number; note?: string }[]; caption?: Text }
  | { type: "share"; title: string; items: { label: string; value: number }[] }
  | { type: "quotes"; items: { who: string; text: Text }[] }
  | { type: "unknowns"; title: string; items: Text[] }
  | { type: "list"; items: { k: string; text: Text }[] }
  | { type: "boxes"; items: { tone: "go" | "risk"; title: string; items: Text[] }[] }
  | { type: "reads"; items: ReadItem[] }
  | { type: "repo"; repo: Repo }
  | { type: "ledger" };

export type ReadItem = {
  title: string;
  url: string;
  via: string;
  why: Text;
  /** When the pick came from the raw HN collection, copy id/points/comments exactly. */
  hn?: { id: string; points: number; comments: number };
};

export type Repo = {
  fullName: string;
  rank: number;
  language?: string | null;
  license?: string | null;
  /** Total stars: GitHub API value from the raw collection. */
  stars: number;
  /** "N stars today" from the raw trending page. */
  starsToday: number;
  /** "none" is mandatory for Anthropic repositories (conflict of interest). */
  verdict: "try" | "experiment" | "watch" | "reference" | "none";
  def: Text;
  rows: [string, Text][];
};

export type AiOpinion =
  | { kind: "opinion"; stance: string; confidence: 1 | 2 | 3; points: { k: string; v: Text }[] }
  | { kind: "none"; reason: Text };

export type Story = {
  id: string;
  kicker: string;
  title: string;
  /** Cross-coverage signal shown as a chip, e.g. { count: 19, basis: "Techmeme 관련 기사" } */
  hot?: { count: number; basis: string };
  /** Legal stories are allowed only when every party named is a company. */
  legal?: "company-only";
  /** True when the same subject ran in an earlier issue and this is new information. */
  followUp?: boolean;
  blocks: Block[];
  ai?: AiOpinion;
  sources: Link[];
};

export type Section = {
  id: string;
  kind: "lead" | "headlines" | "github" | "korea" | "reading" | "column";
  label: string;
  title: string;
  dek?: string;
  stories: Story[];
};

export type Issue = {
  version: 1;
  date: string;
  /** ISO timestamp with offset, e.g. 2026-10-17T08:02:00+09:00 */
  publishedAt: string;
  title: string;
  lede: Text;
  /** Path of the raw collection this issue was written from, or null when unavailable. */
  raw: string | null;
  rawCollectedAt: string | null;
  quick: Text[];
  /** Cover headline, 2-3 short lines joined with "\n"; the last line is set in the accent tint. */
  cover?: { big: string };
  sections: Section[];
  corrections?: Text[];
};

export type Prediction = {
  id: string;
  issued: string;
  statement: string;
  probability: number;
  due: string;
  dueLabel?: string;
  status: "pending" | "hit" | "miss" | "void";
  resolvedOn?: string;
  note?: string;
  evidence?: string;
};
