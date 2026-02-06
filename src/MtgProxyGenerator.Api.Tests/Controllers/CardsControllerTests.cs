using Microsoft.AspNetCore.Mvc;
using MtgProxyGenerator.Api.Controllers;
using MtgProxyGenerator.Api.Models;
using MtgProxyGenerator.Api.Services;

namespace MtgProxyGenerator.Api.Tests.Controllers;

public class CardsControllerTests
{
    private readonly IDecklistParser _parser = Substitute.For<IDecklistParser>();
    private readonly IScryfallService _scryfallService = Substitute.For<IScryfallService>();
    private readonly CardsController _controller;

    public CardsControllerTests()
    {
        _controller = new CardsController(_parser, _scryfallService);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t")]
    public async Task ParseDecklist_EmptyOrWhitespaceText_ReturnsBadRequest(string text)
    {
        var request = new DecklistRequest { Text = text };

        var result = await _controller.ParseDecklist(request);

        result.Result.Should().BeOfType<BadRequestObjectResult>()
            .Which.Value.Should().Be("Decklist text is required.");
    }

    [Fact]
    public async Task ParseDecklist_NoValidEntries_ReturnsBadRequest()
    {
        var request = new DecklistRequest { Text = "invalid text" };
        _parser.Parse("invalid text").Returns(new List<DecklistEntry>());

        var result = await _controller.ParseDecklist(request);

        result.Result.Should().BeOfType<BadRequestObjectResult>()
            .Which.Value.Should().Be("No valid card entries found in decklist.");
    }

    [Fact]
    public async Task ParseDecklist_ValidInput_ReturnsOkWithCards()
    {
        var request = new DecklistRequest { Text = "4 Bolt\n2 Path" };
        var entries = new List<DecklistEntry>
        {
            new() { Quantity = 4, Name = "Bolt" },
            new() { Quantity = 2, Name = "Path" }
        };
        _parser.Parse(request.Text).Returns(entries);

        var lookup = new Dictionary<string, CardInfo>(StringComparer.OrdinalIgnoreCase)
        {
            ["Bolt"] = new() { Name = "Bolt", ImageUrl = "bolt.jpg", ScryfallUrl = "bolt-url", SetCode = "lea" },
            ["Path"] = new() { Name = "Path", ImageUrl = "path.jpg", ScryfallUrl = "path-url", SetCode = "mm3" }
        };
        _scryfallService.GetCardsAsync(Arg.Any<IEnumerable<string>>()).Returns(lookup);

        var result = await _controller.ParseDecklist(request);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var cards = okResult.Value.Should().BeOfType<List<CardInfo>>().Subject;
        cards.Should().HaveCount(2);
        cards[0].Name.Should().Be("Bolt");
        cards[0].Quantity.Should().Be(4);
        cards[1].Name.Should().Be("Path");
        cards[1].Quantity.Should().Be(2);
    }

    [Fact]
    public async Task ParseDecklist_CardNotInLookup_OmittedFromResult()
    {
        var request = new DecklistRequest { Text = "4 Bolt\n2 Missing" };
        var entries = new List<DecklistEntry>
        {
            new() { Quantity = 4, Name = "Bolt" },
            new() { Quantity = 2, Name = "Missing" }
        };
        _parser.Parse(request.Text).Returns(entries);

        var lookup = new Dictionary<string, CardInfo>(StringComparer.OrdinalIgnoreCase)
        {
            ["Bolt"] = new() { Name = "Bolt" }
        };
        _scryfallService.GetCardsAsync(Arg.Any<IEnumerable<string>>()).Returns(lookup);

        var result = await _controller.ParseDecklist(request);

        var cards = result.Result.Should().BeOfType<OkObjectResult>().Subject
            .Value.Should().BeOfType<List<CardInfo>>().Subject;
        cards.Should().ContainSingle().Which.Name.Should().Be("Bolt");
    }

    [Fact]
    public async Task ParseDecklist_QuantityComesFromEntry_NotLookup()
    {
        var request = new DecklistRequest { Text = "4 Bolt" };
        var entries = new List<DecklistEntry> { new() { Quantity = 4, Name = "Bolt" } };
        _parser.Parse(request.Text).Returns(entries);

        var lookup = new Dictionary<string, CardInfo>(StringComparer.OrdinalIgnoreCase)
        {
            ["Bolt"] = new() { Name = "Bolt", Quantity = 0 }
        };
        _scryfallService.GetCardsAsync(Arg.Any<IEnumerable<string>>()).Returns(lookup);

        var result = await _controller.ParseDecklist(request);

        var cards = result.Result.Should().BeOfType<OkObjectResult>().Subject
            .Value.Should().BeOfType<List<CardInfo>>().Subject;
        cards[0].Quantity.Should().Be(4);
    }

    [Fact]
    public async Task ParseDecklist_MapsAllFieldsFromLookup()
    {
        var request = new DecklistRequest { Text = "1 Bolt" };
        var entries = new List<DecklistEntry> { new() { Quantity = 1, Name = "Bolt" } };
        _parser.Parse(request.Text).Returns(entries);

        var lookup = new Dictionary<string, CardInfo>(StringComparer.OrdinalIgnoreCase)
        {
            ["Bolt"] = new()
            {
                Name = "Lightning Bolt",
                ImageUrl = "https://img.jpg",
                ScryfallUrl = "https://scryfall.com/bolt",
                SetCode = "lea"
            }
        };
        _scryfallService.GetCardsAsync(Arg.Any<IEnumerable<string>>()).Returns(lookup);

        var result = await _controller.ParseDecklist(request);

        var cards = result.Result.Should().BeOfType<OkObjectResult>().Subject
            .Value.Should().BeOfType<List<CardInfo>>().Subject;
        var card = cards[0];
        card.Name.Should().Be("Lightning Bolt");
        card.ImageUrl.Should().Be("https://img.jpg");
        card.ScryfallUrl.Should().Be("https://scryfall.com/bolt");
        card.SetCode.Should().Be("lea");
    }

    [Fact]
    public async Task ParseDecklist_PreservesEntryOrder()
    {
        var request = new DecklistRequest { Text = "1 C\n1 A\n1 B" };
        var entries = new List<DecklistEntry>
        {
            new() { Quantity = 1, Name = "C" },
            new() { Quantity = 1, Name = "A" },
            new() { Quantity = 1, Name = "B" }
        };
        _parser.Parse(request.Text).Returns(entries);

        var lookup = new Dictionary<string, CardInfo>(StringComparer.OrdinalIgnoreCase)
        {
            ["A"] = new() { Name = "A" },
            ["B"] = new() { Name = "B" },
            ["C"] = new() { Name = "C" }
        };
        _scryfallService.GetCardsAsync(Arg.Any<IEnumerable<string>>()).Returns(lookup);

        var result = await _controller.ParseDecklist(request);

        var cards = result.Result.Should().BeOfType<OkObjectResult>().Subject
            .Value.Should().BeOfType<List<CardInfo>>().Subject;
        cards.Select(c => c.Name).Should().ContainInOrder("C", "A", "B");
    }

    [Fact]
    public async Task ParseDecklist_DuplicateNames_PassesDistinctNamesToService()
    {
        var request = new DecklistRequest { Text = "4 Bolt\n2 Bolt\n1 Path" };
        var entries = new List<DecklistEntry>
        {
            new() { Quantity = 4, Name = "Bolt" },
            new() { Quantity = 2, Name = "Bolt" },
            new() { Quantity = 1, Name = "Path" }
        };
        _parser.Parse(request.Text).Returns(entries);

        var lookup = new Dictionary<string, CardInfo>(StringComparer.OrdinalIgnoreCase)
        {
            ["Bolt"] = new() { Name = "Bolt" },
            ["Path"] = new() { Name = "Path" }
        };
        _scryfallService.GetCardsAsync(Arg.Any<IEnumerable<string>>()).Returns(lookup);

        await _controller.ParseDecklist(request);

        await _scryfallService.Received(1).GetCardsAsync(
            Arg.Is<IEnumerable<string>>(names => names.Distinct(StringComparer.OrdinalIgnoreCase).Count() == names.Count()));
    }
}
