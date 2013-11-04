var htmlTemp = "<div class='invite-item'> <div class='avatar'> <a href='/people/<%= urlToken %>'> <img height='50' width='50' src='<%= avatarPath %>' alt='<%= fullName %>'> </a> </div> <div class='profile'> <p> <a href='#' class='profile-name'><%= fullName %></a> </p> <p class='profile-bio'><%= bio %></p> </div> <div class='invite-btn send-invite btn btn-primary btn-mini <%= inviteClass %>'><%= inviteText %></div></div>";

// htmlTemp =>
// ------------------------------------------------------------
// 
// <div class="invite-item">
//     <div class="avatar">
//         <a href="/people/<%= urlToken %>">
//             <img height="50" width="50" src="<%= avatarpath %>" alt="<%= fullName %>">
//         </a>
//     </div>
//     <div class='profile'>
//         <p>
//             <a href="#" class="profile-name"><%= fullName %></a>
//         </p>
//         <p class="profile-bio"><%= bio %></p>
//     </div>
//     <div class="invite-btn send-invite btn btn-primary btn-mini <%= isInvited %>">邀请回答</div>
// </div>
//
// ------------------------------------------------------------

var statusTag = document.getElementsByClassName('invite-status')[0];
var inviteItemCon = document.getElementsByClassName("invite-item-con")[0];
var frag = document.createElement('div');

frag.className = 'invite-item-con-inner'
frag.innerHTML = "";

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

        var allUsers = invitedUsers.concat( recommendedUsers );
        console.log(allUsers);

        for (var i = 0, len = allUsers.length; i < len; ++i) {
            var user = allUsers[i];
            if (user.isInvited) {
                // console.log(user, 'invited');
                user.inviteClass = "btn-inverse";
                user.inviteText = "收回邀请"
            } else {
                user.inviteClass = "";
                user.inviteText = "邀请回答"
            }
            var htmlCode = htmlTemp;

            for (var key in user) {
                // console.log(key);
                htmlCode = htmlCode.replace((new RegExp("<%= "+key+" %>", "g")), user[key]);
            }
            frag.innerHTML = frag.innerHTML + htmlCode;
        }

        inviteItemCon.appendChild( frag );

        // update status
        var invitedUserArray = [];
        for (var i = 0, len = invitedUsers.length; i < len; ++i) {
            var aTagStr = "<a href='/people/" + invitedUsers[i].urlToken + "'>" + invitedUsers[i].fullName + "</a>";
            invitedUserArray.push( aTagStr );
        }
        statusTag.innerHTML = "您已经邀请" + invitedUserArray.join("、") + "等" + invitedUserArray.length + "人";
    }
}
xhr.send();
