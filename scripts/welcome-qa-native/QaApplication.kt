package com.ipongoal

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

// Used only by welcome-qa.gradle; normal MainApplication remains unchanged.
class WelcomeQaApplication : Application(), ReactApplication {
  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList = PackageList(this).packages.apply {
        add(com.ipongoal.sound.WelcomeSoundPackage())
      },
      useDevSupport = false,
    )
  }
  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
