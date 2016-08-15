'use strict';

var room = 'bar';
// Could prompt for room name:
// var room = prompt('Enter room name:');

var socket = io();

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/javascript");
editor.$blockScrolling = Infinity;
editor.setByAPI = false;
editor.setFontSize(14);


socket.on('update', function(data) {
  console.log('updated')
  var cursor = editor.getCursorPosition();
  var length = editor.session.getLength();
  // console.log(cursor)

  editor.setByAPI = true;
  editor.setValue(data.content);
  var diff = editor.session.getLength() - length;
  // console.log(diff)
  if(diff != 0) {
    editor.moveCursorTo(cursor.row + diff, cursor.column);
  }
  // else if(diff < 0) {
  //   editor.moveCursorTo(cursor.row + diff, cursor.column);
  // }
  else {
    editor.moveCursorTo(cursor.row, cursor.column);
  }

  editor.clearSelection();
  editor.setByAPI = false;

})

editor.getSession().on('change', function(e) {
  // console.log(editor.getValue());

  // console.log(editor.selection.getCursor());
  var currentRow = editor.getCursorPosition().row;
  // console.log(currentRow)

  if (!editor.setByAPI) {
    socket.emit('content', {
      content: editor.getValue()
    });
  }
});

function getToken(url, cb) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);

  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      // Success!
      var data = JSON.parse(request.responseText);
      // console.log(data.token)
      cb(data.token);
    } else {
      // We reached our target server, but it returned an error

    }
  };

  request.onerror = function() {
    // There was a connection error of some sort
  };

  request.send();
}
function conversationStarted(conversation) {
  // Here is where you add your own custom functionality.
  console.log('The conversation has started.');
}

function onInviteAccepted(conversation) {
  conversation.localMedia.attach('#local');

  conversation.on('participantConnected', function(participant) {
    participant.media.attach('#remote');

    conversationStarted(conversation);
  });
}


if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or join room', room);
}

socket.on('created', function(room) {
  console.log('Created room ' + room);
  getToken('token/local', function(token) {

    var accessToken = token;
    console.log(accessToken)
    var local = Twilio.Conversations.Client(accessToken);

    // Begin listening for invites to Twilio Video conversations.
    local.listen().then(function() {
      local.on('invite', function(invite) {
        invite.accept().then(onInviteAccepted);
      });
    });
  });


});

socket.on('join', function(room) {
  console.log('Another peer made a request to join room ' + room);

  getToken('token/remote', function(token) {

    var accessToken = token;
    var accessManager = new Twilio.AccessManager(accessToken);
    var remote = new Twilio.Conversations.Client(accessManager);

    remote.inviteToConversation('local').then(onInviteAccepted);
  });



});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});


socket.on('log', function(array) {
  console.log.apply(console, array);
});
