'use strict';

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