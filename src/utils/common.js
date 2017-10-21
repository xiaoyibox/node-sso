'use strict';
var tgtMap = require('../dataobject/TGTMap');
var config = require('../config/config').config;
/**
 * 随机生成字符串
 * @param randomFlag
 * @param min
 * @param max
 * @returns {string}
 */
var getRandomString = function randomWord(randomFlag, min, max){
    var str = '',
        range = min,
        arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    // 随机产生
    if(randomFlag){
        range = Math.round(Math.random() * (max-min)) + min;
    }
    for(var i=0; i<range; i++){
        var pos = Math.round(Math.random() * (arr.length-1));
        str += arr[pos];
    }
    return str;
};

/**
 * 随机产生相关位数的随机数
 * @param randomFlag
 * @param min
 * @param max
 * @returns {string}
 */
exports.getRandomString = function randomWord(randomFlag, min, max){
    return getRandomString(randomFlag, min, max);
};

/**
 * 判断是否为空
 * @param data
 * @returns {boolean}
 */
exports.isEmpty = function(data){
    return (data === '' || data === undefined || data === null) ? true : false;
};
/**
 * 验证图片验证码和session保存的验证码是否一致
 * @param vcode
 * @param sessCode
 * @returns {boolean}
 */
exports.validateVCode = function(vcode,sessCode){
    if (!this.isEmpty(vcode)
        && !this.isEmpty(sessCode)
        && vcode.toLowerCase() === sessCode.toLowerCase()){
        return true;
    }
    return false;
};
/**
 * 校验signin Token和Ticket
 * @param req
 * @returns {boolean}
 */
exports.checkCSRF= function (req) {
    if(this.isEmpty(req.body.signToken) || req.session.signToken !== req.body.signToken
        ||this.isEmpty(req.body.signTicket)|| req.session.signTicket !== req.body.signTicket){
        return false;
    }
    return true;
};
/**
 * 设置验证token和ticket，用于form提交的CSRF
 * @param req
 * @returns {{signToken: string, signTicket: string}}
 */
exports.setSignTokenAndTicket = function(req){
    var ses=req.session,
        signToken = getRandomString(false,32),
        signTicket = getRandomString(false,32);
    ses.signToken = signToken;
    ses.signTicket = signTicket;
    return {signToken:signToken,signTicket:signTicket};
};
/**
 * 验证tgt，返回一个json对象：result：true|false ， data.nstgc , data.tgt
 * @param req
 * @returns {{}}
 */
exports.validationTGC = function(req){
    var data = {};
    //在cookies中获取tgc
    data.nstgc = req.cookies.nstgc;
    //判断nstgc是否存在,并且长度等于tgc的配置的长度
    if(data.nstgc && data.nstgc.length > config.stLength){
        //从缓存中通过nstgc的值作为key，获取tgt对象
        var tgt = tgtMap[data.nstgc];
        //如果tgt在缓存中存在，并且username不为空，同时login的状态为true
        if(tgt && tgt.username && tgt.login === true){
            data.tgt = tgt;
            data.result = true;
        }else{
            //只要失败就需要登录，跳转到登录页面
            data.result = false;
        }
    }else{
        //只要失败就需要登录，跳转到登录页面
        data.result =  false;
    }
    return data;
};
/**
 * 生成TGC和TGT
 * @param req
 */
exports.createTGCAndTGT = function(req,res){
    //生成一个tgc，在分布式应用中，尽量的确保这个tgc的唯一性
    var tgc = this.getRandomString(false,config.stLength)+this.getRandomString(false,5) + config.serviceId;
    //生成tgc后，创建一个保存用户信息的tgt对象，tgc作为key保存在cookies中，用于SSO的多系统验证
    var tgt = {
        username:req.body.username,
        login:true
    };
    //将tgc存放在缓存中，用与tgc的其他系统SSO验证使用,若使用redis则将这个对象存放到redis中
    tgtMap[tgc] = tgt;
    //将tgc设置到cookies中，过期时间为900000，httpOnly为true
    res.cookie('nstgc', tgc, {path:config.nstgcCookiesPath,maxAge: config.nstgcMaxAge, httpOnly: config.nstgcHttpOnly });
};
/**
 * 生成ST票据
 */
exports.createST = function(req){
    //生成ST，用于登录成功后的获取用户信息的唯一令牌，有效期可以进行配置，默认为5秒
    var st = this.getRandomString(false,config.stLength);
    //由于用户的st的时间只有很短的时效性，这个st会保存到session中，同时保存这个值的过期时间
    req.session.st = st;
    req.session.stExpiresTime = new Date().getTime() + config.stExpiresTime;
    return st;
};

exports.setCookies = function(){

};

exports.getCookies = function(){

};