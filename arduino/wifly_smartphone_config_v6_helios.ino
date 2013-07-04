/*
Waarschijnlijk moet flow control geimplementeerd worden

oudere firmware 2.45 (die nu standaard meegeleverd wordt) werkt wel, maar de apmode blijft roving1 heten. 



This script is for the Arduino Leonardo. It uses Serial to debug, and Serial1 for the WiFly communcation. 
On a UNO you would lack that extra port. 

2 modes are used Infrastructure and apmode
If you don't get a connection with infrastructure it starts the apmode

button 1 (pin 8): ints apmode
button 2 (pin 9): reinits (and connects to infra if SSID/phrase is good)

commands implemented in Arduino:
store new pincode (1234):  *SPN1234*  returns *PS1234* (so you can check if they match)
check pincode (1234)    :  *PN1234*   returns *PINOK* or *PINERR*
check tcpmode           :  *TCP?*     returns *TCPOPEN* or *TCPCLOS*
wrong password          :             when entering appmode and *PASSERR*, than the wlan pass was wrong

Commands to/from WiFly.
The commands below are needed to configure the infrastructure (homenetwork) parameters 

  connection:             *HELLO*
  command mode:           $$$  returns CMD
  data mode:              exit returns EXIT
  scan:                   scan 1 and after that scan 400 (bug: call scan twice)
                          this takes (14 Channels * 400 = 5600)
  
  set w a <value>  (set wlan auth)    returns AOK                      
  set w k <value>  (set wlan key)     returns AOK
  set w p <string> (set wlan phrase)  returns AOK
  set w s <string> (set wlan ssid)    returns AOK

  save                      returns AOK
  reboot                    (this will do a reinit in Arduino as well)

App moet dus ook rechtstreeks communiceren met WiFly. 
Idee was om scan data gelijk weer op de wifly door te sturen (wifly.read(wiflywrite)), dit gaat mis en de wifly loopt vast. 
Dat betekend dat tcp-ip communicatie toch open moet.. we zetten dit dus alleen open als de pincode ok is (zie versie 3). 

To implement:
- return values
- store pincode in EEPROM
*/

// Wifly library: uses dev branch https://github.com/Seeed-Shield/WiFi_Shield/tree/dev
// JSON minimalist: https://github.com/not404/json-arduino#readme

#include "WiFly.h"
#include "json_arduino.h"
#include <MoodLight.h>

#define AP_DEVICE_ID        "WiFly_AP"
#define WEB_DEVICE_ID       "WiFly"

// we only use this for debugging, the whole idea is to set this with the smartphone
#define WIFISSID  "own SSID"
#define KEY       "own PW"
#define AUTH      WIFLY_AUTH_WPA1_2

WiFly wifly(&Serial1); // connected to 0 and 1 on Arduino Leonardo

char configModePin [] = "1234";
boolean wrongWlanPass = false;  // to show a message if the password was wrong
boolean reInitOnReboot = false; // set to false if reboot is initiated by Arduino 

boolean isTCPOpen; // false TCP is closed, true TCP is open

// inputs
const int button1Pin = 8;
const int button2Pin = 9;

// outputs
const int ledPinR = 6; // pwm pin with red led
const int ledPinG = 5; // pwm pin with green led
const int ledPinB = 3; // pwm pin with blue led

int hue = 260;         // use value between 0 - 359
int saturation = 200;  // use value between 0 - 255
int brightness = 0;  // use value between 0 - 255

// create MoodLight object
MoodLight ml = MoodLight(); 

int button1;
int button2;

//JSON part
token_list_t *token_list = NULL;

void setup() {
  
  pinMode(button1Pin, INPUT);
  pinMode(button2Pin, INPUT);
  
  Serial.begin(57600);   // debuging serial usb
  
  //while (!Serial) {
  //  ; // wait for serial port to connect. Needed for Leonardo only
  //}
  Serial.println("starting...");
  delay(200); // give WiFly some time to power up
  
  // in case the UART baudrate is reset, we configure it again at 57600 baud
  // only after power off (problem some users can change the baudrate, 
  // but then you are an expert already
  Serial1.begin(9600); 
    // if we can enter commandmode we speak 9600 baud with the WiFly
    if(wifly.commandMode())
    { wifly.reset(); // factory reset in case settings where changed
      wifly.sendCommand("set uart baud 57600\r", "AOK"); 
      wifly.sendCommand("save\r", "Storing"); // save
      wifly.reboot();
      delay(200);
    }
    Serial1.flush();
  Serial1.end();   

  initWifly();  
}

