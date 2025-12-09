const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const seedData = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(process.env.DB_NAME || "bookcourier");

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing data...");
    await db.collection("users").deleteMany({});
    await db.collection("books").deleteMany({});
    await db.collection("orders").deleteMany({});
    await db.collection("payments").deleteMany({});
    await db.collection("wishlists").deleteMany({});
    await db.collection("reviews").deleteMany({});

    // ==================== SEED USERS ====================
    console.log("👥 Seeding users...");

    const users = [
      {
        _id: new ObjectId(),
        uid: "user1_firebase_uid",
        name: "John Doe",
        email: "john@example.com",
        photoURL: "https://i.pravatar.cc/150?img=1",
        role: "user",
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        uid: "user2_firebase_uid",
        name: "Jane Smith",
        email: "jane@example.com",
        photoURL: "https://i.pravatar.cc/150?img=2",
        role: "user",
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        uid: "librarian1_firebase_uid",
        name: "Alice Johnson",
        email: "alice@example.com",
        photoURL: "https://i.pravatar.cc/150?img=3",
        role: "librarian",
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        uid: "librarian2_firebase_uid",
        name: "Bob Wilson",
        email: "bob@example.com",
        photoURL: "https://i.pravatar.cc/150?img=4",
        role: "librarian",
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        uid: "admin1_firebase_uid",
        name: "Admin User",
        email: "admin@example.com",
        photoURL: "https://i.pravatar.cc/150?img=5",
        role: "admin",
        createdAt: new Date(),
      },
    ];

    await db.collection("users").insertMany(users);
    console.log(`✅ Inserted ${users.length} users`);

    // Get user IDs for references
    const [user1, user2, librarian1, librarian2, admin] = users;

    // ==================== SEED BOOKS ====================
    console.log("📚 Seeding books...");

    const books = [
      {
        _id: new ObjectId(),
        name: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        category: "Classic Literature",
        price: 12.99,
        quantity: 25,
        imageURL:
          "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400",
        description:
          "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.",
        status: "published",
        librarian: librarian1._id,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      {
        _id: new ObjectId(),
        name: "To Kill a Mockingbird",
        author: "Harper Lee",
        category: "Classic Literature",
        price: 14.99,
        quantity: 30,
        imageURL:
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
        description:
          "A gripping tale of racial injustice and childhood innocence in the American South.",
        status: "published",
        librarian: librarian1._id,
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20"),
      },
      {
        _id: new ObjectId(),
        name: "1984",
        author: "George Orwell",
        category: "Science Fiction",
        price: 13.99,
        quantity: 20,
        imageURL:
          "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400",
        description:
          "A dystopian social science fiction novel and cautionary tale about totalitarianism.",
        status: "published",
        librarian: librarian2._id,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      },
      {
        _id: new ObjectId(),
        name: "Pride and Prejudice",
        author: "Jane Austen",
        category: "Romance",
        price: 11.99,
        quantity: 35,
        imageURL:
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
        description:
          "A romantic novel of manners exploring themes of love, reputation, and class.",
        status: "published",
        librarian: librarian2._id,
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-02-10"),
      },
      {
        _id: new ObjectId(),
        name: "The Hobbit",
        author: "J.R.R. Tolkien",
        category: "Fantasy",
        price: 16.99,
        quantity: 40,
        imageURL:
          "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400",
        description:
          "A fantasy adventure about a hobbit's unexpected journey to reclaim a treasure guarded by a dragon.",
        status: "published",
        librarian: librarian1._id,
        createdAt: new Date("2024-02-15"),
        updatedAt: new Date("2024-02-15"),
      },
      {
        _id: new ObjectId(),
        name: "Harry Potter and the Sorcerer's Stone",
        author: "J.K. Rowling",
        category: "Fantasy",
        price: 15.99,
        quantity: 50,
        imageURL:
          "https://images.unsplash.com/photo-1551029506-0807df4e2031?w=400",
        description:
          "The first book in the magical Harry Potter series about a young wizard's adventures.",
        status: "published",
        librarian: librarian1._id,
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-03-01"),
      },
      {
        _id: new ObjectId(),
        name: "The Catcher in the Rye",
        author: "J.D. Salinger",
        category: "Coming-of-Age",
        price: 13.49,
        quantity: 18,
        imageURL:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
        description:
          "A controversial novel about teenage rebellion and alienation.",
        status: "published",
        librarian: librarian2._id,
        createdAt: new Date("2024-03-10"),
        updatedAt: new Date("2024-03-10"),
      },
      {
        _id: new ObjectId(),
        name: "The Lord of the Rings",
        author: "J.R.R. Tolkien",
        category: "Fantasy",
        price: 24.99,
        quantity: 15,
        imageURL:
          "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400",
        description:
          "An epic high fantasy trilogy about the quest to destroy the One Ring.",
        status: "published",
        librarian: librarian1._id,
        createdAt: new Date("2024-03-20"),
        updatedAt: new Date("2024-03-20"),
      },
      {
        _id: new ObjectId(),
        name: "Brave New World",
        author: "Aldous Huxley",
        category: "Science Fiction",
        price: 14.49,
        quantity: 22,
        imageURL:
          "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400",
        description:
          "A dystopian novel set in a futuristic World State of genetically modified citizens.",
        status: "published",
        librarian: librarian2._id,
        createdAt: new Date("2024-04-01"),
        updatedAt: new Date("2024-04-01"),
      },
      {
        _id: new ObjectId(),
        name: "The Chronicles of Narnia",
        author: "C.S. Lewis",
        category: "Fantasy",
        price: 19.99,
        quantity: 28,
        imageURL:
          "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400",
        description:
          "A series of fantasy novels about children who enter a magical world.",
        status: "published",
        librarian: librarian1._id,
        createdAt: new Date("2024-04-10"),
        updatedAt: new Date("2024-04-10"),
      },
      {
        _id: new ObjectId(),
        name: "Moby Dick",
        author: "Herman Melville",
        category: "Adventure",
        price: 15.49,
        quantity: 12,
        imageURL:
          "https://images.unsplash.com/photo-1580169980114-ccd0babfa840?w=400",
        description:
          "An epic tale of obsession and revenge against a great white whale.",
        status: "unpublished",
        librarian: librarian2._id,
        createdAt: new Date("2024-04-15"),
        updatedAt: new Date("2024-04-15"),
      },
    ];

    await db.collection("books").insertMany(books);
    console.log(`✅ Inserted ${books.length} books`);

    // Get published book IDs for orders
    const publishedBooks = books.filter((b) => b.status === "published");

    // ==================== SEED ORDERS ====================
    console.log("🛒 Seeding orders...");

    const orders = [
      {
        _id: new ObjectId(),
        user: user1._id,
        book: publishedBooks[0]._id,
        bookName: publishedBooks[0].name,
        quantity: 2,
        totalPrice: publishedBooks[0].price * 2,
        deliveryAddress: "123 Main St, New York, NY 10001",
        phoneNumber: "+1234567890",
        orderStatus: "delivered",
        paymentStatus: "paid",
        orderDate: new Date("2024-11-01"),
        deliveryDate: new Date("2024-11-05"),
      },
      {
        _id: new ObjectId(),
        user: user1._id,
        book: publishedBooks[1]._id,
        bookName: publishedBooks[1].name,
        quantity: 1,
        totalPrice: publishedBooks[1].price,
        deliveryAddress: "123 Main St, New York, NY 10001",
        phoneNumber: "+1234567890",
        orderStatus: "shipped",
        paymentStatus: "paid",
        orderDate: new Date("2024-11-15"),
      },
      {
        _id: new ObjectId(),
        user: user2._id,
        book: publishedBooks[2]._id,
        bookName: publishedBooks[2].name,
        quantity: 1,
        totalPrice: publishedBooks[2].price,
        deliveryAddress: "456 Oak Ave, Los Angeles, CA 90001",
        phoneNumber: "+9876543210",
        orderStatus: "delivered",
        paymentStatus: "paid",
        orderDate: new Date("2024-10-20"),
        deliveryDate: new Date("2024-10-25"),
      },
      {
        _id: new ObjectId(),
        user: user2._id,
        book: publishedBooks[3]._id,
        bookName: publishedBooks[3].name,
        quantity: 3,
        totalPrice: publishedBooks[3].price * 3,
        deliveryAddress: "456 Oak Ave, Los Angeles, CA 90001",
        phoneNumber: "+9876543210",
        orderStatus: "pending",
        paymentStatus: "unpaid",
        orderDate: new Date("2024-12-05"),
      },
      {
        _id: new ObjectId(),
        user: user1._id,
        book: publishedBooks[4]._id,
        bookName: publishedBooks[4].name,
        quantity: 2,
        totalPrice: publishedBooks[4].price * 2,
        deliveryAddress: "123 Main St, New York, NY 10001",
        phoneNumber: "+1234567890",
        orderStatus: "cancelled",
        paymentStatus: "unpaid",
        orderDate: new Date("2024-11-25"),
      },
    ];

    await db.collection("orders").insertMany(orders);
    console.log(`✅ Inserted ${orders.length} orders`);

    // Get delivered order IDs for payments
    const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered");

    // ==================== SEED PAYMENTS ====================
    console.log("💳 Seeding payments...");

    const payments = [
      {
        _id: new ObjectId(),
        user: user1._id,
        order: deliveredOrders[0]._id,
        amount: deliveredOrders[0].totalPrice,
        paymentMethod: "Credit Card",
        paymentId: "pay_" + Math.random().toString(36).substr(2, 9),
        transactionId: "txn_" + Math.random().toString(36).substr(2, 9),
        status: "success",
        paymentDate: new Date("2024-11-01"),
      },
      {
        _id: new ObjectId(),
        user: user2._id,
        order: deliveredOrders[1]._id,
        amount: deliveredOrders[1].totalPrice,
        paymentMethod: "PayPal",
        paymentId: "pay_" + Math.random().toString(36).substr(2, 9),
        transactionId: "txn_" + Math.random().toString(36).substr(2, 9),
        status: "success",
        paymentDate: new Date("2024-10-20"),
      },
    ];

    await db.collection("payments").insertMany(payments);
    console.log(`✅ Inserted ${payments.length} payments`);

    // ==================== SEED WISHLISTS ====================
    console.log("❤️  Seeding wishlists...");

    const wishlists = [
      {
        _id: new ObjectId(),
        user: user1._id,
        book: publishedBooks[5]._id,
        addedAt: new Date("2024-11-10"),
      },
      {
        _id: new ObjectId(),
        user: user1._id,
        book: publishedBooks[6]._id,
        addedAt: new Date("2024-11-12"),
      },
      {
        _id: new ObjectId(),
        user: user2._id,
        book: publishedBooks[7]._id,
        addedAt: new Date("2024-11-15"),
      },
      {
        _id: new ObjectId(),
        user: user2._id,
        book: publishedBooks[8]._id,
        addedAt: new Date("2024-11-18"),
      },
    ];

    await db.collection("wishlists").insertMany(wishlists);
    console.log(`✅ Inserted ${wishlists.length} wishlist items`);

    // ==================== SEED REVIEWS ====================
    console.log("⭐ Seeding reviews...");

    const reviews = [
      {
        _id: new ObjectId(),
        user: user1._id,
        book: publishedBooks[0]._id,
        rating: 5,
        comment:
          "Absolutely loved this book! A timeless classic that everyone should read.",
        createdAt: new Date("2024-11-06"),
      },
      {
        _id: new ObjectId(),
        user: user2._id,
        book: publishedBooks[2]._id,
        rating: 4,
        comment:
          "Very thought-provoking and relevant even today. Highly recommend!",
        createdAt: new Date("2024-10-26"),
      },
      {
        _id: new ObjectId(),
        user: user1._id,
        book: publishedBooks[1]._id,
        rating: 5,
        comment:
          "A powerful story that stays with you long after you finish reading.",
        createdAt: new Date("2024-11-20"),
      },
      {
        _id: new ObjectId(),
        user: user2._id,
        book: publishedBooks[0]._id,
        rating: 4,
        comment: "Great story and well-written. A must-read classic!",
        createdAt: new Date("2024-11-08"),
      },
    ];

    await db.collection("reviews").insertMany(reviews);
    console.log(`✅ Inserted ${reviews.length} reviews`);

    // ==================== SUMMARY ====================
    console.log("\n🎉 Seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📚 Books: ${books.length}`);
    console.log(`   🛒 Orders: ${orders.length}`);
    console.log(`   💳 Payments: ${payments.length}`);
    console.log(`   ❤️  Wishlist Items: ${wishlists.length}`);
    console.log(`   ⭐ Reviews: ${reviews.length}`);
    console.log(
      "\n⚠️  Note: These users have Firebase UIDs like 'user1_firebase_uid'"
    );
    console.log(
      "   To use them, you'll need to create matching Firebase users or update the UIDs.\n"
    );
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    await client.close();
    console.log("✅ Disconnected from MongoDB");
  }
};

// Run the seeder
seedData();
