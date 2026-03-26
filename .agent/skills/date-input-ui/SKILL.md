---
name: date-input-ui
description: Quy chuẩn UI/UX + logic cho bộ lọc ngày dùng calendar custom và nhập tay tự format trong FUDECO_CLIENT.
---

# date-input-ui

Skill này chuẩn hóa cách làm DATE filter cho các màn admin (Projects, Tenants) để đồng bộ UI và hành vi.

## Mục tiêu

1. Không dùng date picker native của browser.
2. Dùng calendar popup custom theo theme hệ thống.
3. Cho phép nhập nhanh bằng bàn phím theo định dạng `dd/MM/yyyy`.
4. Chuẩn hóa query range:
- `from` = đầu ngày.
- `to` = cuối ngày.

## Component chuẩn

Sử dụng component:

- `components/ui/optional-date-time-input.tsx`
- Export chính: `OptionalDateInput`

### Hành vi nhập tay

1. Nhập số tự động format:
- `01012026` -> `01/01/2026`
- `010120` -> `01/01/20`
2. Không tự chèn placeholder dạng `..`.
3. `Backspace/Delete` phải xóa mượt, không bị “khóa” input.

### Hành vi popup calendar

1. Mở lịch bằng nút calendar trong ô input.
2. Chọn ngày sẽ cập nhật value chuẩn ISO `yyyy-MM-dd`.
3. Có action `Xóa` và `Hôm nay`.
4. Hỗ trợ `menuPlacement="top"` cho khu vực pagination/filter sát đáy màn.

## Contract dữ liệu

Component `OptionalDateInput` trả về value chuẩn:

- `''` (chưa chọn)
- hoặc `yyyy-MM-dd` (đã chọn)

Khi gửi API filter:

1. `createdFrom`: parse về `00:00:00.000`.
2. `createdTo`: parse về `23:59:59.999`.

## Cách dùng chuẩn

```tsx
<OptionalDateInput
  value={createdFrom}
  onChange={setCreatedFrom}
  ariaLabel="Từ ngày"
  size="xs"
  className="w-full"
/>
```

## Áp dụng hiện tại

1. `app/(admin)/projects/page.tsx`
2. `app/(admin)/tenants/page.tsx`

## Checklist khi chỉnh DATE

1. UI input compact đồng bộ filter.
2. Popup calendar đúng theme.
3. Gõ tay + auto format hoạt động.
4. Xóa bằng phím hoạt động.
5. Query from/to không hụt dữ liệu cuối ngày.
