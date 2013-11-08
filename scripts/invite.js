var htmlTemp = "<div class='invite-item' data-user-name='{{ urlToken }}'> <div class='avatar'> <a href='/people/{{ urlToken }}'> <img height='50' width='50' src='{{ avatarPath }}' alt='{{ fullName }}'> </a> </div> <div class='profile'> <p> <a href='#' class='profile-name'>{{ fullName }}</a> </p> <p class='profile-bio'>{{ bio }}</p> </div> <div class='invite-btn send-invite btn btn-primary btn-mini {{ inviteClass }}'>{{ inviteText }}</div></div>";

// htmlTemp =>
// ------------------------------------------------------------
// 
// <div class="invite-item">
//     <div class="avatar">
//         <a href="/people/{{ urlToken }}">
//             <img height="50" width="50" src="{{ avatarpath }}" alt="{{ fullName }}">
//         </a>
//     </div>
//     <div class='profile'>
//         <p>
//             <a href="#" class="profile-name">{{ fullName }}</a>
//         </p>
//         <p class="profile-bio">{{ bio }}</p>
//     </div>
//     <div class="invite-btn send-invite btn btn-primary btn-mini {{ isInvited }}">邀请回答</div>
// </div>
//
// ------------------------------------------------------------

// static variable
var INVITE_BTN_CLASS = "send-invitation",
    RETRIEVE_BTN_CN = 'btn-inverse retrieve-invitation',
    MAX_SHOWEN_NUM = 5;         // only the first 5 people

var $statusTag = $('#invite-status');
var $notif = function() {
    return $("<div class='notification btn-warning' />").appendTo($('body'));
}

var allUsers;

var getUserFullName = function(urlToken) {
    return $.grep(allUsers, function (user, i) {
        return user.urlToken === urlToken;
    })[0].fullName;
}

// InvitaeStatus
// @updateData  => update @tag's text and data-invited-users
// @tag  => tag contains invitation status
// @getUserList     => get the data bind to data-invited-users attributes
// @remove  => retrieve a invitation, and @updateData
// @add     => invite a user, and @updatedata
// @setAttr => set data-invited-users' value
// =========================================

var InviteStatus = function () {}
InviteStatus.prototype.updateData = function(data) {
    var urlTokens,
        aTags = [];
    if ($.isArray(data)) {
        this.setAttr(data.join(';'));
        urlTokens = data;
    } else {
        // string
        this.setAttr(data);
        urlTokens = data.split(';');
    }
    if (urlTokens.length === 0) {
        $statusTag.html( "您还没要邀请任何人！" );
        return;
    }
    $.map(urlTokens, function (urlToken, i) {
        if (i >= MAX_SHOWEN_NUM) return;
        var fullName = getUserFullName(urlToken);
        var aTagStr = ('<a href="/people/{{ urlToken }}" data-user-name="{{ urlToken }}">{{ fullName }}</a>')
            .replace('{{ urlToken }}', urlToken, 'g')
            .replace('{{ fullName }}', fullName, 'g');
        aTags.push(aTagStr);
    })
    $statusTag.html( '您已经邀请' + aTags.join('、') + '等' + urlTokens.length + '人' );
}

InviteStatus.prototype.getUserList = function() {
    var data = $statusTag.data('invited-users');
    if (data) {
        return data.split(';');
    }
    return [];
}

InviteStatus.prototype.setAttr = function(datastr) {
    $statusTag.data('invited-users', datastr);
}

InviteStatus.prototype.add = function(name) {
    if ($.isArray(name)) {
        this.prototype.add.call(this, name);
        return;
    }
    var list = this.getUserList();
    if ($.inArray(name, list) < 0) {
        list.push(name);
    }
    this.updateData(list);
}

InviteStatus.prototype.remove = function(name) {
    var list = this.getUserList();
    var index = $.inArray(name, list)
    list = list.splice(0, index).concat(list.splice(index + 1));
    this.updateData(list);
}

var inviteStatus = new InviteStatus();

