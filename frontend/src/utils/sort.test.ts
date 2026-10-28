import { formatPrice, sortToParam, toggleSort } from './sort';

describe('toggleSort', () => {
  it('cicla asc → desc → sin orden y acumula campos', () => {
    let s = toggleSort([], 'title');
    expect(s).toEqual([{ field: 'title', dir: 'asc' }]);
    s = toggleSort(s, 'price');
    s = toggleSort(s, 'title');
    expect(s).toEqual([{ field: 'title', dir: 'desc' }, { field: 'price', dir: 'asc' }]);
    expect(sortToParam(s)).toBe('title:desc,price:asc');
    expect(toggleSort(s, 'title')).toEqual([{ field: 'price', dir: 'asc' }]);
    expect(sortToParam([])).toBeUndefined();
  });

  it('formatea precios en CLP', () => {
    expect(formatPrice(14990)).toMatch(/14\.990/);
  });
});
