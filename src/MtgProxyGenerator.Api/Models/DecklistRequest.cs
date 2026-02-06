using System.ComponentModel.DataAnnotations;

namespace MtgProxyGenerator.Api.Models;

public class DecklistRequest
{
    [Required]
    [StringLength(10000, ErrorMessage = "Decklist text must not exceed 10,000 characters.")]
    public required string Text { get; set; }
}
