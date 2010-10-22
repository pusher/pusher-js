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
  
  def releaseable
    prerelease? ? [full] : [full, major_minor]
  end
  
  protected
  
  def prerelease?
    @patch =~ /-pre/
  end
  
end

class Builder
  DIST_DIR = 'dist'
  SRC_DIR = 'src'
  
  attr_reader :version, :require_root
  
  def initialize(version, require_root)
    @version = Version.new(version)
    @require_root = require_root
  end

  def build
    version.releaseable.each do |v|
      clear(v)
      bundle('pusher-bundle.js', 'pusher.js', v) do |f|
        licence = File.read('src/pusher-licence.js')
        licence.gsub!(/<VERSION>/, version.full)
        f.write(licence)
      end
      bundle('web-socket-js-bundle.js', 'flashfallback.js', v) do |f|
        licence = File.read('src/web-socket-js-licence.js')
        licence.gsub!(/<VERSION>/, version.full)
        f.write(licence)
      end
      bundle('json-bundle.js', 'json2.js', v)

      copy_swf(v)
    end
  end

  def clear(v)
    path = "#{version_dir(v)}/"
    files =  Dir.glob(path + "*")
    files.each  do |f|
      p "Removing #{f}"
    end
    FileUtils.rm(files)
  end

  def bundle(bundle, dest, v)
    FileUtils.mkdir_p(version_dir(v))

    path = "#{version_dir(v)}/#{dest}"
    min_path = path.sub('.js', '.min.js')

    puts "generating #{path}"

    unminified_code = unminified(bundle).to_s

    File.open(path, 'w') do |f|
      yield f if block_given?
      f.write(unminified_code)
    end

    puts "generating #{min_path}"
    minified = Closure::Compiler.new.compile(unminified_code)
    File.open(min_path, 'w') do |f|
      yield f if block_given?
      f.write(minified)
    end
  end

  def unminified(bundle)
    secretary = Sprockets::Secretary.new(
      :load_path => SRC_DIR,
      :source_files => "#{SRC_DIR}/#{bundle}"
    )
    concatenation = secretary.concatenation.to_s.
      gsub(/<PUSHER_REQUIRE_ROOT>/, require_root).
      gsub(/<VERSION>/, version.full)
  end

  def copy_swf(v)
    from = "#{SRC_DIR}/web-socket-js/WebSocketMain.swf"
    to = "#{version_dir(v)}/WebSocketMain.swf"

    puts "copying #{to}"

    FileUtils.cp(from, to)
  end

  def version_dir(v)
    "#{DIST_DIR}/#{v}"
  end
end
