using MtgProxyGenerator.Api.Models;

namespace MtgProxyGenerator.Api.Services;

public interface IDecklistParser
{
    IReadOnlyList<DecklistEntry> Parse(string decklist);
}
