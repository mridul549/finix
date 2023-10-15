import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';
import App from './App';
import Login from './Components/Auth/Login'
import Signup from './Components/Auth/Signup'
import ResetPassword from './Components/ResetPassword';
import Otp from './Components/Otp';
import AuthState from './context/auth/authState';
import { ToastContainer } from 'react-toastify';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />
    },
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/signup',
        element: <Signup />
    },
    {
        path: '/resetpassword',
        element: <ResetPassword />
    },
    {
        path: "/otp",
        element: <Otp />
    }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ToastContainer closeOnClick draggable pauseOnHover />
        <AuthState>
            <RouterProvider router={router} />
        </AuthState>
    </React.StrictMode>
);