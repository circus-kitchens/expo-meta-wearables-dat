require 'json'

# Load the spm_dependency helper from React Native
react_native_path = File.join(
  File.dirname(`node --print "require.resolve('react-native/package.json')"`),
  "scripts/react_native_pods"
)
require react_native_path

Pod::Spec.new do |s|
  s.name           = 'MetaWearables'
  s.version        = '1.0.0'
  s.summary        = 'Expo module for Meta Wearables SDK integration'
  s.description    = 'Native iOS module bridging Meta Wearables DAT SDK to React Native via Expo Modules'
  s.author         = 'Circus Group'
  s.homepage       = 'https://github.com/circus-group/ops-ai-wearables'
  s.platforms      = { :ios => '16.0' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Meta Wearables DAT SDK via Swift Package Manager
  spm_dependency(s,
    url: 'https://github.com/facebook/meta-wearables-dat-ios',
    requirement: { kind: 'upToNextMinorVersion', minimumVersion: '0.3.0' },
    products: ['MWDATCore', 'MWDATCamera']
  )

  # Swift/Objective-C settings
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.swift'
end
