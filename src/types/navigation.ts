export type AuthStackParamList = {
  login: undefined;
  register: undefined;
  'forgot-password': undefined;
};

export type TabsParamList = {
  home: undefined;
  search: undefined;
  bookings: undefined;
  profile: undefined;
};

export type RootStackParamList = {
  index: undefined;
  onboarding: undefined;
} & AuthStackParamList & TabsParamList;

