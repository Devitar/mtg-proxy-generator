using Microsoft.Extensions.Logging;
using MtgProxyGenerator.Api.Models;
using MtgProxyGenerator.Api.Services;
using MtgProxyGenerator.Api.Tests.Helpers;
using System.Net;
using System.Text.Json;

namespace MtgProxyGenerator.Api.Tests.Services;

public class ScryfallServiceTests
{
    private readonly ILogger<ScryfallService> _logger = Substitute.For<ILogger<ScryfallService>>();

    private ScryfallService CreateService(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler)
    {
        var mockHandler = new MockHttpMessageHandler(handler);
        var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("https://api.scryfall.com/") };
        return new ScryfallService(httpClient, _logger);
    }

    private static HttpResponseMessage JsonResponse(string json, HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        return new HttpResponseMessage(statusCode)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };
    }

    private static string BuildResponse(
        IEnumerable<object>? data = null,
        IEnumerable<object>? notFound = null)
    {
        var response = new Dictionary<string, object>();
        if (data is not null) response["data"] = data;
        if (notFound is not null) response["not_found"] = notFound;
        return JsonSerializer.Serialize(response);
    }

    private static object CreateCardJson(
        string name,
        string? imageUrl = "https://img.scryfall.com/large.jpg",
        string? scryfallUri = "https://scryfall.com/card/test",
        string? set = "lea")
    {
        var card = new Dictionary<string, object> { ["name"] = name };

        if (imageUrl is not null)
            card["image_uris"] = new { large = imageUrl };
        if (scryfallUri is not null)
            card["scryfall_uri"] = scryfallUri;
        if (set is not null)
            card["set"] = set;

        return card;
    }

    [Fact]
    public async Task GetCardsAsync_SingleCard_ReturnsCardInfo()
    {
        var json = BuildResponse(data: [CreateCardJson("Lightning Bolt")]);
        var service = CreateService((_, _) => Task.FromResult(JsonResponse(json)));

        var result = await service.GetCardsAsync(["Lightning Bolt"]);

        result.Should().ContainKey("Lightning Bolt");
        var card = result["Lightning Bolt"];
        card.Name.Should().Be("Lightning Bolt");
        card.ImageUrl.Should().Be("https://img.scryfall.com/large.jpg");
        card.ScryfallUrl.Should().Be("https://scryfall.com/card/test");
        card.SetCode.Should().Be("lea");
    }

    [Fact]
    public async Task GetCardsAsync_MultipleCards_ReturnsAll()
    {
        var json = BuildResponse(data: [
            CreateCardJson("Lightning Bolt"),
            CreateCardJson("Counterspell"),
            CreateCardJson("Black Lotus")
        ]);
        var service = CreateService((_, _) => Task.FromResult(JsonResponse(json)));

        var result = await service.GetCardsAsync(["Lightning Bolt", "Counterspell", "Black Lotus"]);

        result.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetCardsAsync_CardWithNoImageUris_ImageUrlIsNull()
    {
        var json = BuildResponse(data: [CreateCardJson("Bolt", imageUrl: null)]);
        var service = CreateService((_, _) => Task.FromResult(JsonResponse(json)));

        var result = await service.GetCardsAsync(["Bolt"]);

        result["Bolt"].ImageUrl.Should().BeNull();
    }

    [Fact]
    public async Task GetCardsAsync_CardWithNoScryfallUri_ScryfallUrlIsNull()
    {
        var json = BuildResponse(data: [CreateCardJson("Bolt", scryfallUri: null)]);
        var service = CreateService((_, _) => Task.FromResult(JsonResponse(json)));

        var result = await service.GetCardsAsync(["Bolt"]);

        result["Bolt"].ScryfallUrl.Should().BeNull();
    }

    [Fact]
    public async Task GetCardsAsync_CardWithNoSet_SetCodeIsNull()
    {
        var json = BuildResponse(data: [CreateCardJson("Bolt", set: null)]);
        var service = CreateService((_, _) => Task.FromResult(JsonResponse(json)));

        var result = await service.GetCardsAsync(["Bolt"]);

        result["Bolt"].SetCode.Should().BeNull();
    }

    [Fact]
    public async Task GetCardsAsync_CardWithNoName_SkippedInResults()
    {
        // Build a card JSON without a name property
        var json = """{"data":[{"image_uris":{"large":"img.jpg"}}]}""";
        var service = CreateService((_, _) => Task.FromResult(JsonResponse(json)));

        var result = await service.GetCardsAsync(["Anything"]);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetCardsAsync_NonSuccessStatusCode_ReturnsEmptyDict()
    {
        var service = CreateService((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError)
            {
                Content = new StringContent("Server error")
            }));

        var result = await service.GetCardsAsync(["Bolt"]);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetCardsAsync_HttpRequestException_ReturnsEmptyDict()
    {
        var service = CreateService((_, _) =>
            throw new HttpRequestException("Network error"));

        var result = await service.GetCardsAsync(["Bolt"]);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetCardsAsync_MalformedJson_ReturnsEmptyDict()
    {
        var service = CreateService((_, _) =>
            Task.FromResult(JsonResponse("this is not json")));

        var result = await service.GetCardsAsync(["Bolt"]);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetCardsAsync_EmptyInput_ReturnsEmptyDict()
    {
        var requestCount = 0;
        var service = CreateService((_, _) =>
        {
            requestCount++;
            return Task.FromResult(JsonResponse("{}"));
        });

        var result = await service.GetCardsAsync([]);

        result.Should().BeEmpty();
        requestCount.Should().Be(0);
    }

    [Fact]
    public async Task GetCardsAsync_BatchesRequestsAt75()
    {
        var requestCount = 0;
        var json = BuildResponse(data: []);
        var service = CreateService((_, _) =>
        {
            requestCount++;
            return Task.FromResult(JsonResponse(json));
        });

        var names = Enumerable.Range(1, 80).Select(i => $"Card{i}");

        await service.GetCardsAsync(names);

        requestCount.Should().Be(2);
    }

    [Fact]
    public async Task GetCardsAsync_Exactly75_SingleBatch()
    {
        var requestCount = 0;
        var json = BuildResponse(data: []);
        var service = CreateService((_, _) =>
        {
            requestCount++;
            return Task.FromResult(JsonResponse(json));
        });

        var names = Enumerable.Range(1, 75).Select(i => $"Card{i}");

        await service.GetCardsAsync(names);

        requestCount.Should().Be(1);
    }

    [Fact]
    public async Task GetCardsAsync_UsesOrdinalIgnoreCaseForKeys()
    {
        var json = BuildResponse(data: [CreateCardJson("lightning bolt")]);
        var service = CreateService((_, _) => Task.FromResult(JsonResponse(json)));

        var result = await service.GetCardsAsync(["Lightning Bolt"]);

        result.Should().ContainKey("Lightning Bolt");
        result.Should().ContainKey("lightning bolt");
    }

    [Fact]
    public async Task GetCardsAsync_SendsCorrectPayloadFormat()
    {
        string? capturedBody = null;
        var json = BuildResponse(data: [CreateCardJson("Lightning Bolt")]);
        var service = CreateService(async (request, _) =>
        {
            capturedBody = await request.Content!.ReadAsStringAsync();
            return JsonResponse(json);
        });

        await service.GetCardsAsync(["Lightning Bolt"]);

        capturedBody.Should().NotBeNull();
        using var doc = JsonDocument.Parse(capturedBody!);
        var identifiers = doc.RootElement.GetProperty("identifiers");
        identifiers.GetArrayLength().Should().Be(1);
        identifiers[0].GetProperty("name").GetString().Should().Be("Lightning Bolt");
    }

    [Fact]
    public async Task GetCardsAsync_NotFoundCards_LogsWarning()
    {
        var json = BuildResponse(
            data: [],
            notFound: [new { name = "Nonexistent Card" }]);
        var service = CreateService((_, _) => Task.FromResult(JsonResponse(json)));

        await service.GetCardsAsync(["Nonexistent Card"]);

        _logger.ReceivedWithAnyArgs().LogWarning(default!, default(object?[]));
    }
}
