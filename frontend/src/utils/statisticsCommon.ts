export function formatNet(value: number): string {
    if (value > 0) {
        return `+${value}`;
    }

    if (value < 0) {
        return `-${Math.abs(value)}`;
    }

    return "0";
}

export function toNumber(value: number | string | undefined): number {
    return Number(value ?? 0);
}

export function netClassName(netChange: number): string {
    if (netChange < 0) {
        return "negative";
    }

    if (netChange > 0) {
        return "positive";
    }

    return "";
}

// Dates are shown in the viewer's own timezone (no timeZone option = the browser's zone).
// The backend sends UTC ISO timestamps, so this converts them correctly for each viewer.
export function parseDateToLocaleString(date: Date): string {
    return date.toLocaleString('en-US', {
        timeStyle: 'short',
        dateStyle: 'full'
    });
}

export function parseDateToLocaleStringShort(date: Date): string {
    return date.toLocaleString('en-US', {
        timeStyle: 'short',
        dateStyle: 'short'
    });
}