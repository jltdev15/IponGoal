#import <AVFoundation/AVFoundation.h>
#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface WelcomeSound : NSObject <RCTBridgeModule>
@property(nonatomic, strong) AVAudioPlayer *player;
@end

@implementation WelcomeSound
RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup { return YES; }
- (dispatch_queue_t)methodQueue { return dispatch_get_main_queue(); }

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
      selector:@selector(stop) name:UIApplicationWillResignActiveNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
      selector:@selector(stop) name:AVAudioSessionInterruptionNotification object:nil];
  }
  return self;
}

RCT_EXPORT_METHOD(prepare)
{
  if (self.player) return;
  // Ambient respects the silent switch and mixes with the user's existing audio.
  NSError *error = nil;
  if (![[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryAmbient error:&error]) return;
  NSURL *url = [[NSBundle mainBundle] URLForResource:@"welcome-oink" withExtension:@"wav"];
  if (!url) return;
  self.player = [[AVAudioPlayer alloc] initWithContentsOfURL:url error:&error];
  self.player.volume = 0.65f;
  [self.player prepareToPlay];
}

RCT_EXPORT_METHOD(play)
{
  if (UIApplication.sharedApplication.applicationState != UIApplicationStateActive) return;
  [self prepare];
  [self.player stop];
  self.player.currentTime = 0;
  [self.player play];
}

- (void)stop { [self.player stop]; }
- (void)dealloc { [[NSNotificationCenter defaultCenter] removeObserver:self]; }
@end
