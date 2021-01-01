import firebase from "../firebase";

let gapi = window.gapi;
let CLIENT_ID = "109926755172-6086ap2j9nurhqasd0mtqcs2nnhmu163.apps.googleusercontent.com";
let API_KEY = "AIzaSyAZmf24l1CY50NyCtp8OoHVaYFJ-uuv0kU";
let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
let SCOPES = "https://www.googleapis.com/auth/calendar.events";

const updatePlaceholder = () => {

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

                const today_date= new Date();

                fetchEventData().then(async (data) => {
                    let events_data = data; 

                    for(let i=0;i<events_data.length;i++)
                    {
                        const obj1= new Date(events_data.event_time);
                        const obj2= new Date(today_date);

                        const v1 = obj1.getFullYear() == obj2.getFullYear();
                        const v2 = obj1.getDate() == obj2.getDate();
                        const v3 = obj1.getMonth() == obj2.getMonth();

                        if(v1&&v2&&v3)
                        {
                            let timings = parseInt(events_data[i].event_slot.substring(3));

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

                            
                        }
                    }





                }





            }
        })
    })
}