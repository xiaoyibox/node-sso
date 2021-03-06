# node-sso
这是一个基于NodeJS的SSO项目，支持NodeJS、java等多类型项目的接入。
web框架使用 Express4.15.5 + jade + less + semantic-ui

### Quick Start
Install dependencies:
~~~ shell
npm install -g pm2
npm install
~~~
Start app at http://localhost:3000/: [用户名为：username 密码为：password]
~~~ shell
node ./bin/www
~~~
or
~~~ shell
pm2 start pm2Conf.json
~~~

#### 构建Express + jade项目
* 安装Node环境，包含npm
* 全局安装 npm install -g express-generator
* 创建项目目录并进入
* 执行：express --view=jade
* npm install [安装依赖的项目]
* 完成Express项目的构建
* npm start
* 访问http://localhost:3000



#### 配置说明
##### 系统配置
~~~ javascript 1.8
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
~~~

##### pm2启动配置
~~~ javascript 1.8
{
  "apps": {
    "name": "node-sso",//启动后的名称
    "cwd": "项目根目录",
    "script": "./bin/www",//启动文件
    "min_uptime": "60s",
    "max_restarts": 3,//最大重启次数
    "max_memory_restart": "128M",//最大使用内存，超过此内存后自动restart
    "instances": "max",//max，cpu的核心数，可以写1，2，3...
    "exec_mode": "cluster",//cluster 模式
    "error_file": "/logs/pm2-err.log",
    "out_file": "/logs/pm2-out.log",
    "pid_file": "/logs/nodesso.pid",
    "env": {
      "NODE_ENV": "production"//运行环境
    },
    "log_date_format": "YYYY-MM-DD HH:mm Z",//log 日期格式
    "combine_logs": true,
    "merge_logs": true,
    "watch": true //默认打开，文件变动后会自动加载，切记不要把log文件放入到项目中，否则会不断的自动重启。
  }
}

/*
  注意：生产环境一定要根据自己的实际情况进行配置  
//*/
~~~

