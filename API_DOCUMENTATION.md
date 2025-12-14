# BookCourier Backend - Complete API Documentation

## Base URL

- Local: `http://localhost:5000/api`
- Production: `https://bookcourier-server-two.vercel.app/api`

---

## 🔐 Authentication

All protected routes require `Authorization: Bearer <firebase-token>` header

---

## 📚 BOOKS API

### Public Routes

#### GET /books

Get all published books with search and sort

- **Query Params:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `search` (optional): Search by book name
  - `sort` (optional): newest | price_asc | price_desc | name_asc | name_desc
- **Response:** Array of published books

#### GET /books/:id

Get single book details

- **Response:** Book object with librarian details

### Protected Routes (Librarian/Admin)

#### POST /books/add

Add a new book

- **Body:** `{ name, author, image, price, status, category, description }`
- **Status:** "published" | "unpublished"

#### GET /books/librarian/my-books

Get books added by logged-in librarian

#### PUT /books/:id

Update book (librarian can update own books, admin can update all)

- **Body:** `{ name, author, image, price, status, category, description }`

#### PATCH /books/:id/status

Toggle book status (published ↔ unpublished)

### Admin Only Routes

#### GET /books/admin/all

Get all books (published + unpublished) with librarian info

#### DELETE /books/:id

Delete book and all related orders

---

## 🛒 ORDERS API

### User Routes

#### POST /orders

Place a new order

- **Body:** `{ book, bookName, phoneNumber, address, price }`

#### GET /orders/my-orders

Get all orders for logged-in user

#### GET /orders/:id

Get single order details

#### PATCH /orders/:id/cancel

Cancel order (only if status is "pending")

#### PATCH /orders/:id/payment

Update payment status after payment

- **Body:** `{ paymentStatus: "paid" }`

### Librarian Routes

#### GET /orders/librarian/orders

Get all orders for books added by librarian

#### GET /orders/librarian/stats

Get librarian statistics (books, orders, revenue)

#### PATCH /orders/:id/status

Update order status

- **Body:** `{ orderStatus: "pending" | "shipped" | "delivered" | "cancelled" }`

### Admin Routes

#### GET /orders/admin/all

Get all orders

#### GET /orders/admin/stats

Get comprehensive admin statistics

---

## 💳 PAYMENTS API

### User Routes

#### POST /payments

Create payment record after successful payment

- **Body:** `{ orderId, paymentId, amount, paymentMethod, transactionId }`

#### GET /payments/my-invoices

Get all payment invoices for logged-in user

#### GET /payments/:id

Get single payment details

### Admin Routes

#### GET /payments/admin/all

Get all payments

---

## ❤️ WISHLIST API

### User Routes

#### POST /wishlist

Add book to wishlist

- **Body:** `{ bookId }`

#### GET /wishlist

Get user's wishlist with book details

#### DELETE /wishlist/:bookId

Remove book from wishlist

---

## ⭐ REVIEWS API

### User Routes

#### POST /reviews

Add or update review (user must have a delivered order for the book)

- **Body:** `{ bookId, rating, comment }`
- **Rating:** 1-5

#### GET /reviews/my-reviews

Get all reviews by logged-in user

### Public Routes

#### GET /reviews/book/:bookId

Get all reviews for a specific book

---

## 👥 USERS API

### User Routes

#### GET /users/profile

Get current user profile

#### PUT /users/profile

Update user profile

- **Body:** `{ name, photoURL }`

#### GET /users/stats

Get user statistics (orders, spending)

#### POST /users/password-set

Mark that user has set a password (after Google login)

### Admin Routes

#### GET /users/all

Get all users

- **Query:** `excludeAdmin=true` (optional)

#### PATCH /users/:userId/role

Update user role

- **Body:** `{ role: "user" | "librarian" | "admin" }`

---

## 📊 Data Models

### User

