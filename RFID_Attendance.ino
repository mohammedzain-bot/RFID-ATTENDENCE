/*
  ==============================================================
  RFID STUDENT ATTENDANCE SYSTEM - ARDUINO UNO + MFRC522
  ==============================================================
  
  WIRING GUIDE:
  --------------------------------------------------------------
  MFRC522 Pin  |  Arduino Uno Pin  |  Description
  --------------------------------------------------------------
  SDA (SS)     |  Pin 10           |  SPI Slave Select
  SCK          |  Pin 13           |  SPI Clock (Do NOT attach LEDs to Pin 13!)
  MOSI         |  Pin 11           |  SPI Master Out
  MISO         |  Pin 12           |  SPI Master In
  IRQ          |  (Unused)         |  Leave empty
  GND          |  GND              |  Ground
  RST          |  Pin 9            |  Reset
  3.3V         |  3.3V             |  *** MUST BE 3.3V (NOT 5V) ***
  --------------------------------------------------------------
*/

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN  10
#define RST_PIN 9

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(9600);
  while (!Serial);

  SPI.begin();
  mfrc522.PCD_Init();
  delay(100);

  Serial.println("STATUS:READY");
  Serial.println("RFID Reader Ready. Waiting for card scan...");
}

void loop() {
  // Look for card
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Select card
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Read UID bytes into XX:XX:XX:XX format
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
    if (i < mfrc522.uid.size - 1) uid += ":";
  }
  uid.toUpperCase();

  // Print in standard format for Serial Bridge
  Serial.print("RFID_SCAN:");
  Serial.println(uid);

  // Also print human-readable UID
  Serial.print("RFID UID: ");
  Serial.println(uid);

  // Halt card and stop encryption
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  // 1.5s debounce delay
  delay(1500);
}
