# NexTrack RFID - Student Attendance Management System

A modern, responsive, real-time RFID-based student attendance management platform connecting to an **Arduino Uno** with an **MFRC522 RFID reader** via a local USB serial bridge.

---

## 🌐 Live Web Application

- **Web Dashboard (Dev Server with HMR):** [http://localhost:3000](http://localhost:3000)
- **Backend API & Serial Bridge Server:** [http://localhost:5000](http://localhost:5000)
- **Default Admin Login:**
  - **Username:** `admin`
  - **Password:** `admin123`
  *(A convenient "One-Click Quick Fill" button is also provided on the login page)*

---

## 🚀 Key Features

1. **Tap-to-Record Interactive Kiosk:**
   - Central "Ready to Scan" section with animated RFID wave radar.
   - When a student taps their card, smoothly transitions to **"Attendance Recorded"** with the student's profile photo, prominent name, Student ID, class, roll number, scan time, and celebratory confetti.
   - Automatically returns to "Ready to Scan" after 5 seconds with countdown timer.
2. **Attendance Rules Enforced:**
   - **First valid scan of the day:** Marked `PRESENT` (or `LATE` if after cutoff) with exact system timestamp.
   - **Duplicate tap on same day:** Does not duplicate records; displays `"Already marked present today."`
   - **Unregistered card:** Displays `"RFID card not registered."`
3. **Live Hardware Bridge with Real-Time Updates:**
   - Communicates with physical Arduino Uno over USB Serial COM port.
   - Real-time WebSockets push updates instantly without page refresh.
   - Live hardware status indicators:
     - 🟢 **RFID Reader Connected**
     - 🟡 **Waiting for Card**
     - 🔴 **RFID Reader Disconnected**
   - Live Serial Packet Terminal viewing incoming raw lines (`RFID_SCAN:A3:B4:C5:D6`).
   - Distinct **Demo Tap Mode** for testing when hardware is unplugged.
4. **Student Management & RFID Pairing:**
   - Register, edit, delete students.
   - **"Scan RFID Card" Mode:** When registering a student, clicking "Scan RFID Card" allows the administrator to tap any card on the reader to auto-populate the UID!
5. **Attendance History & Analytics:**
   - Search by name, roll number, student ID, or UID.
   - Filter by date, class, and attendance status.
   - Export filtered logs to CSV with one click.
   - Analytics charts: Daily trends, department distribution, and student rate rankings.

---

## 🔌 Hardware Wiring Guide (Arduino Uno + MFRC522)

> ⚠️ **CRITICAL WARNING:** Connect MFRC522 `VCC` pin **ONLY to Arduino 3.3V**. Connecting to 5V will damage the reader!

| MFRC522 Pin | Arduino Uno Pin | Description |
|---|---|---|
| **VCC** | **3.3V** | Power (3.3V only) |
| **RST** | **Pin 9** | Reset |
| **GND** | **GND** | Ground |
| **IRQ** | *Unconnected* | Not required |
| **MISO** | **Pin 12** | SPI MISO |
| **MOSI** | **Pin 11** | SPI MOSI |
| **SCK** | **Pin 13** | SPI Clock |
| **SDA (SS)**| **Pin 10** | SPI Slave Select |

*(Optional: Pin 7 for buzzer/green LED, Pin 8 for status LED)*

The complete Arduino sketch is located at:
[`arduino/rfid_attendance_uno/rfid_attendance_uno.ino`](file:///c:/Users/varis/OneDrive/Desktop/filzas.prjt/arduino/rfid_attendance_uno/rfid_attendance_uno.ino)

---

## 🏃 Running the Application

### 1. Start the Backend API & Serial Bridge:
```bash
cd backend
npm run build
npm start
```

### 2. Start the Frontend Dashboard:
```bash
cd frontend
npm run dev -- --port 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
