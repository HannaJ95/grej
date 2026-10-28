using System.Net.Http.Headers;
using Grej.Application.Catalog;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Grej.Infrastructure.Images;

// Stores product images in Supabase Storage through its REST API. The bucket is public,
// so the browser loads the images straight from Supabase, not through our API (architecture.md).
public class SupabaseImageStorage(HttpClient http, IConfiguration configuration, ILogger<SupabaseImageStorage> logger)
    : IImageStorage
{
    // Created in the Supabase dashboard, with the same rules as ImageFile.
    private const string Bucket = "product-images";

    public async Task<string> UploadAsync(string path, ImageFile image, CancellationToken cancellationToken)
    {
        using var request = CreateRequest(HttpMethod.Post, path);
        // The file is sent as it is, and Content-Type tells Supabase what kind of file it is.
        request.Content = new ByteArrayContent(image.Content);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue(image.ContentType);

        using var response = await http.SendAsync(request, cancellationToken);
        // Throws if Supabase says no, e.g. to a wrong key. The API then answers 500,
        // and nothing is saved in the database.
        response.EnsureSuccessStatusCode();

        return $"{SupabaseUrl}/storage/v1/object/public/{Bucket}/{path}";
    }

    public async Task DeleteAsync(string path, CancellationToken cancellationToken)
    {
        using var request = CreateRequest(HttpMethod.Delete, path);
        try
        {
            using var response = await http.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException exception)
        {
            // Nothing points to the file any more, so it is only unused. The warning
            // in Render's log says which file to delete by hand.
            logger.LogWarning(exception, "Could not delete {Path} from Supabase Storage.", path);
        }
    }

    // E.g. POST https://abc.supabase.co/storage/v1/object/product-images/products/7/3f9a….png
    private HttpRequestMessage CreateRequest(HttpMethod method, string path)
    {
        var request = new HttpRequestMessage(method, $"{SupabaseUrl}/storage/v1/object/{Bucket}/{path}");
        // "Supabase:SecretKey" comes from User Secrets locally and Supabase__SecretKey in hosting.
        // Read here instead of at startup, so tests and CI work without it (like Stripe:SecretKey).
        // Supabase wants secret keys in the apikey header, not as a Bearer token.
        request.Headers.Add("apikey", configuration["Supabase:SecretKey"]
            ?? throw new InvalidOperationException("Supabase:SecretKey is not configured."));
        return request;
    }

    // E.g. https://abc.supabase.co, from appsettings.json. Not a secret: it is part of every image's URL.
    private string SupabaseUrl => configuration["Supabase:Url"]
        ?? throw new InvalidOperationException("Supabase:Url is not configured.");
}
