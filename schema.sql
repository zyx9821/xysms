DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    balance REAL DEFAULT 0.00,
    api_token TEXT UNIQUE
);

DROP TABLE IF EXISTS api_configs;
CREATE TABLE api_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_name TEXT NOT NULL,
    api_url TEXT NOT NULL,
    api_key TEXT,
    is_active INTEGER DEFAULT 1
);

DROP TABLE IF EXISTS sms_orders;
CREATE TABLE sms_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    phone_number TEXT,
    verification_code TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
