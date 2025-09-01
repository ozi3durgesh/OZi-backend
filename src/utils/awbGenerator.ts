/**
 * Utility functions for generating AWB (Airway Bill) and Manifest numbers
 */

/**
 * Generate AWB number in the format: AWB-OZISTORE-0012345
 * @returns AWB number string
 */
export function generateAWBNumber(): string {
  const timestamp = Date.now();
  const sequence = Math.floor(Math.random() * 100000).toString().padStart(7, '0');
  return `AWB-OZISTORE-${sequence}`;
}

/**
 * Generate tracking number in the format: TRK-{timestamp}-{random}
 * @returns Tracking number string
 */
export function generateTrackingNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRK-${timestamp}-${random}`;
}

/**
 * Generate manifest number in the format: MF-{timestamp}-{random}
 * @returns Manifest number string
 */
export function generateManifestNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MF-${timestamp}-${random}`;
}

/**
 * Generate unique shipment ID
 * @returns Shipment ID string
 */
export function generateShipmentId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SHP-${timestamp}-${random}`;
}

/**
 * Validate AWB number format
 * @param awbNumber - AWB number to validate
 * @returns boolean indicating if format is valid
 */
export function validateAWBNumber(awbNumber: string): boolean {
  const pattern = /^AWB-OZISTORE-\d{7}$/;
  return pattern.test(awbNumber);
}

/**
 * Extract sequence number from AWB
 * @param awbNumber - AWB number
 * @returns sequence number or null if invalid
 */
export function extractSequenceFromAWB(awbNumber: string): number | null {
  if (!validateAWBNumber(awbNumber)) {
    return null;
  }
  
  const sequencePart = awbNumber.split('-')[2];
  const sequence = parseInt(sequencePart);
  
  return isNaN(sequence) ? null : sequence;
}
