import firebase from "../firebase";
import React, {  useState, useEffect} from 'react';

let gapi = window.gapi;
let CLIENT_ID = "109926755172-6086ap2j9nurhqasd0mtqcs2nnhmu163.apps.googleusercontent.com";
let API_KEY = "AIzaSyAZmf24l1CY50NyCtp8OoHVaYFJ-uuv0kU";
let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
let SCOPES = "https://www.googleapis.com/auth/calendar.events";



 const createEventMiddle = async function (student) {
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
          const current_date= new Date();    
 
    
         console.log(current_date);
          if(current_date.getDay()=== 0 )
          {
            current_date.setDate(current_date.getDate() + 1);
          }
          
          let req_days= [];

          if (student.courseBatches[0].batch[0] == 'M') {
            req_days=[1,3,5];
          }
          else {
            req_days=[2,4,6];
          }

          let timings = parseInt(student.courseBatches[0].batch.substring(3));

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

          console.log(current_date);
          

          fetchEventData().then(async (data) => {
            let events_data = data; 
            const loop_date = new Date(current_date);

            while( loop_date.getDay() !==0)
          {
           
            if(loop_date.getDay()== req_days[0] || loop_date.getDay()== req_days[1] || loop_date.getDay()== req_days[2])
            {
              console.log("In loop:", loop_date);
              const use_later = new Date(loop_date);
              let flag = 0;
              for (let k = 0; k < parseInt(events_data.length); k++) {
                const obj1 = new Date(events_data[k].event_time.toDate());
                const obj2 = new Date(loop_date);

                let v1 = obj1.getFullYear() == obj2.getFullYear();
                let v2 = obj1.getDate() == obj2.getDate();
                let v3 = obj1.getMonth() == obj2.getMonth();
                let v4 = obj1.getHours() == obj2.getHours();
                let v5 = obj1.getMinutes() == obj2.getMinutes();
                let v6 = obj1.getSeconds() == obj2.getSeconds();


                if (v1 && v2 && v3 && v4 && v5 && v6) {
                  flag = 1;
                                 
                  console.log("updated");
                  const db = firebase.firestore();
                  events_data[k].participants.push({ age: student.age, email: student.BookingEmail });
                  await db.collection('cal_test').doc(events_data[k].id).set(events_data[k]);

                  const event_start = new Date(events_data[k].event_time.toDate());
                  event_start.setHours(event_start.getHours() - 5);
                  event_start.setMinutes(event_start.getMinutes() - 30);
                  const event_end = new Date(events_data[k].event_time.toDate());
                  event_end.setHours(event_end.getHours() + 1);
                  event_end.setHours(event_end.getHours() - 5);
                  event_end.setMinutes(event_end.getMinutes() - 30);

                  let part_email_array=[];

                  for(let g=0;g< events_data[k].participants.length; g++)
                  {
                    part_email_array[g]={'email' : events_data[k].participants[g].email };

                  }

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

                  await req.execute(function(e) {
                    console.log(e);
                });

        

                  break;
                }

              }

              if (flag == 0) {
                //bring in teacher logic
           
                console.log("created");

                //calendar logic starts
                const event_start_time = new Date(loop_date);
                event_start_time.setHours(event_start_time.getHours() - 5);
                event_start_time.setMinutes(event_start_time.getMinutes() - 30);
                const event_end_time = new Date(loop_date);
                event_end_time.setHours(event_end_time.getHours() + 1);
                event_end_time.setHours(event_end_time.getHours() - 5);
                event_end_time.setMinutes(event_end_time.getMinutes() - 30);

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
                  // 'recurrence': [
                  //   'RRULE:FREQ=DAILY;COUNT=2'
                  // ],
                  'attendees': [
                    { 'email': student.BookingEmail }
                  ],
                  'guestsCanInviteOthers': false,
                  'guestsCanSeeOtherGuests': false
                  // 'reminders': {
                  //   'useDefault': false,
                  //   'overrides': [
                  //     {'method': 'email', 'minutes': 24 * 60},
                  //     {'method': 'popup', 'minutes': 10}
                  //   ]
                  // }
                }

                const request = gapi.client.calendar.events.insert({
                  'calendarId': 'primary',
                  'sendUpdates': 'all',
                  'resource': event_obj

                })
              
                await request.execute(async event_ob => {
                  
                  // event_id.push
                  // window.open(event_ob.htmlLink)
                  console.log(use_later);
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
                    teacher_email: []
  
                  };
  
                  await db.collection('cal_test').add(addedObj);

                
               
                })

              

              }
              
    
              
            }

            loop_date.setDate(loop_date.getDate() +1);

          }


          })
       
      })
    })

  // let events_data;
  // const fetchData = async () => {
  //   const db = firebase.firestore();
  //   const data = await db.collection("placeholder").get();
  //   events_data= data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  // };
  // fetchData();


  })
}



