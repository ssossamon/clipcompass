export const FREE_AUDIT_LIMIT_PER_MONTH = 3;
export const FREE_KEYWORD_LIMIT_PER_MONTH = 10;

export function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
