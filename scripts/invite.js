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

// some helper functions
var GetByClass = function(cn) {
    if (document.getElementsByClassName) {
        return document.getElementsByClassName(cn);
    } else {
        var tags = document.getElementsByTagName("*"),
            regexp = new RegExp("(^|\\W)" + cn + "(\\W|$)"),
            reslut = [];
        for (var i = 0, len = tags.length; i < len; ++i) {
            if (regexp.test(tags[i].className)) {
                reslut.push(tags[i]);
            }
        }
        return reslut;
    }
}

var IsArray = Array.isArray || $.isArray || function(obj) {
        return Object.prototype.toString.call(obj) === "[object array]";
    }

Array.prototype.indexOf = Array.prototype.indexOf || function(value) {
    for (var i = 0; i < this.length; ++i) {
        if (this[i] == value) {
            return i;
        }
    }
}

String.prototype.trim = Array.prototype.trim || function() {
    return this.replace(/(^\s*|\s*$)/g, '');
}

var statusTag = GetByClass('invite-status')[0];
var inviteItemCon = GetByClass("invite-item-con")[0];
var $notif = function() {
    return $("<div class='notification btn-warning' />").appendTo($('body'));
}
var frag = document.createElement('div');
frag.className = 'invite-item-con-inner';

var allUsers;

// InvitaeStatus
// @updateData  => update @tag's text and data-invited-users
// @tag  => tag contains invitation status
// @getUserList     => get the data bind to data-invited-users attributes
// @remove  => retrieve a invitation, and @updateData
// @add     => invite a user, and @updatedata
// @setAttr => set data-invited-users' value
// =========================================

var InviteStatus = function() {
    this.tag = document.getElementById('invite-status');
    return this;
}

InviteStatus.prototype.updateData = function(data) {
    var aTags = [];
    var names;
    if (IsArray(data)) {
        this.setAttr(data.join(';'));
        names = data;
    } else {
        // string
        this.setAttr(data);
        names = data.split(';');
    }
    if (names.length == 0) {
        statusTag.innerHTML = "您还没要邀请任何人！";
        return;
    }
    var len = Math.min(names.length, MAX_SHOWEN_NUM);
    for (var i = 0; i < len; ++i) {
        var urlToken = names[i];
        for (var j = 0; j < allUsers.length; ++j) {
            if (allUsers[j].urlToken === urlToken) {
                fullName = allUsers[j].fullName;
                break;
            }
        }
        var aTagStr = ("<a href='/people/{{ urlToken }}' data-user-name='{{ urlToken }}'>{{ fullName }}</a>")
            .replace("{{ urlToken }}", urlToken, 'g')
            .replace("{{ fullName }}", fullName, 'g');
        aTags.push(aTagStr);
    }
    statusTag.innerHTML = "您已经邀请" + aTags.join("、") + "等" + names.length + "人";
}

InviteStatus.prototype.getUserList = function() {
    var data = this.tag.getAttribute('data-invited-users');
    if (data) {
        return data.split(';');
    }
    return [];
}

InviteStatus.prototype.setAttr = function(datastr) {
    this.tag.setAttribute('data-invited-users', datastr);
}

InviteStatus.prototype.add = function(name) {
    if (IsArray(name)) {
        this.prototype.add.call(this, name);
        return;
    }
    var list = this.getUserList();
    if (list.indexOf(name) == -1) {
        list.push(name);
    }
    this.updateData(list);
}

InviteStatus.prototype.remove = function(name) {
    var list = this.getUserList();
    var index = list.indexOf(name);
    list = list.splice(0, index).concat(list.splice(index + 1));
    this.updateData(list);
}

var inviteStatus = new InviteStatus();

// request invite_panel.json and handle it
var xhr;
if (window.XMLHttpRequest) {
    xhr = new XMLHttpRequest();
} else {
    xhr = new ActiveXObject("Microsoft.XMLHTTP");
}
// xhr = new XMLHttpRequest();
xhr.open('GET', '/invite_panel.json', true);

xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
        inviteItemCon.innerHTML = "";
        var json = xhr.responseText;
        var data = jQuery.parseJSON(json);

        var invitedUsers = data.invited;
        var recommendedUsers = data.recommended;
        for (var i = 0, len = invitedUsers.length; i < len; ++i) {      // users had been invited
            invitedUsers[i].isInvited = true;
        }

        allUsers = invitedUsers.concat(recommendedUsers);

        for (var i = 0, len = allUsers.length; i < len; ++i) {
            var user = allUsers[i];
            if (user.isInvited) {
                user.inviteClass = RETRIEVE_BTN_CN;
                user.inviteText = "收回邀请";
            } else {
                user.inviteClass = INVITE_BTN_CLASS;
                user.inviteText = "邀请回答";
            }
            var htmlCode = htmlTemp;

            // generate innerHTML
            for (var key in user) {
                htmlCode = htmlCode.replace((new RegExp("{{ " + key + " }}", "g")), user[key]);
            }
            frag.innerHTML = frag.innerHTML + htmlCode;
        }

        inviteItemCon.appendChild(frag);

        var invitedUserNames = $.map(invitedUsers, function(e) {
            return e.urlToken;
        });
        inviteStatus.updateData(invitedUserNames);

    }
}
// send request
xhr.send();

var main = function() {
    var $mask = $(".mask");
    var $confirmer = $(".confirmer");

    var getUserFullName = function(urlToken) {
        for (var i = 0, len = allUsers.length; i < len; ++i) {
            if (allUsers[i].urlToken == urlToken) {
                return allUsers[i].fullName;
            }
        }
    }

    var hideConfirm = function(callback) {
        $mask.fadeOut();
        $confirmer.fadeOut(function() {
            // invoke callback if given
            if (callback) callback();
        });
    };

    // 通过 @elem
    // 将用户名传递进来
    var showConfirm = function(elem) {
        $mask.fadeIn();
        $confirmer
            .attr('data-user-name', $(elem).attr('data-user-name'))
            .fadeIn();
    };

    $mask.bind('click', function() {
        hideConfirm();
    });

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
    $(".confirmer .confirm-btn").bind("click", function() {
        var urlToken = $(this).data('user-name');
        var fullName = getUserFullName(urlToken);
        hideConfirm(function() {
            // change style
            $(".invite-item-con .invite-item[data-user-name='" + urlToken + "']")
                .find('.btn')
                .text('邀请回答')
                .removeClass(RETRIEVE_BTN_CN)
                .addClass(INVITE_BTN_CLASS);

            inviteStatus.remove(urlToken);      // update status

            // notification show up
            $notif()
                .html("已收回对<a href='/people/" + urlToken + "'>" + fullName + "</a>的邀请！")
                .animate({ top: '5px' }, 500)
                .delay(1500)
                .animate({ top: '-50px' }, 300);
        });

    });


    // send invitation
    // ---------------
    $('.invite-item-con').on('click', '.send-invitation', function() {
        // toggle className
        var that = this;
        $(this).text("收回邀请")
            .removeClass(INVITE_BTN_CLASS)
            .addClass(RETRIEVE_BTN_CN)
            .queue();

        // show notification
        var urlToken = $(that).parent('.invite-item').data('user-name');
        var fullName = getUserFullName(urlToken);
        inviteStatus.add(urlToken);
        $notif()
            .html("已向<a href='/people/" + urlToken + "'>" + fullName + "</a>发送邀请！")
            .animate({ top: '5px' }, 500)
            .delay(1500)
            .animate({ top: '-50px' }, 300);
    });

    // handle notification
    // -------------------
    $("body").on('mouseover', '.notification', function() {
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