const calendarfunction = (event) => {
  gapi.load('client:auth2', () => {
    console.log('loaded client');

    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    });
    // 'dateTime': startDateTime.toISOString(),
    gapi.client.load('calendar', 'v3', () => {
      console.log('bam!');


      gapi.auth2.getAuthInstance().signIn()
        .then(() => {

          let event_id=[];

          for (let i = 0; i < event.length; i++) {

            let event_start_time = event[i].event_time.toDate();
            event_start_time.setHours(event_start_time.getHours() - 5);
            event_start_time.setMinutes(event_start_time.getMinutes() - 30);
            let event_end_time = event[i].event_time.toDate();
            event_end_time.setHours(event_end_time.getHours() + 1);
            event_end_time.setHours(event_end_time.getHours() - 5);
            event_end_time.setMinutes(event_end_time.getMinutes() - 30);

            let event_obj = {
              'summary': event[i].event_name,
              'description': 'Personality development',
              'start': {
                'dateTime': event_start_time.toISOString().substring(0, 19) + "-05:30",
                'timeZone': 'Asia/Calcutta'
              },
              'end': {
                'dateTime': event_end_time.toISOString().substring(0, 19) + "-05:30",
                'timeZone': 'Asia/Calcutta'
              },
              // 'recurrence': [
              //   'RRULE:FREQ=DAILY;COUNT=2'
              // ],
              'attendees': [
                { 'email': event[i].participants[0].email }
              ]
              // 'reminders': {
              //   'useDefault': false,
              //   'overrides': [
              //     {'method': 'email', 'minutes': 24 * 60},
              //     {'method': 'popup', 'minutes': 10}
              //   ]
              // }
            }

            let request = gapi.client.calendar.events.insert({
              'calendarId': 'primary',
              'sendUpdates': 'all',
              'resource': event_obj

            })

            request.execute(event_ob => {
              console.log(event_ob)
              // event_id.push
              // window.open(event_ob.htmlLink)
            })


            /*
                Uncomment the following block to get events
            */
            /*
            // get events
            gapi.client.calendar.events.list({
              'calendarId': 'primary',
              'timeMin': (new Date()).toISOString(),
              'showDeleted': false,
              'singleEvents': true,
              'maxResults': 10,
              'orderBy': 'startTime'
            }).then(response => {
              const events = response.result.items
              console.log('EVENTS: ', events)
            })
            */


          }



        })
    })





  })
}


const fetchEventData = async () => {
  const db = firebase.firestore();
  const data = await db.collection("cal_test").get();
  const events_data = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  return events_data;
};


