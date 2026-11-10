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
    public async Task AddImage_WithoutToken_ReturnsUnauthorized()
    {
        var id = await AddProductAsync();

        var response = await app.CreateClient().PostAsync(ImagesUrl(id), ImageForm(Png, "En vas"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AddImage_PngImage_UploadsItAndSavesWhereItIs()
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsync(ImagesUrl(id), ImageForm(Png, "  En blå vas  "));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var path = Assert.Single(storage.Uploaded);
        // The extension comes from the content, not from the file's name (bild.jpg).
        Assert.StartsWith($"products/{id}/", path);
        Assert.EndsWith(".png", path);
        var image = Assert.Single((await FindProductAsync(id))!.Images);
        Assert.Equal(path, image.StoragePath);
        Assert.Equal($"https://storage.test/{path}", image.Url);
        Assert.Equal("En blå vas", image.AltText);
        Assert.Equal([new ProductImageDto(image.Id, image.Url, "En blå vas")], await ReadImagesAsync(response));
    }

    [Theory]
    [InlineData("GIF89a")]
    [InlineData("Hej, jag är en bild!")]
    public async Task AddImage_FileThatIsNotJpgPngOrWebp_ReturnsBadRequestAndUploadsNothing(string content)
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();

        // The form says image/jpeg, but the content decides.
        var response = await client.PostAsync(ImagesUrl(id), ImageForm(Encoding.UTF8.GetBytes(content), "En vas"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(storage.Uploaded);
        Assert.Empty((await FindProductAsync(id))!.Images);
    }

    [Fact]
    public async Task AddImage_LargerThan5MB_ReturnsBadRequestAndUploadsNothing()
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();
        var content = new byte[ImageFile.MaxBytes + 1];
        Png.CopyTo(content, 0);

        var response = await client.PostAsync(ImagesUrl(id), ImageForm(content, "En vas"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(storage.Uploaded);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task AddImage_WithoutAltText_ReturnsBadRequest(string altText)
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsync(ImagesUrl(id), ImageForm(Png, altText));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(storage.Uploaded);
    }

    [Fact]
    public async Task AddImage_AltTextLongerThan200_ReturnsBadRequest()
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsync(ImagesUrl(id), ImageForm(Png, new string('a', 201)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddImage_UnknownProduct_ReturnsNotFoundAndUploadsNothing()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsync(ImagesUrl(99), ImageForm(Png, "En vas"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Empty(storage.Uploaded);
    }

    [Fact]
    public async Task AddImage_ProductWithImage_PutsTheNewOneLastAndDeletesNothing()
    {
        var id = await AddProductAsync();
        var client = await CreateAdminClientAsync();
        await client.PostAsync(ImagesUrl(id), ImageForm(Png, "Första"));

        var response = await client.PostAsync(ImagesUrl(id), ImageForm(Png, "Andra"));

        Assert.Equal(["Första", "Andra"], (await ReadImagesAsync(response)).Select(image => image.AltText));
        Assert.Equal(storage.Uploaded, (await FindProductAsync(id))!.Images.Select(image => image.StoragePath));
        Assert.Empty(storage.Deleted);
    }

    [Fact]
    public async Task AddImage_ProductWithTenImages_ReturnsConflictAndUploadsNothing()
    {
        var id = await AddProductAsync(imageCount: Product.MaxImages);
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsync(ImagesUrl(id), ImageForm(Png, "Den elfte"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Empty(storage.Uploaded);
        Assert.Equal(Product.MaxImages, (await FindProductAsync(id))!.Images.Count);
    }

    [Fact]
    public async Task RemoveImage_DeletesOnlyThatRowAndFile()
    {
        var id = await AddProductAsync(imageCount: 2);
        var client = await CreateAdminClientAsync();
        var images = (await FindProductAsync(id))!.Images;
        var first = images[0];
        var second = images[1];

        var response = await client.DeleteAsync($"{ImagesUrl(id)}/{first.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal([first.StoragePath], storage.Deleted);
        Assert.Equal([second.Id], (await ReadImagesAsync(response)).Select(image => image.Id));
        Assert.Equal(second.Id, Assert.Single((await FindProductAsync(id))!.Images).Id);
    }

    [Fact]
    public async Task RemoveImage_AnotherProductsImage_ReturnsNotFoundAndDeletesNothing()
    {
        var id = await AddProductAsync(imageCount: 1);
        var otherId = await AddProductAsync(imageCount: 1);
        var client = await CreateAdminClientAsync();
        var othersImage = Assert.Single((await FindProductAsync(otherId))!.Images);

        var response = await client.DeleteAsync($"{ImagesUrl(id)}/{othersImage.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Empty(storage.Deleted);
        Assert.Single((await FindProductAsync(otherId))!.Images);
    }

    [Fact]
    public async Task OrderImages_NewOrder_IsSavedAndAnswered()
    {
        var id = await AddProductAsync(imageCount: 3);
        var client = await CreateAdminClientAsync();
        var ids = (await FindProductAsync(id))!.Images.Select(image => image.Id).ToList();
        int[] newOrder = [ids[2], ids[0], ids[1]];

        var response = await client.PutAsJsonAsync($"{ImagesUrl(id)}/order", new ImageOrderRequest(newOrder));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(newOrder, (await ReadImagesAsync(response)).Select(image => image.Id));
        Assert.Equal(newOrder, (await FindProductAsync(id))!.Images.Select(image => image.Id));
    }

    // Each list is given as positions in the product's images; -1 is an id no image has.
    [Theory]
    [InlineData(new[] { 1, 0 })]
    [InlineData(new[] { 1, 1, 0 })]
    [InlineData(new[] { 2, 1, -1 })]
    public async Task OrderImages_IdsThatAreNotExactlyTheImages_ReturnsBadRequestAndChangesNothing(int[] positions)
    {
        var id = await AddProductAsync(imageCount: 3);
        var client = await CreateAdminClientAsync();
        var ids = (await FindProductAsync(id))!.Images.Select(image => image.Id).ToList();
        var imageIds = positions.Select(position => position < 0 ? 999 : ids[position]).ToList();

        var response = await client.PutAsJsonAsync($"{ImagesUrl(id)}/order", new ImageOrderRequest(imageIds));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ids, (await FindProductAsync(id))!.Images.Select(image => image.Id));
    }

    [Fact]
    public async Task OrderImages_UnknownProduct_ReturnsNotFound()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"{ImagesUrl(99)}/order", new ImageOrderRequest([1]));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ProductWithImages_DeletesTheFilesToo()
    {
        var id = await AddProductAsync(imageCount: 2);
        var client = await CreateAdminClientAsync();
        var paths = (await FindProductAsync(id))!.Images.Select(image => image.StoragePath).ToList();

        var response = await client.DeleteAsync($"/api/admin/products/{id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(paths.Order(), storage.Deleted.Order());
    }

    [Fact]
    public async Task GetProduct_InTheShop_IncludesTheImagesInOrder()
    {
        var id = await AddProductAsync(imageCount: 2);
        var client = await CreateAdminClientAsync();
        var ids = (await FindProductAsync(id))!.Images.Select(image => image.Id).ToList();
        await client.PutAsJsonAsync($"{ImagesUrl(id)}/order", new ImageOrderRequest([ids[1], ids[0]]));

        var product = await app.CreateClient().GetFromJsonAsync<ProductDto>($"/api/products/{id}");

        Assert.Equal([ids[1], ids[0]], product!.Images.Select(image => image.Id));
        Assert.Equal("Bild 2", product.Images[0].AltText);
    }

    private static string ImagesUrl(int productId) => $"/api/admin/products/{productId}/images";

    private static async Task<List<ProductImageDto>> ReadImagesAsync(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<List<ProductImageDto>>())!;

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

    // An active product, so the shop's endpoint shows it too. Its images are saved straight to the
    // database, so the fake storage has uploaded nothing when the test starts.
    private async Task<int> AddProductAsync(int imageCount = 0)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var product = new Product { Title = "Vas", Price = 300m, Stock = 1, IsActive = true };
        for (var number = 1; number <= imageCount; number++)
        {
            var path = $"products/test/{Guid.NewGuid():N}.png";
            product.AddImage($"https://storage.test/{path}", path, $"Bild {number}");
        }
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
