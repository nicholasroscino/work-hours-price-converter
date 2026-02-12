import { extractPriceFromText, isVisibleElement } from "../utils";

import type { IPriceParser } from "./IPriceParser";

export class EbayParser implements IPriceParser {
  private processedElements: WeakSet<HTMLElement> = new WeakSet();

  getPriceElements(): HTMLElement[] {
    const found = document.querySelectorAll(
      ".bc-item-detail-price, [data-testid='x-price-primary'], .bc-item-detail-price-discounted > ins, .yVet > span",
    );
    console.log("Found elements:", found);

    const elements: HTMLElement[] = [];

    found.forEach((el) => {
      if (
        el instanceof HTMLElement &&
        !this.isProcessedElement(el) &&
        isVisibleElement(el)
      ) {
        elements.push(el);
        this.processedElements.add(el);
      }
    });

    return elements;
  }

  private isProcessedElement(el: HTMLElement) {
    return this.processedElements.has(el);
  }

  extractPrice(element: HTMLElement): number | null {
    // innerText is often cleaner than textContent as it respects CSS visibility
    // and hides clipped text often used for screen readers on eBay.
    const text = (element.innerText || element.textContent || "").trim();

    // If the text contains multiple price-like strings (e.g. "Was $20 Now $15")
    // we should try to extract the most relevant one.
    // Usually the last one is the current price on eBay.
    if (text.includes("$") || text.includes("£") || text.includes("€")) {
      const parts = text.split(/\s+/);
      if (parts.length > 2) {
        // Try to found the last part that looks like a price
        for (let i = parts.length - 1; i >= 0; i--) {
          const price = extractPriceFromText(parts[i]);
          if (price && price > 0) return price;
        }
      }
    }

    return extractPriceFromText(text);
  }

  clearProcessedElements(): void {
    this.processedElements = new WeakSet();
  }
}
