// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(   message: string, ...args: any[]) {
    if (import.meta.env.MODE === "production") {
        return;
    }
    console.log(`[LOG] ${message}`, ...args);
}