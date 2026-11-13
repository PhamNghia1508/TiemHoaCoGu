'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import Image from 'next/image';
import { ArrowRight, Check, Lightbulb, Minus, Plus, Shuffle, Trash2 } from 'lucide-react';
import { money } from '@/lib/catalog';
import { storeRequest } from '@/lib/browser-api';
import type { BouquetInput } from '@/lib/api/client';
import { useStore } from './store-provider';
import CustomForm from './custom-form';

const categories = { flowers: 'Hoa chính', greenery: 'Lá xanh', accents: 'Điểm nhấn' };
type Category = keyof typeof categories;
type Item = {
  id: string;
  name: string;
  category: Category;
  art: string;
  price: number;
  color?: string;
  swatch?: string;
};
type Catalog = {
  productId?: string;
  minFlowers: number;
  maxStems: number;
  laborPrice: number;
  items: Item[];
  wraps: { id: string; name: string; price: number }[];
};
export type BouquetSelection = {
  input: BouquetInput;
  productId?: string;
  labels: string[];
  wrap: string;
  estimate: number;
};

const artNames = new Set([
  'rose',
  'gerbera',
  'lily',
  'sunflower',
  'hydrangea',
  'eucalyptus',
  'baby-breath',
]);
const artPath = (name: string) =>
  `/images/bouquet-builder/${artNames.has(name) ? name : 'rose'}.webp`;
const sample: Catalog = {
  minFlowers: 7,
  maxStems: 25,
  laborPrice: 20000,
  items: [
    {
      id: 'gerbera-pink',
      name: 'Đồng tiền',
      color: 'Hồng',
      swatch: '#e789a4',
      price: 14000,
      category: 'flowers',
      art: 'gerbera',
    },
    {
      id: 'gerbera-purple',
      name: 'Đồng tiền',
      color: 'Tím',
      swatch: '#a684bd',
      price: 14000,
      category: 'flowers',
      art: 'gerbera',
    },
    {
      id: 'rose-pink',
      name: 'Hồng sáp',
      color: 'Hồng',
      swatch: '#df8e9d',
      price: 18000,
      category: 'flowers',
      art: 'rose',
    },
    {
      id: 'rose-red',
      name: 'Hồng sáp',
      color: 'Đỏ',
      swatch: '#bd4557',
      price: 18000,
      category: 'flowers',
      art: 'rose',
    },
    {
      id: 'rose-peach',
      name: 'Hồng sáp',
      color: 'Cam',
      swatch: '#e69b66',
      price: 18000,
      category: 'flowers',
      art: 'rose',
    },
    {
      id: 'lily-white',
      name: 'Hoa ly',
      color: 'Trắng',
      swatch: '#fffcf4',
      price: 22000,
      category: 'flowers',
      art: 'lily',
    },
    {
      id: 'lily-pink',
      name: 'Hoa ly',
      color: 'Hồng',
      swatch: '#e98da9',
      price: 22000,
      category: 'flowers',
      art: 'lily',
    },
    {
      id: 'sunflower',
      name: 'Hướng dương',
      color: 'Vàng',
      price: 20000,
      category: 'flowers',
      art: 'sunflower',
    },
    {
      id: 'hydrangea',
      name: 'Cẩm tú cầu',
      color: 'Xanh',
      price: 30000,
      category: 'flowers',
      art: 'hydrangea',
    },
    {
      id: 'spray-rose',
      name: 'Hồng chùm',
      color: 'Cam',
      price: 16000,
      category: 'flowers',
      art: 'rose',
    },
    { id: 'eucalyptus', name: 'Lá bạc', price: 7000, category: 'greenery', art: 'eucalyptus' },
    { id: 'baby-breath', name: 'Hoa baby', price: 8000, category: 'accents', art: 'baby-breath' },
  ],
  wraps: [
    { id: 'classic', name: 'Giấy gói cổ điển', price: 0 },
    { id: 'premium', name: 'Giấy gói cao cấp', price: 20000 },
  ],
};
const example = {
  'gerbera-pink': 1,
  'rose-pink': 1,
  'lily-white': 1,
  sunflower: 1,
  hydrangea: 1,
  'spray-rose': 1,
};
const poses = [
  [50, 65, 7, 46],
  [53, 71, 9, 46],
  [67, 68, 16, 46],
  [58, 63, 8, 49],
  [45, 59, -10, 51],
  [37, 71, -19, 41],
  [45, 72, -10, 45],
  [56, 70, 9, 44],
  [62, 72, 20, 42],
  [35, 70, -23, 39],
];
const artFilter = (item: Item) => {
  if (item.color === 'Đỏ' && item.art === 'rose') return 'saturate(1.65) brightness(.84)';
  if (item.color === 'Cam' && item.art === 'rose') return 'hue-rotate(23deg) saturate(1.35)';
  if (item.color === 'Tím' && item.art === 'gerbera') return 'hue-rotate(-49deg)';
  if (item.color === 'Hồng' && item.art === 'lily')
    return 'sepia(.23) saturate(1.5) hue-rotate(288deg)';
  return undefined;
};

