import { v4 as uuidv4 } from 'uuid';

/**
 * Generate UUID v4 using the uuid npm package
 * @returns UUID v4 string (e.g., '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d')
 */
export function generateUUID4(): string {
  return uuidv4();
}

/**
 * Convert UUID4 string to felt252 (BigInt)
 * Removes hyphens and converts hex string to BigInt
 */
export function uuidToFelt252(uuid: string): bigint {
  // Remove hyphens from UUID
  const hexString = uuid.replace(/-/g, '');
  
  // Convert hex string to BigInt
  // UUID4 is 128 bits = 32 hex characters
  const felt = BigInt('0x' + hexString);
  
  // felt252 max value is 2^251 - 1, but UUID4 is only 128 bits (2^128),
  // so it will always fit without issue
  return felt;
}

/**
 * Convert felt252 (BigInt) back to UUID string format
 * Useful for displaying stored UUIDs
 */
export function felt252ToUUID(felt: bigint): string {
  const hexString = felt.toString(16).padStart(32, '0');
  
  // Format as UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return [
    hexString.slice(0, 8),
    hexString.slice(8, 12),
    hexString.slice(12, 16),
    hexString.slice(16, 20),
    hexString.slice(20, 32)
  ].join('-');
}

