import { expect, type Page } from '@playwright/test';

export type VisibleProduct = {
  name: string;
  subtitle: string;
  categoryId: string;
  href: string;
  price: number;
  available: boolean;
};

export async function readVisibleProducts(page: Page): Promise<VisibleProduct[]> {
  return page.locator('.product-card:visible').evaluateAll((cards) =>
    cards.map((card) => {
      const title = card.querySelector('.product-info h3');
      const priceText = card.querySelector('.product-price')?.textContent ?? '';
      const quickAdd = card.querySelector<HTMLButtonElement>('.quick-add');
      return {
        name: title?.textContent?.trim() ?? '',
        categoryId: card.getAttribute('data-category-id') ?? '',
        subtitle:
          card.querySelector('.product-info > div > p:last-child')?.textContent?.trim() ?? '',
        href:
          card
            .querySelector<HTMLAnchorElement>('.product-info a[href^="/cua-tiem/"]')
            ?.getAttribute('href') ?? '',
        price: Number(priceText.replace(/\D/g, '')),
        available: quickAdd ? !quickAdd.disabled : false,
      };
    }),
  );
}

export async function expectCatalogProducts(page: Page): Promise<VisibleProduct[]> {
  const cards = page.locator('.product-card:visible');
  await expect.poll(() => cards.count()).toBeGreaterThan(0);
  await expect(cards.first()).toHaveAttribute('data-store-ready', 'true');
  await expect(page.locator('.commerce-shop')).toHaveCount(1);
  const products = await readVisibleProducts(page);
  expect(new Set(products.map((product) => product.href)).size).toBe(products.length);
  return products;
}

export async function expectAvailableProduct(page: Page): Promise<VisibleProduct> {
  await expectCatalogProducts(page);
  await expect
    .poll(async () => (await readVisibleProducts(page)).some((product) => product.available))
    .toBe(true);
  return (await readVisibleProducts(page)).find((product) => product.available)!;
}

export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function priceValue(text: string): number {
  return Number(text.replace(/\D/g, ''));
}
