using Microsoft.AspNetCore.Mvc.Testing;

namespace Grej.IntegrationTests;

// The API only accepts browser calls from the frontend's own domain (constraints.md).
// The test server runs in Development, so it uses appsettings.Development.json.
public class CorsTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Request_FromFrontendOrigin_IsAllowed()
    {
        var response = await GetHealthFrom("http://localhost:4200");

        Assert.Equal("http://localhost:4200", response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    [Fact]
    public async Task Request_FromOtherOrigin_IsNotAllowed()
    {
        var response = await GetHealthFrom("https://other-site.example");

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    private async Task<HttpResponseMessage> GetHealthFrom(string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/health");
        request.Headers.Add("Origin", origin);
        return await factory.CreateClient().SendAsync(request);
    }
}
