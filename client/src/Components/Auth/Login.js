import { React, useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import '../../css/auth.css'
import Spinner from "../Spinner";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import jwt_decode from 'jwt-decode'
import {Modal} from 'react-bootstrap'
import Otp from '../Otp';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthContext from '../../context/auth/authContext';
import imageLogin from '../../images/authImage.jpg'
import logo from '../../images/finix-logo.png'

export default function SignIn() {
    const [credentials, setCredentials] = useState({email: '', password: ''})
    const [error,setError]=useState(false);
    const [loading, setLoading] = useState(false)
    const [invalidCredError, setInvalidCredError] = useState({error: false, message: ''})
    const [verificationModal, setVerificationModal] = useState(false)
    const {setEmail,setOtpFor,setOtpRole} = useContext(AuthContext)
    const [passRestModal, setPassResetModal] = useState(false)
    const [passResetForm, setPassResetForm] = useState({emailPass: ''})
    const [role, setRole] = useState('admin')

    let navigate = useNavigate()

    const resetPassword = (event) => {
        event.preventDefault()

        toast.promise(
            fetch(`http://localhost:3001/mail/passwordreset`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(({email: passResetForm.emailPass}))
            }).then((response) => response.json()),
            {
                pending: {
                    render() {
                        return `Please wait...`;
                    },
                    icon: true,
                },
                success: {
                    render({ data }) {
                        setPassResetModal(false)
                        return data.message
                    },
                },
                error: {
                    render({ data }) {
                        return "Internal server error";
                    },
                }
            }
        );

    }

    const passOnChange = (e) => {
        setPassResetForm({...passResetForm, [e.target.name]: e.target.value})
    }

    const handleClosePassResetModal = () => {
        setPassResetModal(false)
    }

    const handleResetPassword = () => {
        setPassResetModal(true)
    }

    const handleCloseVerificationModal = () => {
        setVerificationModal(false)
    }

    const afterVerify = () => {
        setVerificationModal(false)
        toast.success("Email verified successfully, you can log in now.", {
            closeOnClick: true,
            pauseOnHover: true,
        });
    }

    const sendOTP = async () => {
        toast.promise(
            fetch(`http://localhost:3001/mail/resendotp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(({key: credentials.email, role: 1}))
            }).then((response) => response.json()),
            {
                pending: {
                    render() {
                        return `Sending OTP to ${credentials.email}...`;
                    },
                    icon: true,
                },
                success: {
                    render({ data }) {
                        setEmail(credentials.email)
                        if(role==='admin'){
                            setOtpRole(1)
                        } else {
                            setOtpRole(2)
                        }
                        setVerificationModal(true)
                        return data.message
                    },
                },
                error: {
                    render({ data }) {
                        return "Internal server error";
                    },
                }
            }
        );
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setOtpFor('signup');
        // const data = new FormData(event.currentTarget);
        if(credentials.email.length===0||credentials.password.length===0){
            setError(true);
            return;
        }
        setLoading(true);

        let response
        let json

        if(role==='admin') {
            response = await fetch("http://localhost:3001/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(({email: credentials.email, password: credentials.password}))
            })
            json = await response.json()
        } else {
            console.log('hi');
            response = await fetch("http://localhost:3001/maintainer/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(({email: credentials.email, password: credentials.password}))
            })
            json = await response.json()
        }

        setLoading(false)
        if(json.message==="Auth successful"){
            // save token and redirect to dashboard
            localStorage.setItem('token', json.token)
            
            const userProfileJson = jwt_decode(json.token)
            localStorage.setItem('loginMethod', 'regular')
            localStorage.setItem('userEmail', userProfileJson.email)
            localStorage.setItem('userName', userProfileJson.adminName)
            localStorage.setItem('userProfilePic', userProfileJson.profilePic.url)
            localStorage.setItem('role', userProfileJson.role)
            navigate('/')
        }
        else if(json.message==='Email is not verified, please complete verification'){
            setOtpFor('verification')
            sendOTP()
        }
        else {
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
            localStorage.setItem('loginMethod', 'google')
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
        document.title = 'Finix | Login'
    }, [])

    return (
        <>
            {/* Password reset modal */}
            <Modal show={passRestModal} onHide={handleClosePassResetModal} >
                <Modal.Header className="d-flex justify-content-between">
                    <div><p></p></div>
                    <div>
                        <Modal.Title style={{textAlign: 'center', fontWeight: "600"}}>Forgot Password</Modal.Title>
                    </div>
                    <div>
                        <button type="button" className="btn-close" onClick={handleClosePassResetModal}></button>
                    </div>
                </Modal.Header>
                <Modal.Body>
                    <div className="mt-2">
                        <form onSubmit={resetPassword}>
                            <div className="d-flex justify-content-center mt-3">
                                <p style={{textAlign: 'center', fontWeight: '600'}}>Enter the email whose password you want to reset.</p>
                            </div>
                            <div className="d-flex justify-content-center" >
                                <input autoComplete='off' required type="email" name="emailPass" onChange={passOnChange} className="inputText input-field shadow-sm" placeholder="Enter your email"/>
                            </div>
                            <div className="d-flex justify-content-center mt-3 mb-3">
                                <button className="btn signup-btn">Submit</button>
                            </div>
                        </form>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Email verification Modal */}
            <Modal show={verificationModal} onHide={handleCloseVerificationModal}>
                <Modal.Header className="d-flex justify-content-between">
                    <div><p></p></div>
                    <div>
                        <Modal.Title style={{textAlign: 'center', fontWeight: '600'}}>Verify Email</Modal.Title>
                        <h6 className='mt-3' style={{textAlign:'center'}}>Seems like your email has not been verified, please verify it below.</h6>
                    </div>
                    <div>
                        <button type="button" className="btn-close" onClick={handleCloseVerificationModal}></button>
                    </div>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <div style={{marginTop: "-60px"}}>
                            <Otp afterVerify={afterVerify} />
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            <div className="container-fluid signup">
                <div className="row">
                    <div className="col-lg-4 form-div mt-5">
                        <div className=' d-flex justify-content-center'>
                            <h1 style={{color: "black"}}>Finix</h1>
                        </div>
                        <h3>Sign In</h3>
                        <div className="d-flex mt-2 mb-4 justify-content-center">
                            <div className="doubleBtn doubleBtnLogin shadow-sm d-flex flex-row align-items-center justify-content-center">
                                <button onClick={adminClick} className={`roleBtn admin ${role==='admin' ? 'selected': ''} `}>Admin</button>
                                <button onClick={maintainerClick} className={`roleBtn maintainer ${role==='maintainer' ? 'selected': ''}`}>Maintainer</button>
                            </div>
                        </div>
                        <form action="" onSubmit={handleSubmit}>
                            <div>
                                <input className="input-field shadow-sm" name='email' type="email" value={credentials.email} onChange={onChange} placeholder="Enter your email" />
                                { error&&credentials.email.length===0 ? <label htmlFor="" className="errorLabel">Email can't be empty</label> : "" }
                            </div>
                            <div>
                                <input className="input-field shadow-sm" name='password' type="password" value={credentials.password} onChange={onChange} placeholder="Enter your password" />
                                { error&&credentials.password.length===0 ? <label htmlFor="" className="errorLabel">Password can't be empty</label> : "" }
                            </div>
                            {loading && <Spinner />}
                            <div className="sign-up-div"> <button type="submit" className="btn signup-btn">Sign In</button></div>
                            {invalidCredError.error ? <label htmlFor="" style={{marginTop: "10px"}} className="errorLabel">{invalidCredError.message}</label> : ""}
                        </form>
                        <p className='mt-3' style={{fontWeight: "600"}}>or</p>
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
                        <div className='mt-3'>
                            <button onClick={handleResetPassword} className='forgotPassword'>Forgot Password</button>
                            <br/>
                            <Link to="/signup" className="login-link">Don't have an account? Sign Up here</Link>
                        </div>
                    </div>
                    <div className="col-lg-8 imgCol">
                        <img src={imageLogin} alt="abc" className="img-fluid image-1" />
                    </div>
                </div>
            </div>
        </>
    );
}