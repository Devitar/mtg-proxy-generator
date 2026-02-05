using MtgProxyGenerator.Api.Models;

namespace MtgProxyGenerator.Api.Services;

public interface IScryfallService
{
    Task<Dictionary<string, CardInfo>> GetCardsAsync(IEnumerable<string> cardNames);
}