var jsonHandler = function (data) {
    var inviteItemCon = $('.invite-item-con');

    var invitedUsers = data.invited;
    var recommendedUsers = data.recommended;

    $.map(invitedUsers, function (user) {
        user.isInvited = true;
    })

    allUsers = invitedUsers.concat(recommendedUsers);

    $.map(allUsers, function (user) {
        if (user.isInvited) {
            user.inviteClass = RETRIEVE_BTN_CN;
            user.inviteText = '收回邀请';
        } else {
            user.inviteClass = INVITE_BTN_CLASS;
            user.inviteText = '邀请回答';
        }
        var htmlCode = htmlTemp;

        // generate innerHTML
        for (var key in user) {
            htmlCode = htmlCode.replace((new RegExp('{{ ' + key + ' }}', 'g')), user[key]);
        }
        inviteItemCon.append(htmlCode)
    });

    var invitedUserNames = $.map(invitedUsers, function(e) {
        return e.urlToken;
    });
    inviteStatus.updateData(invitedUserNames);
   
}

$.get('/invite_panel.json').done( jsonHandler );

var main = function() {
    var $mask = $('.mask');
    var $confirmer = $('.confirmer');


    var hideConfirm = function(callback) {
        $mask.fadeOut();
        $confirmer.fadeOut( callback );
    };

    $mask.bind( 'click', hideConfirm );

    // handle retrieving invitation
    // --------------------------
    $('.invite-item-con').on('click', '.retrieve-invitation', function() {
        // Change button's style.
        if (showConfirm(this)) {
            $(this).removeClass(RETRIEVE_BTN_CN).addClass(INVITE_BTN_CLASS);
        }
    });

    var showConfirm = function(elem) {
        var urlToken = $(elem).parent('.invite-item').data('user-name');
        var fullName;
        fullName = getUserFullName(urlToken);
        $mask.fadeIn();
        $confirmer
                .find('p')
                .html('确认收回对<a href="/people/' + urlToken + '">' + fullName + '</a>' + '的邀请吗？')
            .end()
                .find('.confirm-btn').data('user-name', urlToken)
            .end()
            .fadeIn();
    }

    // confirm
    $('.confirmer .confirm-btn').bind('click', function() {
        var urlToken = $(this).data('user-name');
        var fullName = getUserFullName(urlToken);
        hideConfirm(function() {
            // change style
            $('.invite-item-con .invite-item[data-user-name="' + urlToken + '"]')
                .find('.btn')
                .text('邀请回答')
                .removeClass(RETRIEVE_BTN_CN)
                .addClass(INVITE_BTN_CLASS);

            inviteStatus.remove(urlToken);      // update status

            // notification show up
            $notif()
                .html('已收回对<a href="/people/' + urlToken + '">' + fullName + '</a>的邀请！')
                .animate({ top: '5px' }, 500)
                .delay(1500)
            .animate({ top: '-50px' }, 300, function () {
                $(this).remove();
            });
        });

    });


    // send invitation
    // ---------------
    $('.invite-item-con').on('click', '.send-invitation', function() {
        // toggle className
        var that = this;
        $(this).text('收回邀请')
            .removeClass(INVITE_BTN_CLASS)
            .addClass(RETRIEVE_BTN_CN)
            .queue();

        // show notification
        var urlToken = $(that).parent('.invite-item').data('user-name');
        var fullName = getUserFullName(urlToken);
        inviteStatus.add(urlToken);
        $notif()
            .html('已向<a href="/people/' + urlToken + '">' + fullName + '</a>发送邀请！')
            .animate({ top: '5px' }, 500)
            .delay(1500)
            .animate({ top: '-50px' }, 300, function () {
                $(this).remove();
            });
    });

    // handle notification
    // -------------------
    $('body').on('mouseover', '.notification', function() {
        $(this)
            .stop(true, true)
            .animate({ top: '5px' }, 500);
    }).on('mouseout', '.notification', function() {
        $(this)
            .stop(true, true)
            .delay(500)
            .animate({ top: '-50px' }, 400);
    });

};

// invoke main function
main();
