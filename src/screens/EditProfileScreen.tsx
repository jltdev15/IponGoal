import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, StyleSheet, Text, View } from 'react-native';
import { NavigationAction, usePreventRemove } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../navigation/types';
import { useAuthStore } from '../stores/authStore';
import { updateProfile } from '../database/repositories/userRepository';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { theme } from '../theme/theme';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { chooseProfilePhoto } from '../services/profilePhoto';
import { useFormAction } from '../services/useFormAction';
export function EditProfileScreen({
  navigation,
}: NativeStackScreenProps<MainStackParams, 'EditProfile'>) {
  const user = useAuthStore(s => s.user)!;
  const refreshUser = useAuthStore(s => s.refreshUser);
  const [initial] = useState(() => ({
    name: user.fullName,
    grade: user.gradeLevel,
    photo: user.profilePhoto,
  }));
  const [name, setName] = useState(initial.name);
  const [grade, setGrade] = useState(initial.grade);
  const [photo, setPhoto] = useState(initial.photo);
  const { busy, error, run } = useFormAction();
  const [operation, setOperation] = useState<'photo' | 'save' | null>(null);
  const [exitIntent, setExitIntent] = useState<
    NavigationAction | 'back' | null
  >(null);
  const promptOpen = useRef(false);
  const left = useRef(false);
  const dirty =
    name !== initial.name || grade !== initial.grade || photo !== initial.photo;
  const locked = busy || exitIntent !== null;
  usePreventRemove((dirty || busy) && exitIntent === null, ({ data }) => {
    if (busy) {
      AccessibilityInfo.announceForAccessibility(
        'Please wait for the current profile action to finish.',
      );
      return;
    }
    if (promptOpen.current) {
      return;
    }
    promptOpen.current = true;
    Alert.alert(
      'Discard unsaved changes?',
      'Your name, grade, or photo changes have not been saved.',
      [
        {
          text: 'Keep Editing',
          style: 'cancel',
          onPress: () => {
            promptOpen.current = false;
          },
        },
        {
          text: 'Discard Changes',
          style: 'destructive',
          onPress: () => {
            promptOpen.current = false;
            setExitIntent(data.action);
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          promptOpen.current = false;
        },
      },
    );
  });
  // Dispatch only after a render disables the removal guard, including after saving.
  useEffect(() => {
    if (!exitIntent || left.current) {
      return;
    }
    left.current = true;
    if (exitIntent === 'back') {
      navigation.goBack();
    } else {
      navigation.dispatch(exitIntent);
    }
  }, [exitIntent, navigation]);
  return (
    <ScreenContainer>
      <Text accessibilityRole="header" style={theme.title}>
        Edit your profile
      </Text>
      <View style={theme.card}>
        <Text accessibilityRole="header" style={theme.heading}>
          Profile photo
        </Text>
        <View style={styles.avatar}>
          <ProfileAvatar
            fullName={name || initial.name}
            photo={photo}
            size={88}
          />
        </View>
        <AppButton
          title={photo ? 'Change Photo' : 'Choose Photo'}
          variant="secondary"
          disabled={locked}
          onPress={() => {
            void run(async () => {
              setOperation('photo');
              try {
                const selected = await chooseProfilePhoto();
                if (selected !== undefined) {
                  setPhoto(selected);
                }
              } finally {
                setOperation(null);
              }
            }, 'Unable to choose your photo. Please try again.');
          }}
        />
        {!!photo && (
          <AppButton
            title="Remove Photo"
            variant="secondary"
            disabled={locked}
            onPress={() => setPhoto(null)}
          />
        )}
        <Text style={theme.muted}>
          Photo changes stay in this preview until you tap Save Profile. Your
          photo is stored only on this device.
        </Text>
      </View>
      <View style={theme.card}>
        <Text accessibilityRole="header" style={theme.heading}>
          Personal details
        </Text>
        <AppInput
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
          editable={!locked}
          autoComplete="name"
          maxLength={80}
        />
        <AppInput
          label="Grade Level (optional)"
          placeholder="e.g. Grade 11"
          helper="You can leave this blank."
          value={grade}
          onChangeText={setGrade}
          editable={!locked}
          maxLength={40}
        />
        <View style={styles.username}>
          <Text style={theme.muted}>Username</Text>
          <Text style={theme.body}>@{user.username}</Text>
          <Text style={theme.muted}>Your username cannot be changed.</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {!!error && (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={theme.error}
          >
            {error}
          </Text>
        )}
        {busy && (
          <Text accessibilityRole="alert" style={theme.muted}>
            {operation === 'photo'
              ? 'Choosing your photo. Please wait.'
              : 'Saving your profile. Please wait.'}
          </Text>
        )}
        <AppButton
          title="Save Profile"
          loading={busy && operation === 'save'}
          disabled={locked}
          onPress={() => {
            void run(() => {
              setOperation('save');
              try {
                updateProfile(user.id, name, grade, photo);
                refreshUser();
                setExitIntent('back');
              } finally {
                setOperation(null);
              }
            }, 'Unable to update your profile.');
          }}
        />
        <Text style={theme.muted}>
          Save applies your name, grade, and photo changes to this local
          profile.
        </Text>
      </View>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  avatar: { alignItems: 'center', paddingVertical: 4 },
  username: { gap: 4 },
  actions: { gap: 12 },
});
