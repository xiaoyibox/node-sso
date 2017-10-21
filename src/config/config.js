'use strict';
exports.redisConfig = {
    redisIP : '127.0.0.1',
    redisPort : '6379',
    redisExpTime : 7200,//Redis session TTL过期时间，单位秒
    redisDB : 0,
    redisPrefix : 'nsso:', //redis前缀，默认为sess:，这里配置nsso=node-sso
    redisPass : '123456',

    //redis connection pool config
    redisMaxConnection : 300, //max connection num , default 30
    redisPerformChecks : false, //checks for needed push/pop functionality
    redisConfigDBNu : 0, //used num 0 of redis db
};

exports.cookie = {
        path :'/',
        maxAge : 1800000,
        secure : false, //https config true,http config false
        httpOnly : true
}
exports.sessionStore = {
    'host' : this.redisConfig.redisIP,
    'port' : this.redisConfig.redisPort,
    'pass' : this.redisConfig.redisPass,
    'prefix' : this.redisConfig.redisPrefix,
    'db' : this.redisConfig.redisDB,
    'ttl' : this.redisConfig.redisExpTime,//Redis session TTL过期时间，单位秒
    'logErrors' : true
}

exports.config = {
    sessionKey : 'nsso.session',
    sessionSecret : 'Asecret-node-sso-secret-XOSODF9sdf7D9sd9fu-dev',
    cookieName : 'nodesso',
    proxyConfig : 1,//proxy config
    sessionStoreType : 2, //1:内存 2:redis
    favicon : false,//是否防止favicon，默认为false
    morganLevel : 'dev',//log 级别
    stExpiresTime : 5,//登录成功后ST的过期时间为5秒
    stLength : 64,//st的字符长度
    nstgcCookiesPath : '/',//cookies存储路径
    nstgcMaxAge : 86400,//nstgc的cookies过期时间
    nstgcHttpOnly:true,//HttpOnly设置，推荐true，安全
    serviceId:1,//运行服务的ID号，用户生成TGC的server唯一识别码，分布式下不同的server配置不同的ID号
};