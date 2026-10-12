package com.ipongoal.sound

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.SoundPool
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.ipongoal.R

class FlightSoundModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context), LifecycleEventListener {
  private val manager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
  private val preferences = context.getSharedPreferences("flight_sound", Context.MODE_PRIVATE)
  private val attributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME)
    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build()
  private var enabled = preferences.getBoolean("enabled", true)
  private var active = true
  private var interrupted = false
  private var closed = false
  private var wanted = false
  private var focused = false
  private var music: MediaPlayer? = null
  private var soundCheck: MediaPlayer? = null
  private var soundCheckResult: Promise? = null
  private var pool: SoundPool? = null
  private var coin = 0
  private var bump = 0
  private val choices = mutableMapOf<String, Int>()
  private val loaded = mutableSetOf<Int>()
  private val streams = mutableListOf<Int>()
  private val focusListener = AudioManager.OnAudioFocusChangeListener { change ->
    if (change != AudioManager.AUDIOFOCUS_GAIN) UiThreadUtil.runOnUiThread { interrupt() }
  }
  private val focus = if (Build.VERSION.SDK_INT >= 26) AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
    .setAudioAttributes(attributes).setOnAudioFocusChangeListener(focusListener).build() else null
  private val handler = Handler(Looper.getMainLooper())
  private val finishEffect = Runnable { if (!wanted) abandonFocus() }
  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent?.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY) interrupt()
    }
  }

  init {
    context.addLifecycleEventListener(this)
    val filter = IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)
    androidx.core.content.ContextCompat.registerReceiver(context, receiver, filter,
      androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED)
  }
  override fun getName() = "FlightSound"
  @ReactMethod fun addListener(eventName: String) {}
  @ReactMethod fun removeListeners(count: Double) {}
  @ReactMethod fun getEnabled(promise: Promise) { promise.resolve(enabled) }
  @ReactMethod fun setEnabled(value: Boolean) = onMain {
    Log.i("FlightSound", "Sound preference: enabled=$value")
    enabled = value
    preferences.edit().putBoolean("enabled", value).apply()
    if (!value) stopPlayers(false) else updateMusic()
  }
  @ReactMethod fun prepare() = onMain { preparePlayers() }
  @ReactMethod fun activate() = onMain {
    interrupted = false
    Log.i("FlightSound", "Activated: enabled=$enabled active=$active")
  }
  @ReactMethod fun setMusic(playing: Boolean) = onMain {
    Log.i("FlightSound", "Music requested=$playing enabled=$enabled active=$active interrupted=$interrupted")
    wanted = playing
    updateMusic()
  }
  @ReactMethod fun playEffect(effect: String) = onMain {
    if (!audible()) return@onMain
    preparePlayers()
    val sample = if (effect == "coin") coin else if (effect == "bump") bump else choices[effect] ?: 0
    // Never queue late effects: a loading callback must not replay a stale game event.
    if (loaded.contains(sample) && acquireFocus()) {
      if (streams.size >= 8) { streams.forEach { pool?.stop(it) }; streams.clear() }
      val volume = if (effect == "bump") 0.7f else 0.55f
      val stream = pool?.play(sample, volume, volume, 1, 0, 1f) ?: 0
      if (stream != 0) {
        streams.add(stream)
        if (effect.startsWith("choice_")) Log.d("FlightSound", "Choice effect played=$effect")
      } else Log.w("FlightSound", "Effect playback unavailable: $effect")
      handler.removeCallbacks(finishEffect)
      handler.postDelayed(finishEffect, 400)
    }
  }
  @ReactMethod fun stop() = onMain { wanted = false; stopPlayers(true) }
  @ReactMethod fun dispose() = onMain { releasePlayers() }
  @ReactMethod fun testSound(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      finishSoundCheck("inactive")
      when {
        closed || !active -> promise.resolve("inactive")
        !enabled -> promise.resolve("muted")
        manager.isStreamMute(AudioManager.STREAM_MUSIC) ||
          manager.getStreamVolume(AudioManager.STREAM_MUSIC) == 0 -> promise.resolve("volume_zero")
        else -> {
          // This explicit foreground action can retry after an interruption.
          interrupted = false
          if (!acquireFocus()) {
            promise.resolve("focus_denied")
          } else {
            soundCheckResult = promise
            try {
              soundCheck = MediaPlayer.create(context, R.raw.flight_coin, attributes, 0)
              val player = soundCheck
              if (player == null) {
                finishSoundCheck("load_failed")
              } else {
                handler.removeCallbacks(finishEffect)
                player.setVolume(0.55f, 0.55f)
                player.setOnCompletionListener { current ->
                  if (current === soundCheck) finishSoundCheck("completed")
                }
                player.setOnErrorListener { current, what, extra ->
                  Log.e("FlightSound", "Sound check failed: what=$what extra=$extra")
                  if (current === soundCheck) finishSoundCheck("playback_failed")
                  true
                }
                player.start()
              }
            } catch (error: Exception) {
              Log.e("FlightSound", "Sound check failed", error)
              finishSoundCheck("playback_failed")
            }
          }
        }
      }
    }
  }

  private fun finishSoundCheck(result: String) {
    val player = soundCheck
    val promise = soundCheckResult
    soundCheck = null
    soundCheckResult = null
    try { player?.release() } catch (_: Exception) { }
    promise?.resolve(result)
    if (promise != null && !wanted) abandonFocus()
  }

  private fun onMain(action: () -> Unit) {
    UiThreadUtil.runOnUiThread {
      if (!closed) try { action() } catch (error: Exception) {
        Log.e("FlightSound", "Native playback failed", error)
        releasePlayers()
      }
    }
  }
  // Android's media stream controls loudness independently of the ringtone mode.
  // Keep playback running at zero media volume so raising it is immediately audible.
  private fun audible() = enabled && active && !interrupted && !closed
  @Suppress("DEPRECATION")
  private fun acquireFocus(): Boolean {
    if (!focused) focused = (if (Build.VERSION.SDK_INT >= 26 && focus != null) manager.requestAudioFocus(focus)
      else manager.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
    if (!focused) Log.w("FlightSound", "Audio focus denied; playback blocked by Android")
    return focused
  }
  @Suppress("DEPRECATION")
  private fun abandonFocus() {
    if (focused) {
      if (Build.VERSION.SDK_INT >= 26 && focus != null) manager.abandonAudioFocusRequest(focus)
      else manager.abandonAudioFocus(focusListener)
    }
    focused = false
  }
  private fun preparePlayers() {
    if (music == null) {
      music = MediaPlayer.create(context, R.raw.flight_music, attributes, 0)?.apply {
        isLooping = true
        setVolume(0.18f, 0.18f)
        setOnErrorListener { _, what, extra ->
          Log.e("FlightSound", "Music player error: what=$what extra=$extra")
          onMain { releasePlayers() }; true
        }
      }
      if (music == null) Log.e("FlightSound", "Music player could not open the bundled WAV")
    }
    if (pool == null) {
      val player = SoundPool.Builder().setMaxStreams(3).setAudioAttributes(attributes).build()
      pool = player
      player.setOnLoadCompleteListener { current, id, status ->
        if (status != 0) Log.e("FlightSound", "Effect load failed: sample=$id status=$status")
        onMain { if (current === pool && status == 0) loaded.add(id) }
      }
      coin = player.load(context, R.raw.flight_coin, 1)
      bump = player.load(context, R.raw.flight_bump, 1)
      choices["choice_1"] = player.load(context, R.raw.choice_1, 1)
      choices["choice_2"] = player.load(context, R.raw.choice_2, 1)
      choices["choice_3"] = player.load(context, R.raw.choice_3, 1)
      choices["choice_4"] = player.load(context, R.raw.choice_4, 1)
    }
  }
  private fun updateMusic() {
    if (wanted && audible() && acquireFocus()) {
      preparePlayers()
      if (music?.isPlaying == false) {
        music?.start()
        Log.i("FlightSound", "Music started: mediaVolume=${manager.getStreamVolume(AudioManager.STREAM_MUSIC)}")
      }
    } else {
      if (music?.isPlaying == true) music?.pause()
      handler.removeCallbacks(finishEffect)
      handler.postDelayed(finishEffect, 400)
    }
  }
  private fun stopPlayers(rewind: Boolean) {
    finishSoundCheck("inactive")
    music?.let { if (it.isPlaying) it.pause(); if (rewind) it.seekTo(0) }
    streams.forEach { pool?.stop(it) }; streams.clear()
    handler.removeCallbacks(finishEffect)
    abandonFocus()
  }
  private fun interrupt() {
    if (closed || interrupted) return
    interrupted = true
    wanted = false
    stopPlayers(false)
    if (context.hasActiveReactInstance()) context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("FlightSoundInterrupted", null)
  }
  private fun releasePlayers() {
    wanted = false
    try { stopPlayers(true) } catch (_: Exception) { }
    music?.release(); music = null
    pool?.release(); pool = null
    loaded.clear(); coin = 0; bump = 0
    choices.clear()
  }
  override fun onHostPause() = onMain { active = false; interrupt() }
  override fun onHostResume() = onMain { active = true }
  override fun onHostDestroy() = onMain { active = false; releasePlayers() }
  override fun invalidate() {
    context.removeLifecycleEventListener(this)
    try { context.unregisterReceiver(receiver) } catch (_: Exception) { }
    UiThreadUtil.runOnUiThread { releasePlayers(); closed = true }
    super.invalidate()
  }
}
