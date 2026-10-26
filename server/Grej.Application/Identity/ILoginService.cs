namespace Grej.Application.Identity;

// Checks an email and a password and hands out a token. Implemented in Infrastructure
// with ASP.NET Core Identity, the same way IPaymentProvider is implemented with Stripe.
public interface ILoginService
{
    // Returns null if the email or password is wrong, or if the account is locked.
    Task<LoginResult?> LoginAsync(LoginRequest request);
}
