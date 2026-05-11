export type LiveSessionParams = {
  streamId: string;
  inviteText?: string;
  title?: string;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  TwoFactor: {
    challengeId: string;
    method?: string;
    identifier?: string;
  };
};

export type ChatStackParamList = {
  ChatThreads: undefined;
  ChatThread: { threadId: string; title?: string };
  CallSession: LiveSessionParams;
};

export type StreamsStackParamList = {
  StreamsList: undefined;
  StreamViewer: LiveSessionParams;
};
