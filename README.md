# Authors: KARAPETYAN Mikhail & PLUVIOSE Louis 

# Introduction
Welcome to our project! This is a project for the course "SAE5.ROM03" at the University of Upper Alsace at Colmar.
In this project we implemented the technology "WebRTC" in a web application. Two type of application are available: a complexe application and a simple application. 

## Complex application
The complexe application is a video chat application with a real-time chat. The application is available at the following link: [https://webrtc.louispluviose.fr/](https://webrtc.louispluviose.fr/). 
This application is based on the Server Side Rendering (SSR) technology. The application is developed with the following technologies:
- Astro.JS in Server Side Rendering (SSR) with the Express.JS framework. 
- WebRTC with the PeerJS library.
- Socket.IO for the real-time chat and the video chat.
- TailwindCSS for the design.

For more information about the complexe application, please read the [**REPORT**](rapport/tp2rapport.pdf) file. (Only available in French)

## Simple application
The simple application is a video chat application. The application is available at the following link: [https://simple-webrtc.louispluviose.fr/](https://simple-webrtc.louispluviose.fr/).
This application is based on Express.JS framework. The application is developed with the websoket technology only. 

### Installation
1. To launch the application locally, you need to copy the project on your computer. 
2. Then, you need to install the dependencies with the following command: `npm install`
3. Finally, you can launch the application with the following command: `npm start`

The application is now available at the following address: [http://localhost:7777/](http://localhost:7777/)
(Don't forget to install Node.JS before launching the application)

### Usage 
1. To use the application, you need to authorize the use of your camera and microphone.
2. Then, you need to click on the button "Start Webcam" to start the video chat. (If you want to test the application locally, you need to open two tabs in your browser and authorize the use of your camera and microphone in both tabs)
3. And voilà! You can now chat !

[WARNING]: The application is not finished yet. Bugs are still present!!! Also the README.md file is not finished yet.
