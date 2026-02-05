using System.Text.RegularExpressions;
using MtgProxyGenerator.Api.Models;

namespace MtgProxyGenerator.Api.Services;

public partial class DecklistParser : IDecklistParser
{
    // Matches lines like "4 Lightning Bolt", "4x Lightning Bolt", "1X Black Lotus"
    [GeneratedRegex(@"^\s*(\d+)\s*[xX]?\s+(.+?)\s*$")]
    private static partial Regex EntryPattern();

    public List<DecklistEntry> Parse(string decklist)
    {
        var entries = new List<DecklistEntry>();

        foreach (var line in decklist.Split('\n'))
        {
            var trimmed = line.Trim();

            // Skip empty lines and comments
            if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith("//") || trimmed.StartsWith('#'))
                continue;

            var match = EntryPattern().Match(trimmed);
            if (match.Success)
            {
                entries.Add(new DecklistEntry
                {
                    Quantity = int.Parse(match.Groups[1].Value),
                    Name = match.Groups[2].Value
                });
            }
        }

        return entries;
    }
}
