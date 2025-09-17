import csv from 'csv-parser';
import { Readable } from 'stream';

// Helper function to parse CSV buffer
export async function parseCSV(buffer: Buffer) {
    const results: any[] = [];
    const stream = Readable.from(buffer.toString());

    return new Promise<any[]>((resolve, reject) => {
        stream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}
