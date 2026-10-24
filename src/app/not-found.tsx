import Link from 'next/link';
import { FlowerMark, PageIntro } from '@/components/site';
export default function NotFound() {
  return (
    <section className="error-page">
      <FlowerMark />
      <PageIntro
        eyebrow="MỘT GÓC CHƯA CÓ HOA"
        title={
          <>
            Trang này đang
            <br />
            <em>đi lạc một chút.</em>
          </>
        }
        description="Có thể đường dẫn đã đổi, hoặc câu chuyện này chưa được viết. Mình cùng quay về từ đầu nhé."
      />
      <Link href="/" className="button">
        Về trang chủ
      </Link>
    </section>
  );
}
