$().ready(function(){
  var socket = new Pusher('0eb73a235dd03b3df71a');
  var nextConnectionAttempt = null;

  socket.connection.bind('connecting_in', function(data) {
    updateLight('amber');
    updateControls('connect');
    if(data > 0)
    {
      nextConnectionAttempt = new Date().getTime() + data;
      handleAmberDelay(nextConnectionAttempt);
    }
  });

  socket.connection.bind('connecting', function() {
    updateLight('amber');
    updateControls('connect');
  });

  socket.connection.bind('connected', function(data) {
    resetAmber();
    updateLight('green');
    updateControls('disconnect');
  });

  socket.connection.bind('disconnected', function(data) {
    updateLight('red');
    updateControls('connect');
  });

  $('#connect').click(function() {
    socket.connection.connect();
  });

  $('#disconnect').click(function() {
    socket.connection.disconnect();
  });
});

var lights = ['red', 'amber', 'green'];
function updateLight(light) {
  for(var i = 0; i < lights.length; i++)
  {
    if(lights[i] !== light)
    {
      $("#" + lights[i] + 'on').hide();
      $("#" + lights[i] + 'off').show();
    }
    else
    {
      $("#" + lights[i] + 'on').show();
      $("#" + lights[i] + 'off').hide();
    }
  }
};

var amberDelayTimer = null;
function handleAmberDelay(nextConnectionAttempt) {
  clearTimeout(amberDelayTimer);
  updateAndSetTimer(nextConnectionAttempt);
};

function updateAndSetTimer(nextConnectionAttempt) {
  amberDelayTimer = setTimeout(function() {
    var countdown = Math.round((nextConnectionAttempt - new Date().getTime()) / 1000);
    if(countdown >= 0) // can take a bit longer if using Flash
      $("#amberon").html(countdown);
    updateAndSetTimer(nextConnectionAttempt);
  }, 999);
};

function resetAmber() {
  clearTimeout(amberDelayTimer);
  $("#amberon").html("");
};

var controls = ['connect', 'disconnect'];
function updateControls(addControl) {
  for(var i = 0; i < controls.length; i++)
    if(controls[i] !== addControl)
      $("#" + controls[i]).hide();
    else
      $("#" + controls[i]).show();
};