const createWeeklyPlaceholder = async (courseName) => {
  let students_data;
  let count = 0;
  // const fetchData = async () => {
  const db = firebase.firestore();
  const data = await db.collection("students").get();
  students_data = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  // };
  // fetchData();

   //calendar logic starts
   gapi.load('client:auth2', () => {
    console.log('loaded client');

    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    });
    // 'dateTime': startDateTime.toISOString(),
    gapi.client.load('calendar', 'v3', () => {
      console.log('bam!');


      gapi.auth2.getAuthInstance().signIn()
        .then(() => {
          students_data.forEach(student => {

            for (let j = 0; j < student.courseBatches.length; j++) {
              if (student.courseBatches[j].courseName == courseName) {
                if (parseInt(student.courseBatches[j].NoOfClassesAttended) < parseInt(student.courseBatches[j].NoOfClasses)) {
                  let neededDates = [];
                  let startdate = new Date();
                  // startdate.setFullYear(2020, 11, 27);
        
                  if (student.courseBatches[j].batch[0] == 'M') {
                    startdate.setDate(startdate.getDate() + 1);
                  }
                  else {
                    startdate.setDate(startdate.getDate() + 2);
                  }
        
                  let timings = parseInt(student.courseBatches[j].batch.substring(3));
        
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
        
                  //holiday logic
        
                  neededDates[0] = new firebase.firestore.Timestamp.fromDate(startdate);
                  startdate.setDate(startdate.getDate() + 2);
                  neededDates[1] = new firebase.firestore.Timestamp.fromDate(startdate);
                  startdate.setDate(startdate.getDate() + 2);
                  neededDates[2] = new firebase.firestore.Timestamp.fromDate(startdate);
        
        
        
        
                  fetchEventData().then((data) => {
                    let events_data = data;           
        
                            for (let h = 0; h < 3; h++) {
                      
        
                              let flag = 0;
                              for (let k = 0; k < parseInt(events_data.length); k++) {
                                let obj1 = events_data[k].event_time.toDate();
                                let obj2 = neededDates[h].toDate();
                
                                let v1 = obj1.getFullYear() == obj2.getFullYear();
                                let v2 = obj1.getDate() == obj2.getDate();
                                let v3 = obj1.getMonth() == obj2.getMonth();
                                let v4 = obj1.getHours() == obj2.getHours();
                                let v5 = obj1.getMinutes() == obj2.getMinutes();
                                let v6 = obj1.getSeconds() == obj2.getSeconds();
                
                
                                if (v1 && v2 && v3 && v4 && v5 && v6) {
                                  flag = 1;
                                  count++;
        
                                  
                
                                  const db = firebase.firestore();
                                  events_data[k].participants.push({ age: student.age, email: student.BookingEmail });
                                  db.collection('cal_test').doc(events_data[k].id).set(events_data[k]);
        
                                  let event_start = events_data[k].event_time.toDate();
                                  event_start.setHours(event_start.getHours() - 5);
                                  event_start.setMinutes(event_start.getMinutes() - 30);
                                  let event_end = events_data[k].event_time.toDate();
                                  event_end.setHours(event_end.getHours() + 1);
                                  event_end.setHours(event_end.getHours() - 5);
                                  event_end.setMinutes(event_end.getMinutes() - 30);
        
                                  let  part_email_array=[];
        
                                  for(let g=0;g< events_data[k].participants.length; g++)
                                  {
                                    part_email_array[g]={'email' : events_data[k].participants[g].email };
        
                                  }
        
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
        
                                  req.execute(function(e) {
                                    console.log(e);
                                });
        
                        
                
                                  break;
                                }
                
                              }
                
                              if (flag == 0) {
                                //bring in teacher logic
                                count++;
        
                                //calendar logic starts
                                let event_start_time = neededDates[h].toDate();
                                event_start_time.setHours(event_start_time.getHours() - 5);
                                event_start_time.setMinutes(event_start_time.getMinutes() - 30);
                                let event_end_time = neededDates[h].toDate();
                                event_end_time.setHours(event_end_time.getHours() + 1);
                                event_end_time.setHours(event_end_time.getHours() - 5);
                                event_end_time.setMinutes(event_end_time.getMinutes() - 30);
        
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
                                  // 'recurrence': [
                                  //   'RRULE:FREQ=DAILY;COUNT=2'
                                  // ],
                                  'attendees': [
                                    { 'email': student.BookingEmail }
                                  ]
                                  // 'reminders': {
                                  //   'useDefault': false,
                                  //   'overrides': [
                                  //     {'method': 'email', 'minutes': 24 * 60},
                                  //     {'method': 'popup', 'minutes': 10}
                                  //   ]
                                  // }
                                }
        
                                let request = gapi.client.calendar.events.insert({
                                  'calendarId': 'primary',
                                  'sendUpdates': 'all',
                                  'resource': event_obj
        
                                })
        
                                request.execute(event_ob => {
                                  console.log(event_ob)
                                  // event_id.push
                                  // window.open(event_ob.htmlLink)
        
                                  let createDate = new Date();
                                  let fcreateDate = new firebase.firestore.Timestamp.fromDate(createDate);
                                  const db = firebase.firestore();
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
                                    teacher_email: []
                  
                                  };
                  
                                  db.collection('cal_test').add(addedObj);
                               
                                })
                
                              
                
                              }
                
                            }
                
                          
        
                   
                    
        
        
                  });
        
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


export { createEventMiddle, createWeeklyPlaceholder};
