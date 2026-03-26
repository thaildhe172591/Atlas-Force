---
name: corebh-api-v1-client
description: FE contract cho CoreBH API /api/v1 (tenant-service + project-service), có sẵn type + mẫu request/response.
---
# corebh-api-v1-client

Use this skill when implementing FE theo API v1.

## Base
- Base URL dev: `http://localhost:8081`
- OpenAPI: `/openapi/v1.json`
- Pagination mặc định server-side:
  - `page = 1`
  - `pageSize = 20`, tối đa `100`

## Tenant endpoints (role: TENANT_ADMIN, auth required)
- `GET /api/v1/tenants` - list theo `q`, `status`, `createdFrom|createdTo`, `updatedFrom|updatedTo`, `sortBy`, `sortDirection`, `page`, `pageSize`.
- `GET /api/v1/tenants/search` - alias cho list.
- `GET /api/v1/tenants/{tenantId}` - lấy chi tiết.
- `POST /api/v1/tenants` - tạo mới.
- `PUT /api/v1/tenants/{tenantId}` - update `code|name|status`.
- `DELETE /api/v1/tenants/{tenantId}` - soft delete (set `Inactive`), thường trả `204`.

## Project endpoints (role: project-service, auth required)
- `GET /api/v1/projects?tenantId={tenantId}&page=1&pageSize=20`
- `GET /api/v1/projects/all?page=1&pageSize=20`
- `GET /api/v1/projects/search?...`
- `GET /api/v1/projects/{projectId}`
- `POST /api/v1/projects`
- `PUT /api/v1/projects/{projectId}`
- `DELETE /api/v1/projects/{projectId}`

## TypeScript DTO (FE)
```ts
export type PagedResult<T> = {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}

export type TenantStatus = 'Active' | 'Inactive'
export type TenantStatusDto = 'Active' | 'Inactive'
export type TenantSortBy = 'code' | 'name' | 'status' | 'createdAt' | 'updatedAt'
export type TenantSortDirection = 'asc' | 'desc'

export interface TenantSummaryDto {
  id: string
  code: string
  name: string
  status: TenantStatus
}

export interface TenantDetailDto extends TenantSummaryDto {
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface TenantCreateRequest {
  code: string
  name: string
}

export interface TenantCreateResponse {
  id: string
  code: string
  name: string
}

export interface TenantUpdateRequest {
  code?: string
  name?: string
  status?: TenantStatus
}

export interface TenantSearchQuery {
  q?: string
  status?: TenantStatus
  createdFrom?: string
  createdTo?: string
  updatedFrom?: string
  updatedTo?: string
  sortBy?: TenantSortBy
  sortDirection?: TenantSortDirection
  page?: number
  pageSize?: number
}

export interface ProjectSummaryDto {
  id: string
  code: string
  name: string
  status: 'Draft' | 'Active' | 'Archived'
}

export interface ProjectSummaryWithTenantDto extends ProjectSummaryDto {
  tenantId: string
}

export interface ProjectSearchItemDto extends ProjectSummaryWithTenantDto {
  description?: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectDetailDto extends ProjectSummaryWithTenantDto {
  description?: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface ProjectCreateRequest {
  tenantId: string
  code: string
  name: string
  description?: string | null
}

export interface ProjectUpdateRequest {
  code?: string | null
  name?: string | null
  description?: string | null
  status?: 'Draft' | 'Active' | 'Archived' | null
}
```

## API patterns
- Tenant list/search:
  - `GET /api/v1/tenants/search?q=BDX&status=Active&sortBy=createdAt&sortDirection=desc&page=1&pageSize=20`
- Project create:
  - body bắt buộc gồm `tenantId, code, name`, `description` optional.
- Error style: ProblemDetails-like (`detail`/`title`/`errors`)
  - `400/422`: validation
  - `404`: not found
  - `409`: conflict

## Client checklist
- Trong select “Đối tác quản lý”, bind trực tiếp `items` từ API (`TenantSummaryDto[]`).
- Khi tạo project luôn truyền đúng `tenantId`.
- Khi list/filter dùng query params từ backend (`q`, `status`, `page`, `pageSize`, …) thay vì filter client-only.
