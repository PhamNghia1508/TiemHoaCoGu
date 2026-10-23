import { PageIntro, SectionHeading } from '@/components/site';

export const metadata = {
  title: 'Chính sách & riêng tư',
  description:
    'Thông tin minh bạch về bản trải nghiệm Tiệm Hoa Có Gu và những chính sách đang chờ xác nhận.',
};
export default function PolicyPage() {
  return (
    <>
      <PageIntro
        eyebrow="MINH BẠCH & DỄ HIỂU"
        title={
          <>
            Chính sách của
            <br />
            <em>một bản trải nghiệm.</em>
          </>
        }
        description="Trang này nói rõ những gì đang có và những gì chưa được mở. Các điều khoản chính thức sẽ được cập nhật sau khi chủ tiệm xác nhận."
      />
      <section className="section narrow-page">
        <SectionHeading
          number="01"
          eyebrow="TRẠNG THÁI HIỆN TẠI"
          title={
            <>
              Chưa nhận đơn
              <br />
              <em>thật.</em>
            </>
          }
        />
        <div className="article-body">
          <p>
            <strong>Tiệm Hoa Có Gu / SÁPA Studio hiện là bản trải nghiệm.</strong> Website chưa nhận
            đơn thật, chưa có thanh toán và chưa tạo nghĩa vụ mua bán. Các nút giỏ hàng và yêu thích
            chỉ giúp bạn thử luồng trải nghiệm.
          </p>
          <p>
            Dữ liệu giỏ hàng và danh sách yêu thích được lưu trong <strong>localStorage</strong> của
            trình duyệt đang sử dụng. Bạn có thể xóa dữ liệu này bằng cách xóa dữ liệu trang web
            trong trình duyệt. Tiệm không dùng bản trải nghiệm này để xác nhận đơn hàng.
          </p>
        </div>
        <SectionHeading
          number="02"
          eyebrow="ĐANG CHỜ CHỦ TIỆM XÁC NHẬN"
          title={
            <>
              Những điều sẽ
              <br />
              <em>được viết rõ sau.</em>
            </>
          }
        />
        <div className="article-body">
          <p>
            Thông tin chính thức về phương thức đặt hàng, giao hàng, phí giao hàng, đổi hoặc hoàn
            sản phẩm, bảo quản và địa chỉ liên hệ chưa được công bố trên bản trải nghiệm này.
          </p>
          <p>
            Vì vậy, tiệm chưa cam kết thời hạn giao, điều kiện đổi hoàn, phạm vi phục vụ, địa chỉ
            hay số điện thoại cụ thể. Vui lòng không xem các nội dung mẫu, giá hiển thị hoặc luồng
            thử là xác nhận bán hàng.
          </p>
        </div>
        <SectionHeading
          number="03"
          eyebrow="RIÊNG TƯ"
          title={
            <>
              Bạn luôn biết
              <br />
              <em>mình đang chia sẻ gì.</em>
            </>
          }
        />
        <div className="article-body">
          <p>
            Bản trải nghiệm không yêu cầu bạn nhập thông tin cá nhân để xem nội dung. Tên, số điện
            thoại, địa chỉ và lời nhắn bạn nhập vào form chỉ tồn tại trong bộ nhớ của trang để xem
            trước; không được gửi lên máy chủ hoặc lưu vào localStorage. Chỉ mã sản phẩm, số lượng
            trong giỏ và danh sách yêu thích được lưu trên thiết bị.
          </p>
        </div>
      </section>
    </>
  );
}
