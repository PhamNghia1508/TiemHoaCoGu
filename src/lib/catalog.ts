export type Product = {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  backendId?: string;
  isCustomizable?: boolean;
  isPreOrder?: boolean;
  quantityAvailable?: number;
  images?: string[];
  imageIsFallback?: boolean;
  price: number;
  image: string;
  alternate: string;
  palette: string[];
  description: string;
  tag?: string;
};
export const products: Product[] = [
  {
    id: 'trang-non',
    name: 'Trăng Non',
    subtitle: 'Bó hoa sáp · Kem & hồng phấn',
    category: 'bo',
    price: 420000,
    image: '/images/prod-bouquet.webp',
    alternate: '/images/hero-wax.webp',
    palette: ['#e9d9bd', '#d9afa0', '#8f9b85'],
    tag: 'Gu dịu dàng',
    description:
      'Một chút hồng phấn, một chút kem ấm. Trăng Non là lời thương nhẹ nhàng được gói trong giấy kraft, buộc bằng chiếc nơ linen mộc mạc. Một bó hoa không cần rực rỡ để được nhớ lâu.',
  },
  {
    id: 'suong-som',
    name: 'Sương Sớm',
    subtitle: 'Lọ hoa sáp · Trắng & vàng nhạt',
    category: 'lo',
    price: 289000,
    image: '/images/prod-jar.webp',
    alternate: '/images/ws-studio.webp',
    palette: ['#eee9d5', '#d4bf84', '#9b9c80'],
    tag: 'Một góc bình yên',
    description:
      'Đặt một chút bình yên lên bàn làm việc. Những cánh hoa sáp trắng và vàng nhạt trong chiếc lọ nhỏ, đủ để làm buổi sáng trở nên dễ chịu hơn.',
  },
  {
    id: 'kit-co-ban',
    name: 'Một Chút Khéo',
    subtitle: 'Bộ DIY · Tự tay làm hoa',
    category: 'diy',
    price: 350000,
    image: '/images/prod-kit.webp',
    alternate: '/images/workshop-hands.webp',
    palette: ['#d5bd9b', '#e5d6c3', '#a9ae91'],
    tag: 'Dành cho đôi tay',
    description:
      'Một hộp nguyên liệu để bạn tạm rời màn hình và trở về với đôi tay. Bộ dụng cụ cơ bản để bắt đầu những bông hoa sáp đầu tiên, theo nhịp riêng của mình.',
  },
  {
    id: 'anh-trang',
    name: 'Ánh Trăng',
    subtitle: 'Bó hoa sáp · Phiên bản lớn',
    category: 'bo',
    price: 560000,
    image: '/images/hero-wax.webp',
    alternate: '/images/prod-bouquet.webp',
    palette: ['#eadfc7', '#c6a18e', '#8d9a86'],
    tag: 'Gửi lời thương',
    description:
      'Phiên bản đầy đặn hơn của bảng màu kem và hồng dịu. Một món quà cho những dịp bạn muốn nói nhiều hơn một lời cảm ơn, kèm chỗ dành cho lời nhắn của riêng mình.',
  },
  {
    id: 'nen-hoa',
    name: 'Nắng Trong Nhà',
    subtitle: 'Nến hình hoa · Góc nhỏ thư giãn',
    category: 'lo',
    price: 199000,
    image: '/images/prod-candle.webp',
    alternate: '/images/note-rose.webp',
    palette: ['#e8dcc4', '#d9b9a5', '#a6a287'],
    description:
      'Một bông hoa nhỏ cho khoảng nghỉ của ngày. Nến hình hoa mang nét mềm mại đến góc đọc sách hay chiếc bàn đầu giường. Luôn đặt nến trên đế chịu nhiệt và không để nến cháy khi không có người trông.',
  },
  {
    id: 'hop-qua',
    name: 'Gói Ghém',
    subtitle: 'Hộp quà · Nơ & thiệp',
    category: 'diy',
    price: 89000,
    image: '/images/prod-gift.webp',
    alternate: '/images/prod-kit.webp',
    palette: ['#b69976', '#e9dec8', '#a3a285'],
    description:
      'Phần cuối cùng của một món quà được nghĩ đến cẩn thận: chiếc hộp, sợi nơ và khoảng trống trên tấm thiệp dành cho bạn.',
  },
];
export const categories = [
  { id: 'all', label: 'Tất cả' },
  { id: 'bo', label: 'Bó hoa sáp' },
  { id: 'lo', label: 'Hoa & góc nhỏ' },
  { id: 'diy', label: 'Quà & DIY' },
];
export const money = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
export const articles = [
  {
    slug: 'giu-mot-mua-hoa',
    title: 'Giữ một mùa hoa, lâu hơn một mùa.',
    category: 'CHĂM HOA',
    image: '/images/note-rose.webp',
    excerpt: 'Vài điều nhỏ để những cánh hoa sáp luôn giữ được vẻ dịu dàng ban đầu.',
    paragraphs: [
      'Hoa sáp thích những góc khô ráo, thoáng mát và tránh ánh nắng trực tiếp. Một chiếc kệ cạnh bàn làm việc, không quá gần cửa sổ, thường là lựa chọn dễ chịu.',
      'Đừng tưới nước cho hoa sáp. Nếu hoa bám bụi, dùng cọ mềm hoặc khăn khô và làm thật nhẹ tay. Tránh dùng chất tẩy rửa, cồn hay hơi nóng để làm sạch.',
      'Nhiệt độ cao có thể làm cánh hoa biến dạng. Hãy giữ hoa xa bếp, đèn tỏa nhiệt và không để trong ô tô đóng kín. Mỗi chất liệu có thể có cách chăm riêng; luôn ưu tiên hướng dẫn đi kèm sản phẩm.',
    ],
  },
  {
    slug: 'mon-qua-co-gu',
    title: 'Một món quà có gu, bắt đầu từ sự để ý.',
    category: 'CHUYỆN TẶNG QUÀ',
    image: '/images/prod-bouquet.webp',
    excerpt: 'Không phải bó hoa to nhất. Là bó hoa khiến người nhận thấy mình được hiểu.',
    paragraphs: [
      'Trước khi chọn màu hoa, thử nghĩ đến người sẽ nhận nó. Họ thích một góc nhà rực rỡ hay những sắc độ trầm? Họ thường chọn áo màu gì? Những điều rất nhỏ ấy giúp một món quà trở nên riêng.',
      'Đừng để tấm thiệp trở thành phần làm cho xong. Một câu nhắc về kỷ niệm chung thường đáng nhớ hơn một lời chúc hoàn hảo. Bạn có thể bắt đầu bằng: “Mình nhớ hôm…”',
      'Và đôi khi, không cần đợi một dịp đặc biệt. Một món quà nhỏ giữa ngày bình thường cũng là một cách nói: mình có nghĩ đến bạn.',
    ],
  },
  {
    slug: 'mot-buoi-chieu-cham',
    title: 'Cho đôi tay bận. Cho tâm trí nghỉ.',
    category: 'Ở XƯỞNG',
    image: '/images/workshop-hands.webp',
    excerpt: 'Vì sao việc làm một bông hoa có thể khiến một buổi chiều khác đi.',
    paragraphs: [
      'Có những buổi chiều, điều ta cần không phải làm thêm nhiều việc, mà là làm một việc thật chậm. Nắn một cánh hoa, chọn một màu sắc, buộc một chiếc nơ.',
      'Ở xưởng, không có bông hoa nào bắt buộc phải giống mẫu. Một cánh hơi cong hay một bó hơi lệch đều là dấu vết của người làm ra nó.',
      'Bạn không cần khéo tay để bắt đầu. Chỉ cần dành ra một khoảng thời gian, bỏ điện thoại xuống, và thử. Phần còn lại, cứ để đôi tay học dần.',
    ],
  },
];
