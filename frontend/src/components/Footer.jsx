import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div className='md:mx-10'>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
          <img className='mb-5 w-40' src={assets.logo} alt="" />
          <p className='w-full md:w-2/3 text-gray-600 leading-6'>
            Prescripto is dedicated to advancing healthcare technology with a commitment to quality and innovation. Our platform evolves with the latest enhancements to ensure an exceptional user experience and unparalleled service.
          </p>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>COMPANY</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li><a href="/" className='hover:text-gray-800'>Home</a></li>
            <li><a href="/about" className='hover:text-gray-800'>About us</a></li>
            <li><a href="/Privacy" className='hover:text-gray-800'>Privacy policy</a></li>
            <li><a href="/Features" className='hover:text-gray-800'>Features</a></li>
          </ul>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>+91 6353112999</li>
            <li><a href="mailto:krishsatasiya44@gmail.com" className='hover:text-gray-800'>krishsatasiya44@gmail.com</a></li>
          </ul>
        </div>

      </div>

      <div>
        <hr />
        <p className='py-5 text-sm text-center'>Copyright 2025 @ Mr.Krish Satasiya - All Right Reserved.</p>
      </div>

    </div>
  )
}

export default Footer
