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

/* GET home page. */
router.get('/login.html', function(req, res, next) {
    if(common.checkCSRF(req)){

    }
    res.render('index', { title: 'Express SSO for NodeJS' });
});

module.exports = router;
