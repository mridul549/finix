import {React, useState, useContext, useEffect } from "react";
import '../../css/auth.css'
import {Link, useNavigate} from 'react-router-dom'
import Spinner from "../Spinner";
import AuthContext from '../../context/auth/authContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import jwt_decode from 'jwt-decode'

const Signup = () => {
    const [credentials, setCredentials] = useState({adminName:'',email: '', password: '',cpassword:''})
    const [error, setError] = useState(false)
    const [passError, setPassError] = useState(false)
    const [invalidCredError, setInvalidCredError] = useState({error: false, message: ''})
    const [loading, setLoading] = useState(false)
    const [role, setRole] = useState('admin')
    const auth = useContext(AuthContext)
    let navigate = useNavigate()
    
    const handleSubmit = async (event) => {
        event.preventDefault();

        if(credentials.adminName.length===0 || credentials.email.length===0 || 
           credentials.password.length===0 || credentials.cpassword.length===0){

            if(credentials.cpassword!==credentials.password){
                setPassError(true)
            } else {
                setError(true)
            }
            return
        }

        setLoading(true)
        setInvalidCredError({error: false})
        const {adminName,email,password}=credentials;
        let response;
        let json;
        if(role==='admin') {
            response = await fetch("http://localhost:3001/admin/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(({adminName,email,password}))
            })
            json = await response.json()
            auth.setOtpRole(1)
        } else if (role === 'maintainer') {
            response = await fetch("http://localhost:3001/maintainer/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({maintainerName: adminName, email: email, password: password})
            })
            json = await response.json()
            auth.setOtpRole(2)
        }
        setLoading(false)
        if(json.action==="Role created and OTP Sent"){
            auth.setEmail(credentials.email)
            navigate('/otp')
        } else {
            if(json.message!==undefined && json.message!==null){
                setInvalidCredError({error: true, message: json.message})
            } else {
                setInvalidCredError({error: true, message: "Internal Server error"})
            }
        }
    };

    const onChange = (e) => {
        setCredentials({...credentials, [e.target.name]: e.target.value})
        setInvalidCredError({error: false, message: ''})
        if(e.target.name==="cpassword" && 
            (credentials.cpassword!==credentials.password || 
             credentials.cpassword.length>=credentials.password.length)){
            setPassError(true)
        } else {
            setPassError(false)
        }
    }

    const handleGoogleAuth = async (res) => {
        const decodedToken = jwt_decode(res.credential)

        const response = await fetch("http://localhost:3001/admin/googleAuth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({adminName: decodedToken.name, email: decodedToken.email, profileUrl: decodedToken.picture})
        })
        const json = await response.json()

        if(json.message === "Auth successful"){
            localStorage.setItem('token', json.token)
            localStorage.setItem('adminEmail', decodedToken.email)
            localStorage.setItem('adminName', decodedToken.name)
            localStorage.setItem('adminProfilePic', decodedToken.picture)
            navigate('/dashboard/menu')
        } else {
            setInvalidCredError({error: true, message: json.message})
        }
    }

    const adminClick = () => {
        setRole('admin')
    }

    const maintainerClick = () => {
        setRole('maintainer')
    }

    useEffect(() =>{
        document.title = 'Finix | Sign Up'
    }, [])

    return (
        <div className="container-fluid signup">
            <div className="row">
                <div className="form-div">
                    <div className='d-flex justify-content-center'>
                        <h1 style={{color: "black", marginBottom: "40px"}}>Finix</h1>
                    </div>
                    <h3>Sign Up</h3>
                    <div className="d-flex mt-2 mb-4 justify-content-center">
                        <div className="doubleBtn shadow-sm d-flex flex-row align-items-center justify-content-between">
                            <button onClick={adminClick} className={`roleBtn admin ${role==='admin' ? 'selected': ''} `}>Admin</button>
                            <button onClick={maintainerClick} className={`roleBtn maintainer ${role==='maintainer' ? 'selected': ''}`}>Maintainer</button>
                        </div>
                    </div>
                    <form action="" onSubmit={handleSubmit}>
                        <div>
                            <input className="input-field shadow-sm" type="text" onChange={onChange} name="adminName" placeholder="Enter your full name" />
                            { error&&credentials.adminName.length===0 ? <label htmlFor="" className="errorLabel">Name can't be empty</label> : "" }
                        </div>
                        <div>
                            <input className="input-field shadow-sm" type="email" onChange={onChange} name="email" placeholder="Enter your email" />
                            { error&&credentials.email.length===0 ? <label htmlFor="" className="errorLabel">Email can't be empty</label> : "" }
                        </div>
                        <div>
                            <input className="input-field shadow-sm" type="password" onChange={onChange} name="password" placeholder="Enter your password" />
                            { error&&credentials.password.length===0 ? <label htmlFor="" className="errorLabel">Password can't be empty</label> : "" }
                        </div>
                        <div className="d-flex flex-column align-items-center justify-content-center">
                            <input className="input-field shadow-sm" type="password" onChange={onChange} name="cpassword" placeholder="Confirm password" />
                            { error&&credentials.cpassword.length===0 ? <label htmlFor="" className="errorLabel">Confirm password can't be empty</label> : "" }
                            { passError&&(credentials.cpassword!==credentials.password)? 
                                <label htmlFor="" className="errorLabel">Passwords do not match</label> : "" }
                        </div>
                        {loading && <Spinner />}
                        <div className="sign-up-div"> <button type="submit" className="btn signup-btn">Sign Up</button></div>
                        {invalidCredError.error ? <label htmlFor="" style={{marginTop: "10px"}} className="errorLabel">{invalidCredError.message}</label> : ""}
                    </form>
                    <p className="mt-3">or</p>
                    <div id='googleAuth' className="google-div d-flex justify-content-center">
                        <GoogleOAuthProvider clientId=''>
                            <GoogleLogin
                                onSuccess={credentialResponse => {
                                    handleGoogleAuth(credentialResponse)
                                }}
                                onError={() => {
                                    console.log('Login Failed');
                                }}
                                useOneTap
                            />
                        </GoogleOAuthProvider>
                    </div>
                    <Link to="/login" className="login-link mt-3">Already have an account? Log in here</Link>
                    </div>
            </div>
        </div>
    )
}

export default Signup