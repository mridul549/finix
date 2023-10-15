import React from 'react'
import spinner from '../images/Spinner.gif'

function Spinner () {
  return (
    <div className='d-flex justify-content-center'>
        <img src={spinner} alt="spin" style={{width: "50px", marginTop: "20px"}} />
    </div>
  )
}

export default Spinner