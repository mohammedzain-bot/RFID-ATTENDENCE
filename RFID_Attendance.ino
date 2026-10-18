/*
  RFID Attendance System - Arduino Sketch v2
  Works with MFRC522 + Arduino Uno
  
  WIRING:
    MFRC522 SDA  (pin 1)  --> Arduino Pin 10
    MFRC522 SCK  (pin 2)  --> Arduino Pin 13
    MFRC522 MOSI (pin 3)  --> Arduino Pin 11
    MFRC522 MISO (pin 4)  --> Arduino Pin 12
    MFRC522 IRQ  (pin 5)  --> NOT CONNECTED
    MFRC522 GND  (pin 6)  --> Arduino GND
    MFRC522 RST  (pin 7)  --> Arduino Pin 9
    MFRC522 3.3V (pin 8)  --> Arduino 3.3V  *** NOT 5V ***
*/

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN  10
#define RST_PIN 9

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(9600);
  while (!Serial);  // Wait for serial port to open
  
  SPI.begin();
  mfrc522.PCD_Init();
  delay(100);
  
  // Boost antenna gain to MAX for better detection
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);

  // Print version to verify MFRC522 is wired correctly
  byte v = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.println("================================");
  Serial.println("     RFID ATTENDANCE SYSTEM");
  Serial.println("================================");
  
  if (v == 0x00 || v == 0xFF) {
    Serial.println("ERROR: MFRC522 not detected! Check wiring.");
    Serial.println("STATUS:READER_ERROR");
    while (true); // Stop here - wiring is wrong
  }
  
  Serial.print("MFRC522 Version: 0x");
  Serial.println(v, HEX);
  Serial.println("RFID Reader Ready!");
  Serial.println("Students registered: 4");
  Serial.println("Tap an RFID card...");
}

void loop() {
  // Reset the loop if no new card present
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Select one of the cards
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Build UID string in format XX:XX:XX:XX
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
    if (i < mfrc522.uid.size - 1) uid += ":";
  }
  uid.toUpperCase();

  // Output UID — server reads this line
  Serial.print("RFID UID: ");
  Serial.println(uid);

  // Halt PICC and stop encryption
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  delay(2000); // 2 second cooldown between scans
}
