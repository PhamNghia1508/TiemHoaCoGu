import type { Metadata } from 'next';
import { PageIntro, SectionHeading } from '@/components/site';

export const metadata: Metadata = {
  title: 'Hỏi đáp',
  description: 'Giải đáp rõ ràng về hoa sáp, workshop và bản trải nghiệm của Tiệm Hoa Có Gu.',
};
const groups = [
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
export default function FAQPage() {
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
