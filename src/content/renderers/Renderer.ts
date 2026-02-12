export interface Renderer {
    addWorkHoursElement(
        element: HTMLElement,
        hoursInfo: { hours: number; formatted: string },
    ): void;
}
