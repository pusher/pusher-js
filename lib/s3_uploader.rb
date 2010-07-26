$:.unshift(File.expand_path('..', __FILE__))

require 'rubygems'
require 'aws/s3'
require 'pp'
require 'builder'

module S3Uploader
 ENVIRONMENT = ENV["ENVIORNMENT"] || 'staging'
 p ENVIRONMENT
 
 CONFIG = YAML.load_file('./config/config.yml')[ENVIRONMENT.to_sym]
 raise "Specify config.yml" unless  CONFIG

 class << self
   def upload()
     versions = [Builder.version.full, Builder.version.major_minor]

     versions.each do |v|

       bucket = CONFIG[:s3][:bucket]

       files = Dir.glob("#{Builder::DIST_DIR}/#{v}/*")
       target_dir = "#{v}/"

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
end
