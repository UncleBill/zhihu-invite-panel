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
    MAX_SHOWEN_NUM = 5;         // show the first 5 people

var statusTag = document.getElementsByClassName('invite-status')[0];
var inviteItemCon = document.getElementsByClassName("invite-item-con")[0];
var $notif = function () {
    return $("<div class='notification btn-warning' />").appendTo($('body'));
}
var frag = document.createElement('div');

var allUsers;

frag.className = 'invite-item-con-inner'
frag.innerHTML = "";

var isArray = Array.isArray || function () {
    return Object.prototype.toString.call(obj) === "[object array]";
}

// invitation status
var InviteStatus = function () {
    this.tag = document.getElementById('invite-status');
    // return this;
}

InviteStatus.prototype.updateData = function (data) {
    var aTags = [];
    var names;
    if (isArray(data)) {
        this.setAttr(data.join(';'));
        names = data;
    } else {
        // string
        this.setAttr(data);
        names = data.split(';');
    }
    if ( !names.length ) {
        statusTag.innerHTML = "您还没要邀请任何人！";
        return;
    }
    var len = Math.min( names.length, MAX_SHOWEN_NUM );
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
            .replace("{{ fullName }}", fullName, 'g')
            aTags.push( aTagStr );
    }
    statusTag.innerHTML = "您已经邀请" + aTags.join("、") + "等" + names.length + "人";
}

InviteStatus.prototype.getUserList = function () {
    var data = this.tag.getAttribute('data-invited-users') || "";
    if (data && data.trim()) {
        return data.split(';');
    }
    return [];
}

InviteStatus.prototype.setAttr = function (datastr) {
    this.tag.setAttribute('data-invited-users', datastr)
}

InviteStatus.prototype.add = function (name) {
    if ( isArray(name) ) {
        this.prototype.add.call(this, name);
        return;
    }
    // console.log('before addiction', name);
    var list = this.getUserList();
    // console.log('before adding', list);
    if ( list.indexOf(name) == -1  ) {
        // console.log('not include');
        list.push( name );
    }
    // console.log('added', list);
    this.updateData( list )
}

InviteStatus.prototype.remove = function (name) {
    var list = this.getUserList();
    // console.log('before remove', list);
    var index = list.indexOf( name );
    // remove list[index]
    list = list.splice(0,index).concat( list.splice(index + 1) );
    // console.log('removed', list);
    this.updateData( list )
}

var getUserFullName = function (urlToken) {
    // console.log('search by ', urlToken);
    for (var i = 0, len = allUsers.length; i < len; ++i) {
        // console.log('user', i+1, allUsers[i].urlToken, '==>', urlToken);
        if (allUsers[i].urlToken == urlToken) {
            console.log('find', allUsers[i]);
            return allUsers[i].fullName;
        }
    }
}

var inviteStatus = new InviteStatus();

// request invite_panel.json and handle it
var xhr;
if (window.XMLHttpRequest) {
    xhr = new XMLHttpRequest();
} else {
    xhr = new ActiveXObject("Microsoft.XMLHTTP")
}
// xhr = new XMLHttpRequest();
xhr.open('GET', '/invite_panel.json', true);

xhr.onreadystatechange = function () {
    // console.log(xhr);
    if ( xhr.readyState === 4 && xhr.status === 200 ) {
        inviteItemCon.innerHTML = ""
        var json = xhr.responseText;
        var data = JSON.parse(json);
        // console.log(data);

        var invitedUsers = data.invited;
        var recommendedUsers = data.recommended;
        for (var i = 0, len = invitedUsers.length; i < len; ++i) {      // users had been invited
            invitedUsers[i].isInvited = true;
        }

        allUsers = invitedUsers.concat( recommendedUsers );
        // console.log(allUsers);

        for (var i = 0, len = allUsers.length; i < len; ++i) {
            var user = allUsers[i];
            if (user.isInvited) {
                // console.log(user, 'invited');
                user.inviteClass = RETRIEVE_BTN_CN;
                user.inviteText = "收回邀请"
            } else {
                user.inviteClass = INVITE_BTN_CLASS;
                user.inviteText = "邀请回答"
            }
            var htmlCode = htmlTemp;

            // generate innerHTML
            for (var key in user) {
                // console.log(key);
                htmlCode = htmlCode.replace((new RegExp("{{ " + key + " }}", "g")), user[key]);
            }
            frag.innerHTML = frag.innerHTML + htmlCode;
        }

        inviteItemCon.appendChild( frag );

        var invitedUserNames = invitedUsers.map(function(e){
            return e.urlToken;
        })
        inviteStatus.updateData(invitedUserNames);
        
    }
}
// send request
xhr.send();

