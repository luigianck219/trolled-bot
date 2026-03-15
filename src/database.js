const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'trolled.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

async function init() {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(`PRAGMA journal_mode = WAL;`);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      username TEXT,
      points INTEGER DEFAULT 0,
      total_votes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS posts (
      post_id TEXT PRIMARY KEY,
      message_id TEXT,
      channel_id TEXT,
      target_user_id TEXT,
      title TEXT,
      video_url TEXT,
      description TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS votes (
      vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id TEXT,
      voter_id TEXT,
      stars INTEGER,
      voted_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(post_id, voter_id)
    );

    CREATE TABLE IF NOT EXISTS leaderboard_messages (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT,
      message_id TEXT
    );
  `);

  console.log('✅ Database inizializzato');
}

function getDB() {
  if (!db) throw new Error('Database non inizializzato');
  return db;
}

// --- USER ---
async function getUser(userId) {
  return getDB().get('SELECT * FROM users WHERE user_id = ?', userId);
}

async function upsertUser(userId, username) {
  await getDB().run(`
    INSERT INTO users (user_id, username, points, total_votes)
    VALUES (?, ?, 0, 0)
    ON CONFLICT(user_id) DO UPDATE SET username = excluded.username
  `, userId, username);
}

async function addPoints(userId, stars) {
  await getDB().run(`
    UPDATE users SET points = points + ?, total_votes = total_votes + 1 WHERE user_id = ?
  `, stars, userId);
}

async function getUserPoints(userId) {
  const row = await getDB().get('SELECT points, total_votes FROM users WHERE user_id = ?', userId);
  return row || { points: 0, total_votes: 0 };
}

async function getTopUsers(limit = 10) {
  return getDB().all(`
    SELECT user_id, username, points, total_votes
    FROM users
    WHERE points > 0
    ORDER BY points DESC
    LIMIT ?
  `, limit);
}

// --- POSTS ---
async function savePost(postId, messageId, channelId, targetUserId, title, videoUrl, description) {
  await getDB().run(`
    INSERT OR REPLACE INTO posts (post_id, message_id, channel_id, target_user_id, title, video_url, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, postId, messageId, channelId, targetUserId, title, videoUrl, description);
}

async function getPost(postId) {
  return getDB().get('SELECT * FROM posts WHERE post_id = ?', postId);
}

// --- VOTES ---
async function getVote(postId, voterId) {
  return getDB().get('SELECT * FROM votes WHERE post_id = ? AND voter_id = ?', postId, voterId);
}

async function saveVote(postId, voterId, stars) {
  await getDB().run(`
    INSERT INTO votes (post_id, voter_id, stars) VALUES (?, ?, ?)
  `, postId, voterId, stars);
}

async function getPostVotes(postId) {
  return getDB().get('SELECT COUNT(*) as count, AVG(stars) as avg FROM votes WHERE post_id = ?', postId);
}

// --- ADMIN ---
async function setPoints(userId, delta) {
  await getDB().run(`UPDATE users SET points = MAX(0, points + ?) WHERE user_id = ?`, delta, userId);
}

async function resetUser(userId) {
  await getDB().run("UPDATE users SET points = 0, total_votes = 0 WHERE user_id = ?", userId);
  await getDB().run("DELETE FROM votes WHERE voter_id = ?", userId);
  await getDB().run("DELETE FROM votes WHERE post_id IN (SELECT post_id FROM posts WHERE target_user_id = ?)", userId);
}

async function resetAllPoints() {
  await getDB().run("UPDATE users SET points = 0, total_votes = 0");
  await getDB().run("DELETE FROM votes");
}

// --- LEADERBOARD MESSAGE ---
async function getLeaderboardMessage(guildId) {
  return getDB().get('SELECT * FROM leaderboard_messages WHERE guild_id = ?', guildId);
}

async function setLeaderboardMessage(guildId, channelId, messageId) {
  await getDB().run(`
    INSERT OR REPLACE INTO leaderboard_messages (guild_id, channel_id, message_id)
    VALUES (?, ?, ?)
  `, guildId, channelId, messageId);
}

module.exports = {
  init,
  getUser,
  upsertUser,
  addPoints,
  getUserPoints,
  getTopUsers,
  savePost,
  getPost,
  getVote,
  saveVote,
  getPostVotes,
  getLeaderboardMessage,
  setLeaderboardMessage,
  setPoints,
  resetUser,
  resetAllPoints,
};
