$:.unshift(File.expand_path('..', __FILE__))

require 'rubygems'
require 'aws/s3'
require 'pp'
require 'builder'

class S3Uploader
 
 attr_reader :config, :version
 
 def initialize(version_number, config)
   raise 'Define :access_key_id' unless config[:access_key_id]
   raise 'Define :secret_access_key' unless config[:secret_access_key]
   raise 'Define :bucket' unless config[:bucket]
   
   @config = config
   @version = Version.new(version_number)
 end
 
 def upload()
    versions = version.releaseable
    p versions
    versions.each do |v|

      bucket = config[:bucket]

      files = Dir.glob("#{Builder::DIST_DIR}/#{v}/*")
      target_dir = "#{v}/"

      AWS::S3::Base.establish_connection!(
        :access_key_id     => config[:access_key_id],
        :secret_access_key => config[:secret_access_key]
      )

      files.each do |file|
        file_name = File.basename(file)
        p "Uploading ... AWS::S3::S3Object.store(#{target_dir + file_name}, open(#{file}), #{bucket}, :access => :public_read)"
        AWS::S3::S3Object.store(target_dir + file_name, open(file), bucket, :access => :public_read)
      end
    end
    
  end
  
end
