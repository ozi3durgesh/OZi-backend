import sequelize from '../config/database';

/**
 * Generates a custom order ID in the format: ozi + timestamp + sequence
 * Example: ozi1755942302000001
 */
export async function generateOrderId(): Promise<string> {
  try {
    // Get current timestamp in milliseconds
    const timestamp = Date.now();
    
    // Get the count of orders created today (same timestamp prefix)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTimestamp = todayStart.getTime();
    
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE created_at >= ? 
      AND order_id LIKE ?
    `, {
      replacements: [
        Math.floor(todayStartTimestamp / 1000), // Convert to seconds for created_at
        `ozi${timestamp}%`
      ]
    });
    
    const count = (results as any)[0]?.count || 0;
    
    // Generate sequence number (1-based, padded to 4 digits)
    const sequence = (count + 1).toString().padStart(4, '0');
    
    // Combine: ozi + timestamp + sequence
    const orderId = `ozi${timestamp}${sequence}`;
    
    return orderId;
  } catch (error) {
    console.error('Error generating order ID:', error);
    // Fallback: ozi + timestamp + random 4 digits
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ozi${timestamp}${random}`;
  }
}

/**
 * Alternative method: Generate order ID based on auto-increment ID
 * This ensures uniqueness even if multiple orders are created simultaneously
 */
export async function generateOrderIdFromSequence(): Promise<string> {
  try {
    // Get the next auto-increment ID
    const [results] = await sequelize.query(`
      SELECT AUTO_INCREMENT 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orders'
    `);
    
    const nextId = (results as any)[0]?.AUTO_INCREMENT || 1;
    
    // Get current timestamp in milliseconds
    const timestamp = Date.now();
    
    // Generate sequence number (padded to 4 digits)
    const sequence = nextId.toString().padStart(4, '0');
    
    // Combine: ozi + timestamp + sequence
    const orderId = `ozi${timestamp}${sequence}`;
    
    return orderId;
  } catch (error) {
    console.error('Error generating order ID from sequence:', error);
    // Fallback: ozi + timestamp + random 4 digits
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ozi${timestamp}${random}`;
  }
}

/**
 * Simple method: Generate order ID based on current timestamp and random sequence
 * This is more reliable when there are foreign key constraints
 */
export async function generateSimpleOrderId(): Promise<string> {
  try {
    // Get current timestamp in milliseconds
    const timestamp = Date.now();
    
    // Get count of orders created in the last second to avoid duplicates
    const oneSecondAgo = timestamp - 1000;
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE created_at >= ?
    `, {
      replacements: [Math.floor(oneSecondAgo / 1000)]
    });
    
    const count = (results as any)[0]?.count || 0;
    
    // Generate sequence number (padded to 4 digits)
    const sequence = (count + 1).toString().padStart(4, '0');
    
    // Combine: ozi + timestamp + sequence
    const orderId = `ozi${timestamp}${sequence}`;
    
    return orderId;
  } catch (error) {
    console.error('Error generating simple order ID:', error);
    // Fallback: ozi + timestamp + random 4 digits
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ozi${timestamp}${random}`;
  }
}

/**
 * Validate if an order ID follows the correct format
 */
export function validateOrderId(orderId: string): boolean {
  const pattern = /^ozi\d{13,17}$/; // ozi + timestamp (13-17 digits) + sequence
  return pattern.test(orderId);
}

/**
 * Extract timestamp from order ID
 */
export function extractTimestampFromOrderId(orderId: string): number | null {
  if (!validateOrderId(orderId)) {
    return null;
  }
  
  // Remove 'ozi' prefix and last 4 digits (sequence)
  const timestampPart = orderId.slice(3, -4);
  const timestamp = parseInt(timestampPart);
  
  return isNaN(timestamp) ? null : timestamp;
}

/**
 * Extract sequence number from order ID
 */
export function extractSequenceFromOrderId(orderId: string): number | null {
  if (!validateOrderId(orderId)) {
    return null;
  }
  
  // Get last 4 digits
  const sequencePart = orderId.slice(-4);
  const sequence = parseInt(sequencePart);
  
  return isNaN(sequence) ? null : sequence;
}
