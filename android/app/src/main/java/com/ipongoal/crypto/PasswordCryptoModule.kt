package com.ipongoal.crypto

import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.RejectedExecutionException

@ReactModule(name = PasswordCryptoModule.NAME)
class PasswordCryptoModule(context: ReactApplicationContext) : NativePasswordCryptoSpec(context) {
  companion object { const val NAME = "NativePasswordCrypto" }
  private val executor = Executors.newSingleThreadExecutor()
  private val pending = ConcurrentHashMap<Promise, Boolean>()
  @Volatile private var closed = false
  override fun getName() = NAME

  override fun derive(passwordUtf8Hex: String, saltHex: String, iterations: Double, promise: Promise) {
    if (closed) { promise.reject("E_PASSWORD_CRYPTO", "Password security is unavailable. Please try again."); return }
    pending[promise] = true
    try {
      executor.execute {
        var password: ByteArray? = null
        var salt: ByteArray? = null
        var result: ByteArray? = null
        try {
          require(iterations.isFinite() && iterations == iterations.toInt().toDouble())
          require(passwordUtf8Hex.length <= 1024 && saltHex.length == 32)
          password = PasswordKdf.decode(passwordUtf8Hex)
          salt = PasswordKdf.decode(saltHex)
          result = PasswordKdf.derive(password, salt, iterations.toInt(), Build.VERSION.SDK_INT)
          val hex = PasswordKdf.encode(result)
          if (pending.remove(promise) != null) promise.resolve(hex)
        } catch (error: Exception) {
          val code = when (error) {
            is java.security.NoSuchAlgorithmException -> "E_PASSWORD_PROVIDER"
            is java.security.spec.InvalidKeySpecException, is IllegalArgumentException -> "E_PASSWORD_INPUT"
            else -> "E_PASSWORD_CRYPTO"
          }
          if (pending.remove(promise) != null) promise.reject(code, "Unable to secure your account. Please try again.")
        } finally {
          password?.fill(0); salt?.fill(0); result?.fill(0)
        }
      }
    } catch (_: RejectedExecutionException) {
      if (pending.remove(promise) != null) promise.reject("E_PASSWORD_CRYPTO", "Password security is unavailable. Please try again.")
    }
  }
  override fun invalidate() {
    closed = true
    executor.shutdownNow()
    for (promise in pending.keys) {
      if (pending.remove(promise) != null) promise.reject("E_PASSWORD_CRYPTO", "Password security was interrupted. Please try again.")
    }
    super.invalidate()
  }
}