// function called after setup
// but also when we changed the settings (reInitOnReboot)
void initWifly()
{ 
    
  Serial1.begin(57600); // rx/tx WiFly
    Serial1.flush();    // clear everyting leave this
    wifly.clear();      // clear everyting leave this
    wifly.dataMode();   // clear everyting leave this
    delay(200);
    //default settings
    
    wifly.sendCommand("set o j 1500\r", "AOK");            // set opt jointmr give more time to connect
    wifly.sendCommand("set i p 3\r", "AOK");               // set ip proto 3 (TCP, UDP)   
    wifly.sendCommand("set w f 900\r", "AOK");             // set wlan fmon 15 minutes for aging out clients (APmode) that do not send any traffic over Wi-Fi.
    wifly.sendCommand("set b i 0x3\r", "AOK");             // set broadcast intervalof UDP packet each 4 seconds
    wifly.sendCommand("set t e 60\r", "AOK");              // set time enable 60 (every 60 minutes)
    //wifly.sendCommand("set w s " WIFISSID "\r", "AOK");    // set wlan ssid
    //wifly.sendCommand("set w p " KEY "tt\r", "AOK");       // set wlan phrase
    //wifly.sendCommand("set w a 3\r", "AOK");             // set wlan auth
    //wifly.sendCommand("set uart mode 0x0\r", "AOK");     // Command echo 0=enabled (default), 1=disabled
    wifly.sendCommand("save\r", "Storing");  
    wifly.reboot(); 
    
    delay(200);
  
    if(startInfra()) 
    { Serial.println(F("Infrastructure mode"));
    }
    else
    {  // start the normal accesspoint
       startNormalAP(); 
    }
    reInitOnReboot = true;
}

//idea to reset the whole board on a reset. However reset is different in Leonardo and Uno. 
//probably better to solved it in a different way now. 
//declare reset function at address 0
//void(* resetFunction) (void) = 0;  
/*
void resetFunction()
{  Serial.end();
   delay(100);
   Serial.begin(1200);
   delay(100);
   Serial.end();  
}
*/

void loop() {
  
  button1 = digitalRead(button1Pin);
  button2 = digitalRead(button2Pin);

  if(button1==HIGH) 
  { Serial.println("pressed button 1: AP mode");
    startNormalAP();
    delay(100);
  }
  else if(button2==HIGH) 
  { Serial.println("pressed button 2: reinit");
    initWifly();
    delay(100);
    
    //Serial.println("pressed button 2: Infra mode");
    //startInfra(); 
    //delay(100);
  }
  
  // process WiFly data commands and json parsing
  processIncomingData(); 
  
  // show colors
  ml.setHSB(hue, saturation , brightness);
  
  analogWrite(ledPinR, ml.getRed());
  analogWrite(ledPinG, ml.getGreen());
  analogWrite(ledPinB, ml.getBlue());   
  
  // use the Serial monitor to send data to the WiFly
  if (Serial.available()) {
    wifly.write(Serial.read());
  }
}

// normal WLAN
boolean startInfra()
{ wifly.sendCommand("set o d " WEB_DEVICE_ID "\r", "AOK"); // set opt deviceid, each mode has own id
  wifly.sendCommand("set i d 1\r", "AOK");                 // Set DHCP obtain (necessary coming from apmode)
  wifly.sendCommand("set w h 1\r", "AOK");                 // set wlan hide, hide wlan phrase/key 
  wifly.sendCommand("set w j 0\r", "AOK");                 // set wlan join (necessary coming from apmode)
  wifly.sendCommand("set i t 0x10\r", "AOK");              // set ip tcp-mode 0x10 // disables remote configuration over TCP
  
  isTCPOpen = false;
  
  wifly.sendCommand("save\r", "Storing");  
  wifly.reboot(); 
  
  delay(200);
  
  boolean joined = false;
  
  // try to join maximum 3 times, before returning false (and going to apmode)
  if(!wifly.sendCommand("join\r", "ssociated!", 1500))
  {  // association failed check why by retry
     if(wifly.sendCommand("join\r", "AUTH-ERR", 1500))
     { Serial.println(F("wrong pass"));
       wrongWlanPass = true;
     }
     else 
     { if(wifly.sendCommand("join\r", "ssociated!", 1500)) joined=true; // retry once more
     }
  } 
  else joined=true;  
  
  if(joined)
  { wifly.dataMode(); 
    return true;
  }
  else return false;
  
}

