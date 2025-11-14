# Booking Management System Implementation

This document describes the implementation of the booking management features including reschedule/cancellation requests, company policies, and request tracking.

## Features Implemented

### 1. Dynamic Terms Display
- **Component**: `CompanyTermsComponent` (`velorent-app/src/app/components/company-terms/company-terms.component.ts`)
- **Backend Endpoint**: `GET /api/companies/:id/policies`
- **Features**:
  - Displays company-specific reschedule, cancellation, and refund terms
  - Shows fee information (free reschedule days, fee percentages)
  - Highlights non-refundable deposits

### 2. Request Submission
- **Component**: `RequestModalComponent` (`velorent-app/src/app/components/request-modal/request-modal.component.ts`)
- **Backend Endpoints**:
  - `POST /api/requests` - Create a new request
  - `POST /api/requests/compute-fee` - Calculate fee before submission
- **Features**:
  - Submit reschedule requests with new dates/times
  - Submit cancellation requests
  - Automatic fee computation based on company policies
  - Form validation

### 3. Request Tracking
- **Page**: `BookingRequestsPage` (`velorent-app/src/app/booking-requests/booking-requests.page.ts`)
- **Backend Endpoint**: `GET /api/requests/my-requests`
- **Features**:
  - View all submitted requests
  - Filter by status (all, pending, approved, rejected)
  - Display request details, fees, and company responses
  - Status badges with color coding

### 4. Updated My Rentals Page
- **Page**: `MyRentalsPage` (updated)
- **Features**:
  - "Request Reschedule" button for eligible bookings
  - "Request Cancel" button for eligible bookings
  - Link to view all requests
  - Integrated with request modal

### 5. Fee Computation
- **Backend Logic**: Automatic fee calculation based on:
  - Days until booking (free reschedule if within policy threshold)
  - Company-defined fee percentages
  - Request type (reschedule vs cancellation)

### 6. Notifications
- **Backend Endpoints**:
  - `GET /api/notifications/my-notifications`
  - `GET /api/notifications/unread-count`
  - `PUT /api/notifications/:id/read`
  - `PUT /api/notifications/mark-all-read`
- **Features**:
  - Automatic notification creation when requests are submitted
  - Unread count tracking
  - Mark as read functionality

## Database Schema

### New Tables Created

1. **company_policies**
   - Stores company-specific terms and policies
   - Includes fee percentages and free reschedule days
   - Location: `backend/config/booking-management-schema.sql`

2. **requests**
   - Stores all reschedule and cancellation requests
   - Tracks status, fees, and company responses
   - Links to bookings and companies

3. **notifications**
   - Stores user notifications
   - Tracks read/unread status
   - Links to requests and bookings

## Setup Instructions

### 1. Database Setup

Run the SQL script to create the new tables:

```bash
mysql -u root -p velorent < backend/config/booking-management-schema.sql
```

Or manually execute the SQL in `backend/config/booking-management-schema.sql`.

### 2. Backend Routes

The following routes have been added:
- `/api/companies/:id/policies` - Get company policies
- `/api/requests/*` - Request management endpoints
- `/api/notifications/*` - Notification endpoints

Routes are automatically registered in `backend/app.js`.

### 3. Frontend Components

All components are standalone and ready to use:
- `CompanyTermsComponent` - Display company terms
- `RequestModalComponent` - Submit requests
- `BookingRequestsPage` - Track requests

### 4. Routes

New route added:
- `/booking-requests` - View all booking requests (requires authentication)

## Usage

### For Customers

1. **View Company Terms**:
   - Terms are automatically displayed when viewing vehicle details or submitting requests
   - Shows reschedule, cancellation, and refund policies

2. **Submit Reschedule Request**:
   - Go to "My Rentals"
   - Click "Request Reschedule" on an eligible booking
   - Fill in new dates/times and reason
   - Review computed fee
   - Submit request

3. **Submit Cancellation Request**:
   - Go to "My Rentals"
   - Click "Request Cancel" on an eligible booking
   - Provide reason
   - Review computed fee
   - Submit request

4. **Track Requests**:
   - Go to "My Rentals" and click "View All Requests"
   - Or navigate to "Booking Requests" page
   - Filter by status
   - View details, fees, and company responses

### For Companies (Backend)

Companies can manage policies through the database or by creating admin endpoints (not implemented in this phase).

## API Endpoints

### Company Policies
```
GET /api/companies/:id/policies
```

### Requests
```
GET /api/requests/my-requests
GET /api/requests/:id
POST /api/requests
POST /api/requests/compute-fee
```

### Notifications
```
GET /api/notifications/my-notifications
GET /api/notifications/unread-count
PUT /api/notifications/:id/read
PUT /api/notifications/mark-all-read
```

## File Structure

### Backend
```
backend/
├── config/
│   └── booking-management-schema.sql (NEW)
├── routes/
│   ├── companies.js (UPDATED - added policies endpoint)
│   ├── requests.js (NEW)
│   └── notifications.js (NEW)
└── app.js (UPDATED - registered new routes)
```

### Frontend
```
velorent-app/src/app/
├── components/
│   ├── company-terms/ (NEW)
│   │   └── company-terms.component.ts
│   └── request-modal/ (NEW)
│       └── request-modal.component.ts
├── booking-requests/ (NEW)
│   ├── booking-requests.page.ts
│   ├── booking-requests.page.html
│   └── booking-requests.page.scss
├── services/
│   └── booking-request.service.ts (NEW)
├── my-rentals/ (UPDATED)
│   ├── my-rentals.page.ts
│   ├── my-rentals.page.html
│   └── my-rentals.page.scss
├── api.service.ts (UPDATED - added notification endpoints)
└── app.routes.ts (UPDATED - added booking-requests route)
```

## Testing

### Manual Testing Steps

1. **Test Company Policies Display**:
   - Navigate to a vehicle detail page
   - Verify company terms are displayed

2. **Test Reschedule Request**:
   - Create a booking
   - Go to "My Rentals"
   - Click "Request Reschedule"
   - Fill form and submit
   - Verify request appears in "Booking Requests"

3. **Test Cancellation Request**:
   - Create a booking
   - Go to "My Rentals"
   - Click "Request Cancel"
   - Fill form and submit
   - Verify request appears in "Booking Requests"

4. **Test Fee Computation**:
   - Submit reschedule request within free period (should show 0% fee)
   - Submit reschedule request after free period (should show fee)
   - Verify cancellation fee is calculated

5. **Test Notifications**:
   - Submit a request
   - Check notifications page
   - Verify notification is created
   - Mark as read and verify count updates

## Future Enhancements

1. **Admin Panel**:
   - Company admin interface to manage policies
   - Approve/reject requests
   - Set custom fees

2. **Email Notifications**:
   - Send email when request status changes
   - Email reminders for pending requests

3. **Push Notifications**:
   - Real-time push notifications for request updates
   - Mobile app integration

4. **Advanced Fee Calculation**:
   - Calculate fees based on booking total amount
   - Support for partial refunds
   - Multiple fee tiers

5. **Request History**:
   - View all past requests
   - Request analytics
   - Export request data

## Notes

- All requests require authentication
- Requests can only be created for bookings with status "Pending" or "Approved"
- Fee computation is based on company policies or defaults if no policy exists
- Notifications are automatically created when requests are submitted
- Company responses can be added through backend (admin functionality not implemented)

