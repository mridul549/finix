import React from 'react'
import Navbar from './Navbar'
import landing from '../images/landing2.png'
import '../css/home.css'

export default function Home() {
    return (
        <div>
            <div className="App">
                <div>
                    <Navbar />
                </div>
                <div className='d-flex justify-content-center'>
                    <img className="mt-3 landingImage" src={landing} alt="" />
                </div>
            </div>
        </div>
    )
}
