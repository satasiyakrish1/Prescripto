import React from 'react'
import { specialityData } from '../assets/assets'
import { Link } from 'react-router-dom'

const SpecialityMenu = () => {
    return (
        <div id='speciality' className='flex flex-col items-center gap-6 py-20 text-gray-800 dark:text-white'>
            <h1 className='text-4xl font-medium text-center'>Find by Speciality</h1>
            <p className='sm:w-1/2 lg:w-1/3 text-center text-sm text-gray-600 dark:text-gray-300'>Simply browse through our extensive list of trusted doctors, schedule your appointment hassle-free.</p>
            <div className='flex sm:justify-center gap-8 pt-10 w-full overflow-x-auto px-4 pb-6 scrollbar-none'>
                {specialityData.map((item, index) => (
                    <Link onClick={() => scrollTo(0, 0)} className='flex flex-col items-center text-xs cursor-pointer flex-shrink-0 hover:translate-y-[-10px] transition-all duration-300 min-w-[80px]' key={index} to={`/doctors/${item.speciality}`}>
                        <img className='w-16 sm:w-24 mb-3 object-cover' src={item.image} alt={item.speciality} />
                        <p className="text-sm font-medium dark:text-gray-200">{item.speciality}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default SpecialityMenu