var express = require('express');
var router = express.Router();
var common = require('../src/utils/common');
var config = require('../src/config/config');
var tgtMap = require('../src/dataobject/TGTMap');

/* GET home page. */
router.get(['','/'], function(req, res, next) {
    var tokenAndTicket = common.setSignTokenAndTicket(req);
    var service =req.param('service');
    var data = {};
    if(!service){
        service = '';
    }
    data.service = service;
    data.signToken = tokenAndTicket.signToken;
    data.signTicket = tokenAndTicket.signTicket;
    res.render('index', data);
});

router.get('/vtgc.html',function(req,res){
    var service =req.param('service');
    if(service){
        var data = {};
        data.nstgc = req.cookies.nstgc;
        var key = data.nstgc;
        var tgt = tgtMap[key];
        if(tgt && tgt.username && tgt.login === true){
            req.session.st = common.getRandomString(false,64);
            req.session.stExpiresTime = new Date().getTime() + config.stExpiresTime;
            res.redirect(service+'?ST='+req.session.st);
        }
    }
    res.redirect('/');
});

router.get('/vst.html',function(req,res){
    var st =req.param('st');
    var data = {};
    var currentTime = new Date().getTime();
    if(st && st.length === 64 && st === req.session.st && req.session.stExpiresTime <= currentTime){
        req.session.st = '';
        req.session.stExpiresTime = 0;
        data.result = 'success';
    }else{
        data.result = 'fail';
    }
    res.json(data);
});

/* POST LOGIN page. */
router.post('/login.html', function(req, res, next) {
    var data ={};
    console.log();
    if(common.checkCSRF(req)){
        if(req.body.username === 'username'
            && req.body.password === 'password'
        ){
            if(req.body.randomcode === req.session.randomcode){
                req.session.randomcode = 'judy89w';
                var tgc = common.getRandomString(false,64);
                var tgt = {
                    username:req.body.username,
                    login:true
                };
                tgtMap[tgc] = tgt;
                res.cookie('nstgc', tgc, { expires: new Date(Date.now() + 900000), httpOnly: true });
                data.ST = common.getRandomString(false,64);
                req.session.st = data.ST;
                req.session.stExpiresTime = new Date().getTime() + config.stExpiresTime;
                data.result = 'success';
            }else{
                data.result = 'fail';
                data.msg = '您输入的验证码不正确。';
            }
        }else{
            data.result = 'fail';
            data.msg = '用户名或者密码不正确。';
        }
    }else{
        data.msg = '您正在非法操作，请刷新页面重试。';
    }
    res.json(data);
});


router.get('/success.html', function(req, res, next) {
    var data = {};
    if(req.session.username && req.session.login === true){
        data.username = req.session.username;
        res.render('success', data);
    }else{
        res.redirect('/');
    }

});

module.exports = router;
