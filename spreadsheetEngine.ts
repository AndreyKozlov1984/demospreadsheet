export class Spreadsheet {
    private maxRows: number;
    private maxCols: number;
    private cells: Map<string, string | number | '!SYNTAX' | 'CIRCULAR'>;
    private rawValues: Map<string, string>;
    private dependencies: Map<string, Set<string>>;

    constructor(maxRows: number = 5, maxCols: number = 10) {
        if (maxCols > 26) throw new Error('Maximum 26 columns (A-Z) allowed');
        if (maxRows > 999) throw new Error('Maximum 999 rows allowed');
        if (maxRows < 1 || maxCols < 1) throw new Error('Dimensions must be positive');

        this.maxRows = maxRows;
        this.maxCols = maxCols;
        this.cells = new Map();
        this.rawValues = new Map();
        this.dependencies = new Map();
    }

    // Set a cell's value or formula (only strings allowed)
    set(cell: string, value: string): void {
        if (typeof value !== 'string') {
            this.cells.set(cell, '!SYNTAX');
            this.rawValues.set(cell, String(value));
            return;
        }

        if (!this.isValidCell(cell)) {
            this.cells.set(cell, '!SYNTAX');
            this.rawValues.set(cell, value);
            return;
        }

        this.dependencies.delete(cell);
        this.rawValues.set(cell, value);

        // Store numeric value if it's a number string
        if (/^[0-9]+$/.test(value)) {
            this.cells.set(cell, parseFloat(value));
        } else {
            this.cells.set(cell, value);
        }

        if (value.startsWith('=')) {
            const tokens = this.parseFormula(value);
            if (tokens === null) {
                this.cells.set(cell, '!SYNTAX');
                return;
            }

            const deps = tokens.filter(token => this.isValidCell(token));
            this.dependencies.set(cell, new Set(deps));

            if (this.detectCircular(cell, new Set())) {
                this.markCircular(cell, new Set());
                return;
            }

            // Evaluate formula immediately
            const result = this.evaluateFormula(cell, value);
            this.cells.set(cell, result);
        }

        this.updateDependents(cell, new Set());
    }

    // Get a cell's computed value
    get(cell: string): string | number | '!SYNTAX' | 'CIRCULAR' {
        if (!this.isValidCell(cell)) {
            return '!SYNTAX';
        }

        const value = this.cells.get(cell);
        return value ?? '';
    }

    // Get a cell's raw value or formula
    getRaw(cell: string): string {
        if (!this.isValidCell(cell)) {
            return '';
        }
        return this.rawValues.get(cell) ?? '';
    }

    // Validate cell reference (e.g., A1, Z999)
    private isValidCell(cell: string): boolean {
        return /^[A-Z](?:[1-9]|[1-9][0-9]{1,2})$/.test(cell) &&
               cell.charCodeAt(0) - 65 < this.maxCols &&
               parseInt(cell.slice(1)) <= this.maxRows;
    }

    // Parse formula into tokens
    private parseFormula(formula: string): string[] | null {
        if (!formula.startsWith('=')) {
            return null;
        }

        const parts = formula.slice(1).split('+').map(part => part.trim());

        for (const part of parts) {
            if (!/^[0-9]+$/.test(part) && !this.isValidCell(part)) {
                return null;
            }
        }

        return parts;
    }

    // Evaluate a formula
    private evaluateFormula(cell: string, formula: string): number | '!SYNTAX' | 'CIRCULAR' {
        const tokens = this.parseFormula(formula);
        if (tokens === null) {
            return '!SYNTAX';
        }

        let sum: number = 0;
        for (const token of tokens) {
            if (/^[0-9]+$/.test(token)) {
                sum += parseFloat(token);
            } else {
                const refValue = this.get(token);
                if (refValue === '!SYNTAX' || refValue === 'CIRCULAR') {
                    return refValue;
                }
                if (typeof refValue !== 'number') {
                    return '!SYNTAX';
                }
                sum += refValue;
            }
        }

        return sum;
    }

    // Detect circular references using DFS
    private detectCircular(cell: string, visited: Set<string>): boolean {
        if (!this.dependencies.has(cell)) {
            return false;
        }

        if (visited.has(cell)) {
            return true;
        }

        visited.add(cell);
        const deps = this.dependencies.get(cell) || new Set<string>();
        for (const dep of deps) {
            if (this.detectCircular(dep, new Set(visited))) {
                return true;
            }
        }

        return false;
    }

    // Mark all cells in a circular reference chain
    private markCircular(cell: string, visited: Set<string>): void {
        if (visited.has(cell)) {
            return;
        }

        visited.add(cell);
        this.cells.set(cell, 'CIRCULAR');

        for (const [otherCell, deps] of this.dependencies.entries()) {
            if (deps.has(cell)) {
                this.markCircular(otherCell, visited);
            }
        }
    }

    // Update all dependent cells with cycle prevention
    private updateDependents(cell: string, visited: Set<string>): void {
        if (visited.has(cell)) {
            return;
        }
        visited.add(cell);

        for (const [otherCell, deps] of this.dependencies.entries()) {
            if (deps.has(cell)) {
                const value = this.rawValues.get(otherCell);
                if (typeof value === 'string' && value.startsWith('=')) {
                    if (this.detectCircular(otherCell, new Set())) {
                        this.markCircular(otherCell, new Set());
                    } else {
                        const result = this.evaluateFormula(otherCell, value);
                        this.cells.set(otherCell, result);
                    }
                }
                this.updateDependents(otherCell, visited);
            }
        }
    }

    // Export as array
    exportAsArray(): (string | number | '!SYNTAX' | 'CIRCULAR')[][] {
        const result: (string | number | '!SYNTAX' | 'CIRCULAR')[][] =
            Array.from({ length: this.maxRows }, () => Array(this.maxCols).fill(''));

        for (let row = 1; row <= this.maxRows; row++) {
            for (let col = 0; col < this.maxCols; col++) {
                const cell = String.fromCharCode(65 + col) + row;
                result[row - 1][col] = this.get(cell);
            }
        }

        return result;
    }
}
