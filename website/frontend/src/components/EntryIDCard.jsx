import React from 'react';

const EntryIDCard = ({ member, showDetails = true }) => {
    return (
        <div className='bg-gradient-to-br from-primary to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
            <div className='flex justify-between items-start mb-4'>
                <div>
                    <p className='text-xs uppercase tracking-wider opacity-80'>Prescripto Health ID</p>
                    <p className='text-2xl font-bold mt-1 tracking-widest'>{member.entryId}</p>
                </div>
                <div className='bg-white bg-opacity-20 p-2 rounded-lg'>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                </div>
            </div>
            
            {showDetails && (
                <div className='border-t border-white border-opacity-30 pt-4 space-y-2'>
                    <div className='flex justify-between'>
                        <span className='text-xs uppercase opacity-80'>Name</span>
                        <span className='font-semibold'>{member.name}</span>
                    </div>
                    <div className='flex justify-between'>
                        <span className='text-xs uppercase opacity-80'>Relation</span>
                        <span className='font-semibold'>{member.relation}</span>
                    </div>
                    {member.dateOfBirth && (
                        <div className='flex justify-between'>
                            <span className='text-xs uppercase opacity-80'>DOB</span>
                            <span className='font-semibold'>{new Date(member.dateOfBirth).toLocaleDateString()}</span>
                        </div>
                    )}
                    {member.bloodGroup && (
                        <div className='flex justify-between'>
                            <span className='text-xs uppercase opacity-80'>Blood Group</span>
                            <span className='font-semibold'>{member.bloodGroup}</span>
                        </div>
                    )}
                </div>
            )}
            
            <div className='mt-4 text-xs opacity-70 text-center'>
                <p>Use this ID for all medical services</p>
            </div>
        </div>
    );
};

export default EntryIDCard;
