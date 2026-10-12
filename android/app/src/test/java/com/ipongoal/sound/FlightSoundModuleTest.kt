package com.ipongoal.sound

import com.facebook.react.bridge.ReactMethod
import org.junit.Assert.assertEquals
import org.junit.Test

class FlightSoundModuleTest {
  @Test fun bridgeMethodsReturnVoid() {
    val methods = FlightSoundModule::class.java.declaredMethods.filter {
      it.isAnnotationPresent(ReactMethod::class.java)
    }
    assertEquals(setOf("prepare", "activate", "getEnabled", "setEnabled", "setMusic", "playEffect", "stop", "dispose", "testSound", "addListener", "removeListeners"), methods.map { it.name }.toSet())
    methods.forEach { assertEquals(Void.TYPE, it.returnType) }
  }
}
