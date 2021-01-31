import firebase from "../../firebase";

const fns = require("../helper/helperFunctions");

// initialization of API keys, Client ID to access the Google Calender API
let gapi = window.gapi;
let CLIENT_ID = "109926755172-6086ap2j9nurhqasd0mtqcs2nnhmu163.apps.googleusercontent.com";
let API_KEY = "AIzaSyAZmf24l1CY50NyCtp8OoHVaYFJ-uuv0kU";
let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
let SCOPES = "https://www.googleapis.com/auth/calendar.events"; 

// Function to update the placeholder event, 2 hours before the actual class starts
const updatePlaceholder = async () => {

    
  // Logging in inside the Google account
    gapi.load('client:auth2', async () => {
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

                // Initializing today_date with current date
                const today_date= new Date();

                // Fetching events data from cloud firestore
                fns.fetchEventData().then(async (data) => {
                    let events_data = data; 

                    // Iterating over events one-by-one
                    for(let i=0;i<events_data.length;i++)
                    {   
                        const obj1= new Date(events_data[i].event_time);
                        const obj2= new Date(today_date);

                        // Comparing the event_time of the event with the current today's date
                        const v1 = obj1.getFullYear() == obj2.getFullYear();
                        const v2 = obj1.getDate() == obj2.getDate();
                        const v3 = obj1.getMonth() == obj2.getMonth();

                        if(v1&&v2&&v3)
                        {
                             // Pulling out timings from the batch string
                            let timings = parseInt(events_data[i].event_slot.substring(3));

                            // Assigning timings to the current_date
                            switch (timings) {
                                case 1530: {
                                today_date.setHours(15);
                                today_date.setMinutes(30);
                                today_date.setSeconds(0);

                                break;
                                }

                                case 1700: {
                                today_date.setHours(17);
                                today_date.setMinutes(0);
                                today_date.setSeconds(0);

                                break;
                                }

                                case 1830: {
                                today_date.setHours(18);
                                today_date.setMinutes(30);
                                today_date.setSeconds(0);

                                break;
                                }


                            }

                            // Fetching data from Google Sheets regarding class grouping
                            const res = await fetch('http://gsx2json.com/api?id=1nyzRNDzJCOMVKND__EAfeVJVPwb8cIhrXy5LaZZj55c&sheet=1');
                            const data = await res.json();

                            // Creating arrays of students correspondong to a teacher
                            let teachGroups = new Map();

                            // Iterating over the participants data that has been fetched
                            for(let k = 0; k< events_data[i].participants.length; k++)
                            {
                                for(let j=0;j<data.rows.length; j++)
                                {
                                    // Seraching for the participant in the fetched json data
                                    if(events_data[i].participants[k].email === data.rows[j].bookingemail)
                                    {   
                                        // if the teacher group already exists, push the participant to the array
                                        if(teachGroups.has(data.rows[j].teacheremail))
                                        {
                                            teachGroups[data.rows[j].teacheremail].push(events_data[i].participants[k].email);
                                        }
                                        // Else create the teacher group
                                        else {
                                            teachGroups[data.rows[j].teacheremail]= [events_data[i].participants[k].email ];
                                        }
                                       
                                    }
                                    
                                }
                            }
                           
                            



                            const params = {
                                calendarId: "primary",
                                eventId: events_data[i].calender_id,
                                sendUpdates: "none"
                              };                        
                              
                              // Deleting the previously existing placeholder event
                              let req = gapi.client.calendar.events.delete(params, function(err) {
                                if (err) {
                                  console.log('The API returned an error: ' + err);
                                  return;
                                }
                                console.log('Event deleted.');
                              });
    
                              await req.execute(function(e) {
                                console.log(e);
                            });

                            let mapEntries= teachGroups.entries();

                            // Forming final list of participants including the teacher and all students 
                            for(let ele of mapEntries)
                            {
                                let p_array = [];

                                p_array.push(ele[0]);

                                for( let k=0 ; k < teachGroups[ele[0]].length; k++)
                                {
                                    p_array.push(teachGroups[ele[0]][k]);
                                }

                                 // Defining start and end times of the event for Google Calender event
                                const event_start = new Date(events_data[i].event_time.toDate());
                                event_start.setHours(event_start.getHours() - 5);
                                event_start.setMinutes(event_start.getMinutes() - 30);
                                const event_end = new Date(events_data[i].event_time.toDate());
                                event_end.setHours(event_end.getHours() + 1);
                                event_end.setHours(event_end.getHours() - 5);
                                event_end.setMinutes(event_end.getMinutes() - 30);

                                 // Defining parameters for Google Calender event
                                const evobj = {
                                    'summary': events_data[i].event_name,
                                    'description': 'Personality development',
                                    'start': {
                                    'dateTime': event_start.toISOString().substring(0, 19) + "-05:30",
                                    'timeZone': 'Asia/Calcutta'
                                    },
                                    'end': {
                                    'dateTime': event_end.toISOString().substring(0, 19) + "-05:30",
                                    'timeZone': 'Asia/Calcutta'
                                    },
                                    
                                    'attendees': p_array,
                                    'guestsCanInviteOthers': false,
                                    'guestsCanSeeOtherGuests': false
                                
                                }

                                
                                const request = gapi.client.calendar.events.insert({
                                    'calendarId': 'primary',
                                    'sendUpdates': 'all',
                                    'resource': event_obj
                  
                                  })


                                // Creating google calender event with the all participants
                                await req.execute(function(e) {
                                    console.log(e);
                                });
                            }
    

                            
                        }
                    }





                })





            })
        })
    })
}


export { updatePlaceholder};