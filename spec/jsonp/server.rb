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

  "#{receiver}(#{params[:id]}, #{JSON.generate(decoded_params)});"
end

get '/parse_error/:id' do
  content_type 'text/javascript', :charset => 'utf-8'
  "not really javascript"
end
