guard :jasmine, server: :none, jasmine_url: "http://localhost:8888/" do
  watch(%r{spec/javascripts/.+_spec\.js$})
  watch(%r{src/(.+)\.js$}) { |m| "spec/javascripts/unit/#{m[1]}_spec.js" }
end
