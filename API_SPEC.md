# twintell — API Specification

Base URL: `/api` (except `/health`)

All requests returning success lists use consistent cursor pagination:
```json
{
  "data": [...],
  "nextCursor": "string | null"
}
```

All errors follow a unified structure:
```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable description"
  }
}
```

---

## 1. System Endpoints

### `GET /health`
- **Access**: Public
- **Description**: Returns 200 OK. Used by Render and AWS health checks.
- **Response**:
  ```json
  {
    "status": "ok",
    "environment": "development",
    "uptime": 12.34,
    "timestamp": "2026-10-01T11:28:13.375Z"
  }
  ```

---

## 2. Auth & User Profile

### `GET /api/me`
- **Access**: Authenticated (`requireAuth`)
- **Description**: Retrieves current user, role, profile, and associated company (if role is COMPANY).

### `PATCH /api/me`
- **Access**: Authenticated (`requireAuth`)
- **Description**: Updates user's own profile fields (`name`, `avatarUrl`, `headline`, `bio`, `city`).

### `POST /api/onboarding`
- **Access**: Authenticated (`requireAuth`)
- **Description**: Sets role for the first time.
- **Payload for USER**:
  ```json
  {
    "role": "USER"
  }
  ```
- **Payload for COMPANY**:
  ```json
  {
    "role": "COMPANY",
    "company": {
      "name": "Acme Packaging",
      "businessType": "Manufacturer",
      "categoryId": "uuid",
      "city": "Ahmedabad",
      "state": "Gujarat",
      "description": "Leading manufacturer...",
      "logoUrl": "https://...",
      "tags": ["Packaging", "Boxes"]
    }
  }
  ```

---

## 3. Feed & Posts

### `GET /api/feed`
- **Access**: Public (`optionalAuth`). If `tab=following`, requires authentication.
- **Query Parameters**:
  - `tab`: `for-you` (default) | `following` | `trending`
  - `topic`: optional `PostTopic` enum string
  - `cursor`: optional ISO datetime cursor
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "companyId": "uuid",
        "content": "Post content...",
        "images": ["https://..."],
        "topic": "MANUFACTURING",
        "likeCount": 12,
        "commentCount": 3,
        "createdAt": "2026-10-01T10:00:00.000Z",
        "company": {
          "id": "uuid",
          "name": "GreenPack Solutions",
          "slug": "greenpack-solutions",
          "logoUrl": "https://...",
          "businessType": "Manufacturer",
          "city": "Ahmedabad",
          "state": "Gujarat",
          "verified": true
        },
        "isLiked": false
      }
    ],
    "nextCursor": "2026-10-01T09:30:00.000Z"
  }
  ```

### `GET /api/posts/:id`
- **Access**: Public (`optionalAuth`)
- **Description**: Retrieves single post with company details and `isLiked`.

### `POST /api/posts`
- **Access**: Company only (`onlyCompany` + `checkPostLimit`)
- **Body**:
  ```json
  {
    "content": "Post text...",
    "images": ["https://..."],
    "topic": "MANUFACTURING"
  }
  ```

### `DELETE /api/posts/:id`
- **Access**: Company Owner only
- **Description**: Deletes a post belonging to the authenticated company.

### `POST /api/posts/:id/like`
- **Access**: Authenticated (`requireAuth`)
- **Description**: Idempotently likes a post and increments `likeCount`.

### `DELETE /api/posts/:id/like`
- **Access**: Authenticated (`requireAuth`)
- **Description**: Idempotently unlikes a post and decrements `likeCount`.

### `GET /api/posts/:id/comments`
- **Access**: Public
- **Query**: `cursor`

### `POST /api/posts/:id/comments`
- **Access**: Authenticated (`requireAuth`)
- **Body**:
  ```json
  {
    "content": "Great update!"
  }
  ```

---

## 4. Companies & Business Directory

### `GET /api/companies`
- **Access**: Public
- **Query Parameters**: `category`, `city`, `cursor`
- **Description**: Lists verified companies for the Business Directory.

### `GET /api/companies/:slug`
- **Access**: Public (`optionalAuth`)
- **Description**: Returns company details, stats, verified status, and `isFollowing`.

### `GET /api/companies/:slug/products`
- **Access**: Public
- **Query**: `cursor`

### `GET /api/companies/:slug/posts`
- **Access**: Public (`optionalAuth`)
- **Query**: `cursor`

### `PATCH /api/companies/me`
- **Access**: Company only (`onlyCompany`)
- **Description**: Updates authenticated user's company profile.

### `POST /api/companies/:id/follow`
- **Access**: Authenticated (`requireAuth`)
- **Description**: Idempotently follows a company and increments `followerCount`.

### `DELETE /api/companies/:id/follow`
- **Access**: Authenticated (`requireAuth`)
- **Description**: Idempotently unfollows a company and decrements `followerCount`.

---

## 5. Products

### `GET /api/products`
- **Access**: Public
- **Query Parameters**: `category`, `cursor`

### `GET /api/products/:id`
- **Access**: Public
- **Description**: Full product details including MOQ, unit price, material, and company info.

### `POST /api/products`
- **Access**: Company only (`onlyCompany` + `checkProductLimit`)
- **Body**:
  ```json
  {
    "title": "Custom Printed Corrugated Boxes",
    "description": "High quality 5-ply cartons",
    "price": 12.50,
    "priceUnit": "piece",
    "moq": 1000,
    "images": ["https://..."],
    "tags": ["Packaging", "Custom Printing"],
    "material": "Kraft Paperboard",
    "sizes": "Custom",
    "usage": "E-commerce, Food",
    "categoryId": "uuid"
  }
  ```

### `PATCH /api/products/:id`
- **Access**: Company Owner only

### `DELETE /api/products/:id`
- **Access**: Company Owner only

---

## 6. Inquiries ("Contact Supplier")

### `POST /api/inquiries`
- **Access**: Authenticated (`requireAuth`)
- **Body**:
  ```json
  {
    "companyId": "uuid",
    "productId": "uuid | null",
    "message": "We need a quote for 5,000 units delivered to Mumbai."
  }
  ```

### `GET /api/inquiries`
- **Access**: Company only (`onlyCompany`)
- **Description**: Lists inquiries received by the authenticated company.

---

## 7. Search & Categories

### `GET /api/categories`
- **Access**: Public
- **Description**: Returns all business categories and icons.

### `GET /api/search`
- **Access**: Public
- **Query**: `q`, `type` (`all` | `companies` | `products` | `posts`)
- **Description**: Case-insensitive search using Postgres ILIKE.

---

## 8. Uploads

### `POST /api/uploads/sign`
- **Access**: Authenticated (`requireAuth`)
- **Body**:
  ```json
  {
    "fileName": "sample.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1048576
  }
  ```
- **Response**:
  ```json
  {
    "uploadUrl": "https://<project-ref>.supabase.co/storage/v1/object/upload/sign/...",
    "publicUrl": "https://<project-ref>.supabase.co/storage/v1/object/public/twintell-uploads/..."
  }
  ```
