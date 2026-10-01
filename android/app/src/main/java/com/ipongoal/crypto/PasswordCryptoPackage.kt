package com.ipongoal.crypto

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class PasswordCryptoPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == PasswordCryptoModule.NAME) PasswordCryptoModule(reactContext) else null
  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(PasswordCryptoModule.NAME to ReactModuleInfo(
      PasswordCryptoModule.NAME, PasswordCryptoModule.NAME, false, false, false, true
    ))
  }
}