var main = function() {
    var $mask = $(".mask");
    var $confirmer = $(".confirmer");

    var hideConfirm = function( callback ) {
        $mask.fadeOut();
        $confirmer.fadeOut(function () {
            // invoke callback if given
            if (callback) callback();
        });
    };


    // 通过 @elem
    // 将用户名传递进来
    var showConfirm = function(elem) {
        $mask.fadeIn();
        $confirmer
            .data('user-name', $(elem).data('user-name'))
            .fadeIn()
    };

    $mask.bind('click', function () {
        hideConfirm();
    });

    // handle retrieve invitation
    // --------------------------
    $('.invite-item-con').on( 'click', '.retrieve-invitation', function(){
            // console.log('click retrieve invitational');
            // console.log(this);
            // $(this).data('user-name')
            // change button's style
            if (showConfirm(this)){
                $(this).removeClass(RETRIEVE_BTN_CN).addClass(INVITE_BTN_CLASS);
            }
    });

    var showConfirm = function (elem) {
        var urlToken = $(elem).parent('.invite-item').data('user-name');
        // console.log('elem bind data',elem);
        var fullName;
        fullName = getUserFullName(urlToken)
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
    $(".confirmer .confirm-btn").bind("click", function () {
        var urlToken = $(this).data('user-name')
        var fullName = getUserFullName(urlToken);
        hideConfirm(function () {
            // change style
            $(".invite-item-con .invite-item[data-user-name='" + urlToken+ "']")
            .find('.btn')
            .text('邀请回答')
            .removeClass(RETRIEVE_BTN_CN)
            .addClass(INVITE_BTN_CLASS);

            // update status
            inviteStatus.remove(urlToken);

            // notification show up
            $notif()
                // .text("已收回对" + fullName + "的邀请！")
                .html("已收回对<a href='/people/" + urlToken + "'>" + fullName + "</a>的邀请！")
                .animate({top:'5px'}, 500)
                .delay(1500)
                .animate({top:'-50px'}, 300);
        })

    });


    // send invitation
    // ---------------
    $('.invite-item-con').on('click', '.send-invitation', function(){
        // toggle className
        var that = this;
        // console.log(this, 'clicking sending button');
        $(this).text("收回邀请")
            .removeClass(INVITE_BTN_CLASS)
            .addClass(RETRIEVE_BTN_CN)
            .queue();
            (function(){
                // show notification
                // console.log('sending');
                var urlToken = $(that).parent('.invite-item').data('user-name');
                var fullName = getUserFullName(urlToken);
                // console.log(urlToken);
                inviteStatus.add(urlToken);
                $notif()
                    .html("已向<a href='/people/" + urlToken + "'>" + fullName + "</a>发送邀请！")
                    .animate({top:'5px'}, 500)
                    .delay(1500)
                    .animate({top:'-50px'}, 300);

            }()); // closure
    })

    // handle notification
    // -------------------
    $("body").on('mouseover', '.notification', function () {
        $(this)
            .stop(true, true)
            .animate({top:'5px'}, 500);
    }).on('mouseout', '.notification', function () {
        $(this)
            .stop(true, true)
            .delay(500)
            .animate({top:'-50px'}, 400);
    })

};

// invoke main function
main();