// accespoint if we don't want people to change settings
boolean startNormalAP()
{ Serial.println(F("starting AP")); 
  wifly.sendCommand("set o d " AP_DEVICE_ID "\r", "AOK"); // set opt deviceid, each mode has own id
  wifly.sendCommand("set ip tcp-mode 0x10\r", "AOK");   // set ip tcp-mode 0x10 // disables remote configuration over TCP 
  //wifly.sendCommand("set w h 1\r", "AOK");              // set wlan hide, hide wlan phrase/key 
  isTCPOpen = false;
  
  wifly.sendCommand("apmode\r", "AP mode",3000);  
  //if(wifly.sendCommand("apmode\r", "AP mode",3000))  
  //{  wifly.sendCommand("scan 1\r", "END");           // do one 1ms scan, because in APmode the first scan gives always an empty result 
  //}  
  wifly.dataMode();
  
  if(wrongWlanPass) wifly.print("*PASSERR*\r\n");
  
  Serial.println(F("AP mode"));  
}

// filtering commands with the processIncomingData;
boolean commandStarted = false;
boolean commandEnded = false;

char commandData [7]; 
byte commandDataIndex = 0;

// filtering json strings

boolean jsonStarted = false;
boolean jsonEnded   = false;

// now sending: {\"hue\":120, \"sat\":255 , \"bri\":255}
// 40 characters (received as 33?)
char jsonData[50];        // dit kan gecombineerd worden met commandData, gewoon 1 buffer array
int  jsonDataIndex = 0;

// idee:
// via Serial.find kun je het eind karakter opsporen } dan weet je al of je een heel pakketje hebt. 
// alleen voor string compare moet je nog wel bufferen. 
// een buffer zoals hier is het meest zeker. Maar als er geheugen problemen ontstaan, dan kan dit 
// waarschijnlijk wel efficienter zonder te bufferen (dan moeten commando's ook anders kunnen).  

char* jsonValue; // pointer to the value

