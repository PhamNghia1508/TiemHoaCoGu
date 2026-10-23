import Image from 'next/image';
import { ArrowLink, FlowerMark, PageIntro, SectionHeading } from '@/components/site';

export const metadata = {
  title: 'Câu chuyện của tiệm',
  description:
    'Câu chuyện về Tiệm Hoa Có Gu và SÁPA Studio — nơi những bông hoa sáp được làm chậm bằng đôi tay.',
};

export default function StoryPage() {
  return (
    <>
      <PageIntro
        eyebrow="CÂU CHUYỆN CỦA TIỆM"
        title={
          <>
            Một tiệm hoa chọn
            <br />
            <em>làm mọi thứ thật chậm.</em>
          </>
        }
        description="Tiệm Hoa Có Gu / SÁPA Studio bắt đầu từ tình yêu với những điều được làm bằng tay — một cánh hoa, một chiếc nơ, một món quà có người nhận cụ thể."
      />
      <section className="editorial-split section">
        <div className="editorial-photo">
          <Image
            src="/images/workshop-hands.webp"
            alt="Đôi tay đang làm hoa sáp tại xưởng"
            fill
            sizes="(max-width: 800px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="editorial-copy">
          <span className="eyebrow">01 / BẮT ĐẦU TỪ ĐÔI TAY</span>
          <h2>
            Giữa những điều chóng qua, tiệm chọn làm ra <em>một điều ở lại.</em>
          </h2>
          <p>
            Mỗi bông hoa sáp là một khoảng thời gian được giữ lại: lúc chọn màu, nắn cánh, sắp từng
            nhành hoa và buộc sợi ruy-băng cuối cùng.
          </p>
          <p>
            Tiệm tin món quà đẹp không nhất thiết phải thật lớn. Nó cần vừa vặn với người nhận, và
            đủ chân thành để nói thay những điều đôi khi ta chưa biết nói thế nào.
          </p>
          <ArrowLink href="/cua-tiem">Ghé cửa tiệm</ArrowLink>
        </div>
      </section>
      <section className="section story-section">
        <SectionHeading
          number="02"
          eyebrow="SÁPA STUDIO"
          title={
            <>
              Một góc nhỏ cho
              <br />
              <em>những điều có gu.</em>
            </>
          }
        />
        <div className="story-detail">
          <p>
            SÁPA Studio là tên gọi của phần xưởng phía sau Tiệm Hoa Có Gu — nơi những ý tưởng được
            thử bằng chất liệu, màu sắc và đôi tay. Ở đây, không có hai bông hoa thủ công hoàn toàn
            giống nhau; mỗi khác biệt nhỏ là dấu vết của người làm.
          </p>
          <p>
            Tiệm làm hoa sáp để những lời thương có thêm hình dáng, và để bạn có thể tặng một điều
            dịu dàng vào bất kỳ ngày nào.
          </p>
        </div>
      </section>
      <section className="editorial-split section">
        <div className="editorial-copy">
          <span className="eyebrow">03 / MỘT LỜI MỜI</span>
          <h2>
            Đến với tiệm bằng <em>sự tò mò.</em>
          </h2>
          <p>
            Có thể là một bó hoa, một bộ DIY, hoặc một buổi chiều tự tay làm điều gì đó. Bạn không
            cần biết trước mình sẽ làm thật khéo — chỉ cần bắt đầu.
          </p>
          <ArrowLink href="/workshop">Hẹn một buổi ở xưởng</ArrowLink>
        </div>
        <div className="editorial-photo">
          <Image
            src="/images/hero-wax.webp"
            alt="Bó hoa sáp thủ công trong ánh sáng dịu"
            fill
            sizes="(max-width: 800px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
      </section>
      <div className="closing-note">
        <FlowerMark />
        <p>
          Hoa không vội.
          <br />
          <em>Lời thương cũng thế.</em>
        </p>
        <ArrowLink href="/chuyen-cua-hoa">Đọc chuyện của hoa</ArrowLink>
      </div>
    </>
  );
}
