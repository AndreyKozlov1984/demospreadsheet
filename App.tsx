
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Spreadsheet } from './spreadsheetEngine';

const SpreadsheetApp: React.FC = () => {
    const spreadsheet = React.useMemo(() => new Spreadsheet(5, 10), []);
    const [selectedCell, setSelectedCell] = React.useState<string | null>(null);
    const [inputValue, setInputValue] = React.useState<string>('');
    const [error, setError] = React.useState<string | null>(null);
    const [grid, setGrid] = React.useState<(string | number | '!SYNTAX' | 'CIRCULAR')[][]>(
        Array.from({ length: 5 }, () => Array(10).fill(''))
    );

    // Load from localStorage on mount
    React.useEffect(() => {
        const savedData = localStorage.getItem('spreadsheet');
        if (savedData) {
            try {
                const rawArray: string[][] = JSON.parse(savedData);
                if (Array.isArray(rawArray) && rawArray.length === 5 && rawArray.every(row => Array.isArray(row) && row.length === 10)) {
                    rawArray.forEach((row, rowIndex) => {
                        row.forEach((value, colIndex) => {
                            if (value !== '') {
                                const cell = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
                                try {
                                    spreadsheet.set(cell, value);
                                } catch (err) {
                                    console.error(`Failed to load cell ${cell}:`, err);
                                }
                            }
                        });
                    });
                    setGrid(spreadsheet.exportAsArray());
                }
            } catch (err) {
                console.error('Failed to load from localStorage:', err);
            }
        }
    }, [spreadsheet]);

    // Update grid and save to localStorage
    const updateGrid = React.useCallback(() => {
        const newGrid = spreadsheet.exportAsArray();
        setGrid(newGrid);
        // Save to localStorage
        try {
            const rawArray = spreadsheet.exportAsRawArray();
            localStorage.setItem('spreadsheet', JSON.stringify(rawArray));
        } catch (err) {
            console.error('Failed to save to localStorage:', err);
        }
    }, [spreadsheet]);

    // Handle cell click to select and show input
    const handleCellClick = (cell: string) => {
        setSelectedCell(cell);
        setInputValue(spreadsheet.getRaw(cell));
        setError(null);
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    // Handle Enter key to update cell
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, cell: string) => {
        if (e.key === 'Enter') {
            try {
                spreadsheet.set(cell, inputValue);
                setSelectedCell(null);
                setInputValue('');
                setError(null);
                updateGrid();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        }
    };

    // Render the grid
    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Spreadsheet (10x5)</h1>
            {error && (
                <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
                    {error}
                </div>
            )}
            <div className="grid gap-1" style={{ gridTemplateColumns: '40px repeat(10, 80px)' }}>
                {/* Header row */}
                <div className="text-center font-bold"></div>
                {Array.from({ length: 10 }).map((_, col) => (
                    <div key={col} className="text-center font-bold">
                        {String.fromCharCode(65 + col)}
                    </div>
                ))}
                {/* Grid rows */}
                {grid.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        <div className="text-center font-bold">{rowIndex + 1}</div>
                        {row.map((value, colIndex) => {
                            const cell = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
                            return (
                                <div
                                    key={cell}
                                    className="border border-gray-300 p-1 h-8 flex items-center justify-end"
                                    onClick={() => handleCellClick(cell)}
                                >
                                    {selectedCell === cell ? (
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            onKeyDown={(e) => handleInputKeyDown(e, cell)}
                                            onBlur={() => setSelectedCell(null)}
                                            autoFocus
                                            className="w-full h-full text-right outline-none"
                                        />
                                    ) : (
                                        <span className="truncate">
                                            {value === '!SYNTAX' ? '#SYNTAX' :
                                             value === 'CIRCULAR' ? '#CIRCULAR' :
                                             value}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

// Render the app
const root = createRoot(document.getElementById('root')!);
root.render(<SpreadsheetApp />);
