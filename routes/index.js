var express = require('express');
var router = express.Router();
var common = require('../src/utils/common');
var config = require('../src/config/config');
var tgtMap = require('../src/dataobject/TGTMap');
var redisPool = require('../src/utils/redisPool').redisPool;
var co = require('co');

/**
 * 1 登录页，支持空路径和反斜杠路径
 */
router.get(['','/'], function(req, res, next) {
    //生成用于防止CSRF攻击的Formtoken和ticket
    var tokenAndTicket = common.setSignTokenAndTicket(req);
    /*
        获取参数service，首页传递service的时候需要使用'/',因为firefox不会自动添加反斜杠，chrome会自动添加
        firefox : http://xxx.xxx.xxx?service=https://yyy.yyy.yyy [不会自动添加反斜杠]
        chrome : http://xxx.xxx.xxx/?service=https://yyy.yyy.yyy [会自动添加反斜杠]
    //*/
    var service =req.query.service;
    //用于返回的data数据对象
    var data = {};
    //判断service是否为空，如果为空赋值为空字符串，到前端页面时为空字符串而不是undefined
    if(!service){
        service = '';
    }
    //把service的值复制到data的service参数中，传递出去
    data.service = service;
    //把token和ticket赋值到data数据参数中，传递出去
    data.signToken = tokenAndTicket.signToken;
    data.signTicket = tokenAndTicket.signTicket;
    //render index page
    res.render('index', data);
});




/**
 * 2 post 执行登录的操作
 */
router.post('/login.html', function(req, res, next) {
    co(function* () {
        //用于返回的data数据对象
        var data ={};
        //登录传递的参数中包含form token 和 ticket，common.checkCSRF验证传递过来的token和ticket是否正确
        //如果正确可以执行登录的验证操作，不正确则提醒非法操作
        if(common.checkCSRF(req)){
            //判断传递过来的用户名和密码是否正确，如果正确执行登录操作，如果不正确提醒用户名或者密码错误，用户simple演示
            //默认的用户名是username，默认的密码是password
            if(req.body.username === 'username'
                && req.body.password === 'password'
            ){
                //验证验证码是否正确，如果验证吗不正确提醒验证码不正确，否则进行登录操作
                if(req.body.randomcode === req.session.randomcode){
                    //验证码正确后，直接修改掉这个验证码，将它设置为其他的，令其失效。
                    req.session.randomcode = '';

                    //生成TGC和TGT
                    common.createTGCAndTGT(req,res);
                    //生成ST
                    data.ST = common.createST(req);

                    //完成登录后将结果设置为成功
                    data.result = 'success';
                }else{//验证吗不正确给出的提醒，结果为失败，消息为msg
                    data.result = 'fail';
                    data.msg = '您输入的验证码不正确。';
                }
            }else{//用户名或者密码不正确
                data.result = 'fail';
                data.msg = '用户名或者密码不正确。';
            }
        }else{//token and ticket 验证失败
            data.msg = '您正在非法操作，请刷新页面重试。';
        }
        //返回登录后的结果，如果service被赋值了，前端页面会根据service是否有值进行callback的操作，同时携带上ST
        res.json(data);
    });
});
/**
 * 3 验证ST，获取用户信息
 */
router.get('/vst.html',function(req,res){
    //获取参数st
    var st =req.query.st;
    //用于返回数据的对象
    var data = {};
    //获取当前时间，用于和session的st进行时间对比，如果在有效期内，则返回用户信息，不在则提醒验证失败
    var currentTime = new Date().getTime();
    //判断获取到的st是否为空，长度是否是配置的长度，是否和session的st相等，是否在有效期内
    //如果同时满足，则在缓存中获取用户信息进行返回，同时将st清空，过期时间清零
    if(st && st.length === config.config.stLength && st === req.session.st && req.session.stExpiresTime <= currentTime){
        req.session.st = '';
        req.session.stExpiresTime = 0;
        data.result = 'success';
    }else{
        data.result = 'fail';
    }
    res.json(data);
});
/**
 * 4 没有service参数的情况下登录成功的返回页面
 */
