---
description: Hướng dẫn phân tích yêu cầu màn hình và đề xuất các component tái sử dụng (UI Components Roadmap).
---

# 🎨 Workflow: Thiết kế màn hình với Reusable Components (`/design-screen`)

Workflow này được sử dụng khi User yêu cầu xây dựng hoặc refactor một màn hình giao diện mới. Mục tiêu là tận dụng tối đa các component đã có sẵn trong hệ thống (`@/components/ui/`), tránh code lặp lại, và duy trì cấu trúc gọn nhẹ cho file `page.tsx`.

## 🛠 Cách sử dụng (Cho Agent)

Khi User yêu cầu: *"Tôi muốn làm màn hình phân hệ X với danh sách, bộ lọc và các hành động thêm/sửa/xóa"*, bạn (AI) **phải** thực hiện qua 4 bước sau:

### Bước 1: Phân tích UI Layout (Top-Down)
Liệt kê các thành phần chính của màn hình dựa vào yêu cầu:
1. **Tiêu đề & Mô tả (Page Header):** Tên màn hình là gì?
2. **Khu vực Bộ lọc (Filters):** Cần tìm kiếm, Date picker, Select box nào?
3. **Khu vực Dữ liệu (Bảng danh sách/Data Grid):** Có bao nhiêu cột? Các cột có badge trạng thái không?
4. **Khu vực Phân trang (Pagination):** Có cần phân trang không?
5. **Khu vực Modal/Dialog (Actions):** Các thao tác Thêm/Sửa/Xóa/Đổi trạng thái.

### Bước 2: Khớp nối với Core Components (Mapping)
Gợi ý cho User các component có sẵn tương ứng:

- Chủ đạo cho **Layout & Header**:
  - `PageHeader` (`@/components/ui/page-header`): Dùng cho tiêu đề màn hình.
  - `AppLink` (`@/components/ui/app-link`): Nút điều hướng, link nội bộ hỗ trợ i18n chuẩn.

- Chủ đạo cho **Bảng & Danh sách (Table & Data)**:
  - `DataTable` (`@/components/ui/data-table`): Render bảng danh sách dữ liệu (cần truyền `columns`).
  - `DataTablePagination` (`@/components/ui/data-table-pagination`): Phân trang ở dưới bảng (nhận `totalCount`, `pageSize`, `currentPage`).
  - `StatusBadge` (`@/components/ui/status-badge`): Component hiển thị thẻ trạng thái có màu sắc (Active/Inactive, v.v.).

- Chủ đạo cho **Bộ lọc & Form (Filters & Inputs)**:
  - `StyledSelect` (`@/components/ui/styled-select`): Dùng cho Dropdown/Select.
  - `OptionalDateInput` (`@/components/ui/optional-date-time-input`): Dùng cho chọn Khoảng/Ngày (Từ ngày - Đến ngày).

- Chủ đạo cho **Xác nhận (Confirmations)**:
  - `ActionConfirmDialog` (`@/components/ui/action-confirm-dialog`): Cho tính năng xóa, vô hiệu hóa, kích hoạt.

### Bước 3: Đề xuất kiến trúc file (Domain-Driven)
Gợi ý tạo các file sau thay vì viết dồn vào `page.tsx`:
1. `app/(admin)/[domain]/page.tsx`: Orchestrator chính, chỉ fetch data (SWR) và gọi API, truyền state xuống các component con.
2. `components/[domain]/[domain]-filters.tsx`: Khối UI của bộ lọc.
3. `components/[domain]/[domain]-columns.tsx`: Trả về mảng `Column<T>` cho `DataTable`.
4. `components/[domain]/add-[domain]-modal.tsx`: Modal tạo mới.

### Bước 4: Lên mã giả (Skeleton) mô phỏng
Tạo một đoạn mã giả ngắn gọn để User hình dung cấu trúc:

```tsx
// Ví dụ: app/(admin)/products/page.tsx
export default function ProductsPage() {
  // 1. Data fetching (useSWR)
  // 2. State quản lý filter và modal
  
  return (
    <div className="space-y-3">
      <PageHeader title="Sản phẩm" description="Quản lý danh mục" />
      
      <ProductFilters 
        search={search} onSearchChange={setSearch} 
        /* ... truyền các props khác ... */ 
      />
      
      <DataTable 
        columns={columns} 
        data={data.items} 
        isLoading={isLoading} 
      />
      
      <DataTablePagination 
        totalCount={data.totalCount}
        /* ... các props khác ... */
      />
      
      {/* Modal Actions */}
      <ActionConfirmDialog open={isOpen} />
    </div>
  )
}
```

---

> **Note cho Agent:** Không bao giờ suggest code toàn bộ logic filter hoặc table thuần tuý bằng the `<table>` HTML vào `page.tsx`. Luôn ưu tiên dùng `DataTable`, `DataTablePagination` và bộ `components/ui/` hiện có.
