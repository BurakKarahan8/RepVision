import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Ekranlarımız
import HomeScreen from '../screens/HomeScreen';
import UploadScreen from '../screens/UploadScreen';
import AnalysisScreen from '../screens/AnalysisScreen';

const Tab = createBottomTabNavigator();

// Renklerimiz
const COLORS = {
    background: '#1A1A1A',
    accent: '#39FF14',
    inactive: '#A9A9A9',
};

function MainAppTabs({ route }) {
    const { user } = route.params || {};
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            initialRouteName="Home"

            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLORS.accent,
                tabBarInactiveTintColor: COLORS.inactive,
                tabBarStyle: {
                    backgroundColor: COLORS.background,
                    borderTopColor: '#2a2a2a',
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60 + insets.bottom,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = 'home';
                    else if (route.name === 'Upload') iconName = 'upload-file';
                    else if (route.name === 'My Analyses') iconName = 'pie-chart';

                    return <MaterialIcons name={iconName} size={28} color={color} />;
                },
            })}
        >
            {/* 4. DEĞİŞİKLİK: 'user' verisini initialParams ile tüm sekme ekranlarına aktar */}
            <Tab.Screen
                name="My Analyses"
                component={AnalysisScreen}
                initialParams={{ user: user }}
            />
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                initialParams={{ user: user }}
            />
            <Tab.Screen
                name="Upload"
                component={UploadScreen}
                initialParams={{ user: user }}
            />
        </Tab.Navigator>
    );
}

export default MainAppTabs;