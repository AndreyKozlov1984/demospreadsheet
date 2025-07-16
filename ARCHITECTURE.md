Part 1 - the spreadsheet module
speadsheetEnginge.ts file

so there is a spreadsheet class, with get, set, getRaw, exportAsArray methods

exportAsArray will be used in the UI to draw the content.
getRaw allows to display the formula of the selected cell
get give a value of any cell, and set allows to set a value of any cell

We store a list of dependencies for every cell, still yet if we update any cell
it easier to exportAsArray whole spreadsheet than to get a list of all dependencies (next step)
