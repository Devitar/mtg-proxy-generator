using System.Text.Json;
using MtgProxyGenerator.Api.Models;

namespace MtgProxyGenerator.Api.Services;

public class ScryfallService(HttpClient httpClient, ILogger<ScryfallService> logger) : IScryfallService
{
    public async Task<Dictionary<string, CardInfo>> GetCardsAsync(IEnumerable<string> cardNames)
    {
        var results = new Dictionary<string, CardInfo>(StringComparer.OrdinalIgnoreCase);

        // Scryfall /cards/collection accepts up to 75 identifiers per request
        foreach (var batch in cardNames.Chunk(75))
        {
            var fetched = await FetchCollectionAsync(batch);
            foreach (var (name, card) in fetched)
                results[name] = card;
        }

        return results;
    }

    private async Task<Dictionary<string, CardInfo>> FetchCollectionAsync(IEnumerable<string> cardNames)
    {
        var results = new Dictionary<string, CardInfo>(StringComparer.OrdinalIgnoreCase);

        var identifiers = cardNames.Select(name => new { name }).ToArray();
        var payload = JsonSerializer.Serialize(new { identifiers });

        try
        {
            var content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync("https://api.scryfall.com/cards/collection", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                logger.LogWarning("Scryfall collection returned {StatusCode}: {Error}",
                    (int)response.StatusCode, errorBody);
                return results;
            }

            using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
            var root = doc.RootElement;

            if (root.TryGetProperty("data", out var data))
            {
                foreach (var card in data.EnumerateArray())
                {
                    var cardInfo = ParseCard(card);
                    if (cardInfo is not null)
                        results[cardInfo.Name] = cardInfo;
                }
            }

            if (root.TryGetProperty("not_found", out var notFound))
            {
                foreach (var entry in notFound.EnumerateArray())
                {
                    if (entry.TryGetProperty("name", out var name))
                        logger.LogWarning("Card not found on Scryfall: {CardName}", name.GetString());
                }
            }
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(ex, "Error fetching card collection from Scryfall");
        }

        return results;
    }

    private static CardInfo? ParseCard(JsonElement card)
    {
        string? imageUrl = null;
        if (card.TryGetProperty("image_uris", out var imageUris)
            && imageUris.TryGetProperty("large", out var largeUri))
        {
            imageUrl = largeUri.GetString();
        }

        var name = card.GetProperty("name").GetString();
        if (name is null) return null;

        return new CardInfo
        {
            Name = name,
            Quantity = 1,
            ImageUrl = imageUrl,
            ScryfallUrl = card.GetProperty("scryfall_uri").GetString(),
            SetCode = card.GetProperty("set").GetString()
        };
    }
}
