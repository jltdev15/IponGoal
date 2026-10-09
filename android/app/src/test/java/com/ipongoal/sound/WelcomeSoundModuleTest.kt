package com.ipongoal.sound

import com.facebook.react.bridge.ReactMethod
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class WelcomeSoundModuleTest {
  @Test
  fun soundMethodsUseTheAsyncVoidBridgeContract() {
    // Kotlin expression bodies can accidentally export Boolean (Handler.post),
    // which makes React Native reject the entire module at runtime.
    val methods = WelcomeSoundModule::class.java.declaredMethods.filter {
      it.isAnnotationPresent(ReactMethod::class.java)
    }
    assertEquals(setOf("prepare", "play"), methods.map { it.name }.toSet())
    methods.forEach {
      assertEquals(Void.TYPE, it.returnType)
      val annotation = requireNotNull(it.getAnnotation(ReactMethod::class.java))
      assertFalse(annotation.isBlockingSynchronousMethod)
    }
  }
}
