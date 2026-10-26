using Grej.Application;
using Grej.Infrastructure;
using Grej.Infrastructure.Identity;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();

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

app.UseAuthorization();

app.MapControllers();

app.Run();
