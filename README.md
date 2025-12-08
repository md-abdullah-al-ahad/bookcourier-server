# 📚 BookCourier Server

A robust and scalable backend API for an online book ordering and library management system built with Node.js, Express, and MongoDB.

## 🚀 Features

### User Management

- **User Authentication** - Secure authentication using Firebase Admin SDK
- **Role-Based Access Control** - Three user roles: User, Librarian, and Admin
- **User Profiles** - Update profile information (name, photo)
- **User Statistics** - Track orders, spending, and pending orders

### Book Management

- **Book CRUD Operations** - Create, read, update, and delete books
- **Book Categorization** - Organize books by categories
- **Status Management** - Published/Unpublished status control
- **Search & Filter** - Search books by name with sorting options
- **Librarian Books** - Librarians can manage their own books
- **Admin Dashboard** - Complete book overview for administrators

### Order Management

- **Place Orders** - Users can order published books
- **Order Tracking** - Track order status (pending, shipped, delivered, cancelled)
- **Payment Status** - Track payment status (paid, unpaid)
- **Order History** - View complete order history with book details
- **Librarian Orders** - View orders for books added by librarian
- **Admin Analytics** - Comprehensive order statistics and revenue tracking
- **Order Cancellation** - Users can cancel pending orders

### Payment System

- **Payment Records** - Create and store payment information
- **Invoice Management** - View payment history and invoices
- **Payment Verification** - Validate payment amounts against orders
- **Duplicate Prevention** - Prevent duplicate payments

### Wishlist

- **Add to Wishlist** - Save books for later
- **Remove from Wishlist** - Manage wishlist items
- **View Wishlist** - Get all wishlist items with book details

### Reviews & Ratings

- **Add Reviews** - Rate and review books (only for delivered orders)
- **Update Reviews** - Update existing reviews
- **View Reviews** - Get all reviews for a book with user details
- **Average Ratings** - Calculate average ratings for books

### Statistics & Analytics

- **User Stats** - Total orders, spending, pending orders
- **Librarian Stats** - Books count, orders, revenue
- **Admin Dashboard** - Users, books, orders, revenue, order status breakdown

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **MongoDB Native Driver** - Database operations

### Authentication & Security

- **Firebase Admin SDK** - User authentication and token verification
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing (if used)
- **cookie-parser** - Cookie parsing middleware

### Validation & Utilities

- **express-validator** - Request validation
- **dotenv** - Environment variable management
- **cors** - Cross-Origin Resource Sharing

### Development Tools

