import { Spreadsheet } from './spreadsheetEngine';

describe('Spreadsheet', () => {
    let sheet: Spreadsheet;

    beforeEach(() => {
        sheet = new Spreadsheet(5, 10);
    });

    test('constructor validates maxRows and maxCols', () => {
        expect(() => new Spreadsheet(0, 10)).toThrow('Dimensions must be positive');
        expect(() => new Spreadsheet(5, 0)).toThrow('Dimensions must be positive');
        expect(() => new Spreadsheet(1000, 10)).toThrow('Maximum 999 rows allowed');
        expect(() => new Spreadsheet(5, 27)).toThrow('Maximum 26 columns (A-Z) allowed');
        expect(() => new Spreadsheet(999, 26)).not.toThrow();
    });

    test('sets and gets raw values correctly', () => {
        sheet.set('A1', '10');
        expect(sheet.get('A1')).toBe(10);       // Numeric string "10" computes to number 10
        expect(sheet.getRaw('A1')).toBe('10');  // Raw value remains "10"

        sheet.set('B2', 'hello');
        expect(sheet.get('B2')).toBe('hello');  // Non-numeric string remains a string
        expect(sheet.getRaw('B2')).toBe('hello');

        sheet.set('C3', '0');
        expect(sheet.get('C3')).toBe(0);       // Numeric string "0" computes to number 0
        expect(sheet.getRaw('C3')).toBe('0');

        sheet.set('D4', '');
        expect(sheet.get('D4')).toBe('');      // Empty string remains empty
        expect(sheet.getRaw('D4')).toBe('');
    });

    test('handles non-string inputs', () => {
        sheet.set('A1', 42 as any);
        expect(sheet.get('A1')).toBe('!SYNTAX');
        expect(sheet.getRaw('A1')).toBe('42');

        sheet.set('B1', null as any);
        expect(sheet.get('B1')).toBe('!SYNTAX');
        expect(sheet.getRaw('B1')).toBe('null');
    });

    test('handles invalid cell references', () => {
        sheet.set('K1', '10');
        expect(sheet.get('K1')).toBe('!SYNTAX');
        expect(sheet.getRaw('K1')).toBe('10');

        sheet.set('A6', '10');
        expect(sheet.get('A6')).toBe('!SYNTAX');
        expect(sheet.getRaw('A6')).toBe('10');
    });

    test('evaluates simple formulas', () => {
        sheet.set('A1', '=5 + 10');
        expect(sheet.get('A1')).toBe(15);
        expect(sheet.getRaw('A1')).toBe('=5 + 10');

        sheet.set('B1', '10');
        sheet.set('B2', '=B1 + 5');
        expect(sheet.get('B2')).toBe(15);
        expect(sheet.getRaw('B2')).toBe('=B1 + 5');
    });

    test('detects circular references', () => {
        sheet.set('A1', '=B1 + 5');
        sheet.set('B1', '=A1 + 10');
        expect(sheet.get('A1')).toBe('CIRCULAR');
        expect(sheet.getRaw('A1')).toBe('=B1 + 5');
        expect(sheet.get('B1')).toBe('CIRCULAR');
        expect(sheet.getRaw('B1')).toBe('=A1 + 10');
    });

    test('updates dependent cells', () => {
        sheet.set('A1', '10');
        sheet.set('B1', '=A1 + 5');
        expect(sheet.get('B1')).toBe(15);
        expect(sheet.getRaw('B1')).toBe('=A1 + 5');

        sheet.set('A1', '20');
        expect(sheet.get('B1')).toBe(25);
        expect(sheet.getRaw('B1')).toBe('=A1 + 5');
    });

    test('handles syntax errors in formulas', () => {
        sheet.set('A1', '=A1 + K1');
        expect(sheet.get('A1')).toBe('!SYNTAX');
        expect(sheet.getRaw('A1')).toBe('=A1 + K1');
    });

    test('exports as array correctly', () => {
        sheet.set('A1', '10');
        sheet.set('B2', '=A1 + 5');
        const expected = [
            [10, '', '', '', '', '', '', '', '', ''],
            ['', 15, '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '']
        ];
        expect(sheet.exportAsArray()).toEqual(expected);
    });
});