```javascript
{
  uid: String (Firebase UID),
  name: String,
  email: String,
  photoURL: String,
  role: "user" | "librarian" | "admin",
  hasPassword: Boolean,
  passwordRequired: Boolean,
  createdAt: Date
}
```

### Book

```javascript
{
  name: String,
  author: String,
  image: String (URL),
  price: Number,
  quantity: Number,
  status: "published" | "unpublished",
  category: String,
  description: String,
  librarian: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Order

```javascript
{
  book: ObjectId,
  bookName: String,
  user: ObjectId,
  userName: String,
  userEmail: String,
  phoneNumber: String,
  address: String,
  price: Number,
  orderStatus: "pending" | "shipped" | "delivered" | "cancelled",
  paymentStatus: "unpaid" | "paid",
  createdAt: Date,
  updatedAt: Date
}
```

### Payment

```javascript
{
  order: ObjectId,
  user: ObjectId,
  amount: Number,
  transactionId: String,
  paymentMethod: String,
  paymentStatus: "completed",
  createdAt: Date
}
```

### Wishlist

```javascript
{
  user: ObjectId,
  book: ObjectId,
  createdAt: Date
}
```

### Review

```javascript
{
  book: ObjectId,
  user: ObjectId,
  userName: String,
  userPhoto: String,
  rating: Number (1-5),
  comment: String,
  createdAt: Date
}
```

---

## 🔒 Role-Based Access

### User

- View published books
- Place orders
- View/cancel own orders
- Make payments
- Add/remove wishlist items
- Add reviews (only for delivered orders)
- View own profile and stats

### Librarian

- All user permissions
- Add books
- View/edit own books
- View orders for own books
- Update order status for own books
- Publish/unpublish own books
- View own statistics

### Admin

- All librarian permissions
- View all books (published + unpublished)
- View all orders
- View all users
- Update user roles
- Delete books
- Publish/unpublish any book
- View system-wide statistics

---

## ✅ Backend Features Checklist

### Authentication ✅

- [x] Firebase email/password authentication
- [x] Social login support (Google)
- [x] Mandatory password creation for social login users
- [x] JWT token verification
- [x] Role-based access control (user, librarian, admin)

### Books Management ✅

- [x] Add books (Librarian/Admin)
- [x] View all published books (Public)
- [x] Search books by name
- [x] Sort books by price/name/date
- [x] View book details
- [x] Update books (Librarian: own books, Admin: all books)
- [x] Delete books (Admin only)
- [x] Publish/unpublish books
- [x] Latest books endpoint

### Orders Management ✅

- [x] Place orders
- [x] View user orders
- [x] Cancel orders (only pending status)
- [x] View librarian's book orders
- [x] Update order status (pending → shipped → delivered)
- [x] Payment status tracking (unpaid/paid)
- [x] Order statistics

### Payment System ✅

- [x] Create payment records
- [x] View user invoices/payments
- [x] Payment validation
- [x] Automatic order payment status update
- [x] Transaction ID tracking

### Wishlist ✅

- [x] Add books to wishlist
- [x] Remove books from wishlist
- [x] View user wishlist with book details

### Reviews & Ratings ✅

- [x] Add reviews (only for delivered orders)
- [x] Update existing reviews
- [x] Rating validation (1-5)
- [x] View book reviews
- [x] View user reviews

### User Management ✅

- [x] User profile management
- [x] View all users (Admin)
- [x] Update user roles (Admin)
- [x] User statistics

### Database Seeding ✅

- [x] Seed users (User, Librarian, Admin)
- [x] Seed books with proper images
- [x] Seed orders
- [x] Seed payments
- [x] Seed wishlists
- [x] Seed reviews

---

## 🔑 Test Credentials

Create these users in Firebase Authentication:

1. **User:** `user@bookcourier.com` / `User@123`
2. **Librarian:** `librarian@bookcourier.com` / `Librarian@123`
3. **Admin:** `m4xabdullah@gmail.com` / `Admin@123`

The backend will automatically sync Firebase UID when they first log in.
