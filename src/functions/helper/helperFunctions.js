import firebase from "../../firebase";
import React, {  useState, useEffect} from 'react';

// initialization of API keys, Client ID to access the Google Calender API
let gapi = window.gapi;
let CLIENT_ID = "109926755172-6086ap2j9nurhqasd0mtqcs2nnhmu163.apps.googleusercontent.com";
let API_KEY = "AIzaSyAZmf24l1CY50NyCtp8OoHVaYFJ-uuv0kU";
let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
let SCOPES = "https://www.googleapis.com/auth/calendar.events";

// Function to fetch information about all events from cloud firestore
const fetchEventData = async () => {

    const data = await firebase.firestore().collection("events").get();
    const events_data = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return events_data;
  };
  
  // Function to fetch information about all teachers from cloud firestore
  const fetchTeacherData = async () => {
    const db = await firebase.firestore();
    const data = await db.collection('teachers').get();
    const teachers_data = await data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return teachers_data;
  };

  export { fetchEventData, fetchTeacherData};