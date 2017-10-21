'use strict';
var index = {};
//加载图片验证码
index.loadRandomCode = function(){
    $.getJSON('/randomcode.html',function(json){
        var  randomCode = $('.randomcode');
        if(json && json.result === 'success' && json.data && randomCode){
            randomCode.html(json.data);
        }else{
            randomCode.html('<svg></svg>');
        }
    });
};
//为图片添加click时间进行验证码的重新加载
index.initRandomCode = function(){
    $('.randomcode').on('click',function(){
        index.loadRandomCode();
    });
    $('#randomcode').on('focus',function(){
        $('#randomcode').val('');
    });
    $('#password').on('focus',function(){
        $('#password').val('');
    });
}

index.login = function(){
    var loginBtn = $('.loginButton');
    loginBtn.off('click');
    $('.loginButton').on('click',function(){
        var loginData = {};
        loginData.signToken = $('#signToken').val();
        loginData.signTicket = $('#signTicket').val();
        loginData.service = $('#service').val();
        loginData.username = $('#username').val();
        loginData.password = $('#password').val();
        loginData.randomcode = $('#randomcode').val();

        //alert(signToken + signTicket + service + username + password + randomcode);

        $.ajax({
            type: 'POST',
            url: '/login.html',
            data: loginData,
            dataType: 'json',
            success: function(json){
               if(json.result === 'success'){
                   if(loginData.service){
                       window.location.href = loginData.service+'?st='+json.ST;
                   }else{
                       window.location.href = '/success.html';
                   }
               }else{
                   $('.error').html(json.msg);
                   $('.error').show();

               }
            }
        });



    });
};


$().ready(function(){
    index.loadRandomCode();
    index.initRandomCode();
    index.login();
});