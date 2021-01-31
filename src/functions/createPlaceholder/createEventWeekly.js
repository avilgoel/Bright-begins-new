import firebase from "../../firebase";
import React, {  useState, useEffect} from 'react';
const fns = require("../helper/helperFunctions");

// initialization of API keys, Client ID to access the Google Calender API
let gapi = window.gapi;
let CLIENT_ID = "109926755172-6086ap2j9nurhqasd0mtqcs2nnhmu163.apps.googleusercontent.com";
let API_KEY = "AIzaSyAZmf24l1CY50NyCtp8OoHVaYFJ-uuv0kU";
let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
let SCOPES = "https://www.googleapis.com/auth/calendar.events";

// Function to create events for all students on a weekly basis( to be run on Sundays)
const createWeeklyPlaceholder = async (courseName) => {
  let students_data;
  let count = 0;

  // Fetching the students' data from cloud firestore
  const db = firebase.firestore();
  const data = await db.collection("students").get();
  students_data = await data.docs.map(doc => ({ ...doc.data(), id: doc.id }));

   
  // Logging in inside the Google account
   await gapi.load('client:auth2', async () => {
    console.log('loaded client');

    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    });
 
    gapi.client.load('calendar', 'v3', async () => {
      console.log('bam!');


      gapi.auth2.getAuthInstance().signIn()
        .then(async () => {

          // Iterating over the students_data fetched from DB
          students_data.forEach(async student => {

            for (let j = 0; j < student.courseBatches.length; j++) {
              
              // Course of the student should be same as the given course
              if (student.courseBatches[j].courseName == courseName) {

                // Number of classes attended should be less than the total number of classes
                if (parseInt(student.courseBatches[j].NoOfClassesAttended) < parseInt(student.courseBatches[j].NoOfClasses)) {
                  let neededDates = [];

                  // Setting startdate as the current date
                  let startdate = new Date();
      
                  // If batch is MWF, start with Monday, else with Tuesday
                  if (student.courseBatches[j].batch[0] == 'M') {
                    startdate.setDate(startdate.getDate() + 1);
                  }
                  else {
                    startdate.setDate(startdate.getDate() + 2);
                  }
        
                   // Pulling out timings from the batch string
                  let timings = parseInt(student.courseBatches[j].batch.substring(3));
        
                  
                  // Assigning timings to the startdate
                  switch (timings) {
                    case 1530: {
                      startdate.setHours(15);
                      startdate.setMinutes(30);
                      startdate.setSeconds(0);
        
                      break;
                    }
        
                    case 1700: {
                      startdate.setHours(17);
                      startdate.setMinutes(0);
                      startdate.setSeconds(0);
        
                      break;
                    }
        
                    case 1830: {
                      startdate.setHours(18);
                      startdate.setMinutes(30);
                      startdate.setSeconds(0);
        
                      break;
                    }
        
        
                  }
        
                  //holiday logic comes in
                  // Ascertaining the needed dates for the student
                  neededDates[0] = new firebase.firestore.Timestamp.fromDate(startdate);
                  startdate.setDate(startdate.getDate() + 2);
                  neededDates[1] = new firebase.firestore.Timestamp.fromDate(startdate);
                  startdate.setDate(startdate.getDate() + 2);
                  neededDates[2] = new firebase.firestore.Timestamp.fromDate(startdate);
        
        
        
             
                            // Iterating over those needed dates
                            for (let h = 0; h < 3; h++) {

                              // Fetching events data from cloud firestore 
                            await fns.fetchEventData().then(async (data) => {


                              let events_data = data; 
                         
                              let flag = 0;

                              // Looping over the events fetched from the DB
                              for (let k = 0; k < parseInt(events_data.length); k++) {
                                let obj1 = new Date(events_data[k].event_time.toDate());
                                let obj2 = new Date(neededDates[h].toDate());
            
                               
                                // Comparing date of the current event with the needed date
                                let v1 = obj1.getFullYear() == obj2.getFullYear();
                                let v2 = obj1.getDate() == obj2.getDate();
                                let v3 = obj1.getMonth() == obj2.getMonth();
                                let v4 = obj1.getHours() == obj2.getHours();
                                let v5 = obj1.getMinutes() == obj2.getMinutes();
                                let v6 = obj1.getSeconds() == obj2.getSeconds();
                
                
                                if (v1 && v2 && v3 && v4 && v5 && v6) {
                                  flag = 1;
                                  
        
                                  
                                  // Updating event, with the newly added participant in the DB
                                  const db = await firebase.firestore();
                                  await events_data[k].participants.push({ age: student.age, email: student.BookingEmail });
                                  await db.collection('events').doc(events_data[k].id).set(events_data[k]);
                                  
                                   // Defining start and end times of the event for Google Calender event
                                  let event_start = new Date(events_data[k].event_time.toDate());
                                  event_start.setHours(event_start.getHours() - 5);
                                  event_start.setMinutes(event_start.getMinutes() - 30);
                                  let event_end = new Date(events_data[k].event_time.toDate());
                                  event_end.setHours(event_end.getHours() + 1);
                                  event_end.setHours(event_end.getHours() - 5);
                                  event_end.setMinutes(event_end.getMinutes() - 30);
        
                                  let  part_email_array=[];
                                  
                                   // Creating participants array
                                  for(let g=0;g< events_data[k].participants.length; g++)
                                  {
                                    part_email_array[g]={'email' : events_data[k].participants[g].email };
        
                                  }

                                  // Adding teachers to the participants array
                                  for(let r=0;r<events_data[k].teacher_email.length; r++ )
                                  {
                                    await part_email_array.push({'email': events_data[k].teacher_email[r] })
                                  }
                
                                 // Defining parameters for Google Calender event
                                  let evobj = {
                                    'summary': events_data[k].event_name,
                                    'description': 'Personality development',
                                    'start': {
                                      'dateTime': event_start.toISOString().substring(0, 19) + "-05:30",
                                      'timeZone': 'Asia/Calcutta'
                                    },
                                    'end': {
                                      'dateTime': event_end.toISOString().substring(0, 19) + "-05:30",
                                      'timeZone': 'Asia/Calcutta'
                                    },
                                    
                                    'attendees': part_email_array
                                 
                                  }
          
                                  
                                  let req = gapi.client.calendar.events.update({
                                    'calendarId': 'primary',
                                    'eventId': events_data[k].calender_id,
                                    'sendUpdates': 'all',
                                    'resource': evobj
                                  });
                                  
                                  // Updating google calender event with the added participant
                                  await req.execute(function(e) {
                                    console.log(e);
                                });
        
                        
                
                                  break;
                                }
                
                              }
                              
                              // If flag is 0, then event does not exist in the DB, hence Creating new event
                              if (flag == 0) {
        
                                 // Assigning teachers to the event 
                                await fns.fetchTeacherData().then(async teachers_data=> {
                                let attendes_array=[];
                                  
                                // Iterating over teachers_data brought from the DB
                                  for(let f=0;f<teachers_data.length;f++)
                                  {
                                    // Assigned teachers should have priority p1
                                    if(teachers_data[f].priority == 'p1')
                                    {
                                  

                                      stop: 
                                      {
                                        for(let v=0 ; v< teachers_data[f].courseBatches.length; v++)
                                        {
                                          // Teacher's coursename and batch should match that of the student
                                          if(teachers_data[f].courseBatches[v].courseName == courseName)
                                          {
                                     
                                            for(let c=0; c< teachers_data[f].courseBatches[v].batch.length; c++)
                                            {
                                              if(teachers_data[f].courseBatches[v].batch[c]== student.courseBatches[j].batch )
                                              {
                                                await attendes_array.push({'email': teachers_data[f].email });
                                                                                             
                                                break stop;
                                              }
                                            }
                                            
                                          }
                                        }

                                      }
                                     

                                    }
                                    
                                  

                                  }
                                  

                               
        
                                //calendar logic starts: initialising start and end time of event
                                let event_start_time = new Date(neededDates[h].toDate());
                                event_start_time.setHours(event_start_time.getHours() - 5);
                                event_start_time.setMinutes(event_start_time.getMinutes() - 30);
                                let event_end_time = new Date(neededDates[h].toDate());
                                event_end_time.setHours(event_end_time.getHours() + 1);
                                event_end_time.setHours(event_end_time.getHours() - 5);
                                event_end_time.setMinutes(event_end_time.getMinutes() - 30);
                                
                                  await attendes_array.push( { 'email': student.BookingEmail });

                                 // Defining parameters to create calender event
                                let event_obj = {
                                  'summary': courseName + " class",
                                  'description': 'Personality development',
                                  'start': {
                                    'dateTime': event_start_time.toISOString().substring(0, 19) + "-05:30",
                                    'timeZone': 'Asia/Calcutta'
                                  },
                                  'end': {
                                    'dateTime': event_end_time.toISOString().substring(0, 19) + "-05:30",
                                    'timeZone': 'Asia/Calcutta'
                                  },                                  
                                  'attendees': attendes_array
                                  
                                }
        
                                let request = gapi.client.calendar.events.insert({
                                  'calendarId': 'primary',
                                  'sendUpdates': 'all',
                                  'resource': event_obj
        
                                });
                                
                                // Executing the request for create event
                                await request.execute(async event_ob => {
                        
                          
                                 // Defining object for event in cloud firestore
                                  let createDate = new Date();
                                  let fcreateDate = new firebase.firestore.Timestamp.fromDate(createDate);
                                  const db = await firebase.firestore();
                                  const addedObj = {
                                    calender_id: event_ob.id,
                                    course: courseName,
                                    created_at: fcreateDate,
                                    event_name: courseName + " class",
                                    event_slot: student.courseBatches[j].batch,
                                    event_time: neededDates[h],
                                    participants: [{
                                      age: student.age,
                                      email: student.BookingEmail
                                    }],
                                    teacher_email: attendes_array.slice(0,attendes_array.length-1)
                  
                                  };
                                  
                                  // Creating event in cloud firestore
                                  await db.collection('events').add(addedObj);
                                     
                                })
                

                                })


                              
                
                              }

                            })  
                                
        

                
                            }
                
                          
        
                   
                    
        
        
                 
        
                }
                else {
                  break;
                }
              }
        
            }
        
        
        
          })

        })
      })
    })





}


export { createWeeklyPlaceholder};