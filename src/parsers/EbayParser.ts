import { extractPriceFromText, isVisibleElement } from "../utils";

import type { IPriceParser } from "./IPriceParser";

export class EbayParser implements IPriceParser {
  private processedElements: WeakSet<HTMLElement> = new WeakSet();

  getPriceElements(): HTMLElement[] {
    const found = document.querySelectorAll(
      ".s-item__price, .x-price-primary, .bc-item-detail-price, [data-testid='x-price-primary']",
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
    return extractPriceFromText(element.textContent || "");
  }

  clearProcessedElements(): void {
    this.processedElements = new WeakSet();
  }
}
