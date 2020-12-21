import firebase from "../firebase";

const createPlaceholderEvent = async function (student) {
  
  var events_data;
  const fetchData = async () => {
    const db = firebase.firestore();
    const data = await db.collection("placeholder").get();
    events_data= data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  };
  fetchData();

  console.log(events_data);
    
  };

  const fetchEventData = async () => {
    const db = firebase.firestore();
    const data = await db.collection("placeholder").get();
    const events_data= data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    return events_data;
  };

const createWeeklyPlaceholder=async (courseName) => {
  var students_data;
  var count=0;
  // const fetchData = async () => {
    const db = firebase.firestore();
    const data = await db.collection("students").get();
    students_data= data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  // };
  // fetchData();

  students_data.forEach(student => {
    
    for(var j=0;j<student.courseBatches.length; j++)
    {
      if(student.courseBatches[j].courseName==courseName)
      {
        if(parseInt(student.courseBatches[j].NoOfClassesAttended)<parseInt(student.courseBatches[j].NoOfClasses))
        {
          var neededDates=[];
          var startdate= new Date();
          startdate.setFullYear(2020,11,20);

          if(student.courseBatches[j].batch[0]=='M')
          {          
            startdate.setDate(startdate.getDate() + 1);
          }
          else
          {
            startdate.setDate(startdate.getDate() + 2);
          }

          var timings= parseInt(student.courseBatches[j].batch.substring(3));
          
          switch(timings)
          {
            case 1530: {
              startdate.setHours=15;
              startdate.setMinutes=30;
              startdate.setSeconds=0;
              break;
            }

            case 1700: {
              startdate.setHours=17;
              startdate.setMinutes=0;
              startdate.setSeconds=0;
              break;
            }

            case 1830: {
              startdate.setHours=18;
              startdate.setMinutes=30;
              startdate.setSeconds=0;
              break;
            }
          }

          //holiday logic
 
          neededDates[0]= new firebase.firestore.Timestamp.fromDate(startdate);
          startdate.setDate(startdate.getDate() + 2);
          neededDates[1]= new firebase.firestore.Timestamp.fromDate(startdate);
          startdate.setDate(startdate.getDate() + 2);
          neededDates[2]= new firebase.firestore.Timestamp.fromDate(startdate); 
      
          
          var events_data= fetchEventData();        
                
  
          for(var h=0;h<3;h++)
          {
              var flag=0;
              for(var k=0;k<events_data.length;k++)
              {
                if(events_data[k].event_time === neededDates[h])
                {
                  flag=1;
                  count++;
                  console.log(count);
                  const db = firebase.firestore();
                  events_data[k].participants.push({ age: student.age, email: student.BookingEmail});
                  db.collection('placeholder').doc(events_data.id).set({...events_data[k] });

                  break;
                }

              }

              if(flag==0)            
              {
                //bring in teacher logic
                count++;
                console.log(count);                
                var createDate= new Date();   
                let fcreateDate= new firebase.firestore.Timestamp.fromDate(createDate);
                const db = firebase.firestore();
                db.collection('placeholder').add({
                  course: courseName,
                  created_at: fcreateDate,
                  event_name: courseName+" class",
                  event_slot: student.courseBatches[j].batch,
                  event_time: neededDates[h],
                  participants: [{
                    age: student.age,
                    email: student.BookingEmail 
                  }],
                  teacher_email: []
                  
                });

              }

          }       

        
          
        }
        else
        {
          break;
        }
      }

    }



  })

  // console.log(count);

}

  export default createWeeklyPlaceholder;
  