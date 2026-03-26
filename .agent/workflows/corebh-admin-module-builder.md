---
description: Build a CoreBH admin module end-to-end from UI/UX through API config, reusing shipped CRUD and complex-form patterns.
---

# /corebh-admin-module-builder

Workflow này dùng cho các yêu cầu tạo mới hoặc mở rộng màn quản lý trong CoreBH.

## Mục tiêu

- Phân tích đúng pattern màn hình
- Lên plan file-by-file
- Thiết kế UI/UX theo chuẩn admin hiện tại
- Nối đầy đủ type, action-code, route, client API, hook, modal, table, page
- Xác thực và cập nhật project memory sau khi hoàn tất

## Input tối thiểu

1. Tên màn hình và route slug
2. Loại màn:
   - CRUD thường
   - CRUD theo ngày hiệu lực
   - master-detail
   - form nhiều tab
3. Procedure + action code cho list, detail, save, toggle/delete
4. Payload/response mẫu
5. Danh sách cột, filter, field form, lookup phụ thuộc

## Rule

- Ưu tiên dùng skill repo-local: `/home/devthai/workspace/projects/CoreBH/.codex/skills/corebh-admin-module-builder/SKILL.md`
- Không tạo component nền mới nếu `components/ui/*` đã đáp ứng được
- Detail theo timeline phải forward cả khóa chính và `ngay_ad`
- Route handler phải forward nguyên lỗi upstream với đúng status code
- Mỗi task phải ghi review vào `tasks/todo.md` và cập nhật `.agent/memory/active_context.md`
