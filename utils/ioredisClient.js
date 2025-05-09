// utils/ioredisClient.js

const Redis = require('ioredis');

// For local Redis — adjust config for cloud/cluster
const redis = new Redis({
  host: 'redis-stack',
  port: 6379,
  // password: 'yourPassword', // if needed
  // retryStrategy: times => Math.min(times * 50, 2000) // optional
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

module.exports = redis;
