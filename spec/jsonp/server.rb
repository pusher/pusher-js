require 'base64'
require 'json'
require 'sinatra'

def decode(value)
  decoded_value = Base64.decode64(value);
  begin
    JSON.parse(decoded_value)
  rescue JSON::ParserError => e
    decoded_value
  end
end

get '/jsonp/:id' do
  cache_control :private, :must_revalidate, :max_age => 0
  content_type 'text/javascript', :charset => 'utf-8'

  decoded_params = Hash[
    params.find_all do |key, value|
      !["id", "receiver"].include?(key)
    end.map do |key, value|
      [key, decode(value)]
    end
  ]

  receiver = if params.has_key?("receiver")
    decode(params["receiver"])
  else
    "Pusher.JSONP.receive";
  end

  "#{receiver}(#{params[:id]}, null, #{JSON.generate(decoded_params)});"
end

get '/500/:id' do
  status 500
end
