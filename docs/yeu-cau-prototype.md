# Yêu cầu prototype — luồng đặt chỗ workshop

**Mục đích:** danh sách việc cần làm cho prototype, tick dần khi làm.
**Phạm vi:** chỉ phần **luồng và trạng thái** của đặt chỗ workshop. Không gồm backend.
**Chốt ngày:** 26/09/2026 · **Trạng thái:** prototype luồng đã dựng (frontend)

---

## 0. Quyết định đã chốt — không bàn lại

| # | Quyết định | Lý do ngắn |
|---|---|---|
| 1 | **Không bắt đăng nhập** | Đăng nhập không giải quyết rác dữ liệu lẫn no-show, chỉ thêm ma sát |
| 2 | **Định danh bằng SĐT + mã đặt chỗ** | SĐT là kênh chính ở Việt Nam; mã đặt chỗ thay cho tài khoản |
| 3 | **Cọc 30–50% khi đặt** | Đủ chống no-show và lọc rác, không quá cao với vé 450.000–890.000₫ |
| 4 | **Thu phần còn lại TRƯỚC buổi 24 giờ** | Không thu tiền tại check-in — đó là điểm nghẽn vận hành |
| 5 | **Không ghi cơ sở dữ liệu trước khi thanh toán** | `pending` (hết hạn 10 phút) → `confirmed`. Đây là thứ thay thế cho CAPTCHA |
| 6 | **Chính sách huỷ/hoàn hiển thị trước khi thanh toán** | Tránh tranh chấp về sau |
| 7 | **Zalo là kênh song song, không phải thứ phải loại bỏ** | Phần lớn khách Việt sẽ nhắn Zalo thay vì điền form |

---

## 1. Mô hình trạng thái — prototype phải đi qua được cả 6

| Trạng thái | Nghĩa | Đi tới bằng |
|---|---|---|
| `pending` | Đang giữ chỗ, chờ thanh toán. Hết hạn sau 10 phút | Khách gửi form |
| `expired` | Hết hạn giữ chỗ, chỗ được nhả lại | Quá 10 phút không thanh toán |
| `confirmed` | Đã cọc hoặc đã trả đủ | Thanh toán thành công |
| `attended` | Đã tham dự | Sau buổi |
| `no_show` | Không đến — mất cọc | Sau buổi |
| `cancelled` | Khách huỷ — hoàn theo chính sách | Khách huỷ |

> **Hiện trạng:** frontend mô phỏng `pending`, `expired`, `confirmed` và `cancelled` trong luồng khách; `attended` / `no_show` được chọn ở mục đặt chỗ online trong Studio Ops.

---

## 2. Checklist — việc cần thêm vào prototype

### 2.1 Đồng hồ đếm ngược giữ chỗ

- [x] Hiện đồng hồ đếm ngược khi vào trạng thái `pending`
- [x] Có đường đi khi hết hạn: thông báo rõ ràng + nút bắt đầu lại
- [x] Quyết định rõ: hết hạn **trong lúc khách đang điền form** thì **giữ form** (chỉ reset timer khi submit lại)
- **Xong khi:** thử được cả hai đường — thanh toán kịp giờ, và hết hạn

### 2.2 Trạng thái "chỗ vừa bị người khác lấy"

- [x] Mô phỏng được tình huống khách đang điền form thì chỗ bị lấy hết (~8% khi còn ≤2 chỗ)
- [x] Câu thông báo tử tế + gợi ý buổi khác còn chỗ
- **Xong khi:** không lộ lỗi kỹ thuật ra cho khách trong tình huống này

### 2.3 Hiển thị rõ "còn phải trả bao nhiêu"

- [x] Màn hình xác nhận: hiện số đã cọc **và** số còn lại, tách bạch
- [x] Màn hình quản lý đặt chỗ: hiện số còn lại
- [ ] Nội dung tin nhắn Zalo / email: hiện số còn lại + hạn thanh toán *(cần backend)*
- **Xong khi:** hỏi thử một người chưa biết gì, họ nói đúng còn nợ bao nhiêu

### 2.4 Màn hình xác nhận có mã đặt chỗ

- [x] Hiện mã đặt chỗ, dễ đọc lại và dễ chép
- [x] Nói rõ mã dùng để tra cứu / đổi / huỷ
- **Xong khi:** khách biết mã để tra cứu ở đâu

### 2.5 Màn hình "quản lý đặt chỗ"

- [x] Tra cứu bằng **mã đặt chỗ + SĐT**
- [x] Xem được thông tin buổi đặt
- [x] Chọn buổi khác cùng lớp từ danh sách còn đủ chỗ *(dữ liệu demo lưu trong trình duyệt)*
- [x] Huỷ được, có hiện chính sách hoàn tiền
- **Xong khi:** làm được cả 4 việc trên mà không cần tài khoản

### 2.6 Chính sách huỷ và hoàn tiền hiển thị trước khi thanh toán

