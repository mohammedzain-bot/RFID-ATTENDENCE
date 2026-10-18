/*
  ==============================================================
  RFID STUDENT ATTENDANCE SYSTEM - ARDUINO UNO + MFRC522
  ==============================================================
  
  WIRING GUIDE:
  --------------------------------------------------------------
  MFRC522 Pin       Arduino Uno Pin       Notes
  --------------------------------------------------------------
  SDA (SS)     -->  Digital Pin 10        SPI Slave Select
  SCK          -->  Digital Pin 13        SPI Clock
  MOSI         -->  Digital Pin 11        SPI Master Out
  MISO         -->  Digital Pin 12        SPI Master In
  IRQ          -->  (NOT CONNECTED)       Leave empty
  GND          -->  GND                   Ground
  RST          -->  Digital Pin 9         Reset
  3.3V (VCC)   -->  3.3V Pin              *** NEVER USE 5V ***
  --------------------------------------------------------------
*/

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9
#define LED_PIN 13  // Onboard LED for scan indicator

MFRC522 mfrc522(SS_PIN, RST_PIN);

// Registered Students for local verification
struct Student {
  String uid;
  String name;
  String studentId;
  String studentClass;
};

Student students[] = {
  {"8A:B9:D6:05", "Rahul Kumar",  "STU001", "10-A"},
  {"0D:26:AA:04", "Ananya Nair",  "STU002", "10-A"},
  {"12:34:56:78", "Arjun Menon",  "STU003", "10-B"},
  {"AB:CD:EF:12", "Meera Joseph", "STU004", "10-B"}
};

const int studentCount = 4;

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Initialize SPI bus and MFRC522
  SPI.begin();
  mfrc522.PCD_Init();
  delay(100);

  // Set maximum antenna sensitivity
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);

  Serial.println();
  Serial.println("========================================");
  Serial.println("     RFID ATTENDANCE SYSTEM READY       ");
  Serial.println("========================================");

  // Test communication with MFRC522 chip
  byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  if (version == 0x00 || version == 0xFF) {
    Serial.println("WARNING: MFRC522 reader not detected!");
    Serial.println("Please check wire connections (especially 3.3V & GND).");
  } else {
    Serial.print("Reader Firmware: 0x");
    Serial.println(version, HEX);
    Serial.println("RFID Reader Initialized Successfully.");
  }

  Serial.print("Students Registered in Memory: ");
  Serial.println(studentCount);
  Serial.println("Tap an RFID card to scan attendance...");
  Serial.println("----------------------------------------");
}

void loop() {
  // Look for new card
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Read card serial UID
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Blink onboard LED to indicate card detected
  digitalWrite(LED_PIN, HIGH);

  // Format UID to hex string: XX:XX:XX:XX
  String cardUid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) cardUid += "0";
    cardUid += String(mfrc522.uid.uidByte[i], HEX);
    if (i < mfrc522.uid.size - 1) cardUid += ":";
  }
  cardUid.toUpperCase();

  // Print in the exact format the web backend reads:
  Serial.print("RFID UID: ");
  Serial.println(cardUid);

  // Search if UID matches any known student
  bool matched = false;
  for (int i = 0; i < studentCount; i++) {
    if (students[i].uid.equalsIgnoreCase(cardUid)) {
      Serial.print("STUDENT: ");
      Serial.print(students[i].name);
      Serial.print(" | ID: ");
      Serial.print(students[i].studentId);
      Serial.print(" | CLASS: ");
      Serial.println(students[i].studentClass);
      matched = true;
      break;
    }
  }

  if (!matched) {
    Serial.println("STATUS: Unregistered Card Scanned");
  }

  // Turn off onboard LED
  delay(150);
  digitalWrite(LED_PIN, LOW);

  // Halt card and stop encryption
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  // Short delay so it doesn't scan the same card multiple times in 1 second
  delay(1500);
}
