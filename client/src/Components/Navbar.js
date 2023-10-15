import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/navbar.css'

export default function Navbar() {
    const navigate = useNavigate()
    const loginHandler = () => {
        navigate('/login')
    }

    const signupHandler = () => {
        navigate('/signup')
    }

    return (
        <div>
            <nav class="navbar navbar-expand-lg justify-items-between" style={{padding: "1rem 7rem"}}>
                <div className='d-flex align-items-center justify-content-between' style={{width: "100%"}}>
                    <div>
                        <h2 style={{fontWeight: "700"}}>Finix</h2>
                    </div>
                    <div>
                        <p></p>
                    </div>
                    <div>
                        <button onClick={loginHandler} className='authBtn mx-2 loginBtn'>Log In</button>
                        <button onClick={signupHandler} className='authBtn mx-2 signupBtn'>Sign Up</button>
                    </div>
                </div>
            </nav>
        </div>
    )
}
