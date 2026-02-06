using MtgProxyGenerator.Api.Models;

namespace MtgProxyGenerator.Api.Services;

public interface IScryfallService
{
    Task<IReadOnlyDictionary<string, CardInfo>> GetCardsAsync(IEnumerable<string> cardNames);
}
