export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>
): Promise<{ data: T | null; error: unknown }> {
  try {
    const res = await queryFn();

    if (res.error) {
      console.warn('[SAFE QUERY ERROR]', res.error);
      return { data: null, error: res.error };
    }

    return res;
  } catch (err) {
    console.error('[SAFE QUERY CRASH]', err);
    return { data: null, error: err };
  }
}
