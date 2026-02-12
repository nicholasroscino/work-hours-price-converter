import {log} from "../../logger";

import {AmazonRenderer} from "./AmazonRenderer";
import {EbayRenderer} from "./EbayRenderer";
import {Renderer} from "./Renderer";

const renderers: Map<string, Renderer> = new Map();

const parserMap = new Map<string, new () => Renderer>([
  [ "amazon", AmazonRenderer ],
  [ "ebay", EbayRenderer ],
]);

/**
 * Gets the appropriate parser for the current website, with caching.
 * @param hostname The current website's hostname.
 * @returns The appropriate price parser, or null if no parser is available.
 */
export function getRendererForHostName(hostname: string) {
  log("debug", "Getting parser for hostname:", hostname);
  if (renderers.has(hostname)) {
    return renderers.get(hostname)!;
  }

  let parserClass: (new () => Renderer)|null = null;
  for (const [key, value] of parserMap) {
    if (hostname.includes(key)) {
      parserClass = value;
      break;
    }
  }

  // If a parser class was found, instantiate it and cache it.
  if (parserClass) {
    const parser = new parserClass();
    renderers.set(hostname, parser);
    return parser;
  }

  return null;
}

/**
 * Clears all cached parsers.
 * Useful when switching between different websites.
 */
export function clearParsers() { renderers.clear(); }
