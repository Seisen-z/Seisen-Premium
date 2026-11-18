# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Client Dashboard**:
  - Redesigned statistics layout.
  - Added "Recent Orders" table with dark aesthetic.
  - Integrated "Downloads" page with product access check.
  - Added "Seisen Hub Premium Loader" download (Lua script).
  - Implemented "Download History" tracking.
- **Support System**:
  - New Support Dashboard (`/client/support`) with compact layout.
  - Ticket Detail view (`/client/support/[id]`) with conversation history.
  - Admin Ticket view (`/admin/tickets/[id]`) for staff replies and status management.
- **Orders & Invoicing**:
  - Refactored Order Details (`/client/orders/[id]`) to match "Receipt" design.
  - Added PDF Download for invoices with custom styling (Emerald theme, License Keys).

### Changed

- **Navigation**: Updated header greeting and verified navigation links.
- **Admin Panel**: Updated "View" button for tickets to link to new Admin Ticket view.
- **Cleanup**: Removed legacy `/support`, `/success`, and debug directories.

### Fixed

- **Admin Connection**: Resolved issues with admin replies not using the correct API.
- **UI Consistency**: Standardized container widths and padding across the Client Area.
