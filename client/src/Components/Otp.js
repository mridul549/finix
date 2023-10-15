import { React, useContext, useState, useEffect } from "react";
import { MuiOtpInput } from "mui-one-time-password-input";
import '../css/otp.css'
import AuthContext from "../context/auth/authContext";
import { useNavigate } from "react-router-dom";
import Spinner from "./Spinner";
import { EventEmitter } from 'events';

const Otp = (props) => {
    const [otp, setOtp] = useState("");
    const {email,otpFor,setOtpVerified,otpRole} = useContext(AuthContext)
    const navigate = useNavigate()
    const [counter, setCounter]=useState(120);
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState({error: false, message: ''})
    const eventEmitter = new EventEmitter();

    useEffect(() => {
        const timer = counter>0&&setInterval(() => setCounter(counter-1), 1000);
        return () =>clearInterval(timer);
    },[counter]);

    const handleChange = (newValue) => {
        setOtp(newValue);
    };

    const handleOTP = async () => {
        setLoading(true)
        const response = await fetch("http://localhost:3001/mail/verifyotp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(({key: email, otp: parseInt(otp), role: otpRole}))
        })
        const json = await response.json()
        setLoading(false)
        if(json.message==="OTP Verified, you can log in now.") {    
            setOtpVerified(true)
            if(otpFor === 'signup'){
                navigate('/login');
            } else {
                props.afterVerify()
            }
        } else {
            setError({error: true, message: json.message})
        }
    } 

    const handleReSend = async () => {
        const response = await fetch("http://localhost:3001/mail/resendotp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(({key: email, role: otpRole}))
        })
        const json = await response.json()
        if(json.action==="OTP Sent") {
            setError({error: true, message: json.action + json.message})
            setCounter(120)
            setTimeout(() => {
                setError({error: false, message: ''})
            }, 5000)
        } else {
            setError({error: true, message: json.message})
        }
    }

    return (
        <div className="container-fluid otpContainer">
            <h1 style={{color: 'black'}}>OTP Verification</h1>
            <div className="container sentContainer">
                <p style={{fontWeight: 600}}>A One time password has been sent to the email</p>
                <p style={{fontWeight: 600, marginTop: -6}}>{email}</p>
            </div>
            <div className="otp">
                <MuiOtpInput value={otp} onChange={handleChange} />
            </div>
            {loading && <Spinner />}
            {error.error ? <label className="errorLabel">{error.message}</label> : ""} 
            {
                counter>0 ? 
                <button disabled={counter>0 } className="btn resendLink">resend OTP in 0{Math.floor(counter/60)}:{counter%60}</button> : 
                <button className="btn resendLink" onClick={handleReSend}>resend OTP</button>
            }
          <button onClick={handleOTP} className="btn signup-btn mb-4">Submit OTP</button>
        </div>
    );
};

export default Otp;