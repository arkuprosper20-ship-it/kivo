# KIVO React Pod (ESP32) — future hardware extension

The KIVO app **does not require hardware**. The digital challenges (tap pods,
jump counter, station grid) already simulate the physical React Pod.

This folder prepares the integration path for a real ESP32 pod:

```
LED lights up  →  child taps the pod button  →  ESP32 timestamps the tap
→  ESP32 POSTs {pod, reactionMs} over Wi-Fi  →  KIVO backend scores it
```

## Wiring (ESP32 DevKit)

| Pod | LED pin | Button pin |
|-----|---------|------------|
| 1   | GPIO 13 | GPIO 12    |
| 2   | GPIO 14 | GPIO 27    |
| 3   | GPIO 15 | GPIO 33    |
| 4   | GPIO 16 | GPIO 32    |

Buttons use internal pull-ups (active LOW). LEDs through 220Ω resistors.

## Firmware

See [`firmware.ino`](./firmware.ino). Configure:

```cpp
const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_PASSWORD";
const char* KIVO_URL  = "http://YOUR_PC_IP:5000/api/hardware/tap";
```

The firmware picks a random pod, lights it, measures tap latency, and POSTs:

```json
{ "deviceId": "kivo-pod-01", "childId": "c_aarav", "pod": 2, "reactionMs": 812 }
```

## Backend ingest (planned)

`POST /api/hardware/tap` — validate `deviceId` against an allow-list,
convert taps into a `reaction-rush` attempt via the existing scoring engine.
No changes to scoring or gamification needed; hardware is just another input.
