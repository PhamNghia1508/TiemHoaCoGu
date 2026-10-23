import type { Metadata } from 'next';
import { PageIntro, SectionHeading } from '@/components/site';

export const metadata: Metadata = {
  title: 'Hỏi đáp',
  description: 'Giải đáp rõ ràng về hoa sáp, workshop và bản trải nghiệm của Tiệm Hoa Có Gu.',
};
const previewGroups = [
  {
    label: 'HOA SÁP / CHĂM HOA',
    items: [
      [
        'Hoa sáp có cần tưới nước không?',
        'Không. Giữ hoa ở nơi khô ráo, thoáng mát và tránh nắng trực tiếp. Khi bám bụi, dùng cọ mềm hoặc khăn khô thật nhẹ tay.',
      ],
      [
        'Hoa sáp giữ được bao lâu?',
        'Độ bền phụ thuộc vào chất liệu và cách bảo quản. Tránh nhiệt độ cao, hơi nóng, nước và ánh nắng trực tiếp; ưu tiên hướng dẫn đi kèm từng sản phẩm.',
      ],
    ],
  },
  {
    label: 'WORKSHOP / TRẢI NGHIỆM',
    items: [
      [
        'Workshop có phù hợp với người mới bắt đầu?',
        'Có. Hai trải nghiệm được mô tả cho người mới: Hoa Sáp Cơ Bản và Bó Quà Tặng. Bạn không cần khéo tay; tiệm hướng dẫn từng phần.',
      ],
      [
        'Lịch workshop đã mở chưa?',
        'Chưa. Lịch chưa mở, nên chưa có ngày, số chỗ hay mã đặt chỗ thật. Form hiện tại chỉ cho bạn xem trước mong muốn ngay trên trình duyệt.',
      ],
      [
        'Thời lượng và giá workshop có phải giá chính thức không?',
        'Chưa. 2,5 giờ / 450.000 ₫ và 3 giờ / 690.000 ₫ là thông tin tham khảo kế thừa từ bản trải nghiệm. Điều kiện chính thức sẽ được xác nhận khi lịch thật mở.',
      ],
    ],
  },
  {
    label: 'ĐẶT RIÊNG / BẢN PREVIEW',
    items: [
      [
        'Tôi có thể nhờ tiệm làm một bó riêng không?',
        'Bạn có thể phác ý tưởng ở trang Hoa theo ý bạn. Bản hiện tại chưa nhận yêu cầu thật; khi quy trình mở, tiệm sẽ trao đổi màu sắc, kiểu dáng và báo giá trước khi bắt đầu.',
      ],
      [
        'Thông tin tôi nhập vào form đi đâu?',
        'Không đi đâu cả. Form chỉ tạo bản nháp trong trình duyệt, chưa gửi đến tiệm và chưa lưu trên máy chủ.',
      ],
      [
        'Website đã nhận đơn hoặc thanh toán chưa?',
        'Chưa. Đây là bản trải nghiệm; không có giao dịch, thanh toán, giữ chỗ hay cam kết hoàn thiện thật.',
      ],
    ],
  },
];
const connectedGroups = [
  previewGroups[0],
  {
    label: 'TÀI KHOẢN / API',
    items: [
      [
        'Dữ liệu nào được lấy từ hệ thống?',
        'Danh mục, sản phẩm, workshop và các ca học lấy từ backend. Nếu mất kết nối, trang báo lỗi thay vì hiển thị mẫu như dữ liệu thật.',
      ],
      [
        'Thông tin nhập vào form đi đâu?',
        'Đăng ký, đăng nhập và gửi yêu cầu ở chế độ API sẽ gửi dữ liệu cần thiết đến máy chủ. Giỏ và yêu thích lưu mã sản phẩm trên trình duyệt; mật khẩu, token và địa chỉ không lưu vào localStorage.',
      ],
      [
        'Làm sao xem lại yêu cầu?',
        'Đăng nhập rồi mở Tra cứu để xem các đơn, yêu cầu đặt riêng và giữ chỗ thuộc tài khoản của bạn. Không tra cứu công khai bằng mã và số điện thoại.',
      ],
    ],
  },
  {
    label: 'TRẠNG THÁI / CHƯA MỞ BÁN',
    items: [
      [
        'Website đã nhận thanh toán thật chưa?',
        'Chưa. Provider thanh toán, giao vận và email/SMS thật chưa được nối. Đây là môi trường tích hợp; chưa mở bán production.',
      ],
      [
        'Giữ chỗ workshop có phải đã mua vé?',
        'Không. API trả thời hạn giữ chỗ và trạng thái; giữ chỗ chưa phải xác nhận thanh toán. Chỉ chọn ca từ lịch backend, không phải ngày tự nhập.',
      ],
      [
        'Gửi yêu cầu đặt riêng có phải đã đặt hoa?',
        'Không. Tiệm cần phát hành báo giá có phiên bản và hạn duyệt. Chỉ duyệt báo giá hiện hành của chính bạn; tạo đơn chờ xử lý không có nghĩa là đã trả tiền hay bắt đầu làm.',
      ],
      [
        'Vì sao chưa thể tạo đơn?',
        'Thao tác ghi có thể đang bị tắt bởi cấu hình máy chủ; checkout cần báo phí giao hàng hợp lệ từ backend. Nếu provider chưa sẵn sàng, hệ thống sẽ báo lỗi, không tự đặt phí giao bằng 0.',
      ],
    ],
  },
];
export default function FAQPage() {
  const groups = process.env.API_BASE_URL ? connectedGroups : previewGroups;
  return (
    <div className="studio-shell">
      <PageIntro
        eyebrow="HỎI ĐÁP / NÓI RÕ TỪ ĐẦU"
        title={
          <>
            Có gì chưa rõ? <br />
            Mình gỡ từng nút.
          </>
        }
        description="Câu trả lời ngắn, trạng thái thật — về chăm hoa, workshop và các form xem trước của tiệm."
      />
      <section className="studio-block" aria-labelledby="faq-title">
        <SectionHeading
          number="01"
          eyebrow="CÂU HỎI THƯỜNG GẶP"
          title={
            <>
              Không giấu phần <br />
              chưa sẵn sàng.
            </>
          }
        />
        <div className="studio-faq" id="faq-title">
          {groups.map((group) => (
            <section key={group.label} aria-labelledby={`faq-${group.label}`}>
              <h2 className="eyebrow" id={`faq-${group.label}`}>
                {group.label}
              </h2>
              {group.items.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
