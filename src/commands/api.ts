import { Command } from "commander";
import { getAuthHeader } from "../lib/config.js";

const API_BASE = "https://api.bitbucket.org/2.0";

export const apiCommand = new Command("api")
  .description("Make an authenticated Bitbucket API request")
  .argument("<path>", "API path (e.g., /repositories/workspace/repo)")
  .option("--method <method>", "HTTP method: GET, POST, PUT, DELETE", "GET")
  .option("--field <fields...>", 'Request body fields (key=value)')
  .option("--input <file>", "Read request body from file (- for stdin)")
  .option("--hostname <host>", "Bitbucket hostname")
  .option("--paginate", "Auto-fetch all pages")
  .option("--include", "Include response headers")
  .option("--silent", "Suppress progress output")
  .action(async (path, opts) => {
    const authHeader = getAuthHeader(opts.hostname);
    if (!authHeader) {
      console.error("Not authenticated. Run `bb auth login` first.");
      process.exit(1);
    }

    const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

    const headers: Record<string, string> = {
      Authorization: authHeader,
      Accept: "application/json",
    };

    const fetchOpts: RequestInit = {
      method: opts.method.toUpperCase(),
      headers,
    };

    // Build body from --field flags or --input
    if (opts.field && opts.field.length > 0) {
      const body: Record<string, string> = {};
      for (const f of opts.field) {
        const eqIdx = f.indexOf("=");
        if (eqIdx === -1) {
          console.error(`Invalid field format: "${f}". Use key=value.`);
          process.exit(1);
        }
        body[f.slice(0, eqIdx)] = f.slice(eqIdx + 1);
      }
      headers["Content-Type"] = "application/json";
      fetchOpts.body = JSON.stringify(body);
    } else if (opts.input) {
      let inputData: string;
      if (opts.input === "-") {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk as Buffer);
        }
        inputData = Buffer.concat(chunks).toString("utf-8");
      } else {
        const { readFileSync } = await import("node:fs");
        inputData = readFileSync(opts.input, "utf-8");
      }
      headers["Content-Type"] = "application/json";
      fetchOpts.body = inputData;
    }

    if (opts.paginate) {
      await fetchAllPages(url, fetchOpts, opts.include);
    } else {
      await fetchOnce(url, fetchOpts, opts.include);
    }
  });

async function fetchOnce(
  url: string,
  fetchOpts: RequestInit,
  includeHeaders: boolean,
): Promise<void> {
  const res = await fetch(url, fetchOpts);

  if (includeHeaders) {
    console.error(`HTTP/${res.status} ${res.statusText}`);
    res.headers.forEach((value, key) => {
      console.error(`${key}: ${value}`);
    });
    console.error("");
  }

  const text = await res.text();

  if (!res.ok) {
    console.error(text);
    process.exit(1);
  }

  // Pretty-print JSON
  try {
    const json = JSON.parse(text);
    console.log(JSON.stringify(json, null, 2));
  } catch {
    console.log(text);
  }
}

async function fetchAllPages(
  startUrl: string,
  fetchOpts: RequestInit,
  includeHeaders: boolean,
): Promise<void> {
  let url: string | null = startUrl;
  const allValues: unknown[] = [];

  while (url) {
    const res: Response = await fetch(url, fetchOpts);

    if (includeHeaders && allValues.length === 0) {
      console.error(`HTTP/${res.status} ${res.statusText}`);
      res.headers.forEach((value: string, key: string) => {
        console.error(`${key}: ${value}`);
      });
      console.error("");
    }

    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      process.exit(1);
    }

    const json: { values?: unknown[]; next?: string } = await res.json();

    if (json.values && Array.isArray(json.values)) {
      allValues.push(...json.values);
      url = json.next ?? null;
    } else {
      // Non-paginated response
      console.log(JSON.stringify(json, null, 2));
      return;
    }
  }

  console.log(JSON.stringify(allValues, null, 2));
}
