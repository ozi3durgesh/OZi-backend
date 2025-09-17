// Utility function to remove backticks from a string
export function removeBackticks(value: string): string {
    if (value) {
        return value.replace(/`/g, '');
    }
    return value;
}
