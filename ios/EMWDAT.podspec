require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

# Load the spm_dependency helper from React Native
react_native_path = File.join(
  File.dirname(`node --print "require.resolve('react-native/package.json')"`),
  "scripts/react_native_pods"
)
require react_native_path

Pod::Spec.new do |s|
  s.name           = 'EMWDAT'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '16.0' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/circus-kitchens/expo-meta-wearables-dat' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Meta Wearables DAT SDK via Swift Package Manager
  spm_dependency(s,
    url: 'https://github.com/facebook/meta-wearables-dat-ios',
    requirement: { kind: 'upToNextMinorVersion', minimumVersion: '0.4.0' },
    products: ['MWDATCore', 'MWDATCamera']
  )

  # Swift/Objective-C settings
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.swift'
end
