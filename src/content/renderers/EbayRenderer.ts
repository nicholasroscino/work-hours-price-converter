import { Renderer } from "./Renderer";

export class EbayRenderer implements Renderer {
    addWorkHoursElement(
        element: HTMLElement,
        hoursInfo: { hours: number; formatted: string },
    ): void {
        const container = document.createElement("span");
        container.className = "work-hours";
        container.setAttribute("data-work-hours", "true");

        const text = document.createElement("span");
        text.textContent = hoursInfo.formatted;

        const tooltip = document.createElement("span");
        tooltip.className = "work-hours-tooltip";
        tooltip.textContent = `You need to work ${hoursInfo.formatted}`;

        container.appendChild(text);
        container.appendChild(tooltip);

        element.appendChild(container);
    }
}