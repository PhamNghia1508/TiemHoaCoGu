import { describe, expect, it } from 'vitest';
import { categories, money, products } from './catalog';

describe('catalog data', () => {
  it('contains unique product IDs and complete positive prices', () => {
    const ids = products.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => Number.isInteger(product.price) && product.price > 0)).toBe(
      true,
    );
    expect(products.map(({ id, price }) => ({ id, price }))).toEqual([
      { id: 'trang-non', price: 420000 },
      { id: 'suong-som', price: 289000 },
      { id: 'kit-co-ban', price: 350000 },
      { id: 'anh-trang', price: 560000 },
      { id: 'nen-hoa', price: 199000 },
      { id: 'hop-qua', price: 89000 },
    ]);
  });

  it('keeps category IDs unique and aligned with product categories', () => {
    expect(new Set(categories.map((category) => category.id)).size).toBe(categories.length);
    const categoryIds = new Set(categories.map((category) => category.id));
    expect(products.every((product) => categoryIds.has(product.category))).toBe(true);
    expect(categories[0]).toEqual({ id: 'all', label: 'Tất cả' });
  });
});

describe('money', () => {
  it('formats VND with Vietnamese separators and no decimal fraction', () => {
    expect(money(420000)).toBe('420.000 ₫');
    expect(money(0)).toBe('0 ₫');
    expect(money(1234567.89)).toBe('1.234.568 ₫');
  });
});
