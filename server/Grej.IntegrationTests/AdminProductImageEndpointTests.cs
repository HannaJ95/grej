using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Grej.Application.Catalog;
using Grej.Application.Identity;
using Grej.Domain.Catalog;
using Grej.Infrastructure.Identity;
using Grej.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Grej.IntegrationTests;

// Tests the product image endpoints like AdminProductsEndpointTests, with a fake
// storage instead of Supabase Storage, so nothing is uploaded for real.
public class AdminProductImageEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Email = "admin@example.com";
    private const string Password = "Test-password-1";

    // The first bytes of a png file, which is all ImageFile looks at.
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00];

    private readonly WebApplicationFactory<Program> app;
    private readonly FakeImageStorage storage = new();

    public AdminProductImageEndpointTests(WebApplicationFactory<Program> factory)
    {
        var databaseName = Guid.NewGuid().ToString();

        app = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Admin:Email"] = Email,
                    ["Admin:Password"] = Password,
                    ["Jwt:SigningKey"] = "test-signing-key-that-is-at-least-32-bytes",
                }));
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IDbContextOptionsConfiguration<GrejDbContext>>();
                services.AddDbContext<GrejDbContext>(options => options.UseInMemoryDatabase(databaseName));
                // The same fake in every request, so the test can see what was uploaded and deleted.
                services.RemoveAll<IImageStorage>();
                services.AddSingleton<IImageStorage>(storage);
            });
        });
    }

    [Fact]
    public async Task SetImage_WithoutToken_ReturnsUnauthorized()
    {
        var id = await AddProductAsync();

        var response = await app.CreateClient().PutAsync($"/api/admin/products/{id}/image", ImageForm(Png, "En vas"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SetImage_PngImage_UploadsItAndSavesWhereItIs()
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsync($"/api/admin/products/{id}/image", ImageForm(Png, "  En blå vas  "));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var path = Assert.Single(storage.Uploaded);
        // The extension comes from the content, not from the file's name (bild.jpg).
        Assert.StartsWith($"products/{id}/", path);
        Assert.EndsWith(".png", path);
        var image = Assert.Single((await FindProductAsync(id))!.Images);
        Assert.Equal(path, image.StoragePath);
        Assert.Equal($"https://storage.test/{path}", image.Url);
        Assert.Equal("En blå vas", image.AltText);
        Assert.Equal(new ProductImageDto(image.Url, "En blå vas"), await response.Content.ReadFromJsonAsync<ProductImageDto>());
    }

    [Theory]
    [InlineData("GIF89a")]
    [InlineData("Hej, jag är en bild!")]
    public async Task SetImage_FileThatIsNotJpgPngOrWebp_ReturnsBadRequestAndUploadsNothing(string content)
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();

        // The form says image/jpeg, but the content decides.
        var response = await client.PutAsync($"/api/admin/products/{id}/image", ImageForm(Encoding.UTF8.GetBytes(content), "En vas"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(storage.Uploaded);
        Assert.Empty((await FindProductAsync(id))!.Images);
    }

    [Fact]
    public async Task SetImage_LargerThan5MB_ReturnsBadRequestAndUploadsNothing()
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();
        var content = new byte[ImageFile.MaxBytes + 1];
        Png.CopyTo(content, 0);

        var response = await client.PutAsync($"/api/admin/products/{id}/image", ImageForm(content, "En vas"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(storage.Uploaded);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task SetImage_WithoutAltText_ReturnsBadRequest(string altText)
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsync($"/api/admin/products/{id}/image", ImageForm(Png, altText));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(storage.Uploaded);
    }

    [Fact]
    public async Task SetImage_AltTextLongerThan200_ReturnsBadRequest()
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsync($"/api/admin/products/{id}/image", ImageForm(Png, new string('a', 201)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task SetImage_UnknownProduct_ReturnsNotFoundAndUploadsNothing()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsync("/api/admin/products/99/image", ImageForm(Png, "En vas"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Empty(storage.Uploaded);
    }

    [Fact]
    public async Task SetImage_ProductWithImage_ReplacesItAndDeletesTheOldFile()
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();
        await client.PutAsync($"/api/admin/products/{id}/image", ImageForm(Png, "Gammal bild"));
        var oldPath = Assert.Single(storage.Uploaded);

        await client.PutAsync($"/api/admin/products/{id}/image", ImageForm(Png, "Ny bild"));

        Assert.Equal([oldPath], storage.Deleted);
        var image = Assert.Single((await FindProductAsync(id))!.Images);
        Assert.Equal("Ny bild", image.AltText);
    }

    [Fact]
    public async Task RemoveImage_DeletesTheRowAndTheFile()
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();
        await client.PutAsync($"/api/admin/products/{id}/image", ImageForm(Png, "En vas"));

        var response = await client.DeleteAsync($"/api/admin/products/{id}/image");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(storage.Uploaded, storage.Deleted);
        Assert.Empty((await FindProductAsync(id))!.Images);
    }

    [Fact]
    public async Task Delete_ProductWithImage_DeletesTheFileToo()
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();
        await client.PutAsync($"/api/admin/products/{id}/image", ImageForm(Png, "En vas"));

        var response = await client.DeleteAsync($"/api/admin/products/{id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(storage.Uploaded, storage.Deleted);
    }

    [Fact]
    public async Task GetProduct_InTheShop_IncludesTheImage()
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();
        await client.PutAsync($"/api/admin/products/{id}/image", ImageForm(Png, "En vas"));

        var product = await app.CreateClient().GetFromJsonAsync<ProductDto>($"/api/products/{id}");

        Assert.Equal("En vas", product?.Image?.AltText);
        Assert.Equal($"https://storage.test/{storage.Uploaded[0]}", product?.Image?.Url);
    }

    // The same form the CMS sends: the file and the alt text as two parts. The file's
    // name and type are wrong on purpose, since the API must read the format from the content.
    private static MultipartFormDataContent ImageForm(byte[] content, string altText)
    {
        var file = new ByteArrayContent(content);
        file.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        return new MultipartFormDataContent
        {
            { file, "file", "bild.jpg" },
            { new StringContent(altText), "altText" },
        };
    }

    private async Task<HttpClient> CreateAdminClientAsync()
    {
        await AdminSeeder.SeedAsync(app.Services);
        var client = app.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(Email, Password));
        var token = (await login.Content.ReadFromJsonAsync<LoginResult>())!.Token;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    // An active product, so the shop's endpoint shows it too.
    private async Task<int> AddProductAsync()
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var product = new Product { Title = "Vas", Price = 300m, Stock = 1, IsActive = true };
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return product.Id;
    }

    // Its own scope, so the test reads what is really saved. The images come along,
    // since ProductConfiguration has AutoInclude.
    private async Task<Product?> FindProductAsync(int id)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        return await db.Products.FirstOrDefaultAsync(p => p.Id == id);
    }

    // Remembers what the API asked it to upload and delete, instead of calling Supabase.
    private class FakeImageStorage : IImageStorage
    {
        public List<string> Uploaded { get; } = [];
        public List<string> Deleted { get; } = [];

        public Task<string> UploadAsync(string path, ImageFile image, CancellationToken cancellationToken)
        {
            Uploaded.Add(path);
            return Task.FromResult($"https://storage.test/{path}");
        }

        public Task DeleteAsync(string path, CancellationToken cancellationToken)
        {
            Deleted.Add(path);
            return Task.CompletedTask;
        }
    }
}