export default function BouquetOrder() {
  const [selection, setSelection] = useState<BouquetSelection | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  return (
    <>
      <BouquetBuilder
        onContinue={(value) => {
          setSelection(value);
          title.current?.focus();
        }}
      />
      <h2 className="x-h2 bouquet-form-title" id="custom-request-form" ref={title} tabIndex={-1}>
        Kể tiệm nghe <span className="x-serif">một chút.</span>
      </h2>
      {selection && (
        <div className="bouquet-request">
          <strong>Bó hoa đã chọn</strong>
          <ul>
            {selection.labels.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>
            {selection.wrap} · {money(selection.estimate)} dự kiến mỗi bó
          </p>
          <button type="button" className="x-textlink" onClick={() => setSelection(null)}>
            Bỏ cấu hình bó
          </button>
        </div>
      )}
      <CustomForm
        key={selection?.productId ?? (selection ? 'preview-bouquet' : 'idea')}
        bouquet={selection}
      />
    </>
  );
}

function BouquetBuilder({ onContinue }: { onContinue: (value: BouquetSelection) => void }) {
  const { mode } = useStore();
  const [remote, setRemote] = useState<{ catalog?: Catalog; error?: string }>({});
  useEffect(() => {
    if (mode !== 'connected') return;
    let active = true;
    storeRequest<Catalog>('custom-orders/bouquet-catalog').then(
      (catalog) => {
        if (active) setRemote({ catalog });
      },
      (error: unknown) => {
        if (active)
          setRemote({
            error: error instanceof Error ? error.message : 'Không tải được bộ phối hoa.',
          });
      },
    );
    return () => {
      active = false;
    };
  }, [mode]);

  const catalog = mode === 'preview' ? sample : remote.catalog;
  if (!catalog)
    return (
      <p className="bouquet-unavailable" role="status">
        {mode === 'unavailable'
          ? 'Bộ phối hoa hiện chưa khả dụng.'
          : (remote.error ?? 'Đang tải bộ phối hoa…')}
      </p>
    );
  return (
    <BouquetStudio
      key={mode}
      catalog={catalog}
      preview={mode === 'preview'}
      onContinue={onContinue}
    />
  );
}

function BouquetStudio({
  catalog,
  preview,
  onContinue,
}: {
  catalog: Catalog;
  preview: boolean;
  onContinue: (value: BouquetSelection) => void;
}) {
  const [amounts, setAmounts] = useState<Record<string, number>>(preview ? example : {});
  const [colors, setColors] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<Category>('flowers');
  const [wrapId, setWrapId] = useState(catalog.wraps[0].id);
  const [layout, setLayout] = useState(0);
  const [offsets, setOffsets] = useState<Record<number, { x: number; y: number }>>({});
  const drag = useRef<{ index: number; x: number; y: number } | null>(null);
  const wrap = catalog.wraps.find((item) => item.id === wrapId)!;
  const selected = catalog.items.filter((item) => amounts[item.id] > 0);
  const count = selected.reduce((sum, item) => sum + amounts[item.id], 0);
  const flowerCount = selected.reduce(
    (sum, item) => sum + (item.category === 'flowers' ? amounts[item.id] : 0),
    0,
  );
  const estimate =
    catalog.laborPrice +
    wrap.price +
    selected.reduce((sum, item) => sum + item.price * amounts[item.id], 0);
  const stems = selected.flatMap((item) => Array<Item>(amounts[item.id]).fill(item));
  const groups = new Map<string, Item[]>();
  for (const item of catalog.items) {
    if (item.category !== category) continue;
    const group = groups.get(item.name);
    if (group) group.push(item);
    else groups.set(item.name, [item]);
  }

  function change(id: string, delta: number) {
    const next = (amounts[id] ?? 0) + delta;
    if (next < 0 || count + delta > catalog.maxStems) return;
    setAmounts({ ...amounts, [id]: next });
    setOffsets({});
  }

  function dragStem(event: PointerEvent<HTMLButtonElement>, index: number) {
    const origin = drag.current;
    if (origin?.index !== index) return;
    const bounds = event.currentTarget.parentElement!.getBoundingClientRect();
    setOffsets({
      ...offsets,
      [index]: {
        x: Math.min(19, Math.max(-19, ((event.clientX - origin.x) * 100) / bounds.width)),
        y: Math.min(20, Math.max(-20, ((event.clientY - origin.y) * 100) / bounds.height)),
      },
    });
  }

  return (
    <>
      <section className="bouquet" aria-labelledby="bouquet-title">
        <header className="bouquet-head">
          <div>
            <h2 id="bouquet-title">Bó hoa của bạn</h2>
            <p>Ít nhất {catalog.minFlowers} bông hoa chính</p>
          </div>
          <div className="bouquet-meter">
            <strong>
              {count} / {catalog.maxStems}
            </strong>
            <div
              role="progressbar"
              aria-label="Số cành và phụ kiện"
              aria-valuenow={count}
              aria-valuemax={catalog.maxStems}
            >
              <i style={{ width: `${(count / catalog.maxStems) * 100}%` }} />
            </div>
          </div>
        </header>
        <div className="bouquet-body">
          <div className="bouquet-stage">
            <div className="bouquet-tools">
              <button
                type="button"
                aria-label="Xáo vị trí hoa"
                title="Xáo vị trí hoa"
                disabled={count < 2}
                onClick={() => {
                  setLayout(layout + 1);
                  setOffsets({});
                }}
              >
                <Shuffle size={17} />
              </button>
              <button
                type="button"
                aria-label="Xóa bó hoa"
                title="Xóa bó hoa"
                disabled={!count}
                onClick={() => {
                  setAmounts({});
                  setColors({});
                  setOffsets({});
                  setLayout(0);
                  setWrapId(catalog.wraps[0].id);
                }}
              >
                <Trash2 size={17} />
              </button>
            </div>
            <label className="bouquet-wrap">
              <Image src="/images/bouquet-builder/wrap.webp" alt="" width={15} height={19} />
              <select
                aria-label="Chọn giấy gói"
                value={wrapId}
                onChange={(event) => setWrapId(event.target.value)}
              >
                {catalog.wraps.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                    {option.price > 0 ? ` (+${money(option.price)})` : ''}
                  </option>
                ))}
              </select>
            </label>
            {count ? (
              <div className="bouquet-art" aria-label="Minh họa bó hoa">
                <Image
                  className="bouquet-paper bouquet-paper-back"
                  src="/images/bouquet-builder/wrap.webp"
                  alt=""
                  width={245}
                  height={290}
                />
                {stems.map((item, index) => {
                  const [x, y, rotation, height] = poses[(index + layout) % poses.length];
                  const offset = offsets[index];
                  return (
                    <button
                      key={`${item.id}-${index}`}
                      type="button"
                      className="bouquet-stem"
                      title={`${item.name}${item.color ? ` · ${item.color}` : ''}`}
                      tabIndex={-1}
                      aria-hidden="true"
                      style={{
                        left: `${x + (offset?.x ?? 0) + (index >= poses.length ? ((index % 5) - 2) * 2 : 0)}%`,
                        top: `${y + (offset?.y ?? 0)}%`,
                        height: `${height}%`,
                        transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
                        filter: artFilter(item),
                      }}
                      onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        drag.current = {
                          index,
                          x:
                            event.clientX -
                            ((offset?.x ?? 0) * event.currentTarget.parentElement!.clientWidth) /
                              100,
                          y:
                            event.clientY -
                            ((offset?.y ?? 0) * event.currentTarget.parentElement!.clientHeight) /
                              100,
                        };
                      }}
                      onPointerMove={(event) => dragStem(event, index)}
                      onLostPointerCapture={() => {
                        drag.current = null;
                      }}
                    >
                      <Image
                        src={artPath(item.art)}
                        alt=""
                        width={245}
                        height={325}
                        draggable={false}
                      />
                    </button>
                  );
                })}
                <Image
                  className="bouquet-paper bouquet-paper-front"
                  src="/images/bouquet-builder/wrap.webp"
                  alt=""
                  width={245}
                  height={290}
                />
              </div>
            ) : (
              <p className="bouquet-empty">Chọn hoa để bắt đầu phối bó của bạn.</p>
            )}
          </div>
          <div className="bouquet-palette">
            <h3>Chọn hoa cho bó</h3>
            <div className="bouquet-tabs" role="group" aria-label="Nhóm vật tư">
              {(Object.keys(categories) as Category[]).map((key) => (
                <button
                  type="button"
                  aria-pressed={key === category}
                  key={key}
                  onClick={() => setCategory(key)}
                >
                  {categories[key]}
                </button>
              ))}
            </div>
            <div className="bouquet-cards" key={category}>
              {[...groups].map(([name, variants]) => {
                const item = variants.find((value) => value.id === colors[name]) ?? variants[0];
                const quantity = amounts[item.id] ?? 0;
                const total = variants.reduce((sum, value) => sum + (amounts[value.id] ?? 0), 0);
                const label = `${name}${item.color ? ` ${item.color}` : ''}`;
                return (
                  <article className="bouquet-card" data-active={total > 0} key={name}>
                    <div className="bouquet-card-head">
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-hidden="true"
                        onClick={() => change(item.id, 1)}
                      >
                        <Image
                          src={artPath(item.art)}
                          width={52}
                          height={76}
                          alt=""
                          style={{ filter: artFilter(item) }}
                        />
                      </button>
                      <div>
                        <h4>{name}</h4>
                        <p>
                          {money(item.price)} · mỗi {category === 'flowers' ? 'bông' : 'cành'}
                        </p>
                      </div>
                      {total > 0 && <span>{total}</span>}
                    </div>
                    {variants.length > 1 && (
                      <div className="bouquet-colors" role="group" aria-label={`Màu ${name}`}>
                        <span>{item.color}</span>
                        <div>
                          {variants.map((value) => (
                            <button
                              type="button"
                              key={value.id}
                              aria-label={`${name} ${value.color}`}
                              aria-pressed={item.id === value.id}
                              style={{ '--swatch': value.swatch ?? '#e6dfdf' } as CSSProperties}
                              onClick={() => setColors({ ...colors, [name]: value.id })}
                            >
                              {item.id === value.id && <Check size={12} />}
                              {amounts[value.id] > 0 && <small>{amounts[value.id]}</small>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="bouquet-quantity">
                      <button
                        type="button"
                        aria-label={`Bớt ${label}`}
                        disabled={!quantity}
                        onClick={() => change(item.id, -1)}
                      >
                        <Minus size={15} />
                      </button>
                      <span>{quantity}</span>
                      <button
                        type="button"
                        aria-label={`Thêm ${label}`}
                        disabled={count >= catalog.maxStems}
                        onClick={() => change(item.id, 1)}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
              {groups.size === 0 && <p>Tiệm chưa có lựa chọn trong nhóm này.</p>}
            </div>
          </div>
        </div>
        <footer className="bouquet-foot">
          <div className="bouquet-summary">
            <div>
              <strong>Còn chỗ cho {catalog.maxStems - count} cành hoặc phụ kiện</strong>
              <small>
                {flowerCount < catalog.minFlowers
                  ? `Chọn thêm ${catalog.minFlowers - flowerCount} bông hoa chính`
                  : `${count} cành và phụ kiện`}
              </small>
            </div>
            <div aria-live="polite">
              <strong>{money(count ? estimate : 0)}</strong>
              <small>Giá dự kiến · gồm {money(catalog.laborPrice)} công bó</small>
            </div>
          </div>
          <div className="bouquet-action">
            <button
              type="button"
              disabled={flowerCount < catalog.minFlowers}
              onClick={() =>
                onContinue({
                  input: {
                    wrapId,
                    lines: selected.map((item) => ({ id: item.id, quantity: amounts[item.id] })),
                  },
                  productId: catalog.productId,
                  wrap: wrap.name,
                  labels: selected.map(
                    (item) =>
                      `${item.name}${item.color ? ` · ${item.color}` : ''} × ${amounts[item.id]}`,
                  ),
                  estimate,
                })
              }
            >
              Tiếp tục với bó này <ArrowRight size={16} />
            </button>
          </div>
        </footer>
      </section>
      <aside className="bouquet-tip">
        <Lightbulb size={20} />
        <div>
          <strong>Gợi ý từ tiệm</strong>
          <p>
            Chọn một loại hoa làm điểm nhấn, rồi thêm vài cành lá để bó hoa có chiều sâu.{' '}
            {preview
              ? 'Hoa và giá trên đây là minh họa.'
              : 'Tiệm sẽ xác nhận vật tư và giá khi báo giá.'}
          </p>
        </div>
      </aside>
    </>
  );
}
