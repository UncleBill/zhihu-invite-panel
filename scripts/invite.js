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

var statusTag = document.getElementsByClassName('invite-status')[0];
var inviteItemCon = document.getElementsByClassName("invite-item-con")[0];
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
    return this;
}

InviteStatus.prototype.updateData = function (datastr) {
    var invitedUserArray = [];
    if (isArray(datastr)) {
        this.tag.setAttribute('data-invited-users', datastr.join(';'));
    } else {
        this.tag.setAttribute('data-invited-users', datastr)
    }
    var names = inviteStatus.getUserList();
    if ( !names.length ) {
        statusTag.innerHTML = "您还没要邀请任何人"
            return
    }
    for (var i = 0, len = names.length; i < len; ++i) {
        var urlToken = names[i];
        for (var j = 0; j < allUsers.length; ++j) {
            if (allUsers[j].urlToken == urlToken) {
                fullName = allUsers[j].fullName;
                break;
            }
        }
        var aTagStr = ("<a href='/people/{{ urlToken }}' data-user-name='{{ urlToken }}'>{{ fullName }}</a>")
            .replace(/{{ urlToken }}/g, urlToken).replace("{{ fullName }}", fullName)
            invitedUserArray.push( aTagStr );
    }
    statusTag.innerHTML = "您已经邀请" + invitedUserArray.join("、") + "等" + invitedUserArray.length + "人";
}

InviteStatus.prototype.getUserList = function () {
    var data = this.tag.getAttribute('data-invited-users') || "";
    if (data && data.trim()) {
        return data.split(';');
    }
    return [];
}

InviteStatus.prototype.add = function (name) {
    if ( isArray(name) ) {
        this.prototype.add.call(this, name);
        return;
    }
    // console.log('will add', name);
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
    console.log('before remove', list);
    var index = list.indexOf( name );
    // remove list[index]
    list = list.splice(0,index).concat( list.splice(index + 1) );
    console.log('removed', list);
    this.updateData( list )
}

var inviteStatus = new InviteStatus();

// request invite_panel.json and handle it
var xhr = new XMLHttpRequest();
xhr.open('GET', '/invite_panel.json');

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
                user.inviteClass = "btn-inverse retrieve-invitation";
                user.inviteText = "收回邀请"
            } else {
                user.inviteClass = "send-invitation";
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

        // update status
        // var invitedUserArray = [];
        // for (var i = 0, len = invitedUsers.length; i < len; ++i) {
        //     var urlToken = invitedUsers[i].urlToken;
        //     var aTagStr = ("<a href='/people/{{ urlToken }}' data-user-name='{{ urlToken }}'>{{ urlToken }}</a>")
        //                    .replace(/{{ urlToken }}/g, urlToken)
        //     invitedUserArray.push( aTagStr );
        // }
        var invitedUserNames = invitedUsers.map(function(e){
            return e.urlToken;
        })
        inviteStatus.updateData(invitedUserNames);
        // statusTag.innerHTML = "您已经邀请" + invitedUserArray.join("、") + "等" + invitedUserArray.length + "人";
        // statusTag.setAttribute('data-invited-users', invitedUserNames.join(';'))
        // if (!invitedUsers.length) {
        //     statusTag.innerHTML = "您还没要邀请任何人"
        // }
        
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
            // run callback if given
            if (callback) {
                callback();
            }
        });
    };


    var showConfirm = function(elem) {
        $mask.fadeIn();
        // 通过 @elem将用户名传递进来
        $confirmer
            .data('user-name', $(elem).data('user-name'))
            .fadeIn()
    };

    $mask.bind('click', function () {
        hideConfirm();
    });

    // handle retrieve invitation
    // ----------------------------------------
    $('.invite-item-con').on( 'click', '.retrieve-invitation', function(){
            // console.log('click retrieve invitational');
            // console.log(this);
            // $(this).data('user-name')
            // change button's style
            if (showConfirm(this)){
                $(this).removeClass('btn-inverse retrieve-invitation').addClass('send-invitation');
            }
    });

    var showConfirm = function (elem) {
        var userName = $(elem).parent('.invite-item').data('user-name');
        // console.log('elem bind data',elem);
        $mask.fadeIn();
        $confirmer
                .find('p')
                .html('确认收回对<a href="/people/' + userName + '">' + userName + '</a>' + '的邀请吗？')
            .end()
                .find('.confirm-btn').data('user-name', userName)
            .end()
            .fadeIn();
    }

    // confirm
    $(".confirmer .confirm-btn").bind("click", function () {
        var userName = $(this).data('user-name')
        hideConfirm(function () {
            // change style
            $(".invite-item-con .invite-item[data-user-name='" + userName+ "']")
            .find('.btn')
            .text('邀请回答')
            .removeClass('btn-inverse retrieve-invitation')
            .addClass('send-invitation');

            // update status
            inviteStatus.remove(userName);

            // notification show up
            $('.notification')
                .text("已收回对" + userName + "的邀请！")
                .animate({top:'5px'}, 500)
                .delay(1500)
                .animate({top:'-50px'}, 300);
        })

    });


    // send invitation
    // ----------------------------------------
    $('.invite-item-con').on('click', '.send-invitation', function(){
        // toggle className
        var that = this;
        console.log(this, 'clicking sending button');
        $(this).text("收回邀请")
            .removeClass('send-invitation')
            .addClass('btn-inverse retrieve-invitation')
            .queue();
            (function(){
                    // show notification
                    console.log('sending');
                    var userName = $(that).parent('.invite-item').data('user-name');
                    console.log(userName);
                    inviteStatus.add(userName);
                    $('.notification')
                .text("已向" + userName + "发送邀请！")
                .animate({top:'5px'}, 500)
                .delay(1500)
                .animate({top:'-50px'}, 300);

            }()); // closure
    })

    // handle notification
    $("notification").hover(function () {
        $(this)
            .stop()
            .animate({top:'5px'}, 500);
    },function () {
        $(this)
            .stop()
            .animate({top:'-50px'}, 300);
    })
};

// invoke main function
main();
