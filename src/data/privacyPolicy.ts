import { appConfig } from '../config/appConfig';

export const privacyPolicy = {
  updated: '13 October 2026',
  introduction: `${appConfig.APP_NAME} is an offline savings tracker. This policy explains how the app uses and stores the information you enter.`,
  sections: [
    {
      title: 'Information saved in the app',
      body: 'The app saves your full name, username, a password hash, and account dates. It also saves the goals, savings amounts, dates, categories, and notes you enter. If you add them, your grade level, profile photo, and goal photos are saved too. Remember Me saves your account selection on this device.',
    },
    {
      title: 'How your information is used',
      body: 'Your information is used to sign you in, separate local accounts, display your profile, and calculate your savings progress, history, and statistics.',
    },
    {
      title: 'Storage and sharing',
      body: 'Your records are stored in the app’s local database on this device. The app does not upload these records to a server or automatically send them to researchers. It has no advertising or analytics services. There is no cloud account or cloud recovery for your records.',
    },
    {
      title: 'Passwords and device security',
      body: 'The app stores a salted password hash rather than your readable password. Keep your device secure and use Remember Me only on a device you trust. Local storage does not guarantee protection if someone gains access to your device.',
    },
    {
      title: 'Optional photos',
      body: 'Adding photos is optional. Camera or photo access is used when you choose to add a picture. Selected pictures are saved locally with your profile or goal. You can manage camera and photo permissions in your device settings.',
    },
    {
      title: 'Managing and removing your information',
      body: 'You can edit your profile, goals, and savings entries in the app, and delete goals or savings entries. Records remain on this device until removed. Reset all device data in Profile permanently removes every local account, goal, and savings record, including other users’ records on the same device. Uninstalling the app or clearing its storage also removes its local records. The app cannot recover deleted records.',
    },
    {
      title: 'Your choice before registering',
      body: 'Read this policy before creating an account. Checking the registration box confirms that you have read and agree to the data handling described here. If you do not agree, you can go back without creating an account. This checkbox does not authorize uploading or sharing your records for research.',
    },
  ],
} as const;
