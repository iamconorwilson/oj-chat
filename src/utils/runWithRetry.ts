export async function runWithRetry<T>(func: () => Promise<T>, retries: number = 5, delayMs: number = 3000): Promise<T | undefined> {
  let attempts = 0;
  while (attempts < retries) {
    try {
      return await func();
    } catch (error) {
      attempts++;
      if (attempts < retries) {
        console.log(`Function failed. Retrying in ${delayMs / 1000} seconds... (Attempt ${attempts} of ${retries})`);
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        console.error('Function failed after multiple attempts:', error);
      }
    }
  }
}