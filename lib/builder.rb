require 'fileutils'
require 'yaml'

require 'rubygems'
require 'closure-compiler'
require 'sprockets'

class Version
  
  def initialize(string)
    @major, @minor, @patch = string.split('.')
    raise "require (major.minor.patch) eg: 1.3.1" unless @major && @minor && @patch
  end
  
  def full
    [@major, @minor, @patch].join('.')
  end
  
  def major_minor 
    [@major, @minor].join('.')
  end
  
end

module Builder
  DIST_DIR = 'dist'
  SRC_DIR = 'src'

  class << self
    def build(*args)
      [version.full, version.major_minor].each do |v|
        bundle('bundle.js', 'pusher.js', v) do |f|
          licence = File.read('src/pusher-licence.js')
          licence.sub!('<%= VERSION %>', v.to_s)
          f.write(licence)
        end

        copy_swf(v)
      end
    end

    def bundle(src, dest, v)
      FileUtils.mkdir_p(version_dir(v))

      path = "#{version_dir(v)}/#{dest}"
      min_path = path.sub('.js', '.min.js')

      puts "generating #{path}"

      unminified(src).save_to(path)

      puts "generating #{min_path}"

      minified = Closure::Compiler.new.compile(File.new(path))

      File.open(min_path, 'w') do |f|
        yield f
        f.write(minified)
      end
    end

    def unminified(src)
      secretary = Sprockets::Secretary.new(
        :load_path => SRC_DIR,
        :source_files => "#{SRC_DIR}/#{src}"
      )
      concatenation = secretary.concatenation
    end

    def config
      @config ||= YAML.load_file("#{SRC_DIR}/constants.yml")
    end

    def copy_swf(v)
      from = "#{SRC_DIR}/WebSocketMain.swf"
      to = "#{version_dir(v)}/#{config['SWF_NAME']}"

      puts "copying #{to}"

      FileUtils.cp(from, to)
    end

    def version
      @version ||= Version.new(config['VERSION'])
    end

    def version_dir(v)
      "#{DIST_DIR}/#{v}"
    end
  end
end
