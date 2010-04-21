require 'fileutils'
require 'tempfile'
require 'yaml'

require 'rubygems'
require 'closure-compiler'
require 'sprockets'

module Builder
  DIST_DIR = 'dist'
  SRC_DIR = 'src'

  class << self
    def build(*args)
      bundle('bundle.js', 'pusher.js') do |f|
        licence = File.read('src/pusher-licence.js')
        licence.sub!('<%= VERSION %>', version.to_s)
        f.write(licence)
      end

      copy_swf
    end

    def bundle(src, dest)
      FileUtils.mkdir_p(version_dir)

      path = "#{version_dir}/#{dest}"
      tempfile = Tempfile.new('bundle')

      puts "generating #{path}"

      secretary = Sprockets::Secretary.new(
        :load_path => SRC_DIR,
        :source_files => "#{SRC_DIR}/#{src}"
      )
      concatenation = secretary.concatenation
      concatenation.save_to(tempfile.path)

      minified = Closure::Compiler.new.compile(tempfile)

      File.open(path, 'w') do |f|
        yield f
        f.write(minified)
      end
    end

    def config
      @config ||= YAML.load_file("#{SRC_DIR}/constants.yml")
    end

    def copy_swf
      from = "#{SRC_DIR}/WebSocketMain.swf"
      to = "#{version_dir}/#{config['SWF_NAME']}"

      puts "copying #{to}"

      FileUtils.cp(from, to)
    end

    def version
      config['VERSION']
    end

    def version_dir
      "#{DIST_DIR}/#{version}"
    end
  end
end
