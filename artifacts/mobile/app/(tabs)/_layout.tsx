import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'leaf', selected: 'leaf.fill' }} />
        <Label>Farm</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="town">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>Town</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mine">
        <Icon sf={{ default: 'hammer', selected: 'hammer.fill' }} />
        <Label>Mine</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="bag">
        <Icon sf={{ default: 'bag', selected: 'bag.fill' }} />
        <Label>Bag</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          paddingBottom: isWeb ? 0 : insets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'dark'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Farm',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="leaf.fill" tintColor={color} size={22} />
            ) : (
              <MaterialCommunityIcons name="sprout" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="town"
        options={{
          title: 'Town',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.2.fill" tintColor={color} size={22} />
            ) : (
              <Ionicons name="people" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="mine"
        options={{
          title: 'Mine',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="hammer.fill" tintColor={color} size={22} />
            ) : (
              <MaterialCommunityIcons name="pickaxe" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="bag"
        options={{
          title: 'Bag',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bag.fill" tintColor={color} size={22} />
            ) : (
              <Ionicons name="bag" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
