import { React, useEffect, useState } from "react"
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/resetpass.css'
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {

    const [passResetForm, setPassResetForm] = useState({newPass: '', confirmNewPass: ''})
    const [passError, setPassError] = useState(false)
    const [searchParams] = useSearchParams();
    const navigate = useNavigate()

    const resetPassword = (e) => {
        e.preventDefault()

        console.log(searchParams.get('token'));
        toast.promise(
            fetch(`http://localhost:3001/owner/forgetPassword`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + searchParams.get('token')
                },
                body: JSON.stringify(({newPassword: passResetForm.newPass}))
            }).then(async (response) => {
                if(response.status>=400){
                    const json = await response.json()
                    throw new Error(`${json.message}`);
                }
                return response.json()
            }),
            {
                pending: {
                    render() {
                        return `Please wait while we reset your password...`;
                    },
                    icon: true,
                },
                success: {
                    render({ data }) {
                        navigate('/login')
                        return data.message
                    },
                },
                error: {
                    render({ data }) {
                        navigate('/login')
                        return data.message;
                    },
                }
            }
        );
    }

    const passOnChange = (e) => {
        setPassResetForm({...passResetForm, [e.target.name]: e.target.value})
        if(e.target.name==="confirmNewPass" && 
            (passResetForm.confirmNewPass!==passResetForm.newPass || 
             passResetForm.confirmNewPass.length>=passResetForm.newPass.length)){
            setPassError(true)
        } else {
            setPassError(false)
        }
    }


    useEffect(() => {
        document.title = 'Finix | Reset Password'
    }, [])

    return (
        <>
            <div className="d-flex align-items-center flex-column justify-content-center mainDiv">
                <div className="d-flex align-items-center flex-column justify-content-cente mt-5">
                    <h1 style={{color: 'black'}}>Reset Password</h1>
                </div>
                <div className="formDiv d-flex justify-content-center">
                    <form onSubmit={resetPassword} className="d-flex flex-column align-items-center justify-content-center">
                        <div className="d-flex flex-column align-items-start justify-content-center" >
                            <label className="" htmlFor="">New Password<span style={{color: 'red'}}>*</span> </label>
                            <input type="password" name="newPass" onChange={passOnChange} className="inputText1 shadow-sm" placeholder="Enter your new password"/>

                            <label className="mt-3" htmlFor="">Confirm new Password<span style={{color: 'red'}}>*</span> </label>
                            <input type="password" name="confirmNewPass" onChange={passOnChange} className="inputText1 shadow-sm" placeholder="Confirm new password"/>
                            {passError&& (passResetForm.confirmNewPass!==passResetForm.newPass) &&
                            <label className="errorLabelPass">Passwords do not match</label> }
                        </div>
                        <div className="d-flex justify-content-center mt-4">
                            <button className="btn saveChanges">Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
