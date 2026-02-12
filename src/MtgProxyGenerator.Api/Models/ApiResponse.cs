namespace MtgProxyGenerator.Api.Models;

public class ApiResponse<T>
{
    public T? Data { get; set; }
    public string? Error { get; set; }

    public static ApiResponse<T> Success(T data) => new() { Data = data };
    public static ApiResponse<T> Fail(string error) => new() { Error = error };
}