router.get('/success.html', function(req, res, next) {
    //验证TGC，并返回TGT对象，如果data.result等于true，则包含tgt对象和nstgc值，等于false时没有tgc和tgt
    var data = {};
    //在cookies中获取tgc
    data.nstgc = req.cookies.nstgc;
    //判断nstgc是否存在,并且长度等于tgc的配置的长度
    if(data.nstgc && data.nstgc.length > config.config.stLength){
        var tgt = {};
        //判断缓存是否使用的是redis，2为redis
        if(config.config.sessionStoreType === 2){
            redisPool.get(data.nstgc, function (err, reply) {
                tgt = JSON.parse(reply);
                if(tgt && tgt.username && tgt.login === true){
                    data.username = tgt.username;
                    res.render('success', data);
                }else{
                    //只要失败就需要登录，跳转到登录页面
                    res.redirect('/');
                }
            });
        }else if(config.config.sessionStoreType === 1){
            //从缓存中通过nstgc的值作为key，获取tgt对象
            tgt = tgtMap[data.nstgc];
            if(tgt && tgt.username && tgt.login === true){
                data.username = tgt.username;
                res.render('success', data);
            }else{
                //只要失败就需要登录，跳转到登录页面
                res.redirect('/');
            }
        }
    }else{
        //只要失败就需要登录，跳转到登录页面
        data.result =  false;
        res.redirect('/');
    }
});

function validationTGT(service,tgt,req){
    //如果tgt在缓存中存在，并且username不为空，同时login的状态为true
    if(tgt && tgt.username && tgt.login === true && service){
        //生成ST
        var st = common.createST(req);
        //一切正常后跳转到service的url，并且携带上这个新生成的ST票据
        return(service+'?ST='+st);
    }else{
        //只要失败就需要登录，跳转到登录页面
        return('/');
    }
}

/**
 * 5 验证tgc
 */
router.get('/vtgc.html',function(req,res){
        //获取servcie参数，这个参数是必须的，因为这个操作是其他子系统的验证操作，验证完成后必须返回的地址
        //Express3 : var service =req.param('service');
        //Express4 : var service =req.query.service;
        var service =req.query.service;
        //验证TGC，并返回TGT对象，如果data.result等于true，则包含tgt对象和nstgc值，等于false时没有tgc和tgt
        var data = {};
        //在cookies中获取tgc
        data.nstgc = req.cookies.nstgc;
        //判断nstgc是否存在,并且长度等于tgc的配置的长度
        if(data.nstgc && data.nstgc.length > config.config.stLength){
            var tgt = {};
            //判断缓存是否使用的是redis，2为redis
            if(config.config.sessionStoreType === 2){
                redisPool.get(data.nstgc, function (err, reply) {
                    tgt = JSON.parse(reply);
                    res.redirect(validationTGT(service,tgt,req));
                });
            }else if(config.config.sessionStoreType === 1){
                //从缓存中通过nstgc的值作为key，获取tgt对象
                tgt = tgtMap[data.nstgc];
                res.redirect(validationTGT(service,tgt,req));
            }
        }else{
            //只要失败就需要登录，跳转到登录页面
            data.result =  false;
            res.redirect('/');
        }
});

/**
 * 退出:service参数不是必须的，service参数在系统退出后将按照service地址进行回调，没有service参数会直接返回到首页登录页面
 */
router.get('/exit.html',function(req,res){
    //获取service参数，但这个参数不是必须的，service在系统退出后将要按照service地址进行回调
    var service =req.query.service;
    //首页清理调本身的session
    req.session.destroy();
    //清除缓存中tgt对象
    var data = {};
    //在cookies中获取tgc
    data.nstgc = req.cookies.nstgc;
    //判断nstgc是否存在,并且长度等于tgc的配置的长度
    if(data.nstgc && data.nstgc.length > config.config.stLength){
        //判断缓存是否使用的是redis，2为redis
        if(config.config.sessionStoreType === 2){
            redisPool.del(data.nstgc, function (err, reply) {});
        }else if(config.config.sessionStoreType === 1){
            //清除缓存中tgt对象
            delete tgtMap[data.nstgc];
        }

    }
    //判断service是否为空，如果空
    //在缓存中获取用户信息
    if(service){
       //service存在时，返回到service的url地址
        res.redirect(service);
    }else{
        //退出时没有回调的service时直接返回首页登录页面
        res.redirect('/');
    }

});




module.exports = router;
