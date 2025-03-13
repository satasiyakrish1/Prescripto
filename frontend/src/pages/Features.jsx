import React from 'react';
import { assets } from '../assets/assets';

const Features = () => {
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div className='text-xl my-4'>
                    <p>MORE  <span className='text-gray-700 font-semibold'>FEATURES</span></p>
                </div>
            </header>

            

            <div className='flex flex-col md:flex-row mb-20'>
                <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
                    <b>EFFICIENCY:</b>
                    <p>Streamlined appointment scheduling that fits into your busy lifestyle.</p>
                </div>
                <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
                    <b>CONVENIENCE: </b>
                    <p>Access to a network of trusted healthcare professionals in your area.</p>
                </div>
                <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
                    <b>PERSONALIZATION:</b>
                    <p >Tailored recommendations and reminders to help you stay on top of your health.</p>
                </div>
            </div>
            <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div className='text-xl my-4'>
                    <p>WHY  <span className='text-gray-700 font-semibold'>CHOOSE US</span></p>
                </div>
            </header>
            <div className='flex flex-col md:flex-row mb-20'>
                <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
                    <b>VIRTUAL FOLLOW-UP:</b>
                    <p>Allows patients to chat with doctors for follow-ups and quick consultations without a full appointment.</p>
                </div>
                <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
                    <b>HEALTH RECORD VAULT:</b>
                    <p>Securely store and access prescriptions, reports, and health records in one place for easy sharing with doctors.</p>
                </div>
                <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
                    <b>CLOUDFLARE SHIELD:</b>
                    <p >Tailored recommendations and reminders to help you stay on top of your health.</p>
                </div>
            </div>

        </div>
    );
};

export default Features;