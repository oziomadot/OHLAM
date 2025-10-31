// Mock DateTimePicker to a simple placeholder
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Mock expo-router hooks used in screens
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => ({}));

// Mock expo vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = (props) => React.createElement(Text, props, props.name || 'Icon');
  return {
    Ionicons: Icon,
    FontAwesome: Icon,
    MaterialIcons: Icon,
  };
});

// Mock safe area context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const MockSafeAreaProvider = ({ children }) => children;
  const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
  return {
    SafeAreaProvider: MockSafeAreaProvider,
    SafeAreaView: 'SafeAreaView',
    useSafeAreaInsets,
  };
});
