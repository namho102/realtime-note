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
  console.log(cursor)

  editor.setByAPI = true;
  editor.setValue(data.content);
  editor.moveCursorTo(cursor.row, cursor.column)
  editor.clearSelection();
  editor.setByAPI = false;

})

editor.getSession().on('change', function(e) {
  // console.log(editor.getValue());

  // console.log(editor.selection.getCursor());
  if (!editor.setByAPI) {
    socket.emit('content', {
      content: editor.getValue()
    });
  }
});

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
  var accessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTSzk1ZTM3MTcyNDQzNGFhMjQ5N2ViMGM1ZDliMTZhZTc2LTE0NjkzMjM5OTYiLCJpc3MiOiJTSzk1ZTM3MTcyNDQzNGFhMjQ5N2ViMGM1ZDliMTZhZTc2Iiwic3ViIjoiQUM3MDVmODY4ZjRiOWVmYzliNzdjMzM3Njc4ZTZkNmQyNiIsImV4cCI6MTQ2OTMyNzU5NiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoibG9jYWwiLCJydGMiOnsiY29uZmlndXJhdGlvbl9wcm9maWxlX3NpZCI6IlZTNzkxNjRlMmRlYTQ4YmM3ZTMyZjU2MGRkYmRkMDU5ZjIifX19.22hSug6OaLvNLCB62iGH9--tSbmdS1Jh3gzYAzUC9DM"
  var accessManager = Twilio.AccessManager(accessToken);
  var local = Twilio.Conversations.Client(accessManager);

  // Begin listening for invites to Twilio Video conversations.
  local.listen().then(function() {
    local.on('invite', function(invite) {
      invite.accept().then(onInviteAccepted);
    });
  });

});

socket.on('join', function(room) {
  console.log('Another peer made a request to join room ' + room);
  var accessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTSzk1ZTM3MTcyNDQzNGFhMjQ5N2ViMGM1ZDliMTZhZTc2LTE0NjkzMjQwMTQiLCJpc3MiOiJTSzk1ZTM3MTcyNDQzNGFhMjQ5N2ViMGM1ZDliMTZhZTc2Iiwic3ViIjoiQUM3MDVmODY4ZjRiOWVmYzliNzdjMzM3Njc4ZTZkNmQyNiIsImV4cCI6MTQ2OTMyNzYxNCwiZ3JhbnRzIjp7ImlkZW50aXR5IjoicmVtb3RlIiwicnRjIjp7ImNvbmZpZ3VyYXRpb25fcHJvZmlsZV9zaWQiOiJWUzc5MTY0ZTJkZWE0OGJjN2UzMmY1NjBkZGJkZDA1OWYyIn19fQ.62DPw6ubIPX8ys9TwdJZ8Qhzv1mlNLvyY3MQDR_En3Y"
  var accessManager = new Twilio.AccessManager(accessToken);
  var remote = new Twilio.Conversations.Client(accessManager);

  remote.inviteToConversation('local').then(onInviteAccepted);

});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});


socket.on('log', function(array) {
  console.log.apply(console, array);
});
