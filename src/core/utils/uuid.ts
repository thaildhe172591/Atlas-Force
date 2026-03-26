import * as crypto from 'node:crypto';

/**
 * UUID v7 Implementation (Time-sortable)
 * 48 bits: timestamp (ms)
 * 4 bits: version (7)
 * 12 bits: sequence/random
 * 2 bits: variant (2)
 * 62 bits: random
 */
export function uuid7(): string {
    const now = Date.now();
    const entropy = crypto.randomBytes(10);

    // Timestamp
    const tsHi = Math.floor(now / 0x10000);
    const tsLo = now % 0x10000;

    const buf = Buffer.alloc(16);
    buf.writeUInt32BE(tsHi, 0);
    buf.writeUInt16BE(tsLo, 4);

    // Version & Entropy
    buf.set(entropy, 6);
    buf[6] = (buf[6] & 0x0f) | 0x70; // version 7
    buf[8] = (buf[8] & 0x3f) | 0x80; // variant 2

    return [
        buf.toString('hex', 0, 4),
        buf.toString('hex', 4, 6),
        buf.toString('hex', 6, 8),
        buf.toString('hex', 8, 10),
        buf.toString('hex', 10, 16)
    ].join('-');
}
