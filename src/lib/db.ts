import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Define the path to the SQLite database file
const dbPath = path.join(process.cwd(), 'database.sqlite');

// Ensure the directory exists (though in this case it's process.cwd(), it's good practice)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize the database connection
const db = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' ? console.log : undefined });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Document',
    content TEXT,
    owner_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_edited_by TEXT,
    FOREIGN KEY(owner_id) REFERENCES users(id),
    FOREIGN KEY(last_edited_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS document_shares (
    document_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    PRIMARY KEY (document_id, user_id),
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS document_comments (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    thread_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    quote TEXT,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Migration to add 'role' if upgrading
try {
  const columns = db.pragma('table_info(document_shares)') as { name: string }[];
  if (!columns.some(c => c.name === 'role')) {
    db.exec("ALTER TABLE document_shares ADD COLUMN role TEXT NOT NULL DEFAULT 'viewer'");
  }
} catch (e) {
  console.log("Migration check complete", e);
}

// Create indices for faster lookups based on our access patterns
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
  CREATE INDEX IF NOT EXISTS idx_document_shares_user ON document_shares(user_id);
`);


// Seed the database with some initial users if empty
const seedUsers = () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO users (id, name, email) VALUES (?, ?, ?)');
    const insertTx = db.transaction(() => {
      insert.run('user_moazzam', 'Moazzam Waheed', 'moazzamwaheed@gmail.com');
      insert.run('user_reviewer', 'Ajaia Reviewer', 'reviewer@ajaia.io');
      insert.run('user_collab', 'Alex Collaborator', 'alex@ajaia.io');
    });
    insertTx();
  }
};

seedUsers();

export default db;
