const Pusher = require("pusher");
const express = require('express');

function decode_base64(data) {
  return Buffer.from(data, 'base64').toString('ascii');
}

function auth(pusher, channel_name, socket_id) {
  const channel_data = {
    user_id: socket_id,
    user_info: {
      name: `Integration ${socket_id}`,
      email: `integration-${socket_id}@example.com`
    }
  };
  return pusher.authorizeChannel(socket_id, channel_name, channel_data);
}

function start_app(port, pusher_config) {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({extended: true}));

  const pusher = new Pusher(pusher_config);

  app.options('/auth', (req, res) => {
    res.set({
      'Allow': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Accepts,Content-Type'
    });
    res.sendStatus(200);
  });

  app.post('/auth', (req, res) => {
    const channel_name = req.body.channel_name;
    const socket_id = req.body.socket_id;
    res.set({
      'Allow': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Accepts,Content-Type',
      'Content-Type': 'application/json'
    });
    res.send(auth(pusher, channel_name, socket_id));
  });

  // jsonp auth
  app.get('/auth', (req, res) => {
    const channel_name = req.query.channel_name;
    const socket_id = req.query.socket_id;
    const callback = req.query.callback;
    const auth_response = auth(pusher, channel_name, socket_id);
    res.set('Content-Type','application/json');
    res.send(callback + "(" + auth_response + ")");
  });

  // triggering messages
  app.get('/send/:jsonp_id', (req, res) => {
    const channel = decode_base64(req.query.channel);
    const event = decode_base64(req.query.event);
    const data = JSON.parse(req.query.data);
    const socket_id = decode_base64(req.query.socket_id || "");

    pusher.trigger(channel, event, data);

    res.set('Content-Type', 'text/javascript');
    res.send(`Pusher.JSONP.receive(${req.params.jsonp_id}, null, {});`)
  });

  // triggering messages
  // pusher-js 2.2 JSONP API
  app.get('/v2/send/:jsonp_id', (req, res) => {
    const channel = decode_base64(req.query.channel);
    const event = decode_base64(req.query.event);
    const data = JSON.parse(decode_base64(req.query.data));
    const socket_id = decode_base64(req.query.socket_id || "");

    pusher.trigger(channel, event, data);

    res.set({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/javascript'
    });
    res.send(`Pusher.Integration.ScriptReceivers[${req.params.jsonp_id}](null, {});`)
  });

  // JSONP echo
  app.get('/jsonp/echo/:id', (req, res) => {
    const decoded_params =
          Object.keys(req.query)
          .filter(key => !["id", "receiver", "splat", "captures"].include(key))
          .reduce((obj, key) => {
            obj[key] = decode_base64(req.query[key]);
          }, {});

    const receiver = params.hasOwnProperty("receiver") ? decode_base64(params["receiver"]) : "Pusher.JSONP.receive";

    res.set({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, max-age=0, must-revalidate'
    });
    res.send(`${receiver}(${req.params.id}, null, ${JSON.stringify(decoded_params)});`)
  });

  // JSONP echo
  // pusher-js 2.2 JSONP API
  app.get('/v2/jsonp/echo/:id', (req, res) => {
    const decoded_params =
          Object.keys(req.query)
          .filter(key => !["id", "splat", "captures"].include(key))
          .reduce((obj, key) => {
            obj[key] = decode_base64(req.query[key]);
          }, {});

    res.set({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, max-age=0, must-revalidate'
    });
    res.send(`Pusher.ScriptReceivers[${req.params.id}](null, #{JSON.stringify(decoded_params)});`)
  });

  // ScriptRequest echo
  app.get('/v2/script_request/echo', (req, res) => {
    const decoded_params =
          Object.keys(req.query)
          .filter(key => !["id", "receiver", "splat", "captures"].include(key))
          .reduce((obj, key) => {
            obj[key] = req.query[key];
          }, {});

    res.set({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, max-age=0, must-revalidate'
    });
    res.send(`${params["receiver"]}(null, ${JSON.stringify(decoded_params)});`);
  });

  app.get( '/jsonp/500/:id', (req, res) => {
    res.sendStatus(500);
  });

  app.get( '/jsonp/404/:id', (req, res) => {
    res.sendStatus(404);
  });

  app.listen(port, () => {
    console.log(`Integration tests auth server listening on port ${port}`);
  })
}

start_app(3000, {
  appId: process.env.INTEGRATION_TESTS_APP_MT1_APP_ID,
  key: "c49a449b916bb4246729",
  secret: process.env.INTEGRATION_TESTS_APP_MT1_SECRET,
  cluster: "mt1",
});

start_app(3001, {
  appId: process.env.INTEGRATION_TESTS_APP_EU_APP_ID,
  key: "cb7d5e50f5669e5c9ae6",
  secret: process.env.INTEGRATION_TESTS_APP_EU_SECRET,
  cluster: "eu"
});
