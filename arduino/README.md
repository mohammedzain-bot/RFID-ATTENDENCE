# Arduino Uno + MFRC522 RFID Attendance Hardware Guide

This directory contains the production-ready embedded firmware for the **RFID-Based Student Attendance Management System**.

---

## 🛠️ Required Hardware Components

1. **Arduino Uno R3** (or Uno R4 / Mega / Nano with SPI)
2. **MFRC522 13.56MHz RFID Reader Module**
3. **Mifare Classic 1K RFID Cards / Keyfob Tags**
4. **USB-A to USB-B Cable** (connects Arduino to PC)
5. **Breadboard & Jumper Wires** (Female-to-Male / Male-to-Male)
6. *(Optional)* **5V Active Buzzer** & **LEDs (Green/Red)** with 220Ω resistors

---

## 🔌 Pin Connection Diagram

> **CRITICAL WARNING:** The MFRC522 RFID module operates at **3.3V logic/power**. Connecting the `VCC` pin of the MFRC522 to 5V will permanently damage the RFID reader! Always connect `3.3V` of Arduino to `3.3V` of MFRC522.

| MFRC522 Pin | Arduino Uno Pin | Description |
|---|---|---|
| **VCC (3.3V)** | **3.3V** | Power supply (3.3V only!) |
| **RST** | **Pin 9** | Reset control |
| **GND** | **GND** | Ground |
| **IRQ** | *Unconnected* | Interrupt pin (not required) |
| **MISO** | **Pin 12** | SPI Master In / Slave Out |
| **MOSI** | **Pin 11** | SPI Master Out / Slave In |
| **SCK** | **Pin 13** | SPI Serial Clock |
| **SDA (SS)** | **Pin 10** | SPI Slave Select / Chip Select |

### Optional Feedback Pins:
- **Buzzer / Green LED (+)**: Pin 7 (via 220Ω resistor)
- **Red Status LED (+)**: Pin 8 (via 220Ω resistor)

---

## 💻 Arduino IDE Setup & Upload Instructions

1. **Install Arduino IDE** from [arduino.cc](https://www.arduino.cc/en/software) if you haven't already.
2. **Install MFRC522 Library**:
   - Open Arduino IDE.
   - Go to **Sketch** -> **Include Library** -> **Manage Libraries...**
   - In the search bar, type `MFRC522`.
   - Find **"MFRC522" by GithubCommunity** and click **Install**.
3. **Open the sketch**:
   - File -> Open -> `arduino/rfid_attendance_uno/rfid_attendance_uno.ino`
4. **Select Board & Port**:
   - **Tools** -> **Board** -> **Arduino Uno**
   - **Tools** -> **Port** -> Select your Arduino COM Port (e.g., `COM3`, `COM4` on Windows).
5. **Upload**:
   - Click the **Upload** arrow button (Ctrl + U).
6. **Verify Serial Output**:
   - Open **Tools** -> **Serial Monitor** at **9600 Baud**.
   - Tap any RFID card or tag against the reader.
   - You will see:
     ```
     STATUS:READY - RFID Attendance Reader Online (MFRC522)
     RFID_SCAN:A3:B4:C5:D6
     ```

---

## ⚡ How the Local Serial Bridge Communicates

The backend includes a built-in Serial Bridge that:
1. Automatically scans available USB COM ports on Windows/Linux/Mac.
2. Connects at 9600 baud rate.
3. Parses serial lines matching `RFID_SCAN:<UID>`.
4. Emits real-time WebSocket events directly to the Web Dashboard.
5. In addition, the Web Dashboard includes an interactive **Hardware Port Manager** where you can select, reconnect, and view live incoming serial packets in real-time!
