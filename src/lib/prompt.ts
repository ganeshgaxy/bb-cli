import * as readline from "node:readline";
import { execSync } from "node:child_process";

/**
 * Minimal interactive prompts — no dependencies.
 */

function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });
}

export function ask(question: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface();
    const suffix = defaultValue ? ` (${defaultValue})` : "";
    rl.question(`? ${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

export function askSecret(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface();
    rl.question(`? ${question}: `, (answer) => {
      rl.close();
      // Clear the line and rewrite with masked value
      const value = answer.trim();
      if (value) {
        const masked = value.slice(0, 4) + "****" + value.slice(-4);
        process.stderr.write(`\x1b[1A\x1b[2K? ${question}: ${masked}\n`);
      }
      resolve(value);
    });
  });
}

export function choose(
  question: string,
  options: string[],
  defaultIndex = 0,
): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface();
    process.stderr.write(`? ${question}\n`);
    options.forEach((opt, i) => {
      const marker = i === defaultIndex ? ">" : " ";
      process.stderr.write(`  ${marker} ${opt}\n`);
    });
    rl.question(`  Choice (1-${options.length}): `, (answer) => {
      rl.close();
      const idx = parseInt(answer, 10) - 1;
      if (idx >= 0 && idx < options.length) {
        resolve(options[idx]);
      } else {
        resolve(options[defaultIndex]);
      }
    });
  });
}
