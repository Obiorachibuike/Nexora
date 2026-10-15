plugins {
    kotlin("jvm") version "1.9.22"
}

group = "dev.nexora"
version = "0.1.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.0")
}
