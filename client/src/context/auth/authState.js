import { useState } from 'react'
import AuthContext from './authContext'

const AuthState = (props) => {
    const [email, setEmail] = useState("")
    const [authenticated, setAuthenticated] = useState(false)
    const [otpFor, setOtpFor] = useState('signup')
    const [otpVerified, setOtpVerified] = useState(false)
    const [otpRole, setOtpRole] = useState(0)
    return (
        <AuthContext.Provider value={{email,authenticated,setEmail,setAuthenticated,otpFor,setOtpFor,otpVerified,setOtpVerified,otpRole,setOtpRole}}>
            {props.children}
        </AuthContext.Provider>
    )
}

export default AuthState