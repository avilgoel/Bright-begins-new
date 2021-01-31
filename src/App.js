import React, {  useState, useEffect} from 'react'
import './App.css';
import firebase from "./firebase";

const fn1 = require("./functions/createPlaceholder/createEventMiddle");
const fn2 = require("./functions/createPlaceholder/createEventWeekly");
const fn3 = require("./functions/updatePlaceholder/updatePlaceholder");

function App() {
  const [formtype,setFormtype] = useState("paid");
  
  const [students,setStudents] = useState([]);
  const [sname, setSname] = useState("");
  const [fname, setFname] = useState("");
  const [mname, setMname] = useState("");
  const [phone, setPhone] = useState("");
  const [pemail, setPemail] = useState("");
  const [bemail, setBemail] = useState("");
  const [age, setAge] = useState("");
  const [batch, setBatch] = useState("MWF1530");
  const [nclasses, setNclasses] = useState("52"); 

  
  useEffect(() => {
    const fetchData = async () => {
      const db = firebase.firestore();
      const data = await db.collection("students").get();
      setStudents(data.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    fetchData();
  }, []);
  
  const onCreate1 = () => {
    const db = firebase.firestore();    
    var cancelDate= new Date();
    var customerCancelDate= new Date();
    var ndays= {
      "52": "150",
      "13": "37"
    }
    cancelDate.setDate(cancelDate.getDate() + parseInt(ndays[nclasses]) ); 
    customerCancelDate.setDate(customerCancelDate.getDate() + parseInt(ndays[nclasses])-10 ); 

    let fcanceldate= new firebase.firestore.Timestamp.fromDate(cancelDate);
    let fcustomerCancelDate= new firebase.firestore.Timestamp.fromDate(customerCancelDate);

   
    let student= {
      BookingEmail: bemail,
      FatherName: fname,
      MotherName: mname,
      ParentEmail: pemail,
      ParentPhone: phone,
      StudentName: sname,
      age: age,
      courses: ["course1"],
      courseBatches: [{
        NoOfClasses: nclasses,
        NoOfClassesAttended: "0",
        batch: batch,
        cancellation: {
          cancelDates: [],
          noOfCancellation: "0"
          
        },
        courseName: "course1",
        validityDate: fcanceldate,
        validityDateForCustomer: fcustomerCancelDate

      }] 
    };
    
    db.collection('students').add(student);
    fn1.createEventMiddle(student);
  
    
  }

  const onCreate2 = () => {
    const db = firebase.firestore();
    db.collection('demo_students').add({
      BookingEmail: bemail,
      ParentPhone: phone,
      StudentName: sname,
      age: age,
      batch: batch
      
    });
  }

  return (
    <div className="App">      
     

    { (formtype=="paid") ? (
          <div>
          <h1>Paid Customer</h1>

          <form onSubmit={(e) => {e.preventDefault(); onCreate1();}}> 
          <p> 
                    
          <input required type="text" name="student_name" placeholder="Student's Name" value={sname} onChange={e => setSname(e.target.value)}  /><br /> <br /> 
          <input required type="text" name="father_name" placeholder="Father's Name" value={fname} onChange={e => setFname(e.target.value)} /><br /> <br /> 
          <input required type="text" name="mother_name" placeholder="Mother's Name" value={mname} onChange={e => setMname(e.target.value)} /><br /> <br /> 
          <input required type="number" name="parent_phone" placeholder="Parent's Phone" value={phone} onChange={e => setPhone(e.target.value)} /><br /> <br /> 
          <input required type="email" name="parent_email" placeholder="Parent's Email" value={pemail} onChange={e => setPemail(e.target.value)} /><br /> <br /> 
          <input required type="email" name="booking_email" placeholder="Booking Email" value={bemail} onChange={e => setBemail(e.target.value)} /><br /> <br /> 
          <input required type="number" name="student_age" placeholder="Student's Age" value={age} onChange={e => setAge(e.target.value)} /><br /><br /> 

          <select name="batch" value={batch} onChange={e => setBatch(e.target.value)}>
            <option value="MWF1530">MWF0330</option>
            <option value="MWF1700">MWF0500</option>
            <option value="MWF1830">MWF0630</option>
            <option value="TTS1530">TTHS0330</option>
            <option value="TTS1700">TTHS0500</option>
            <option value="TTS1830">TTHS0630</option>

          </select>
          <br /><br /> 
          <select name="number_of_classes" value={nclasses} onChange={e => setNclasses(e.target.value)} >
            <option value="52">52</option>
            <option value="13">13</option>

          </select>

          </p>
          <br />
          <input type="submit" value="Start Learning!" />          
          <button onClick={()=> fn2.createWeeklyPlaceholder("course1")}>Click me</button> 
          <button onClick={()=> fn3.updatePlaceholder()}>Update placeholder</button>
                    </form>
          


          </div>  
    ) : (
      <div>
      <h1>Demo Customer</h1>
    
   
      <p> 
          <input type="text" name="student_name" placeholder="Student's Name" value={sname} onChange={e => setSname(e.target.value)} /><br /> <br /> 
          <input type="number" name="parent_phone" placeholder="Parent's Phone" value={phone} onChange={e => setPhone(e.target.value)} /><br /> <br /> 
          <input type="email" name="booking_email" placeholder="Booking Email" value={bemail} onChange={e => setBemail(e.target.value)} /><br /> <br /> 
          <input type="number" name="student_age" placeholder="Student's Age" value={age} onChange={e => setAge(e.target.value)} /><br /><br /> 

          <select name="batch" value={batch} onChange={e => setBatch(e.target.value)}>
            <option value="MWF1530">MWF0330</option>
            <option value="MWF1700">MWF0500</option>
            <option value="MWF1830">MWF0630</option>
            <option value="TTS1530">TTHS0330</option>
            <option value="TTS1700">TTHS0500</option>
            <option value="TTS1830">TTHS0630</option>

          </select>
          <br /><br /> 
  

          </p>
      
      <br />
      <input type="submit" value="Start Learning!" onClick={onCreate2}  />

    
    </div>  
    )


    }

    </div>
  );
}

export default App;
