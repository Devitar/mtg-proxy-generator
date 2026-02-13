using MtgProxyGenerator.Api.Services;

namespace MtgProxyGenerator.Api.Tests.Services;

public class DecklistParserTests
{
    private readonly DecklistParser _parser = new();

    [Fact]
    public void Parse_SingleEntry_ReturnsSingleItem()
    {
        var result = _parser.Parse("4 Lightning Bolt");

        result.Should().ContainSingle()
            .Which.Should().BeEquivalentTo(new { Quantity = 4, Name = "Lightning Bolt" });
    }

    [Fact]
    public void Parse_EntryWithLowercaseX_ParsesCorrectly()
    {
        var result = _parser.Parse("4x Lightning Bolt");

        result.Should().ContainSingle()
            .Which.Should().BeEquivalentTo(new { Quantity = 4, Name = "Lightning Bolt" });
    }

    [Fact]
    public void Parse_EntryWithUppercaseX_ParsesCorrectly()
    {
        var result = _parser.Parse("4X Lightning Bolt");

        result.Should().ContainSingle()
            .Which.Should().BeEquivalentTo(new { Quantity = 4, Name = "Lightning Bolt" });
    }

    [Fact]
    public void Parse_MultipleEntries_ReturnsAll()
    {
        var result = _parser.Parse("4 Lightning Bolt\n2 Counterspell\n1 Black Lotus");

        result.Should().HaveCount(3);
        result[0].Should().BeEquivalentTo(new { Quantity = 4, Name = "Lightning Bolt" });
        result[1].Should().BeEquivalentTo(new { Quantity = 2, Name = "Counterspell" });
        result[2].Should().BeEquivalentTo(new { Quantity = 1, Name = "Black Lotus" });
    }

    [Fact]
    public void Parse_SkipsEmptyLines()
    {
        var result = _parser.Parse("4 Lightning Bolt\n\n2 Counterspell");

        result.Should().HaveCount(2);
    }

    [Fact]
    public void Parse_SkipsDoubleSlashComments()
    {
        var result = _parser.Parse("// this is a comment\n4 Lightning Bolt");

        result.Should().ContainSingle()
            .Which.Name.Should().Be("Lightning Bolt");
    }

    [Fact]
    public void Parse_SkipsHashComments()
    {
        var result = _parser.Parse("# sideboard\n2 Path to Exile");

        result.Should().ContainSingle()
            .Which.Name.Should().Be("Path to Exile");
    }

    [Fact]
    public void Parse_HandlesWindowsLineEndings()
    {
        var result = _parser.Parse("4 Lightning Bolt\r\n2 Counterspell");

        result.Should().HaveCount(2);
    }

    [Fact]
    public void Parse_HandlesOldMacLineEndings()
    {
        var result = _parser.Parse("4 Lightning Bolt\r2 Counterspell");

        result.Should().HaveCount(2);
    }

    [Fact]
    public void Parse_LeadingWhitespace_Trimmed()
    {
        var result = _parser.Parse("   4 Lightning Bolt");

        result.Should().ContainSingle()
            .Which.Should().BeEquivalentTo(new { Quantity = 4, Name = "Lightning Bolt" });
    }

    [Fact]
    public void Parse_TrailingWhitespace_Trimmed()
    {
        var result = _parser.Parse("4 Lightning Bolt   ");

        result.Should().ContainSingle()
            .Which.Name.Should().Be("Lightning Bolt");
    }

    [Fact]
    public void Parse_InvalidLine_Skipped()
    {
        var result = _parser.Parse("not a valid line\n4 Lightning Bolt");

        result.Should().ContainSingle()
            .Which.Name.Should().Be("Lightning Bolt");
    }

    [Fact]
    public void Parse_NoValidEntries_ReturnsEmptyList()
    {
        var result = _parser.Parse("just some random text");

        result.Should().BeEmpty();
    }

    [Fact]
    public void Parse_OnlyComments_ReturnsEmptyList()
    {
        var result = _parser.Parse("// comment\n# another");

        result.Should().BeEmpty();
    }

    [Fact]
    public void Parse_OnlyEmptyLines_ReturnsEmptyList()
    {
        var result = _parser.Parse("\n\n\n");

        result.Should().BeEmpty();
    }

    [Fact]
    public void Parse_EmptyString_ReturnsEmptyList()
    {
        var result = _parser.Parse("");

        result.Should().BeEmpty();
    }

    [Fact]
    public void Parse_QuantityOne_ParsesCorrectly()
    {
        var result = _parser.Parse("1 Sol Ring");

        result.Should().ContainSingle()
            .Which.Quantity.Should().Be(1);
    }

    [Fact]
    public void Parse_LargeQuantity_ParsesCorrectly()
    {
        var result = _parser.Parse("100 Mountain");

        result.Should().ContainSingle()
            .Which.Quantity.Should().Be(100);
    }

    [Fact]
    public void Parse_CardNameWithComma()
    {
        var result = _parser.Parse("1 Jace, the Mind Sculptor");

        result.Should().ContainSingle()
            .Which.Name.Should().Be("Jace, the Mind Sculptor");
    }

    [Fact]
    public void Parse_CardNameWithApostrophe()
    {
        var result = _parser.Parse("1 Sensei's Divining Top");

        result.Should().ContainSingle()
            .Which.Name.Should().Be("Sensei's Divining Top");
    }

    [Fact]
    public void Parse_MixedValidAndInvalid()
    {
        var result = _parser.Parse("4 Bolt\ngarbage\n2 Path");

        result.Should().HaveCount(2);
        result[0].Name.Should().Be("Bolt");
        result[1].Name.Should().Be("Path");
    }

    [Fact]
    public void Parse_OversizedQuantity_CappedAtMaxQuantity()
    {
        var result = _parser.Parse("999999 Mountain");

        result.Should().ContainSingle()
            .Which.Quantity.Should().Be(DecklistParser.MaxQuantity);
    }

    [Fact]
    public void Parse_QuantityAtMax_NotCapped()
    {
        var result = _parser.Parse($"{DecklistParser.MaxQuantity} Mountain");

        result.Should().ContainSingle()
            .Which.Quantity.Should().Be(DecklistParser.MaxQuantity);
    }

    [Fact]
    public void Parse_QuantityBelowMax_NotCapped()
    {
        var result = _parser.Parse("50 Mountain");

        result.Should().ContainSingle()
            .Which.Quantity.Should().Be(50);
    }

    [Fact]
    public void Parse_NameExceedingMaxLength_Skipped()
    {
        var longName = new string('A', DecklistParser.MaxNameLength + 1);
        var result = _parser.Parse($"1 {longName}");

        result.Should().BeEmpty();
    }

    [Fact]
    public void Parse_NameAtMaxLength_Accepted()
    {
        var name = new string('A', DecklistParser.MaxNameLength);
        var result = _parser.Parse($"1 {name}");

        result.Should().ContainSingle()
            .Which.Name.Should().Be(name);
    }
}
