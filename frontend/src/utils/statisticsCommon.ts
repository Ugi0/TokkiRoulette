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

export function parseDateToLocaleString(date: Date): string {
    return date.toLocaleString('en-US', { 
        timeZone: 'America/Chicago', 
        timeStyle: 'short', 
        dateStyle: 'full' 
    });
}

export function parseDateToLocaleStringShort(date: Date): string {
    return date.toLocaleString('en-US', { 
        timeZone: 'America/Chicago', 
        timeStyle: 'short', 
        dateStyle: 'short' 
    });
}