using MtgProxyGenerator.Api.Models;

namespace MtgProxyGenerator.Api.Services;

public interface IDecklistParser
{
    List<DecklistEntry> Parse(string decklist);
}
