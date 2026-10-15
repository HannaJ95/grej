# Builds and runs the API in a container. Render builds this file from the server/ folder.

# Stage 1: build. The SDK image has everything needed to compile .NET code.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
# Copy the solution and publish only the API, as an optimized Release build.
COPY . .
RUN dotnet publish Grej.Api/Grej.Api.csproj -c Release -o /app/publish

# Stage 2: run. The smaller ASP.NET image only contains what is needed to run the app,
# not the SDK or the source code.
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
# Run as the image's built-in non-root user instead of root.
USER $APP_UID
# .NET images listen on port 8080 by default. Render is told to use it with PORT=8080.
EXPOSE 8080
ENTRYPOINT ["dotnet", "Grej.Api.dll"]
