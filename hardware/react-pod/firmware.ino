// KIVO React Pod firmware (ESP32, Arduino framework).
// Randomly lights one of 4 pods, measures tap latency, POSTs to KIVO backend.
// Requires: Arduino ESP32 core + ArduinoJson (via Library Manager).

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_PASSWORD";
const char* KIVO_URL  = "http://YOUR_PC_IP:5000/api/hardware/tap";
const char* DEVICE_ID = "kivo-pod-01";
const char* CHILD_ID  = "c_aarav";

const int LED_PINS[4] = {13, 14, 15, 16};
const int BTN_PINS[4] = {12, 27, 33, 32};

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 4; i++) {
    pinMode(LED_PINS[i], OUTPUT);
    pinMode(BTN_PINS[i], INPUT_PULLUP);
  }
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\nConnected! KIVO pod ready.");
  randomSeed(analogRead(0));
}

void loop() {
  int pod = random(0, 4);
  delay(800 + random(0, 900));           // random "get ready" delay
  digitalWrite(LED_PINS[pod], HIGH);
  unsigned long t0 = millis();

  // wait for the correct tap (timeout 5s)
  bool hit = false;
  while (millis() - t0 < 5000) {
    if (digitalRead(BTN_PINS[pod]) == LOW) { hit = true; break; }
    delay(5);
  }
  unsigned long ms = millis() - t0;
  digitalWrite(LED_PINS[pod], LOW);

  if (hit) {
    Serial.printf("Pod %d tapped in %lums\n", pod + 1, ms);
    postTap(pod + 1, ms);
  } else {
    Serial.println("Timeout — no tap");
  }
  delay(600);
}

void postTap(int pod, unsigned long ms) {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(KIVO_URL);
  http.addHeader("Content-Type", "application/json");
  StaticJsonDocument<192> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["childId"] = CHILD_ID;
  doc["pod"] = pod;
  doc["reactionMs"] = ms;
  String body;
  serializeJson(doc, body);
  int code = http.POST(body);
  Serial.printf("POST -> %d\n", code);
  http.end();
}
