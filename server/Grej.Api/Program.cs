using System.Text;
using System.Threading.RateLimiting;
using Grej.Api;
using Grej.Application;
using Grej.Infrastructure;
using Grej.Infrastructure.DemoData;
using Grej.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();

// The same settings IdentityLoginService makes the token with.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Keeps "sub", "email" and "role" instead of renaming them to long .NET names.
        options.MapInboundClaims = false;

        // Without a key (as in CI) every token is rejected, and requests without one still work.
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

// Only the frontend may call the API from a browser.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

// Slows down password guessing and checkout spam, since each checkout saves an order and
// creates a Stripe session.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(RateLimits.Login, PerIpAddress);
    options.AddPolicy(RateLimits.Checkout, PerIpAddress);
});

builder.Services.AddOpenApi();

var app = builder.Build();

// `dotnet run --project Grej.Api -- seed-admin` creates the admin account and stops.
if (args.Contains("seed-admin"))
{
    await AdminSeeder.SeedAsync(app.Services);
    Console.WriteLine("The admin account is ready.");
    return;
}

// `dotnet run --project Grej.Api -- reset-demo` asks first, since the database is the deployed shop's too.
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

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors();

// After CORS, so a 429 has the CORS headers the browser needs to show it to the frontend.
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// One counter per IP address, so visitors on the same network (one Wi-Fi) share it.
static RateLimitPartition<string> PerIpAddress(HttpContext context) =>
    RateLimitPartition.GetFixedWindowLimiter(
        VisitorIp(context),
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = RateLimits.PermitsPerMinute,
            Window = TimeSpan.FromMinutes(1),
        });

// On Render, the connection's IP and X-Forwarded-For's last address are proxies that nearby visitors
// share. Cloudflare, in front of them, sets CF-Connecting-IP to the visitor's own IP, so it cannot be faked.
static string VisitorIp(HttpContext context) =>
    context.Request.Headers["CF-Connecting-IP"].FirstOrDefault()
        ?? context.Connection.RemoteIpAddress?.ToString()
        ?? "unknown";
