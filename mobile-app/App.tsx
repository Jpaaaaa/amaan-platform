import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { WorkspaceProvider } from './src/context/WorkspaceContext'
import { AppNavigator } from './src/navigation/AppNavigator'
import { color } from './src/theme'

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={color.bg} />
      <WorkspaceProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </WorkspaceProvider>
    </SafeAreaProvider>
  )
}

export default App
