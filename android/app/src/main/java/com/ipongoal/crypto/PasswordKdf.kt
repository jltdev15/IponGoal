package com.ipongoal.crypto

import java.nio.charset.StandardCharsets
import javax.crypto.Mac
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

internal object PasswordKdf {
  fun decode(hex: String): ByteArray {
    require(hex.length % 2 == 0 && hex.all { it in '0'..'9' || it in 'a'..'f' })
    return ByteArray(hex.length / 2) { hex.substring(it * 2, it * 2 + 2).toInt(16).toByte() }
  }
  fun encode(bytes: ByteArray): String = bytes.joinToString("") { "%02x".format(it.toInt() and 255) }

  fun derive(password: ByteArray, salt: ByteArray, rounds: Int, api: Int): ByteArray {
    require(rounds in 1..210000 && salt.size == 16 && password.size <= 512)
    val text = String(password, StandardCharsets.UTF_8)
    // Round-trip check keeps arbitrary bytes compatible too; no Unicode normalization.
    val canonical = text.toByteArray(StandardCharsets.UTF_8)
    val validUtf8 = canonical.contentEquals(password)
    canonical.fill(0)
    // Android's PBKDF2 factory rejects empty passwords; HMAC still implements them exactly.
    if (api >= 26 && validUtf8 && password.isNotEmpty()) {
      val chars = text.toCharArray()
      val spec = PBEKeySpec(chars, salt, rounds, 256)
      try {
        return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
      } finally {
        chars.fill('\u0000')
        spec.clearPassword()
      }
    }
    return deriveHmac(password, salt, rounds)
  }

  // API 24–25 lack the PBKDF2-SHA256 factory. JCA HMAC accepts exact password bytes.
  fun deriveHmac(password: ByteArray, salt: ByteArray, rounds: Int): ByteArray {
    val mac = Mac.getInstance("HmacSHA256")
    // An empty HMAC key and a single zero byte have the same padded key block.
    mac.init(SecretKeySpec(if (password.isEmpty()) byteArrayOf(0) else password, "HmacSHA256"))
    val block = salt + byteArrayOf(0, 0, 0, 1)
    var digest = mac.doFinal(block)
    val result = digest.clone()
    try {
      for (i in 1 until rounds) {
        if (i % 1000 == 0 && Thread.currentThread().isInterrupted) throw InterruptedException()
        val next = mac.doFinal(digest)
        digest.fill(0)
        digest = next
        for (j in result.indices) result[j] = (result[j].toInt() xor digest[j].toInt()).toByte()
      }
      return result
    } catch (e: Exception) {
      result.fill(0)
      throw e
    } finally {
      block.fill(0)
      digest.fill(0)
    }
  }
}
