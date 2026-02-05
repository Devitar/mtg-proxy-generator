namespace MtgProxyGenerator.Api.Models;

public class CardInfo
{
    public required string Name { get; set; }
    public int Quantity { get; set; }
    public string? ImageUrl { get; set; }
    public string? ScryfallUrl { get; set; }
    public string? SetCode { get; set; }
}
