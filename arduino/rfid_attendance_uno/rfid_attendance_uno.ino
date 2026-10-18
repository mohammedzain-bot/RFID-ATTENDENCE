/*
 * =====================================================================
 * RFID Student Attendance Management System - Arduino Uno + MFRC522
 * =====================================================================
 * 
 * Hardware Wiring Guide:
 * ---------------------------------------------------------------------
 * MFRC522 Pin  |  Arduino Uno Pin  |  Description
 * ---------------------------------------------------------------------
 * 3.3V         |  3.3V             |  Power (DO NOT connect to 5V! Max 3.3V)
 * RST          |  Pin 9            |  Reset
 * GND          |  GND              |  Ground
 * IRQ          |  Not Connected    |  Interrupt (Unused)
 * MISO         |  Pin 12           |  SPI MISO
 * MOSI         |  Pin 11           |  SPI MOSI
 * SCK          |  Pin 13           |  SPI Clock
 * SDA (SS)     |  Pin 10           |  SPI Slave Select / Chip Select
 * 
 * Optional Output Indicators:
 * Pin 7        |  Green LED / Buzzer (+) (via 220-330 ohm resistor)
 * Pin 8        |  Red LED (+)            (via 220-330 ohm resistor)
 * ---------------------------------------------------------------------
 *
 * Requirements:
 * Install the "MFRC522" library by GithubCommunity via Arduino IDE Library Manager:
 * Sketch -> Include Library -> Manage Libraries -> Search "MFRC522"
 * =====================================================================
 */

#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN         9          // Configurable, see typical pin layout above
#define SS_PIN          10         // Configurable, see typical pin layout above

#define BUZZER_PIN      7          // Optional buzzer/green LED for feedback
#define STATUS_LED_PIN  8          // Optional status indicator

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance

// Debounce / scan cooldown timer to prevent multiple rapid reads of the same card in 1-2 seconds
unsigned long lastScanTime = 0;
const unsigned long SCAN_COOLDOWN_MS = 2500;
String lastScannedUid = "";

void setup() {
  // Initialize Serial communication at 9600 baud rate
  Serial.begin(9600);
  while (!Serial) {
    ; // Wait for serial port to connect (needed for native USB port only)
  }

  // Initialize indicator pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);

  // Initialize SPI bus
  SPI.begin();

  // Initialize MFRC522 RFID reader
  mfrc522.PCD_Init();
  delay(50);

  // Check communication with reader chip
  byte version = mfrc522.PCD_ReadRegister(MFRC522::VersionReg);
  if (version == 0x00 || version == 0xFF) {
    Serial.println("STATUS:READER_ERROR - Communication with MFRC522 failed. Check wiring!");
  } else {
    Serial.println("STATUS:READY - RFID Attendance Reader Online (MFRC522)");
    // Quick startup beep
    toneFeedback(1800, 80);
    delay(100);
    toneFeedback(2200, 100);
  }
}

void loop() {
  // Check if a new card is present on the RFID antenna
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Verify if the card UID can be successfully read
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Format UID as uppercase colon-separated hex bytes, e.g. "A3:B4:C5:D6"
  String uidString = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) {
      uidString += "0";
    }
    uidString += String(mfrc522.uid.uidByte[i], HEX);
    if (i < mfrc522.uid.size - 1) {
      uidString += ":";
    }
  }
  uidString.toUpperCase();

  unsigned long currentMillis = millis();

  // Check cooldown to avoid flooding serial port when card stays on reader
  if (uidString != lastScannedUid || (currentMillis - lastScanTime) > SCAN_COOLDOWN_MS) {
    lastScanTime = currentMillis;
    lastScannedUid = uidString;

    // Send formatted UID string to USB serial port
    // The Node.js / Express local serial bridge watches for this exact format
    Serial.print("RFID_SCAN:");
    Serial.println(uidString);

    // Audio/visual success chirp
    digitalWrite(STATUS_LED_PIN, HIGH);
    toneFeedback(2400, 120);
    digitalWrite(STATUS_LED_PIN, LOW);
  }

  // Halt PICC to stop reading current card and prepare for next
  mfrc522.PICC_HaltA();
  // Stop encryption on PCD
  mfrc522.PCD_StopCrypto1();
}

// Helper function to produce short feedback tone
void toneFeedback(int freq, int durationMs) {
  tone(BUZZER_PIN, freq, durationMs);
  delay(durationMs);
  noTone(BUZZER_PIN);
}
