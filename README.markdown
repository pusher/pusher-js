# Pusher Javascript Client

## Developing

In order to build a combined `pusher.js` and `pusher.min.js` just install the gem dependencies and run rake:

    gem install closure-compiler sprockets

    rake

For development purposes you can start a Sinatra application which will serve up the combined Javascript on <http://localhost:4567/pusher.js>. It allows you to link against this url in your app and freely modify files in `src`.

    ruby dev_server.rb
