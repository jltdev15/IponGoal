#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>

@interface FlightSound : RCTEventEmitter <RCTBridgeModule>
@property(nonatomic, strong) AVAudioPlayer *music;
@property(nonatomic, strong) AVAudioPlayer *coin;
@property(nonatomic, strong) AVAudioPlayer *bump;
@property(nonatomic, strong) NSMutableDictionary<NSString *, AVAudioPlayer *> *choices;
@property(nonatomic) BOOL enabled;
@property(nonatomic) BOOL interrupted;
@property(nonatomic) BOOL wanted;
@property(nonatomic) BOOL observing;
@end

@implementation FlightSound
RCT_EXPORT_MODULE();
+ (BOOL)requiresMainQueueSetup { return YES; }
- (dispatch_queue_t)methodQueue { return dispatch_get_main_queue(); }
- (NSArray<NSString *> *)supportedEvents { return @[@"FlightSoundInterrupted"]; }
- (void)startObserving { self.observing = YES; }
- (void)stopObserving { self.observing = NO; }
- (instancetype)init {
  if ((self = [super init])) {
    NSUserDefaults *prefs = NSUserDefaults.standardUserDefaults;
    _enabled = [prefs objectForKey:@"flight.sound.enabled"] == nil || [prefs boolForKey:@"flight.sound.enabled"];
    NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
    [center addObserver:self selector:@selector(interrupt:) name:UIApplicationWillResignActiveNotification object:nil];
    [center addObserver:self selector:@selector(interrupt:) name:AVAudioSessionInterruptionNotification object:nil];
    [center addObserver:self selector:@selector(routeChanged:) name:AVAudioSessionRouteChangeNotification object:nil];
  }
  return self;
}
- (AVAudioPlayer *)player:(NSString *)name volume:(float)volume {
  NSURL *url = [NSBundle.mainBundle URLForResource:name withExtension:@"wav"];
  if (!url) return nil;
  AVAudioPlayer *player = [[AVAudioPlayer alloc] initWithContentsOfURL:url error:nil];
  player.volume = volume;
  [player prepareToPlay];
  return player;
}
RCT_EXPORT_METHOD(prepare) {
  // Ambient respects the silent switch and mixes with other audio.
  [AVAudioSession.sharedInstance setCategory:AVAudioSessionCategoryAmbient error:nil];
  if (!self.music) { self.music = [self player:@"flight_music" volume:0.18]; self.music.numberOfLoops = -1; }
  if (!self.coin) self.coin = [self player:@"flight_coin" volume:0.55];
  if (!self.bump) self.bump = [self player:@"flight_bump" volume:0.70];
  if (!self.choices) {
    self.choices = [NSMutableDictionary new];
    for (NSString *name in @[@"choice_1", @"choice_2", @"choice_3", @"choice_4"]) {
      AVAudioPlayer *choice = [self player:name volume:0.55];
      if (choice) self.choices[name] = choice;
    }
  }
}
RCT_EXPORT_METHOD(getEnabled:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) { resolve(@(self.enabled)); }
RCT_EXPORT_METHOD(setEnabled:(BOOL)enabled) {
  self.enabled = enabled;
  [NSUserDefaults.standardUserDefaults setBool:enabled forKey:@"flight.sound.enabled"];
  if (!enabled) { [self.music pause]; [self.coin stop]; [self.bump stop]; for (AVAudioPlayer *choice in self.choices.allValues) [choice stop]; }
  else [self setMusic:self.wanted];
}
- (BOOL)audible { return self.enabled && !self.interrupted && UIApplication.sharedApplication.applicationState == UIApplicationStateActive; }
RCT_EXPORT_METHOD(activate) {
  NSError *error = nil;
  [AVAudioSession.sharedInstance setActive:YES error:&error];
  self.interrupted = error != nil;
}
RCT_EXPORT_METHOD(setMusic:(BOOL)playing) {
  self.wanted = playing;
  if (playing && [self audible]) { [self prepare]; [self.music play]; }
  else [self.music pause];
}
RCT_EXPORT_METHOD(playEffect:(NSString *)effect) {
  if (![self audible]) return;
  [self prepare];
  AVAudioPlayer *player = [effect isEqualToString:@"coin"] ? self.coin : ([effect isEqualToString:@"bump"] ? self.bump : self.choices[effect]);
  [player stop]; player.currentTime = 0; [player play];
}
RCT_EXPORT_METHOD(stop) {
  self.wanted = NO;
  [self.music stop]; self.music.currentTime = 0;
  [self.coin stop]; [self.bump stop];
  for (AVAudioPlayer *choice in self.choices.allValues) [choice stop];
}
RCT_EXPORT_METHOD(dispose) {
  [self stop]; self.music = nil; self.coin = nil; self.bump = nil; self.choices = nil;
}
- (void)interrupt:(NSNotification *)notification {
  if ([notification.name isEqualToString:AVAudioSessionInterruptionNotification] &&
      [notification.userInfo[AVAudioSessionInterruptionTypeKey] unsignedIntegerValue] != AVAudioSessionInterruptionTypeBegan) return;
  dispatch_async(dispatch_get_main_queue(), ^{
    self.interrupted = YES;
    [self stop];
    if (self.observing) [self sendEventWithName:@"FlightSoundInterrupted" body:nil];
  });
}
- (void)routeChanged:(NSNotification *)notification {
  if ([notification.userInfo[AVAudioSessionRouteChangeReasonKey] unsignedIntegerValue] == AVAudioSessionRouteChangeReasonOldDeviceUnavailable) [self interrupt:notification];
}
- (void)invalidate { [self dispose]; [NSNotificationCenter.defaultCenter removeObserver:self]; [super invalidate]; }
- (void)dealloc { [NSNotificationCenter.defaultCenter removeObserver:self]; }
@end