void processIncomingData()
{ // http://stackoverflow.com/questions/8849541/arduino-sketch-reading-serial-bytes  
  // http://arduino.cc/forum/index.php/topic,45629.0.html
  
  //if(wifly.available())
  while(wifly.available())
  { char inChar = wifly.read();
    
    if(inChar == '*')
    {  if(commandStarted==false)
       {
         commandDataIndex = 0;
         commandData[commandDataIndex] = '\0'; // Null terminate the string
         commandStarted = true;
         commandEnded = false;
       }
       else commandEnded = true;
    }
    else if(inChar == '{')
    {  if(jsonStarted==false)
       {
         jsonDataIndex = 0;
         jsonData[jsonDataIndex] = inChar;
         jsonDataIndex++;
         jsonData[jsonDataIndex] = '\0'; // Null terminate the string
         jsonStarted = true;
         jsonEnded = false;
       }
    }
    else if(inChar == '}')
    {  jsonEnded = true;
      
       if(jsonDataIndex < sizeof(jsonData)-1)
       { jsonData[jsonDataIndex] = inChar;
         jsonDataIndex++;
         jsonData[jsonDataIndex] = '\0'; // Null terminate the string
       }
    }    
    else if(commandStarted==true && commandEnded==false)
    {
      if(commandDataIndex < 7)
      { commandData[commandDataIndex] = inChar;
        commandDataIndex++;
        commandData[commandDataIndex] = '\0'; // Null terminate the string
      }
      else
      { Serial.println("error: command too long");
        //reset
        commandStarted = false;
        commandEnded = false;
        commandDataIndex = 0;
        commandData[commandDataIndex] = '\0'; // Null terminate the string        
      }
    }
    else if(jsonStarted==true && jsonEnded==false)
    {
      if(jsonDataIndex < sizeof(jsonData)-1)
      { jsonData[jsonDataIndex] = inChar;
        jsonDataIndex++;
        jsonData[jsonDataIndex] = '\0'; // Null terminate the string
      }
      else
      { Serial.println("error: json too long");
        //reset
        jsonStarted = false;
        jsonEnded = false;
        jsonDataIndex = 0;
        jsonData[jsonDataIndex] = '\0'; // Null terminate the string        
      }
    }
    else
    { // passthrough
      //return inChar;
      Serial.write(inChar);
      //wifly.write(inChar);
    }
   
    //Serial.write(wifly.read());
  }

  if(jsonStarted && jsonEnded)
  { for(int i = 0; i<jsonDataIndex; i++)
    { Serial.write(jsonData[i]);
    }
    
    token_list = create_token_list(25);       // Create the Token List.
    int tokens = json_to_token_list(jsonData, token_list); // Convert JSON String to a Hashmap of Key/Value Pairs
    
    //Serial.println(tokens);
    //jsonValue = json_get_value(token_list, "hue");
    
    // convert values to integers with atoi
    hue        = atoi(json_get_value(token_list, "hue"));
    saturation = atoi(json_get_value(token_list, "saturation"));
    brightness = atoi(json_get_value(token_list, "brightness"));
  
    //Serial.println(jsonValue);
    
    release_token_list(token_list); // Release or Wipe the Token List, else memory-leak at your own peril.

     // Reset for the next packet
    jsonStarted = false;
    jsonEnded = false;
    jsonDataIndex = 0;
    jsonData[jsonDataIndex] = '\0'; // Null terminate the string
  }
    
  // We are here either because all pending serial data has been read OR because an end of
  // packet marker arrived. Which is it?
  if(commandStarted && commandEnded)
  { Serial.println("command received: ");
  
    for(int i = 0; i<commandDataIndex; i++)
    { Serial.write(commandData[i]);
    }
    Serial.println();
   
    //if(strcmp("OPEN", commandData) == 0) 
    if(strcmp("Reboot", commandData) == 0) 
    {         
       if(reInitOnReboot == true)
       {  Serial.println("reInitReset");
          //resetFunction(); //call reset 
          //wifly.sendCommand("set ip tcp-mode 0x10\r", "AOK"); // happens already
          //isTCPOpen = false;
          
          delay(200); // wait till reboot before reinit
          wifly.dataMode(); 
          initWifly();
          
       }
           
       
    }
    //if(strcmp("CLOS", commandData) == 0) 
    if(strcmp("CRASH", commandData) == 0) initWifly();
    //if(strcmp("READY", commandData) == 0)
    
    
    // store entered pin format *SPN1234*
    if(strncmp("SPN", commandData, 3) == 0)
    {   strncpy (configModePin, commandData+strlen(commandData)-4, sizeof(configModePin) );
        //Serial.print("new pin: ");
        //Serial.println(configModePin);
        wifly.print("*PS");
        wifly.print(configModePin);
        wifly.print("*\r\n");
    }
    
    // check entered pin format *PN1234*
    // returns *PINOK* 
    if(strncmp("PN", commandData, 2) == 0)
    { // compare pin (last 4 numbers) witht the stored pin
      if ( strcmp(configModePin, commandData+strlen(commandData)-4) == 0 )
      { //Serial.print("password match");
        
        
        // open TCP/IP connection if thats open return *PINOK*
        if(wifly.sendCommand("set i t 0x0\r", "AOK"))
        { wifly.dataMode(); // return to datamode to send info
          isTCPOpen = true;
          wifly.print("*PINOK*\r\n");
          wifly.print("*TCPOPEN*\r\n");
        }       
      }
      else wifly.print("*PINERR*\r\n");
    }
    
    // give response to *TCP?*
    if(strncmp("TCP?", commandData, 4) == 0)
    {  if(isTCPOpen) wifly.print("*TCPOPEN*\r\n");
       else          wifly.print("*TCPCLOS*\r\n");
    } 

    // Reset for the next packet
    commandStarted = false;
    commandEnded = false;
    commandDataIndex = 0;
    commandData[commandDataIndex] = '\0'; // Null terminate the string
  }
  
}






