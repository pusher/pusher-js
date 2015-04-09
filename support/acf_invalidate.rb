require 'httparty'
require 'hmac-sha1'
require 'base64'

# Invalidate objects on Cloudfront servers.
# This is async, ie. invalidations may take some time to be effective.
# Note: there are quotas for how many FREE invalidation requests you can issue, as well as how many 'in-progress' invalidatioins you can have. Use with caution.
# More on http://docs.amazonwebservices.com/AmazonCloudFront/latest/DeveloperGuide/index.html?Invalidation.html
class Acf
  
  include HTTParty
  API_VERSION = '2010-08-01'
  
  base_uri "https://cloudfront.amazonaws.com/#{API_VERSION}"
  format :xml
  
  def initialize(distribution_id, key, secret)
    raise 'Missing distribution id' unless distribution_id
    raise 'Missing key' unless key
    raise 'Missing secret' unless secret
    @distribution_id, @key, @secret = distribution_id, key, secret
  end
  
  def invalidate(*paths)
    invalidation_id = Time.now.httpdate
    post "/distribution/#{@distribution_id}/invalidation", invalidation_xml(invalidation_id, paths)
  end
  
  def invalidation_list
    get "/distribution/#{@distribution_id}/invalidation"
  end
  
  def invalidation(id)
    get "/distribution/#{@distribution_id}/invalidation/#{id}"
  end
  
  protected
  
  def post(path, body)
    self.class.post(path, :body => body, :headers => headers)
  end
  
  def get(path)
    self.class.get(path, :headers => headers)
  end
  
  def headers
    now = Time.now.httpdate
    {
      'Date'            => now,
      'Authorization'   => signed_header(now),
      'Content-Type'    => 'text/xml'
    }
  end
  
  def signed_header(now)
    "AWS #{@key}:#{signature(now)}"
  end
  
  def invalidation_xml(invalidation_id, paths)
    _xml = %(<InvalidationBatch>)
    _xml << paths.map do |path|
      %(<Path>#{path}</Path>)
    end.join
    _xml << %(<CallerReference>#{invalidation_id}</CallerReference>)
    _xml << %(</InvalidationBatch>)
    _xml
  end
  
  def signature(date)
    hmac = HMAC::SHA1.new(@secret)
    hmac.update(date)
    Base64.encode64(hmac.digest).chomp
  end
  
end