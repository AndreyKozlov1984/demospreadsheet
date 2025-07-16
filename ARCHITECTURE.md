npm install
npm run build
npm run start
npm run test (in other tab to run an automated test)
LOOM VIDEO: https://www.loom.com/share/3825e5c885b74f9fa04ac06c036bd114
Part 1 - the spreadsheet module
speadsheetEnginge.ts file

so there is a spreadsheet class, with get, set, getRaw, exportAsArray methods

exportAsArray will be used in the UI to draw the content.
getRaw allows to display the formula of the selected cell
get give a value of any cell, and set allows to set a value of any cell

We store a list of dependencies for every cell, still yet if we update any cell
it easier to exportAsArray whole spreadsheet than to get a list of all dependencies (next step)

PART 2 -  the UI Part - simple react app, nothing special
puppeteer test - a very primitive test, in future would use data-id="J1" instead of number of the cell
