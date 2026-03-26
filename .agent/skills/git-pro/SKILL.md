---
name: git-pro
description: Professional Git Workflow & Tech Lead Protocol
---

# Git Pro Skill (Tech Lead Mode)

> **MANDATORY**: Bất kỳ thao tác Git nào cũng phải tuân thủ quy trình Tech Lead này. Không được tự ý commit/push mà không qua các bước kiểm duyệt (Audit).

## 🎯 Core Principles

1. **Atomic Commits**: Mỗi commit chỉ giải quyết 1 vấn đề duy nhất.
2. **Conventional Commits**: Sử dụng format `type(scope): description`.
   - `feat`: Tính năng mới
   - `fix`: Sửa lỗi
   - `refactor`: Tái cấu trúc (không đổi logic/UI)
   - `chore`: Update config, dependency, v.v.
3. **Tech Lead Mindset**: 
   - Không được để nhánh `main` bị hôi (dirty).
   - Phải sync với origin trước khi làm bất kỳ việc gì.
   - Khi có Conflict, phải dừng lại, báo cáo chi tiết cho PM (User) và đề xuất phương án giải quyết.

## 🛠️ Tech Lead Protocol

### Step 1: Pre-Commit Audit
Trước khi commit, Tech Lead phải chạy lệnh kiểm tra trạng thái:
- `git status`: Xem các file đã sửa.
- `git diff --stat`: Xem tổng quan số dòng thay đổi.
- `git diff`: Review lại code một lần cuối để đảm bảo không có console.log, debugger hoặc code thừa.

### Step 2: Socratic Conflict Resolution
Nếu có Merge Conflict:
1. **STOP**: Không được tự ý `git add` vào vùng conflict.
2. **ANALYZE**: Đọc kỹ file bị conflict, xác định phần nào là `incoming` phần nào là `current`.
3. **REPORT**: Thông báo cho User qua `notify_user` với nội dung cụ thể về conflict và lý do (vd: 2 người cùng sửa 1 function).
4. **DECIDE**: Đề xuất phương án (vd: "Tôi đề nghị giữ logic của nhánh Thai-dev vì nó có xử lý lỗi tốt hơn").

### Step 3: Branch Sync Protocol (Manual)
Tech Lead ưu tiên `git pull --rebase` thay vì `git merge` thông thường để giữ history sạch sẽ, trừ khi user yêu cầu merge commit.

## 🚀 Professional Command Patterns

- **Audit**: `git status && git diff --stat`
- **Sync**: `git fetch origin && git pull --rebase origin main` (hoặc nhánh hiện tại)
- **Review**: `git log -n 5 --graph --oneline` (Kiểm tra history trước khi push)
