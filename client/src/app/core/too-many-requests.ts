import { HttpErrorResponse } from '@angular/common/http';

// The API answers 429 when one IP address has tried too many times in a minute
// (RateLimits in the API), so trying again at once would fail too.
export const TOO_MANY_REQUESTS_MESSAGE =
  'För många försök på kort tid. Vänta en minut och försök igen.';

export function isTooManyRequests(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 429;
}
