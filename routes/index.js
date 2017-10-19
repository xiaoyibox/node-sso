var express = require('express');
var router = express.Router();
var common = require('../src/utils/common');

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
                req.session.username = req.body.username;
                req.session.login = true;
                data.ST = common.getRandomString(false,64);
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
