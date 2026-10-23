import { PageIntro, SectionHeading } from '@/components/site';

export const metadata = {
  title: 'Hỏi đáp',
  description:
    'Giải đáp những câu hỏi thường gặp về hoa sáp, chăm hoa và trải nghiệm tại Tiệm Hoa Có Gu.',
};
const questions = [
  {
    q: 'Hoa sáp có cần tưới nước không?',
    a: 'Không. Hoa sáp nên được giữ ở nơi khô ráo, thoáng mát và tránh ánh nắng trực tiếp. Khi bám bụi, bạn có thể dùng cọ mềm hoặc khăn khô thật nhẹ tay.',
  },
  {
    q: 'Hoa sáp giữ được bao lâu?',
    a: 'Độ bền phụ thuộc vào chất liệu và cách bảo quản. Tránh nhiệt độ cao, hơi nóng, nước và ánh nắng trực tiếp; ưu tiên hướng dẫn đi kèm từng sản phẩm.',
  },
  {
    q: 'Tôi có thể nhờ tiệm làm một bó riêng không?',
    a: 'Tiệm có thể cùng bạn trao đổi về màu sắc, kiểu dáng và lời nhắn. Hãy gửi mong muốn qua kênh liên hệ của tiệm để được xác nhận khả năng thực hiện.',
  },
  {
    q: 'Workshop có phù hợp với người mới bắt đầu?',
    a: 'Có. Bạn không cần khéo tay để bắt đầu; workshop được thiết kế như một khoảng thời gian làm chậm và thử bằng đôi tay.',
  },
  {
    q: 'Tôi có thể đổi hoặc hoàn sản phẩm không?',
    a: 'Chính sách giao hàng, đổi và hoàn vẫn đang được chủ tiệm xác nhận trước khi ra mắt chính thức. Vui lòng xem trang Chính sách để biết trạng thái mới nhất.',
  },
  {
    q: 'Đây có phải là website nhận đơn thật không?',
    a: 'Chưa. Đây là bản trải nghiệm; giỏ hàng và yêu thích chỉ lưu trong localStorage của trình duyệt, chưa có thanh toán hay quy trình nhận đơn thật.',
  },
];
export default function FAQPage() {
  return (
    <>
      <PageIntro
        eyebrow="MÌNH CÙNG GỠ RỐI"
        title={
          <>
            Hỏi một chút.
            <br />
            <em>Để hoa kể tiếp.</em>
          </>
        }
        description="Những câu hỏi thường gặp về hoa sáp, workshop và trải nghiệm thử của tiệm."
      />
      <section className="section narrow-page">
        <SectionHeading
          number="01"
          eyebrow="CÂU HỎI THƯỜNG GẶP"
          title={
            <>
              Bạn muốn biết <em>điều gì?</em>
            </>
          }
        />
        <div className="accordion">
          {questions.map((item) => (
            <details key={item.q}>
              <summary>
                {item.q}
                <span>+</span>
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
