using MtgProxyGenerator.Api.Models;
using MtgProxyGenerator.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddSingleton<IDecklistParser, DecklistParser>();
builder.Services.AddHealthChecks();

var scryfallBaseUrl = builder.Configuration["Scryfall:BaseUrl"]
    ?? throw new InvalidOperationException("Missing required configuration: Scryfall:BaseUrl");

builder.Services.AddHttpClient<IScryfallService, ScryfallService>(client =>
{
    client.BaseAddress = new Uri(scryfallBaseUrl);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("MtgProxyGenerator/1.0");
    client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
})
.AddStandardResilienceHandler();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("DevCors", policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .WithHeaders("Content-Type")
                  .WithMethods("POST");
        });
    });
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("DevCors");
}

app.UseExceptionHandler(error => error.Run(async context =>
{
    var logger = context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("UnhandledException");
    var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
    logger.LogError(exception, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);

    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    context.Response.ContentType = "application/json";
    await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail("An unexpected error occurred."));
}));

// Serve React static files in production
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapHealthChecks("/health");

// Fallback: serve index.html for client-side routes
app.MapFallbackToFile("index.html");

app.Run();
