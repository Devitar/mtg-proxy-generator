using MtgProxyGenerator.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddSingleton<IDecklistParser, DecklistParser>();

builder.Services.AddHttpClient<IScryfallService, ScryfallService>(client =>
{
    client.DefaultRequestHeaders.UserAgent.ParseAdd("MtgProxyGenerator/1.0");
    client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
});

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("DevCors", policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
    });
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("DevCors");
}

// Serve React static files in production
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

// Fallback: serve index.html for client-side routes
app.MapFallbackToFile("index.html");

app.Run();
