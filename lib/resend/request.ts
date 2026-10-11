/** Resend's shared API quota can return 429 during multi-step preference saves. */
export async function resendRequest<T extends { error: { statusCode?: number | null } | null }>(request: () => Promise<T>): Promise<T> {
  let result = await request();
  for (let attempt = 0; result.error?.statusCode === 429 && attempt < 3; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    result = await request();
  }
  return result;
}
