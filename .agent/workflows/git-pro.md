---
description: Professional Git Workflow & Tech Lead Protocol (thai-dev -> main)
---

# Professional Git Workflow (PM Review Mode)

> **MANDATORY**: Workflow này yêu cầu sự can thiệp của PM (User) ở mỗi giai đoạn quan trọng. Tuyệt đối không được "tự tiện" push code nếu chưa qua bước Review.

## ĐIỀU KIỆN TIÊN QUYẾT
- Đã đọc kỹ `SKILL.md` của `git-pro`.
- Đảm bảo môi trường làm việc sạch sẽ (không có file rác).

## CÁC BƯỚC THỰC HIỆN

### 1. Audit Trạng Thái (Silent Audit)
Chạy lệnh `git status` và `git diff --stat` để xác định danh sách file thay đổi.
**Yêu cầu**: Phải báo cáo tóm tắt cho PM biết mình định commit những gì.

### 2. Chuẩn Bị & Đồng Bộ (Sync origin)
Chạy `git fetch origin` và kiểm tra sự khác biệt giữa local và remote.
- Nếu remote có thay đổi mới: `git pull --rebase origin <current_branch>`.
- **Nếu có Conflict**: Dừng lại ngay! Thực hiện quy trình xử lý Conflict (Socratic resolution).

### 3. Staging & Committing (Conventional Syntax)
Sử dụng `git add .` (hoặc add từng file) và commit với format:
`type(scope): description`
- Ví dụ: `feat(api): implement system-wide api error propagation`

### 4. Review & Merge (PM Review Gate)
Trước khi merge vào `main` hoặc push lên remote:
- Chạy `git diff main..<current_branch>` để liệt kê các thay đổi so với main.
- **BẮT BUỘC**: Sử dụng `notify_user` để gửi danh sách file thay đổi kèm tóm tắt nội dung cho PM duyệt.

### 5. Hoàn Tất & Delivery
Sau khi PM nhấn Approve (hoặc hạ lệnh Proceed):
- Merge vào `main` (nếu cần).
- `git push origin mail` (hoặc branch đích).
- Update `active_context.md`.

## XỬ LÝ MERGE CONFLICT (Tech Lead Protocol)
1. **Identify**: Chỉ ra file nào bị conflict.
2. **Explain**: Giải thích tại sao (vd: upstream thay đổi logic ở cùng 1 dòng).
3. **Propose**: Đề xuất phương án Resolve (Keep Current / Keep Incoming / Custom merge).
4. **Action**: Chỉ thực hiện khi User đã "OK" phương án đó.
