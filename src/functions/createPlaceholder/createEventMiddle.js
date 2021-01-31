import firebase from "../../firebase";
import React, {  useState, useEffect} from 'react';
const fns = require("../helper/helperFunctions");

// initialization of API keys, Client ID to access the Google Calender API
let gapi = window.gapi;
let CLIENT_ID = "109926755172-6086ap2j9nurhqasd0mtqcs2nnhmu163.apps.googleusercontent.com";
let API_KEY = "AIzaSyAZmf24l1CY50NyCtp8OoHVaYFJ-uuv0kU";
let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
let SCOPES = "https://www.googleapis.com/auth/calendar.events";


// Function to create events, when student added in the middle of the week- creates placeholder events for the rest of that week
 const createEventMiddle = async function (student) {

  // Logging in inside the Google account
  gapi.load('client:auth2', async () => {
    console.log('loaded client');

    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    });
   
    gapi.client.load('calendar', 'v3', () => {
      console.log('bam!');


      gapi.auth2.getAuthInstance().signIn()
        .then(async () => {       

          // current_date initialised with the present date 
          const current_date= new Date(); 
 
          // If the current day is Sunday, shift it to Monday as entire week's events need to be created
          if(current_date.getDay()=== 0 )
          {
            current_date.setDate(current_date.getDate() + 1);
          }
          
          let req_days= [];

          // Setting req_days to appropriate array based on the batch of the student
          if (student.courseBatches[0].batch[0] == 'M') {
            req_days=[1,3,5];
          }
          else {
            req_days=[2,4,6];
          }

          // Pulling out timings from the batch string
          let timings = parseInt(student.courseBatches[0].batch.substring(3));

          // Assigning timings to the current_date
          switch (timings) {
            case 1530: {
              current_date.setHours(15);
              current_date.setMinutes(30);
              current_date.setSeconds(0);

              break;
            }

            case 1700: {
              current_date.setHours(17);
              current_date.setMinutes(0);
              current_date.setSeconds(0);

              break;
            }

            case 1830: {
              current_date.setHours(18);
              current_date.setMinutes(30);
              current_date.setSeconds(0);

              break;
            }


          }
                    
          // Fetching events data from cloud firestore
          fns.fetchEventData().then(async (data) => {
            let events_data = data; 

            // Initializing loop_date with the current_date
            const loop_date = new Date(current_date);

            // Looping through remaining days of the week to create events
            while( loop_date.getDay() !==0)
          {
            
            // Checking if loop_date matches with one of the required days
            if(loop_date.getDay()== req_days[0] || loop_date.getDay()== req_days[1] || loop_date.getDay()== req_days[2])
            {
              
              const use_later = new Date(loop_date);
              let flag = 0;

              // Looping over the events fetched from the DB
              for (let k = 0; k < parseInt(events_data.length); k++) {
                const obj1 = new Date(events_data[k].event_time.toDate());
                const obj2 = new Date(loop_date);

                // Comparing date of the current event with the loop_date
                let v1 = obj1.getFullYear() == obj2.getFullYear();
                let v2 = obj1.getDate() == obj2.getDate();
                let v3 = obj1.getMonth() == obj2.getMonth();
                let v4 = obj1.getHours() == obj2.getHours();
                let v5 = obj1.getMinutes() == obj2.getMinutes();
                let v6 = obj1.getSeconds() == obj2.getSeconds();

                // Updating the event, in case current event_date and loop_date match
                if (v1 && v2 && v3 && v4 && v5 && v6) {
                  flag = 1;
                                 
                  // Updating event, with the newly added participant in the DB
                  const db = firebase.firestore();
                  events_data[k].participants.push({ age: student.age, email: student.BookingEmail });
                  await db.collection('events').doc(events_data[k].id).set(events_data[k]);

                  // Defining start and end times of the event for Google Calender event
                  const event_start = new Date(events_data[k].event_time.toDate());
                  event_start.setHours(event_start.getHours() - 5);
                  event_start.setMinutes(event_start.getMinutes() - 30);
                  const event_end = new Date(events_data[k].event_time.toDate());
                  event_end.setHours(event_end.getHours() + 1);
                  event_end.setHours(event_end.getHours() - 5);
                  event_end.setMinutes(event_end.getMinutes() - 30);

                  let part_email_array=[];

                  // Creating participants array
                  for(let g=0;g< events_data[k].participants.length; g++)
                  {
                    part_email_array[g]={'email' : events_data[k].participants[g].email };

                  }

                  // Adding teachers to the participants array
                  for(let r=0;r<events_data[k].teacher_email.length; r++ )
                  {
                    part_email_array.push({'email': events_data[k].teacher_email[r] })
                  }

                  // Defining parameters for Google Calender event
                  const evobj = {
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
                    
                    'attendees': part_email_array,
                    'guestsCanInviteOthers': false,
                    'guestsCanSeeOtherGuests': false
                 
                  }

                  
                  const req = gapi.client.calendar.events.update({
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
                fns.fetchTeacherData().then( async teachers_data=> {
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
                            if(teachers_data[f].courseBatches[v].courseName == student.courseBatches[0].courseName)
                            {
                       
                              for(let c=0; c< teachers_data[f].courseBatches[v].batch.length; c++)
                              {
                                if(teachers_data[f].courseBatches[v].batch[c]== student.courseBatches[0].batch )
                                {
                                  attendes_array.push({'email': teachers_data[f].email });
                                  break stop;
                                }
                              }
                              
                            }
                          }

                        }
                       

                      }
                      
                    

                    }
         

                //calendar logic starts: initialising start and end time of event
                const event_start_time = new Date(use_later);
                event_start_time.setHours(event_start_time.getHours() - 5);
                event_start_time.setMinutes(event_start_time.getMinutes() - 30);
                const event_end_time = new Date(use_later);
                event_end_time.setHours(event_end_time.getHours() + 1);
                event_end_time.setHours(event_end_time.getHours() - 5);
                event_end_time.setMinutes(event_end_time.getMinutes() - 30);
                  
                attendes_array.push({ 'email': student.BookingEmail });

                // Defining parameters to create calender event
                const event_obj = {
                  'summary': student.courseBatches[0].courseName + " class",
                  'description': 'Personality development',
                  'start': {
                    'dateTime': event_start_time.toISOString().substring(0, 19) + "-05:30",
                    'timeZone': 'Asia/Calcutta'
                  },
                  'end': {
                    'dateTime': event_end_time.toISOString().substring(0, 19) + "-05:30",
                    'timeZone': 'Asia/Calcutta'
                  },               
                  'attendees': attendes_array,
                  'guestsCanInviteOthers': false,
                  'guestsCanSeeOtherGuests': false               
                }

                const request = gapi.client.calendar.events.insert({
                  'calendarId': 'primary',
                  'sendUpdates': 'all',
                  'resource': event_obj

                })
                
                // Executing the request for create event
                await request.execute(async event_ob => {          
                  
                  // Defining object for event in cloud firestore
                  const fcur_date=  new firebase.firestore.Timestamp.fromDate(use_later);
                  const createDate = new Date();
                  const fcreateDate = new firebase.firestore.Timestamp.fromDate(createDate);
                  const db = firebase.firestore();
                  const addedObj = {
                    calender_id: event_ob.id,
                    course: student.courseBatches[0].courseName,
                    created_at: fcreateDate,
                    event_name: student.courseBatches[0].courseName + " class",
                    event_slot: student.courseBatches[0].batch,
                    event_time: fcur_date,
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
              
    
              
            }

            // Incrementing loop_date by a single day every time
            loop_date.setDate(loop_date.getDate() +1);

          }


          })
       
      })
    })
  

  })
}








export { createEventMiddle};
