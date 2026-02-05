# MTG Proxy Generator
<b>This is <u>not</u> an official Magic: The Gathering application, and is not endorsed by Wizards of the Coast.</b><br />
C# .NET API + TypeScript React SPA app to fetch and display a list of cards. Allows for easy printing and testing of a deck list prior to purchasing the real cards.

## Requirements
- .NET 10 SDK
- Node.js

## Running the project locally
`dotnet run --project src/MtgProxyGenerator.Api -c Release`<br />
Then open http://localhost:5280 in your browser.<br />
Running with -c Release automatically builds the React app and bundles it into wwwroot, allowing it to be served from the backend.

## The backend and frontend can also be ran separately
Backend<br />
`dotnet run --project src/MtgProxyGenerator.Api`<br />

Frontend, (If your terminal is not running in /ClientApp directory add `cd ClientApp && ` before command)<br />
`npm run dev`<br />
Then open http://localhost:5173 in your browser.