using Microsoft.AspNetCore.Mvc;
using MtgProxyGenerator.Api.Models;
using MtgProxyGenerator.Api.Services;

namespace MtgProxyGenerator.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CardsController(IDecklistParser parser, IScryfallService scryfallService) : ControllerBase
{
    [HttpPost("parse")]
    public async Task<ActionResult<List<CardInfo>>> ParseDecklist([FromBody] DecklistRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
            return BadRequest(new { error = "Decklist text is required." });

        var entries = parser.Parse(request.Text);

        if (entries.Count == 0)
            return BadRequest(new { error = "No valid card entries found in decklist." });

        var uniqueNames = entries.Select(e => e.Name).Distinct(StringComparer.OrdinalIgnoreCase);
        var cardLookup = await scryfallService.GetCardsAsync(uniqueNames);

        var cards = new List<CardInfo>();
        foreach (var entry in entries)
        {
            if (cardLookup.TryGetValue(entry.Name, out var card))
            {
                cards.Add(new CardInfo
                {
                    Name = card.Name,
                    Quantity = entry.Quantity,
                    ImageUrl = card.ImageUrl,
                    ScryfallUrl = card.ScryfallUrl,
                    SetCode = card.SetCode
                });
            }
        }

        return Ok(cards);
    }
}
