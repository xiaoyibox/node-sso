var express = require('express');
var router = express.Router();
var common = require('../src/utils/common');
var config = require('../src/config/config');
var tgtMap = require('../src/dataobject/TGTMap');

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
    var service =req.param('service');
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
                req.session.randomcode = 'judy89w';
                //生成一个tgc，在分布式应用中，尽量的确保这个tgc的唯一性
                var tgc = common.getRandomString(false,64);
                //生成tgc后，创建一个保存用户信息的tgt对象，tgc作为key保存在cookies中，用于SSO的多系统验证
                var tgt = {
                    username:req.body.username,
                    login:true
                };
                //将tgc存放在缓存中，用与tgc的其他系统SSO验证使用,若使用redis则将这个对象存放到redis中
                tgtMap[tgc] = tgt;
                //将tgc设置到cookies中，过期时间为900000，httpOnly为true
                res.cookie('nstgc', tgc, {path:'/',maxAge: 900000, httpOnly: true });
                //生成ST，用于登录成功后的获取用户信息的唯一令牌，有效期可以进行配置，默认为5秒
                data.ST = common.getRandomString(false,64);
                //由于用户的st的时间只有很短的时效性，这个st会保存到session中，同时保存这个值的过期时间
                req.session.st = data.ST;
                req.session.stExpiresTime = new Date().getTime() + config.stExpiresTime;
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
/**
 * 3 验证ST，获取用户信息
 */
router.get('/vst.html',function(req,res){
    //获取参数st
    var st =req.param('st');
    //用于返回数据的对象
    var data = {};
    //获取当前时间，用于和session的st进行时间对比，如果在有效期内，则返回用户信息，不在则提醒验证失败
    var currentTime = new Date().getTime();
    //判断获取到的st是否为空，长度是否是配置的长度，是否和session的st相等，是否在有效期内
    //如果同时满足，则在缓存中获取用户信息进行返回，同时将st清空，过期时间清零
    if(st && st.length === 64 && st === req.session.st && req.session.stExpiresTime <= currentTime){
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
    //用于返回数据的对象
    var data = {};
    //从缓存中获取用户信息并展示
    //在cookies中获取tgc
    data.nstgc = req.cookies.nstgc;
    //判断nstgc是否存在,并且长度等于tgc的配置的长度
    if(data.nstgc && data.nstgc.length === 64){
        //从缓存中通过nstgc的值作为key，获取tgt对象
        var tgt = tgtMap[data.nstgc];
        //如果tgt在缓存中存在，并且username不为空，同时login的状态为true
        if(tgt && tgt.username && tgt.login === true){
            data.username = tgt.username;
            res.render('success', data);
        }else{
            //验证错误后，跳转到登录页
            res.redirect('/');
        }
    }else{
        //验证错误后，跳转到登录页
        res.redirect('/');
    }

});
/**
 * 5 验证tgc
 */
router.get('/vtgc.html',function(req,res){
    //获取servcie参数，这个参数是必须的，因为这个操作是其他子系统的验证操作，验证完成后必须返回的地址
    var service =req.param('service');
    //判断service是否为空，如果空则进入SSO首页进行登录操作，如果不空，则获取tgc，通过tgc这个key
    //在缓存中获取用户信息
    if(service){
        var data = {};
        //在cookies中获取tgc
        data.nstgc = req.cookies.nstgc;
        //判断nstgc是否存在,并且长度等于tgc的配置的长度
        if(data.nstgc && data.nstgc.length === 64){
            //从缓存中通过nstgc的值作为key，获取tgt对象
            var tgt = tgtMap[data.nstgc];
            //如果tgt在缓存中存在，并且username不为空，同时login的状态为true
            if(tgt && tgt.username && tgt.login === true){
                //生成一个ST票据，用于获取用户的登录信息
                req.session.st = common.getRandomString(false,64);
                //设置st的过期时间，时间为配置的时间，默认为5秒钟
                req.session.stExpiresTime = new Date().getTime() + config.stExpiresTime;
                //一切正常后跳转到service的url，并且携带上这个新生成的ST票据
                res.redirect(service+'?ST='+req.session.st);
            }else{
                //只要失败就需要登录，跳转到登录页面
                res.redirect('/');
            }
        }else{
            //只要失败就需要登录，跳转到登录页面
            res.redirect('/');
        }
    }else{
        //只要失败就需要登录，跳转到登录页面
        res.redirect('/');
    }

});

/**
 * 退出
 */
router.get('/exit.html',function(req,res){
    //获取servcie参数，但这个参数不是必须的，servcie在系统退出后将要按照service地址进行回调
    var service =req.param('service');
    //首页清理调本身的session
    req.session.destroy();
    //清除缓存中tgt对象
    var data = {};
    //在cookies中获取tgc
    data.nstgc = req.cookies.nstgc;
    //判断nstgc是否存在,并且长度等于tgc的配置的长度
    if(data.nstgc && data.nstgc.length === 64){
        //清除缓存中tgt对象
        delete tgtMap[data.nstgc];
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
