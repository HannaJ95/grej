namespace Grej.Application.Identity;

// What a successful login returns: the token the frontend sends with every admin
// request, and when it stops working (UTC).
public record LoginResult(string Token, DateTime ExpiresAt);