- **Nodemon** - Auto-restart during development
- **Prettier** - Code formatting

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Firebase Project** - [Create project](https://console.firebase.google.com/)
- **Git** - [Download](https://git-scm.com/)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/md-abdullah-al-ahad/bookcourier-server.git
cd bookcourier-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file and fill in your actual values:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/
DB_NAME=bookcourier

# Server Configuration
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:5173

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Navigate to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `serviceAccountKey.json` in the project root

### 5. MongoDB Setup

1. Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
2. Create a new cluster
3. Create a database user with password
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and update `MONGODB_URI` in `.env`

## 🚀 How to Run

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:5000` with auto-restart enabled.

### Production Mode

```bash
npm start
```

### Test the Server

Open your browser or use a tool like Postman:

```
GET http://localhost:5000/
```

You should see:

```json
{
  "message": "Welcome to BookCourier API",
  "status": "Server is running successfully",
  "timestamp": "2025-12-08T..."
}
```

## 📚 API Endpoints

### Authentication

All protected routes require a valid Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### User Endpoints

| Method | Endpoint                  | Access    | Description              |
| ------ | ------------------------- | --------- | ------------------------ |
| GET    | `/api/users/profile`      | Protected | Get current user profile |
| PUT    | `/api/users/profile`      | Protected | Update user profile      |
| GET    | `/api/users/stats`        | Protected | Get user statistics      |
| GET    | `/api/users/all`          | Admin     | Get all users            |
| PATCH  | `/api/users/:userId/role` | Admin     | Update user role         |

### Book Endpoints

| Method | Endpoint                        | Access          | Description                               |
| ------ | ------------------------------- | --------------- | ----------------------------------------- |
| GET    | `/api/books`                    | Public          | Get all published books (with pagination) |
| GET    | `/api/books/:id`                | Public          | Get single book by ID                     |
| POST   | `/api/books/add`                | Librarian/Admin | Add a new book                            |
| GET    | `/api/books/librarian/my-books` | Librarian/Admin | Get librarian's books                     |
| GET    | `/api/books/admin/all`          | Admin           | Get all books (all statuses)              |
| PUT    | `/api/books/:id`                | Librarian/Admin | Update book                               |
| DELETE | `/api/books/:id`                | Admin           | Delete book                               |
| PATCH  | `/api/books/:id/status`         | Librarian/Admin | Toggle book status                        |

### Order Endpoints

| Method | Endpoint                       | Access          | Description                      |
| ------ | ------------------------------ | --------------- | -------------------------------- |
| POST   | `/api/orders`                  | Protected       | Place a new order                |
| GET    | `/api/orders/my-orders`        | Protected       | Get user's orders                |
| GET    | `/api/orders/librarian/orders` | Librarian/Admin | Get orders for librarian's books |
| GET    | `/api/orders/librarian/stats`  | Librarian/Admin | Get librarian statistics         |
| GET    | `/api/orders/admin/all`        | Admin           | Get all orders                   |
| GET    | `/api/orders/admin/stats`      | Admin           | Get admin statistics             |
| GET    | `/api/orders/:id`              | Protected       | Get single order by ID           |
| PATCH  | `/api/orders/:id/cancel`       | Protected       | Cancel order                     |
| PATCH  | `/api/orders/:id/status`       | Librarian/Admin | Update order status              |
| PATCH  | `/api/orders/:id/payment`      | Protected       | Update payment status            |

### Payment Endpoints

| Method | Endpoint                    | Access    | Description                |
| ------ | --------------------------- | --------- | -------------------------- |
| POST   | `/api/payments`             | Protected | Create payment record      |
| GET    | `/api/payments/my-invoices` | Protected | Get user's payment history |

### Wishlist Endpoints

| Method | Endpoint                | Access    | Description               |
| ------ | ----------------------- | --------- | ------------------------- |
| POST   | `/api/wishlist`         | Protected | Add book to wishlist      |
| DELETE | `/api/wishlist/:bookId` | Protected | Remove book from wishlist |
| GET    | `/api/wishlist`         | Protected | Get user's wishlist       |

### Review Endpoints

| Method | Endpoint                    | Access    | Description                |
| ------ | --------------------------- | --------- | -------------------------- |
| POST   | `/api/reviews`              | Protected | Add or update review       |
| GET    | `/api/reviews/book/:bookId` | Public    | Get all reviews for a book |
| GET    | `/api/reviews/my-reviews`   | Protected | Get user's reviews         |

## 📁 Project Structure

```
bookcourier-server/
├── config/
│   ├── collections.js          # MongoDB collection names
│   ├── db.js                   # Database connection
│   └── firebase-admin.js       # Firebase Admin SDK setup
├── controllers/
│   ├── bookController.js       # Book-related logic
│   ├── orderController.js      # Order management logic
│   ├── paymentController.js    # Payment processing logic
│   ├── reviewController.js     # Review handling logic
│   ├── userController.js       # User management logic
│   └── wishlistController.js   # Wishlist operations
├── middleware/
│   ├── auth.js                 # Firebase token verification
│   ├── checkRole.js            # Role-based access control
│   ├── jwtAuth.js              # JWT authentication
│   ├── requestLogger.js        # Request logging middleware
│   └── validate.js             # Input validation chains
├── routes/
│   ├── bookRoutes.js           # Book endpoints
│   ├── orderRoutes.js          # Order endpoints
│   ├── paymentRoutes.js        # Payment endpoints
│   ├── reviewRoutes.js         # Review endpoints
│   ├── userRoutes.js           # User endpoints
│   └── wishlistRoutes.js       # Wishlist endpoints
├── utils/
│   ├── dbHelpers.js            # Database utility functions
│   ├── jwt.js                  # JWT utilities
│   └── response.js             # Response helper functions
├── docs/
│   └── CORS_TESTING.js         # CORS testing guide
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies and scripts
├── server.js                   # Application entry point
└── README.md                   # Project documentation
```

## 🔐 User Roles

### User (Default)

- Browse and search books
- Place orders
- Manage wishlist
- Add reviews (only for delivered orders)
- View order history and statistics

### Librarian

- All user permissions
- Add and manage their own books
- Update book status (published/unpublished)
- View orders for their books
- Access librarian statistics

### Admin

- All librarian permissions
- Manage all books (view, update, delete)
- View all orders
- Update order status
- Manage user roles
- Access comprehensive analytics

## 🧪 Testing CORS

See `docs/CORS_TESTING.js` for detailed CORS testing examples using:

- cURL commands
- Browser fetch API
- Postman

## 📝 Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Format code with Prettier
npm run format

# Lint code (if configured)
npm run lint
```

## 🔒 Security Features

- **Firebase Authentication** - Secure user authentication
- **JWT Tokens** - Stateless authentication
- **Role-Based Access Control** - Granular permission management
- **Input Validation** - Request validation using express-validator
- **CORS Protection** - Configured allowed origins
- **MongoDB Injection Prevention** - Using MongoDB native driver safely
- **Sensitive Data Redaction** - Passwords and tokens excluded from logs

## 🌐 Environment Modes

### Development

- Detailed error messages
- Request logging enabled
- CORS allows localhost

### Production

- Minimal error exposure
- Optimized logging
- Strict CORS policies

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🚀 Deployment

### Vercel Deployment

This server is ready to deploy on Vercel. See the detailed deployment guide:

📖 **[Vercel Deployment Guide](./docs/VERCEL_DEPLOYMENT.md)**

**Quick Deploy Steps:**

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com/new)
3. Set environment variables in Vercel dashboard
4. Deploy!

**Required Environment Variables for Vercel:**

- `MONGODB_URI` - Your MongoDB Atlas connection string
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT secret key
- `CLIENT_URL` - Your frontend URL
- `FIREBASE_SERVICE_ACCOUNT` - Firebase credentials as JSON string

See [VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md) for complete instructions.

## 👤 Author

**Md Abdullah Al Ahad**

- GitHub: [@md-abdullah-al-ahad](https://github.com/md-abdullah-al-ahad)

## 🙏 Acknowledgments

- Express.js team for the excellent framework
- MongoDB team for the powerful database
- Firebase team for authentication services
- All contributors and supporters

## 📧 Support

For support, email your-email@example.com or open an issue in the repository.

---

**Happy Coding! 🚀**
