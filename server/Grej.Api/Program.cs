using System.Text;
using Grej.Application;
using Grej.Infrastructure;
using Grej.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

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
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors();

// Reads the token, if there is one, and works out who is asking.
app.UseAuthentication();
// Then checks [Authorize]: 401 without a valid token, 403 without the Admin role.
app.UseAuthorization();

app.MapControllers();

app.Run();
