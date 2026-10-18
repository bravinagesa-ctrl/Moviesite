
import client from './appwrite';

export async function testConnection() {
  try {
    const result = await client.ping();
    console.log('Appwrite connection successful:', result);
    return result;
  } catch (error) {
    console.error('Appwrite connection failed:', error.message);
    throw error;
  }
}
