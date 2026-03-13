# 1: Build React frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY ClientApp/package*.json ./
RUN npm ci
COPY ClientApp/ ./
RUN npm run build

# 2: Build .NET backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /app

# Copy project file and restore dependencies (cached layer)
COPY src/MtgProxyGenerator.Api/MtgProxyGenerator.Api.csproj src/MtgProxyGenerator.Api/
RUN dotnet restore src/MtgProxyGenerator.Api/MtgProxyGenerator.Api.csproj

# Copy source and pre-built frontend assets
COPY src/MtgProxyGenerator.Api/ src/MtgProxyGenerator.Api/
COPY --from=frontend-build /app/dist src/MtgProxyGenerator.Api/wwwroot/

# Publish, skipping the SPA build since we handled it above
RUN dotnet publish src/MtgProxyGenerator.Api -c Release -p:SkipSpa=true --no-restore -o /publish

# 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=backend-build /publish ./

ENV ASPNETCORE_HTTP_PORTS=10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "MtgProxyGenerator.Api.dll"]
