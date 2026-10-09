package com.ipongoal.sound

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.SoundPool
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.ipongoal.R

// The pool outlives the welcome artwork, including the third tap's transition.
class WelcomeSoundModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context), LifecycleEventListener {
  private var pool: SoundPool? = null
  private var sound = 0
  private var stream = 0
  private var loaded = false
  private var pending = false
  private var active = true
  @Volatile private var closed = false

  init { context.addLifecycleEventListener(this) }
  override fun getName() = "WelcomeSound"

  @ReactMethod
  fun prepare() {
    UiThreadUtil.runOnUiThread { preparePlayer() }
  }

  private fun preparePlayer() {
    if (closed || pool != null) return
    try {
      val player = SoundPool.Builder()
        .setMaxStreams(1)
        .setAudioAttributes(AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_GAME)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build())
        .build()
      pool = player
      player.setOnLoadCompleteListener { current, _, status ->
        if (!closed && current === pool) {
          loaded = status == 0
          if (pending && loaded) playLoaded()
          pending = false
        }
      }
      sound = player.load(context, R.raw.welcome_oink, 1)
    } catch (_: Exception) {
      release()
    }
  }

  @ReactMethod
  fun play() {
    UiThreadUtil.runOnUiThread {
      if (closed || !active) return@runOnUiThread
      preparePlayer()
      pending = !loaded
      if (loaded) playLoaded()
    }
  }

  private fun playLoaded() {
    if (!active || closed) return
    try {
      val manager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
      pool?.stop(stream)
      stream = 0
      // Respect silent/vibrate mode and the user's media volume.
      if (manager.ringerMode != AudioManager.RINGER_MODE_NORMAL ||
        manager.getStreamVolume(AudioManager.STREAM_MUSIC) == 0) return
      stream = pool?.play(sound, 0.65f, 0.65f, 1, 0, 1f) ?: 0
    } catch (_: Exception) {
      // Decorative audio never affects navigation.
    }
  }

  private fun stop() {
    pending = false
    pool?.stop(stream)
    stream = 0
  }

  private fun release() {
    stop()
    pool?.release()
    pool = null
    sound = 0
    loaded = false
  }

  override fun onHostResume() { UiThreadUtil.runOnUiThread { active = true } }
  override fun onHostPause() { UiThreadUtil.runOnUiThread { active = false; stop() } }
  override fun onHostDestroy() { UiThreadUtil.runOnUiThread { active = false; release() } }

  override fun invalidate() {
    closed = true
    context.removeLifecycleEventListener(this)
    UiThreadUtil.runOnUiThread { release() }
    super.invalidate()
  }
}
