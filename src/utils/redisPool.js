'use strict';
var co = require('co');
/**
 * Created by Yi.Ma on 17/10/18.
 */
var config = require('../config/config').redisConfig;
/* jshint ignore:start */
exports.redisPool = require('redis-connection-pool')('jtsRedisPool', {
    host: config.redisIP, // default
    port: config.redisPort, //default
    // optionally specify full redis url, overrides host + port properties
    // url: "redis://username:password@host:port"
    max_clients: config.redisMaxConnection, // defalut
    perform_checks: config.redisPerformChecks, // checks for needed push/pop functionality
    database: config.redisConfigDBNu, // database number to use
    options: {
        auth_pass: config.redisPass
    } //options for createClient of node-redis, optional
});
/* jshint ignore:end */

/*
 *
 * Demo:
 redisPool.set('test-key', 'foobar', function (err) {
 redisPool.get('test-key', function (err, reply) {
 console.log(reply); // 'foobar'
 });
 });

 *
 * */

/*
 Implemented methods:

 get(key, cb)
 set(key, value, callback)
 expire(key, value, callback) //为key设置过期时间


 ttl(key,cb) //查看key的剩余时间
 del(key, callback)
 hget(key, field, callback)
 hgetall(key, callback)
 hset(key, field, value, callback)
 hset(key, field, value, callback)
 brpop(key, cb)
 blpop(key, cb)
 rpush(key, value, callback)
 lpush(key, value, callback)


 * */