# API Contract (Core Demo Scope)

## Base
- Base URL: `http://127.0.0.1:8000/api`
- Content type: `application/json`
- Common headers:
  - `Accept: application/json`
  - `X-Requested-With: XMLHttpRequest`
  - `Authorization: Bearer <token>` for protected routes

## Standard Error Contract

### 401 Unauthenticated
```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
  "message": "Unauthorized"
}
```

### 422 Validation Error
```json
{
  "errors": {
    "field_name": [
      "Validation message..."
    ]
  }
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal Server Error"
}
```

## Endpoints (Validated in Demo Script)

### 1) `POST /auth/register` (public)
Request:
```json
{
  "name": "Client Demo",
  "email": "client_xxx@test.com",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "client"
}
```
Success (201):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "Client Demo",
    "email": "client_xxx@test.com",
    "role": "client"
  },
  "token": "jwt-token"
}
```

### 2) `POST /auth/login` (public)
Request:
```json
{
  "email": "client_xxx@test.com",
  "password": "password123"
}
```
Success (200):
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "client_xxx@test.com",
    "role": "client"
  },
  "token": "jwt-token"
}
```

### 3) `GET /user/profile` (auth:api)
Success (200):
```json
{
  "id": 1,
  "name": "Client Demo",
  "email": "client_xxx@test.com",
  "role": "client",
  "status": "active"
}
```

### 4) `POST /admin/categories` (auth:api + role:admin)
Request:
```json
{
  "name": "DemoCat_20260224",
  "description": "Demo category",
  "icon": "icon.png"
}
```
Success (201):
```json
{
  "message": "Category created successfully",
  "category": {
    "id": 10,
    "name": "DemoCat_20260224"
  }
}
```

### 5) `POST /admin/companies` (auth:api + role:admin)
Request:
```json
{
  "user_id": 2,
  "name": "Demo Company",
  "address": "Casablanca",
  "city": "Casablanca",
  "description": "Demo company profile",
  "status": "approved"
}
```
Success (201):
```json
{
  "message": "Company created successfully",
  "company": {
    "id": 20,
    "user_id": 2,
    "name": "Demo Company"
  }
}
```

### 6) `POST /company/cars` (auth:api + role:company)
Request:
```json
{
  "company_id": 20,
  "category_id": 10,
  "brand": "DemoBrand",
  "model": "DemoModel",
  "year": 2024,
  "color": "white",
  "license_plate": "DM-20260224",
  "mileage": 1000,
  "fuel_type": "gasoline",
  "transmission": "manual",
  "seats": 5,
  "price_per_day": 300,
  "discount_percent": 0,
  "available": true,
  "description": "Demo car"
}
```
Success (201):
```json
{
  "message": "Car created successfully",
  "car": {
    "id": 30,
    "brand": "DemoBrand",
    "model": "DemoModel"
  }
}
```

### 7) `GET /cars/search` (public)
Query params supported:
- `query`, `category_id`, `company_id`, `fuel_type`, `transmission`
- `available`, `min_price`, `max_price`, `per_page`

Success (200):
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 30,
      "brand": "DemoBrand",
      "model": "DemoModel"
    }
  ],
  "total": 1
}
```

### 8) `POST /reservations` (auth:api)
Request:
```json
{
  "user_id": 1,
  "car_id": 30,
  "start_date": "2026-03-01",
  "end_date": "2026-03-03",
  "total_days": 2,
  "total_price": 600,
  "status": "pending",
  "payment_method": "cash",
  "payment_status": "pending"
}
```
Success (201):
```json
{
  "message": "Reservation created successfully",
  "reservation": {
    "id": 40,
    "user_id": 1,
    "car_id": 30
  }
}
```

### 9) `GET /user/reservations` (auth:api)
Success (200):
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 40,
      "user_id": 1,
      "car_id": 30
    }
  ],
  "total": 1
}
```

### 10) `POST /reviews` (auth:api)
Request:
```json
{
  "user_id": 1,
  "car_id": 30,
  "reservation_id": 40,
  "rating": 5,
  "comment": "Excellent"
}
```
Success (201):
```json
{
  "message": "Review created successfully",
  "review": {
    "id": 50,
    "car_id": 30,
    "rating": 5
  }
}
```

### 11) `GET /cars/{id}/reviews` (public)
Success (200):
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 50,
      "car_id": 30,
      "rating": 5
    }
  ],
  "total": 1
}
```

### 12) `POST /payments` (auth:api)
Request:
```json
{
  "reservation_id": 40,
  "amount": 600,
  "payment_method": "cash",
  "transaction_id": "TXN-20260224",
  "status": "completed"
}
```
Success (201):
```json
{
  "message": "Payment created successfully",
  "payment": {
    "id": 60,
    "reservation_id": 40,
    "status": "completed"
  }
}
```

### 13) `GET /company/stats` (auth:api + role:company)
Success (200):
```json
{
  "scope": "company",
  "total_payments": 1,
  "completed_payments": 1,
  "pending_payments": 0,
  "failed_payments": 0,
  "refunded_payments": 0,
  "total_revenue": 600
}
```

## Notes for Frontend Integration
- Role routing:
  - Admin endpoints are under `/api/admin/*`
  - Company endpoints are under `/api/company/*`
- Token handling:
  - Use JWT token from login/register response.
  - Send in `Authorization: Bearer <token>`.
- Validation handling:
  - Parse 422 response from `errors` object and map field-level errors.
