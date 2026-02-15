import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface AppToggleProps {
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
  activeTrackColor: string;
  inactiveTrackColor: string;
  activeThumbColor: string;
  inactiveThumbColor: string;
}

function AppToggle({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
  activeTrackColor,
  inactiveTrackColor,
  activeThumbColor,
  inactiveThumbColor,
}: AppToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        {
          backgroundColor: value ? activeTrackColor : inactiveTrackColor,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: value ? activeThumbColor : inactiveThumbColor,
            transform: [{ translateX: value ? 18 : 0 }],
          },
        ]}
      />
    </Pressable>
  );
}

export default React.memo(AppToggle);

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});
