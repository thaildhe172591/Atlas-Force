---
description: Create a full CRUD module (API, Hooks, UI, Pages) from provided API docs and Action Codes
---

# /create-crud-module - Tự động tạo module CRUD

Lệnh này giúp tự động tạo toàn bộ một module CRUD (Create, Read, Update, Delete/Deactivate) bao gồm Type Definitions, API Client, SWR Hooks, UI Components (Table, Filters, Form Modal) và Page Integration trong Next.js App Router, dựa trên thư viện UI và cấu trúc lưu trữ hiện tại.

## Input yêu cầu từ User

Khi gọi lệnh này, User cần cung cấp:

1. **Tên module**: (VD: Quản lý Phòng Ban, Quản lý Sản Phẩm...)
2. **Action Codes & Procedure**: Mã hành động và tên thủ tục SQL tương ứng cho Tìm kiếm, Xem chi tiết, Thêm/Sửa.
3. **Payload Mẫu / Response Mẫu**: Cấu trúc JSON trả về hoặc gửi đi để định nghĩa Type.
4. **Các trường (cột) cần hiển thị**: Danh sách cột trên bảng.
5. **Các trường filter cần có**: Danh sách các field trên bộ lọc (vd: Text search, Select dropdown).

## Các bước Agent cần thực hiện (Phase 1 -> 3)

**Phase 1: Core Foundation & API**

1. **`types/[module-name].ts`**: Tạo các interfaces `Item`, `SearchParams`, `SearchResult`, `Detail`, `SavePayload` dựa trên JSON mẫu.
2. **`action-code.store.ts`**: Bổ sung Action Codes vào `procedureCodeStore`.
3. **`app/api/[module-name]/route.ts`**: Tạo Next.js API Route (GET cho list/detail, POST cho save). Chú ý kế thừa hàm `executeWithRetry` và `resolveAccessToken` để handle token.
4. **`lib/services/modules/[module-name].api.ts`**: Tạo file client bọc các lời gọi API sử dụng `apiFetch`. Đăng ký module này vào `lib/api-client.ts`.
5. **`lib/hooks/use-[module-name].ts`**: Viết SWR hooks để component dễ dàng fetch và mutate data.

**Phase 2: User Interface Components**
Bám sát cấu trúc của các module chuẩn (như `DonViChiNhanh`, `DoiTac`, và đặc biệt là `TaiKhoan`, `CauHinhPhanCapDuyet` cho các form phức tạp):

1. **`components/[module-name]/[module-name]-columns.tsx`**: Trả về mảng cấu hình Column cho `DataTable`. Tích hợp `StatusBadge` và nút Edit.
2. **`components/[module-name]/[module-name]-filters.tsx`**: Sử dụng `DynamicFilter` component. Định nghĩa các field input type (text, select) và xử lý call back change.
3. **`components/[module-name]/[module-name]-form-modal.tsx`**: Sử dụng `DynamicFormModal`. Áp dụng logic fetch tự động detail nếu mode = `edit` khi form được open. Phân chia lưới colSpan cho field hợp lý.

**Phase 3: Page Integration**

1. **`app/(admin)/admin/[module-name]/page.tsx`**:
   - Ghép nối `DataTable`, `DataTablePagination`, Filters, và Form Modal.
   - Thêm component `PageHeader`.
   - Sử dụng hook `useDebounce` cho các filter text.
   - Tích hợp `ActionConfirmDialog` cho việc toggle trạng thái (Kích hoạt / Vô hiệu hóa).

## Usage Example

```bash
/create-crud-module "Quản lý Hợp đồng"
- Cột: STT, Mã, Tên, Ngày, Trạng thái
- Lọc: Tên, Mã, Trạng thái
- ActionCodes: PHT_HOP_DONG_PTRANG (AAA), PHT_HOP_DONG_CT (BBB), PHT_HOP_DONG_NH (CCC)
- Response JSON: [Dán json vào đây]
```

## Critical Rules cho Agent

- **KHÔNG SÁNG TẠO COMPONENT MỚI**: Luôn sử dụng `DataTable`, `DynamicFilter`, `DynamicFormModal`, `ActionConfirmDialog`, `PageHeader` đã có sẵn trong `components/ui/`.
- **LUÔN VIẾT TYPE TRƯỚC**: Strict-typing giúp giảm lỗi TypeScript khi truyền props.
- **TÍCH HỢP LOADING & TOAST**: Khi gọi `onSubmit` trong Form Modal, luôn sử dụng `runAction` từ `usePendingUI` và `toast` để thông báo kết quả Thành công/Thất bại.
- **CHÚ Ý CASCADING DROPDOWN**: Nếu form/filter có select dropdown phụ thuộc nhau (VD: Tỉnh -> Huyện), cần có `useEffect` để clear lookup phụ khi giá trị parent bị đổi.
- **🔴 BẮT BUỘC: ĐỒNG BỘ VALIDATION NGHIÊM NGẶT**:
  1. **Khởi tạo**: Các trường số (`number`, `money`) phải được khởi tạo là `''` (chuỗi rỗng) thay vì `0` để logic `required` của `DynamicFormModal` hoạt động chính xác.
  2. **Manual Safeguard**: Trong hàm `handleSubmit` của modal, luôn thêm một bước kiểm tra thủ công `missingFields` trước khi gọi API để đảm bảo không bị bypass validation.
  3. **Visual Feedback**: Sử dụng thuộc tính `error` trên các component input (như `OptionalDateInput`) để hiển thị báo đỏ và hiệu ứng rung (shake) khi validate thất bại.
- **SỬ DỤNG SWR Caching**: Các fetcher phải tận dụng tốt `keepPreviousData: true` của SWR để UX được mượt mà lúc chuyển trang / tìm kiếm.
- **🔴 BẮT BUỘC: FORWARD LỖI UPSTREAM NGUYÊN BẢN**: Trong `executeWithRetry`, khi catch `UpstreamError` với `status !== 401`, **LUÔN** forward `error.bodyText` (body gốc từ API) và `error.status` (status code gốc) thay vì trả về thông báo generic `502 + error.message`. Pattern chuẩn:
  ```typescript
  if (error.status !== 401) {
    try {
      const upstreamJson = JSON.parse(error.bodyText);
      return NextResponse.json(upstreamJson, { status: error.status });
    } catch {
      return NextResponse.json(
        { error: error.message, detail: error.bodyText },
        { status: error.status },
      );
    }
  }
  ```
  Áp dụng **CẢ HAI** catch block (lần đầu + lần retry). Nếu không, lỗi từ BE sẽ bị nuốt và FE chỉ thấy `{"error": "Upstream xxx API returned 400"}` — không thể debug.
- **🔴 BẮT BUỘC: HIỂN THỊ LỖI API QUA TOAST**: Tất cả lỗi API phải hiển thị cho user qua Toast notification:
  1. **Form submit**: `handleFormSubmit` trong page **KHÔNG ĐƯỢC** có `try/catch` nuốt lỗi. Để `DynamicFormModal.handleConfirmSubmit` tự bắt và hiển thị `toast.error()`.
  2. **SWR GET errors**: Mỗi page CRUD phải có `useEffect` theo dõi `error`/`isError` từ hook, hiển thị qua `notifyV2.error()`:

  ```typescript
  import { notifyV2 } from '@/lib/notify'
  import { getApiResponseMessage } from '@/lib/api-client'

  const { items, error, ... } = useMyHook(params)

  useEffect(() => {
      if (error) {
          const msg = getApiResponseMessage(error) || error?.message || 'Lỗi tải dữ liệu'
          notifyV2.error(msg)
      }
  }, [error])
  ```
