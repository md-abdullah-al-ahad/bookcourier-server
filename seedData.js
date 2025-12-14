const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const seedData = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(process.env.DB_NAME || "bookcourier");

    // Clear existing data
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
        uid: "placeholder_user_uid", // Will be updated on first login
        name: "Regular User",
        email: "user@bookcourier.com",
        photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
        role: "user",
        hasPassword: true,
        passwordRequired: false,
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        uid: "placeholder_librarian_uid", // Will be updated on first login
        name: "Library Manager",
        email: "librarian@bookcourier.com",
        photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=librarian",
        role: "librarian",
        hasPassword: true,
        passwordRequired: false,
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        uid: "placeholder_admin_uid", // Will be updated on first login
        name: "Admin User",
        email: "m4xabdullah@gmail.com",
        photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
        role: "admin",
        hasPassword: true,
        passwordRequired: false,
        createdAt: new Date(),
      },
    ];

    await db.collection("users").insertMany(users);
    console.log(`✅ Inserted ${users.length} users`);

    const [regularUser, librarian, admin] = users;

    // ==================== SEED BOOKS ====================
    console.log("📚 Seeding books...");

    const books = [
      {
        _id: new ObjectId(),
        name: "To Kill a Mockingbird",
        author: "Harper Lee",
        category: "Classic Literature",
        price: 14.99,
        quantity: 30,
        imageURL: "https://i.ibb.co.com/chZKYD1w/To-Kill-a-Mockingbird.webp",
        description:
          "A gripping tale of racial injustice and childhood innocence in the American South.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
      },
      {
        _id: new ObjectId(),
        name: "1984",
        author: "George Orwell",
        category: "Dystopian Fiction",
        price: 13.99,
        quantity: 25,
        imageURL: "https://i.ibb.co.com/CK25TQTs/1984.webp",
        description:
          "A dystopian social science fiction novel and cautionary tale about totalitarianism.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      {
        _id: new ObjectId(),
        name: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        category: "Classic Literature",
        price: 12.99,
        quantity: 20,
        imageURL: "https://i.ibb.co.com/RkkCCQVh/The-Great-Gatsby.webp",
        description:
          "A classic American novel exploring themes of wealth, love, and the American Dream.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20"),
      },
      {
        _id: new ObjectId(),
        name: "Pride and Prejudice",
        author: "Jane Austen",
        category: "Romance",
        price: 11.99,
        quantity: 35,
        imageURL: "https://i.ibb.co.com/ktfmMcP/Pride-and-Prejudice.webp",
        description:
          "A romantic novel of manners that critiques the British landed gentry.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      },
      {
        _id: new ObjectId(),
        name: "The Hobbit",
        author: "J.R.R. Tolkien",
        category: "Fantasy",
        price: 15.99,
        quantity: 40,
        imageURL: "https://i.ibb.co.com/LH6mmkt/The-Hobbit.webp",
        description:
          "A fantasy novel about the quest of home-loving Bilbo Baggins.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-02-05"),
        updatedAt: new Date("2024-02-05"),
      },
      {
        _id: new ObjectId(),
        name: "Harry Potter and the Philosopher's Stone",
        author: "J.K. Rowling",
        category: "Fantasy",
        price: 16.99,
        quantity: 50,
        imageURL:
          "https://i.ibb.co.com/v6pwwQ70/Harry-Potter-and-the-Philosopher-s-Stone.webp",
        description:
          "The first novel in the Harry Potter series about a young wizard's journey.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-02-10"),
      },
      {
        _id: new ObjectId(),
        name: "The Catcher in the Rye",
        author: "J.D. Salinger",
        category: "Coming of Age",
        price: 13.99,
        quantity: 22,
        imageURL: "https://i.ibb.co.com/MxznZ3Nw/The-Catcher-in-the-Rye.webp",
        description:
          "A story about teenage rebellion and alienation narrated by Holden Caulfield.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-02-15"),
        updatedAt: new Date("2024-02-15"),
      },
      {
        _id: new ObjectId(),
        name: "The Lord of the Rings",
        author: "J.R.R. Tolkien",
        category: "Fantasy",
        price: 24.99,
        quantity: 28,
        imageURL: "https://i.ibb.co.com/3YM7Q8T6/the-lord-of-the-rings.jpg",
        description:
          "An epic high-fantasy novel about the quest to destroy the One Ring.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-02-20"),
        updatedAt: new Date("2024-02-20"),
      },
      {
        _id: new ObjectId(),
        name: "The Chronicles of Narnia",
        author: "C.S. Lewis",
        category: "Fantasy",
        price: 18.99,
        quantity: 32,
        imageURL: "https://i.ibb.co.com/rRtchqvX/the-chronicles-of-narnia.jpg",
        description:
          "A series of seven fantasy novels set in the magical land of Narnia.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-03-01"),
      },
      {
        _id: new ObjectId(),
        name: "Brave New World",
        author: "Aldous Huxley",
        category: "Dystopian Fiction",
        price: 14.99,
        quantity: 18,
        imageURL: "https://i.ibb.co.com/vxtsr9NK/brave-new-world.webp",
        description:
          "A dystopian novel exploring themes of technology, conditioning, and individual freedom.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-03-05"),
        updatedAt: new Date("2024-03-05"),
      },
      {
        _id: new ObjectId(),
        name: "The Alchemist",
        author: "Paulo Coelho",
        category: "Philosophy",
        price: 12.99,
        quantity: 45,
        imageURL: "https://i.ibb.co.com/gZd0NRwR/the-alchemist.jpg",
        description:
          "A philosophical novel about a young Andalusian shepherd on his journey to Egypt.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-03-10"),
        updatedAt: new Date("2024-03-10"),
      },
      {
        _id: new ObjectId(),
        name: "Moby-Dick",
        author: "Herman Melville",
        category: "Adventure",
        price: 15.99,
        quantity: 15,
        imageURL: "https://i.ibb.co.com/93Td8mmj/moby-dick.jpg",
        description:
          "The saga of Captain Ahab's obsessive quest to kill the white whale.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-03-15"),
        updatedAt: new Date("2024-03-15"),
      },
      {
        _id: new ObjectId(),
        name: "The Da Vinci Code",
        author: "Dan Brown",
        category: "Mystery",
        price: 16.99,
        quantity: 38,
        imageURL: "https://i.ibb.co.com/d43Hc1cQ/the-da-vinci-code.webp",
        description: "A mystery thriller following symbologist Robert Langdon.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-03-20"),
        updatedAt: new Date("2024-03-20"),
      },
      {
        _id: new ObjectId(),
        name: "The Kite Runner",
        author: "Khaled Hosseini",
        category: "Historical Fiction",
        price: 14.99,
        quantity: 27,
        imageURL: "https://i.ibb.co.com/nsBsWTMR/the-kite-runner.webp",
        description:
          "A story of friendship, betrayal, and redemption set in Afghanistan.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-03-25"),
        updatedAt: new Date("2024-03-25"),
      },
      {
        _id: new ObjectId(),
        name: "Life of Pi",
        author: "Yann Martel",
        category: "Adventure",
        price: 13.99,
        quantity: 24,
        imageURL: "https://i.ibb.co.com/Zp2WrBdk/life-of-pi.webp",
        description:
          "A survival story of a boy stranded on a lifeboat with a Bengal tiger.",
        status: "published",
        librarian: librarian._id,
        createdAt: new Date("2024-04-01"),
        updatedAt: new Date("2024-04-01"),
      },
    ];

    await db.collection("books").insertMany(books);
    console.log(`✅ Inserted ${books.length} books`);

    // ==================== SEED ORDERS ====================
    console.log("🛒 Seeding orders...");

    const orders = [
      {
        _id: new ObjectId(),
        user: regularUser._id,
        items: [
          {
            book: books[0]._id,
            bookName: books[0].name,
            quantity: 2,
            price: books[0].price,
          },
          {
            book: books[1]._id,
            bookName: books[1].name,
            quantity: 1,
            price: books[1].price,
          },
        ],
        totalAmount: books[0].price * 2 + books[1].price,
        orderStatus: "delivered",
        paymentStatus: "paid",
        shippingAddress: {
          street: "123 Main Street",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
        },
        createdAt: new Date("2024-04-05"),
        updatedAt: new Date("2024-04-10"),
      },
      {
        _id: new ObjectId(),
        user: regularUser._id,
        items: [
          {
            book: books[5]._id,
            bookName: books[5].name,
            quantity: 1,
            price: books[5].price,
          },
        ],
        totalAmount: books[5].price,
        orderStatus: "pending",
        paymentStatus: "pending",
        shippingAddress: {
          street: "123 Main Street",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
        },
        createdAt: new Date("2024-12-10"),
        updatedAt: new Date("2024-12-10"),
      },
    ];

    await db.collection("orders").insertMany(orders);
    console.log(`✅ Inserted ${orders.length} orders`);

    // ==================== SEED PAYMENTS ====================
    console.log("💳 Seeding payments...");

    const payments = [
      {
        _id: new ObjectId(),
        order: orders[0]._id,
        user: regularUser._id,
        amount: orders[0].totalAmount,
        paymentMethod: "stripe",
        paymentStatus: "completed",
        transactionId: "txn_" + new ObjectId().toString(),
        createdAt: new Date("2024-04-05"),
      },
    ];

    await db.collection("payments").insertMany(payments);
    console.log(`✅ Inserted ${payments.length} payments`);

    // ==================== SEED WISHLISTS ====================
    console.log("❤️  Seeding wishlists...");

    const wishlists = [
      {
        _id: new ObjectId(),
        user: regularUser._id,
        book: books[3]._id,
        createdAt: new Date("2024-04-02"),
      },
      {
        _id: new ObjectId(),
        user: regularUser._id,
        book: books[7]._id,
        createdAt: new Date("2024-04-03"),
      },
      {
        _id: new ObjectId(),
        user: regularUser._id,
        book: books[10]._id,
        createdAt: new Date("2024-04-04"),
      },
    ];

    await db.collection("wishlists").insertMany(wishlists);
    console.log(`✅ Inserted ${wishlists.length} wishlist items`);

    // ==================== SEED REVIEWS ====================
    console.log("⭐ Seeding reviews...");

    const reviews = [
      {
        _id: new ObjectId(),
        book: books[0]._id,
        user: regularUser._id,
        userName: regularUser.name,
        rating: 5,
        comment: "An absolute masterpiece! A must-read for everyone.",
        createdAt: new Date("2024-04-12"),
      },
      {
        _id: new ObjectId(),
        book: books[1]._id,
        user: regularUser._id,
        userName: regularUser.name,
        rating: 5,
        comment:
          "Chilling and thought-provoking. More relevant today than ever.",
        createdAt: new Date("2024-04-13"),
      },
      {
        _id: new ObjectId(),
        book: books[5]._id,
        user: regularUser._id,
        userName: regularUser.name,
        rating: 5,
        comment: "Magic, adventure, and friendship. Perfect for all ages!",
        createdAt: new Date("2024-04-14"),
      },
    ];

    await db.collection("reviews").insertMany(reviews);
    console.log(`✅ Inserted ${reviews.length} reviews`);

    console.log("\n🎉 Seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📚 Books: ${books.length}`);
    console.log(`   🛒 Orders: ${orders.length}`);
    console.log(`   💳 Payments: ${payments.length}`);
    console.log(`   ❤️  Wishlist Items: ${wishlists.length}`);
    console.log(`   ⭐ Reviews: ${reviews.length}`);

    console.log(
      "\n🔐 User Credentials (Create these in Firebase Authentication):"
    );
    console.log("   📧 User: user@bookcourier.com | Password: User@123");
    console.log(
      "   📧 Librarian: librarian@bookcourier.com | Password: Librarian@123"
    );
    console.log("   📧 Admin: m4xabdullah@gmail.com | Password: Admin@123");
    console.log(
      "\n⚠️  IMPORTANT: Create these users in Firebase Authentication with the same emails."
    );
    console.log(
      "   The backend will automatically sync the Firebase UID when they first log in."
    );
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    await client.close();
    console.log("\n✅ Disconnected from MongoDB");
  }
};

seedData();
