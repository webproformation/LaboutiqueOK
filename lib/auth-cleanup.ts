export function clearSupabaseAuth() {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sb-')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log(`Cleared ${keysToRemove.length} Supabase auth items from localStorage`);
}

export function isAuthError(error: any): boolean {
  return error?.message?.includes('Refresh Token') ||
         error?.message?.includes('Invalid token') ||
         error?.status === 401;
}
