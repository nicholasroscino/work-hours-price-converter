import { log } from "../logger";
import type { IPriceParser } from "../parsers/IPriceParser";
import { getParser } from "../parsers/ParserFactory";
import { DEFAULT_USER_SETTINGS } from "../settings";
import type { UserSettings } from "../types";
import { calculateHourlyWage } from "../utils";

import type { Renderer } from "./renderers/Renderer";
import { getRendererForHostName } from "./renderers/RendererFactory";

export class PriceConverter {
  private parser: IPriceParser | null | undefined = null;
  private renderer: Renderer | null | undefined = null;
  private settings: UserSettings | null = null;
  private hourlyWage: number | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Get the appropriate parser for this website
    const hostname = window.location.hostname;
    this.parser = getParser(hostname);
    this.renderer = getRendererForHostName(hostname);

    if (!this.parser) {
      log("info", "No parser available for this website:", hostname);
      return;
    }

    // Load settings and start processing
    this.loadSettings();
  }

  private loadSettings(): void {
    // Request settings from background script
    chrome.runtime.sendMessage({ type: "GET_USER_SETTINGS" }, (response) => {
      if (response) {
        this.settings = response;
        this.processPrices();
      } else {
        log("error", "No settings received from background script");
      }
    });
  }

  private processPrices(): void {
    log("info", "Processing prices with settings:", this.settings);
    if (
      !this.settings ||
      !this.settings.enabled ||
      !this.parser ||
      !this.renderer
    ) {
      return;
    }
    this.hourlyWage = calculateHourlyWage(this.settings)?.amount || 0.0;
    log("info", "Calculated hourly wage:", this.hourlyWage);
    const priceElements = this.parser.getPriceElements();

    for (const element of priceElements) {
      const price = this.parser.extractPrice(element);
      if (price && price > 0) {
        const convertedPrice = this.convertPriceToWorkHours(price);
        this.renderer.addWorkHoursElement(element, convertedPrice);
      }
    }

    log("info", "Price processing completed");
  }

  private convertPriceToWorkHours(price: number): {
    hours: number;
    formatted: string;
  } {
    if (!this.hourlyWage || this.hourlyWage <= 0)
      return { hours: 0, formatted: "N/A" };

    const workHours = price / this.hourlyWage;
    const formattedHours = this.formatWorkHours(workHours);

    return {
      hours: workHours,
      formatted: formattedHours,
    };
  }

  private formatWorkHours(hours: number): string {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    // We need to use settings here for the next conditions
    if (!this.settings || !this.settings.dailyHours) {
      return "N/A";
    }
    if (hours < this.settings.dailyHours) {
      return `${hours.toFixed(1)}h`;
    } else {
      const days = Math.floor(hours / this.settings.dailyHours);
      const remainingHours = hours % this.settings.dailyHours;
      if (remainingHours > 0) {
        return `${days}d ${remainingHours.toFixed(1)}h`;
      } else {
        return `${days}d`;
      }
    }
  }

  // Public method to refresh prices (can be called when settings change)
  public refresh(): void {
    if (this.parser) {
      this.parser.clearProcessedElements();

      // Remove existing work hours elements
      this.removeExistingWorkHours();

      // TODO: Handle currency conversion if needed
      // For now, we assume the prices are in the user's selected currency
      // Remove existing warnings
      // const existingWarning = document.querySelector('.currency-warning');
      // if (existingWarning) {
      //     existingWarning.remove();
      // }

      this.processPrices();
    }
  }

  private removeExistingWorkHours(): void {
    const existingElements = document.querySelectorAll(".work-hours");
    existingElements.forEach((element) => {
      element.remove();
    });
  }

  // Public method to disable/enable the extension
  public setEnabled(enabled: boolean): void {
    if (!enabled) {
      this.removeExistingWorkHours();
      const existingWarning = document.querySelector(".currency-warning");
      if (existingWarning) {
        existingWarning.remove();
      }
    } else {
      this.refresh();
    }
  }

  // Public method to update settings
  public updateSettings(newSettings: UserSettings): void {
    this.settings = {
      ...DEFAULT_USER_SETTINGS,
      ...newSettings,
    };
    this.refresh();
  }
}