- [x] Hiện chính sách ở bước form + bước cọc, **trước** nút thanh toán
- [x] Nói rõ: huỷ trước bao lâu thì hoàn bao nhiêu; không đến thì mất gì
- **Xong khi:** khách phải chủ động bỏ qua nó mới tới được nút thanh toán

### 2.7 Trạng thái hết chỗ + danh sách chờ

- [x] Buổi đã đầy: nút chuyển "Hết chỗ" / "Danh sách chờ", không cho bấm "Giữ chỗ"
- [x] Có form danh sách chờ, lưu họ tên + SĐT trong trình duyệt *(chưa gửi thông báo thật)*
- **Xong khi:** buổi đầy vẫn giữ được khách thay vì để họ rời đi

### 2.8 Trạng thái rỗng

- [x] Không có buổi nào sắp tới
- [x] Mọi buổi đều đã qua *(ẩn theo thời gian)*
- **Xong khi:** hai trường hợp này có màn hình riêng, không phải khoảng trắng

### 2.9 Kiểm tra trên mobile

- [x] Form gọn hơn: bỏ ghi chú dài, qty ≤ 4
- [ ] Điền hết form trên màn hình 375px không phải cuộn quá nhiều *(cần test người thật)*
- [x] `inputmode` cho SĐT / số người
- [ ] Đồng hồ đếm ngược vẫn thấy được khi đang điền *(sticky bar flow)*
- **Xong khi:** làm xong một lượt đặt chỗ trên điện thoại thật

---

## 3. Những thứ KHÔNG thêm vào prototype

- [ ] ~~Luồng đăng nhập~~ — đã chốt bỏ, đừng dựng để rồi phân vân lại
- [ ] ~~Cổng thanh toán thật~~ — dùng stub, ví dụ nút "Đã chuyển khoản" giả
- [ ] ~~Logic chống bot~~ — không quan sát được ở prototype, không ảnh hưởng thiết kế luồng
- [ ] ~~Trang quản trị~~ — vài buổi mỗi tháng thì chưa cần
- [ ] ~~Lưu trữ thật / đồng bộ nhiều thiết bị~~ — chỉ tạo nhiễu

---

## 4. Cách kiểm thử prototype

- [ ] Cho **3–5 người** thử, **không hướng dẫn trước**. Im lặng và quan sát.
- [ ] Ghi lại: họ **khựng lại ở bước nào**?
- [ ] Kiểm tra họ có hiểu **"giữ chỗ 10 phút"** nghĩa là gì
- [ ] Kiểm tra họ có hiểu **vẫn còn nợ tiền** sau khi trả cọc
- [ ] Đếm số bước từ lúc vào trang tới lúc xong. Quá 5 bước thì cắt.
- **Xong khi:** có ghi chú từ ít nhất 3 người thử

---

## 5. Việc sửa ngay ở form hiện tại

Không phải việc của prototype, nhưng nên sửa sớm vì đang sai:

| # | Vấn đề | Vị trí | Sửa thành | Trạng thái |
|---|---|---|---|---|
| 1 | Ô số người cho tối đa **10** | `workshop.html` `max="10"` | Hạ xuống **4** | **done** |
| 2 | Kiểm chỗ chạy hoàn toàn ở trình duyệt | `workshop.js` | Chuyển sang server | *backend* |
| 3 | Chưa có trạng thái nào | `workshop.js` / `booking.js` | Thêm `pending` → `confirmed` / `expired` | **done** |
| 4 | Chưa có ô bẫy bot | `workshop.html` | Thêm honeypot + thời gian điền form | **done** |
| 5 | Một SĐT có thể giữ nhiều chỗ cùng buổi | `workshop.js` | Chặn trùng theo SĐT | **done** |
| 6 | Email không bắt buộc | form | Giữ optional ở giữ chỗ; thu lại khi xác nhận | **done** (optional) |

---

## 6. Điều prototype KHÔNG trả lời được

Đừng mất thời gian cố trả lời bằng prototype — cần dữ liệu thật:

- Tỷ lệ no-show thực tế → đo trong 4–6 buổi đầu
- Mức cọc bao nhiêu là đúng
- Bot có thật sự tấn công không
- Tỷ lệ chuyển đổi

---

## 7. Việc để lại cho backend (không làm ở prototype)

- Kiểm chỗ trong một transaction ở server
- Webhook xác nhận thanh toán
- Tự động nhả chỗ `pending` quá hạn
- Gửi email / Zalo xác nhận và nhắc trước 24 giờ
- Chống trùng theo SĐT, giới hạn tần suất theo IP
- Dọn dữ liệu thử nghiệm

---

## Thứ tự làm đề xuất

1. **2.1** đồng hồ đếm ngược + hết hạn — cốt lõi, làm trước
2. **2.3** hiển thị số còn lại — rủi ro hiểu nhầm cao nhất
3. **2.5** quản lý đặt chỗ — để yên tâm bỏ đăng nhập
4. **2.2** chỗ bị lấy mất
5. **2.4**, **2.6**, **2.7**, **2.8**, **2.9**
6. Mục **5** — sửa form hiện tại
