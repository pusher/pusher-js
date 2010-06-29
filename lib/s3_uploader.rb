$:.unshift(File.expand_path('..', __FILE__))

require 'rubygems'
require 'aws/s3'
require 'pp'
require 'builder'

module S3Uploader
 CONFIG = YAML.load_file('./config/config.yml')
 raise "Specify config.yml" unless  CONFIG

 class << self
   def upload()
     bucket = CONFIG[:s3][:bucket]
     
     files = Dir.glob("#{Builder::DIST_DIR}/#{Builder.config["VERSION"]}/*")
     target_dir = "#{Builder.config["VERSION"]}/"

     AWS::S3::Base.establish_connection!(
       :access_key_id     => CONFIG[:s3][:access_key_id],
       :secret_access_key => CONFIG[:s3][:secret_access_key]
     )

     files.each do |file|
       file_name = File.basename(file)
       p "Uploading ... AWS::S3::S3Object.store(#{target_dir + file_name}, open(#{file}), #{bucket}, :access => :public_read)"
       AWS::S3::S3Object.store(target_dir + file_name, open(file), bucket, :access => :public_read)
     end
   end
 end
end
