import { PageIntro } from '@/components/site';
export const metadata = { title: 'Chính sách & riêng tư' };
export default function PolicyPage() {
  const connected = Boolean(process.env.API_BASE_URL);
  return (
    <>
      <PageIntro
        eyebrow="MINH BẠCH & DỄ HIỂU"
        title={<>Chính sách & riêng tư.</>}
        description="Nói rõ dữ liệu được dùng ở đâu và những dịch vụ chưa được mở. Điều khoản bán hàng chính thức cần được chủ tiệm xác nhận trước khi mở bán."
      />
      <section className="section narrow-page article-body">
        <h2>Trạng thái hiện tại</h2>
        <p>
          {connected
            ? 'Website đã được cấu hình kết nối API. Danh mục và trạng thái tài khoản được lấy từ backend; nếu mất kết nối, website thông báo lỗi thay vì thay bằng dữ liệu mẫu. Đây chưa phải cửa hàng production đã mở bán.'
            : 'Tiệm Hoa Có Gu hiện là bản trải nghiệm. Website chưa nhận đơn thật, chưa có thanh toán và chưa tạo nghĩa vụ mua bán. Giá và nội dung mẫu không phải xác nhận bán hàng.'}
        </p>
        <p>
          Thanh toán, giao vận và email/SMS từ nhà cung cấp thật chưa được tích hợp. Tạo yêu cầu,
          đơn chờ xử lý hoặc giữ chỗ trong môi trường kiểm thử không có nghĩa là đã thanh toán, đã
          giao hoa hoặc đã có vé xác nhận.
        </p>
        <h2>Dữ liệu trên thiết bị</h2>
        <p>
          Giỏ hàng và yêu thích chỉ lưu mã sản phẩm và số lượng trong localStorage. Không lưu mật
          khẩu, token đăng nhập, địa chỉ hay số điện thoại vào localStorage. Bạn có thể xóa dữ liệu
          này trong cài đặt dữ liệu trang web của trình duyệt.
        </p>
        <h2>Tài khoản và các form</h2>
        <p>
          {connected
            ? 'Khi bạn đăng ký, đăng nhập hoặc chủ động gửi form ở chế độ API, thông tin cần thiết được gửi đến máy chủ và có thể được lưu trong tài khoản: tên, email, số điện thoại, địa chỉ, lời nhắn và lịch sử yêu cầu. Cookie phiên đăng nhập có thuộc tính HttpOnly để mã JavaScript trên trang không đọc được token. Đăng xuất xóa cookie của trình duyệt và thu hồi phiên theo khả năng backend.'
            : 'Trong chế độ xem trước, thông tin ở form đặt riêng, checkout và workshop chỉ nằm trong bộ nhớ trang để bạn kiểm tra; không được gửi hoặc lưu máy chủ. Tính năng tài khoản chỉ hoạt động sau khi API được cấu hình.'}
        </p>
        <p>
          Không nhập dữ liệu nhạy cảm không cần thiết trong lời nhắn hoặc ảnh tham khảo. Tra cứu đơn
          và đặt chỗ yêu cầu đăng nhập; không công khai lịch sử khách bằng mã đơn và số điện thoại.
        </p>
        <h2>Trước khi mở bán</h2>
        <p>
          Chủ tiệm cần công bố phương thức thanh toán, phí và phạm vi giao hàng, điều kiện đổi hoàn,
          thời hạn xử lý, địa chỉ liên hệ và quy trình yêu cầu xóa dữ liệu. Website hiện chưa cam
          kết các điều kiện này. Luôn đọc trạng thái và thông báo tại từng bước, không coi dữ liệu
          kiểm thử là xác nhận mua bán thật.
        </p>
      </section>
    </>
  );
}
