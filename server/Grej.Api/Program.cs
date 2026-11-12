using System.Text;
using System.Threading.RateLimiting;
using Grej.Api;
using Grej.Application;
using Grej.Infrastructure;
using Grej.Infrastructure.DemoData;
using Grej.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();

// Admin requests send the JWT from POST /api/auth/login in the Authorization header.
// The API checks it with the same settings IdentityLoginService used to make it.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Keeps the claim names from the token ("sub", "email", "role") as they are,
        // instead of renaming them to long .NET names.
        options.MapInboundClaims = false;

        // "Jwt:SigningKey" comes from User Secrets locally and Jwt__SigningKey in hosting.
        // Without a key (as in CI) every token is rejected, and requests without a token work as before.
        var signingKey = builder.Configuration["Jwt:SigningKey"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = signingKey is null ? null : new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
            // [Authorize(Roles = Roles.Admin)] looks for the role in the token's "role" claim.
            RoleClaimType = "role",
        };
    });

// Only the frontend may call the API from a browser. The allowed origins come from
// appsettings.Development.json locally and from an environment variable in hosting.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

// On Render every request comes from Render's proxy, which adds the visitor's IP to
// X-Forwarded-For. Its addresses are not published, so any sender is trusted: the API can
// only be reached through the proxy. Only the last address is read, the one the proxy added.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// Slows down password guessing and checkout spam, since each checkout saves an order and
// creates a Stripe session. Each policy counts on its own.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(RateLimits.Login, PerIpAddress);
    options.AddPolicy(RateLimits.Checkout, PerIpAddress);
});

builder.Services.AddOpenApi();

var app = builder.Build();

// `dotnet run --project Grej.Api -- seed-admin` creates the admin account and stops,
// instead of starting the web server.
if (args.Contains("seed-admin"))
{
    await AdminSeeder.SeedAsync(app.Services);
    Console.WriteLine("The admin account is ready.");
    return;
}

// `dotnet run --project Grej.Api -- reset-demo` empties the shop and fills it with the demo
// content, then stops. It asks first, since the database is the deployed shop's too.
if (args.Contains("reset-demo"))
{
    Console.WriteLine("This deletes all products, categories, materials, colors, orders and payments,");
    Console.WriteLine("in the deployed shop too, and fills the shop with the demo content.");
    Console.Write("Type RESET to continue: ");
    if (Console.ReadLine() != "RESET")
    {
        Console.WriteLine("Nothing was changed.");
        return;
    }

    await DemoSeeder.ResetAsync(app.Services);
    Console.WriteLine("The demo content is ready.");
    return;
}

// First, so everything after it sees the visitor's IP instead of the proxy's.
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors();

// After CORS, so a 429 has the CORS headers the browser needs to show it to the frontend.
app.UseRateLimiter();

// Reads the token, if there is one, and works out who is asking.
app.UseAuthentication();
// Then checks [Authorize]: 401 without a valid token, 403 without the Admin role.
app.UseAuthorization();

app.MapControllers();

app.Run();

// One counter per IP address, so visitors on the same network (one Wi-Fi) share it.
static RateLimitPartition<string> PerIpAddress(HttpContext context) =>
    RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = RateLimits.PermitsPerMinute,
            Window = TimeSpan.FromMinutes(1),
        });
