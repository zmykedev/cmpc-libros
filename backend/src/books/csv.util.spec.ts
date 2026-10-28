import { csvCell, toCsv } from './csv.util';

describe('csv util', () => {
  it('escapa comas, comillas y saltos', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('di "hola"')).toBe('"di ""hola"""');
    expect(csvCell(null)).toBe('');
    expect(csvCell(5)).toBe('5');
  });

  it('neutraliza inyección de fórmulas', () => {
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
  });

  it('arma el documento', () => {
    expect(toCsv(['a', 'b'], [[1, 2]])).toBe('a,b\r\n1,2');
  });
});
