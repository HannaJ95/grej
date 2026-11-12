namespace Grej.Api;

// The rate limiting policies in Program.cs, used with [EnableRateLimiting].
public static class RateLimits
{
    public const string Login = "login";
    public const string Checkout = "checkout";

    // Per IP address, for each policy on its own.
    public const int PermitsPerMinute = 10;
}
