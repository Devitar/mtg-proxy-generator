# MTG Proxy Generator
<b>This is not an official Magic: The Gathering application, and is not endorsed by Wizards of the Coast.</b><br />
C# .NET API + React SPA app to fetch and display a list of cards. Allows for easy printing and testing of a deck list prior to purchasing the real cards.

## Running the project locally
`dotnet run --project src/MtgProxyGenerator.Api -c Release`<br />
Then open http://localhost:5280 in the browser.

## The backend and frontend can also be ran separately
Backend<br />
`dotnet run`<br />

Frontend, (If not in ClientApp directory add `cd ClientApp && ` before command)<br />
`npm run dev`<br />