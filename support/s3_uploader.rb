require 'aws/s3'

class S3Uploader
 
 attr_reader :config, :version, :dist_dir
 
 def initialize(dist_dir, version, config)
   raise 'Define :access_key_id' unless config[:access_key_id]
   raise 'Define :secret_access_key' unless config[:secret_access_key]
   raise 'Define :bucket' unless config[:bucket]
   
   @config = config
   @version = version
   @dist_dir = dist_dir
 end
 
 def upload()
    versions = version.releaseable
    puts "Uploading versions: #{versions.inspect}"

    versions.each do |v|
      bucket = config[:bucket]

      files = Dir.glob("#{dist_dir}/#{v}/*")

      AWS::S3::Base.establish_connection!(
        :access_key_id     => config[:access_key_id],
        :secret_access_key => config[:secret_access_key],
        :use_ssl          => true,
      )

      files.each do |file|
        file_name = File.basename(file)
        destination = "#{v}/#{file_name}"
        puts "Uploading #{file} to #{bucket}/#{destination}"
        AWS::S3::S3Object.store(destination, open(file), bucket, {
          :access => :public_read,
          "Cache-Control" => "max-age=86400"
        })
      end
    end
  end

end
