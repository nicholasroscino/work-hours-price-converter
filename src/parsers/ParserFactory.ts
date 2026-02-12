import { log } from "../logger";
import { DEFAULT_TARGET_WEBSITES } from "../settings";

import { AmazonParser } from "./AmazonParser";
import { EbayParser } from "./EbayParser";
import type { IPriceParser } from "./IPriceParser";

const parsers: Map<string, IPriceParser> = new Map();

const parserMap = new Map<string, new () => IPriceParser>([
  ["amazon", AmazonParser],
  ["ebay", EbayParser],
]);

/**
 * Gets the appropriate parser for the current website, with caching.
 * @param hostname The current website's hostname.
 * @returns The appropriate price parser, or null if no parser is available.
 */
export function getParser(hostname: string) {
  log("debug", "Getting parser for hostname:", hostname);
  if (parsers.has(hostname)) {
    return parsers.get(hostname)!;
  }

  let parserClass: (new () => IPriceParser) | null = null;
  for (const [key, value] of parserMap) {
    if (hostname.includes(key)) {
      parserClass = value;
      break;
    }
  }

  // If a parser class was found, instantiate it and cache it.
  if (parserClass) {
    const parser = new parserClass();
    parsers.set(hostname, parser);
    return parser;
  }

  return null;
}

/**
 * Clears all cached parsers.
 * Useful when switching between different websites.
 */
export function clearParsers() {
  parsers.clear();
}
