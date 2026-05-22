import React, { useContext, useState, useRef } from 'react'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AddDoctor = () => {

    const [docImg, setDocImg] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [experience, setExperience] = useState('1 Year')
    const [fees, setFees] = useState('')
    const [about, setAbout] = useState('')
    const [speciality, setSpeciality] = useState('General physician')
    const [degree, setDegree] = useState('')
    const [address1, setAddress1] = useState('')
    const [address2, setAddress2] = useState('')
    const [loading, setLoading] = useState(false)

    const { backendUrl } = useContext(AppContext)
    const { aToken, isReadOnly } = useContext(AdminContext)

    // Verification inputs
    const [regNumber, setRegNumber] = useState('')
    const [stateCouncil, setStateCouncil] = useState('')
    const [qualification, setQualification] = useState('')
    const [regYear, setRegYear] = useState('')
    const [verification, setVerification] = useState(null)
    const [docRegCert, setDocRegCert] = useState(null)
    const [docDegreeCert, setDocDegreeCert] = useState(null)
    const [docGovId, setDocGovId] = useState(null)
    const [portalShot, setPortalShot] = useState(null)
    const [verifying, setVerifying] = useState(false)
    const [portalPaste, setPortalPaste] = useState('')
    const [instructionSteps, setInstructionSteps] = useState(null)
    const [loadingInstructions, setLoadingInstructions] = useState(false)

    const callVerify = async () => {
        if (isReadOnly) return
        if (!regNumber) {
            return toast.error('Enter registration number to verify')
        }
        try {
            setVerifying(true)
            const { data } = await axios.post(backendUrl + '/api/doctor-verification/imr-lookup', {
                submitted_name: name,
                registration_number: regNumber,
                state_council: stateCouncil,
                qualification,
                registered_year: regYear
            }, { headers: { aToken } })
            if (data.success) {
                const v = data.verification || {}
                setVerification(v)
                // Autofill fields from portal data when available
                if (v.qualification && !qualification) setQualification(v.qualification)
                if (v.registered_year && !regYear) setRegYear(v.registered_year)
                if (v.state_council && !stateCouncil) setStateCouncil(v.state_council)
                if (v.portal_registration_number && !regNumber) setRegNumber(v.portal_registration_number)
                if (v.portal_name && !name) setName(v.portal_name)
                toast.success(v.verified ? 'Verified via IMR' : (v.notes || 'Verification updated'))
            } else {
                toast.error(data.message || 'Verification failed')
            }
        } catch (e) {
            toast.error(e.response?.data?.message || e.message)
        } finally {
            setVerifying(false)
        }
    }

    const runOCR = async () => {
        try {
            if (!docRegCert && !docDegreeCert && !docGovId && !portalShot) {
                return toast.error('Upload a document or portal screenshot for OCR')
            }
            const fd = new FormData()
            if (docRegCert) fd.append('registrationCertificate', docRegCert)
            if (docDegreeCert) fd.append('degreeCertificate', docDegreeCert)
            if (docGovId) fd.append('governmentId', docGovId)
            if (portalShot) fd.append('portalScreenshot', portalShot)
            if (verification?.portal_name) fd.append('portal_name', verification.portal_name)
            if (verification?.portal_registration_number) fd.append('portal_registration_number', verification.portal_registration_number)
            fd.append('submitted_name', name)
            fd.append('registration_number', regNumber)
            const { data } = await axios.post(backendUrl + '/api/doctor-verification/documents/ocr', fd, { headers: { aToken, 'Content-Type': 'multipart/form-data' } })
            if (data.success) {
                setVerification(prev => ({ ...(prev || {}), documents_match: data.documents_match }))
                if (data.portalExtract) {
                    const v = data.portalExtract
                    if (v.portal_registration_number) setRegNumber(r => r || v.portal_registration_number)
                    if (v.state_council) setStateCouncil(c => c || v.state_council)
                    if (v.qualification) setQualification(q => q || v.qualification)
                    if (v.registered_year) setRegYear(y => y || v.registered_year)
                    if (v.portal_name) setName(n => n || v.portal_name)
                    setVerification(prev => ({ ...(prev || {}), ...v }))
                }
                toast.success('OCR completed')
            } else {
                toast.error(data.message || 'OCR failed')
            }
        } catch (e) {
            toast.error(e.response?.data?.message || e.message)
        }
    }

    const parsePastedPortal = async () => {
        if (!portalPaste.trim()) return toast.error('Paste IMR/State portal text first')
        try {
            const { data } = await axios.post(backendUrl + '/api/doctor-verification/parse', {
                portal_text: portalPaste
            }, { headers: { aToken } })
            if (data.success) {
                const v = data.verification || {}
                setVerification(prev => ({ ...(prev || {}), ...v }))
                if (v.portal_name) setName(n => n || v.portal_name)
                if (v.portal_registration_number) setRegNumber(r => r || v.portal_registration_number)
                if (v.state_council) setStateCouncil(c => c || v.state_council)
                if (v.qualification) setQualification(q => q || v.qualification)
                if (v.registered_year) setRegYear(y => y || v.registered_year)
                toast.success('Parsed portal result')
            } else {
                toast.error(data.message || 'Failed to parse')
            }
        } catch (e) {
            toast.error(e.response?.data?.message || e.message)
        }
    }

    const loadManualInstructions = async () => {
        try {
            setLoadingInstructions(true)
            const { data } = await axios.get(backendUrl + '/api/doctor-verification/manual-instructions', { headers: { aToken } })
            if (data.success) {
                setInstructionSteps(data.steps || [])
                toast.success('Loaded manual steps')
            } else {
                toast.error(data.message || 'Failed to load steps')
            }
        } catch (e) {
            toast.error(e.response?.data?.message || e.message)
        } finally {
            setLoadingInstructions(false)
        }
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        if (isReadOnly) return
        setLoading(true)

        try {
            // Debug: Log current values
            console.log('Form submission started');
            console.log('Backend URL:', backendUrl);
            console.log('Admin Token:', aToken ? 'Present' : 'Missing');
            console.log('Form data:', {
                name: name.trim(),
                email: email.toLowerCase(),
                experience,
                fees,
                speciality,
                degree,
                address1: address1.trim(),
                address2: address2.trim(),
                about,
                hasImage: !!docImg
            });

            // Validation checks
            if (!docImg) {
                setLoading(false)
                return toast.error('Image Not Selected')
            }

            if (!name.trim()) {
                setLoading(false)
                return toast.error('Doctor name is required')
            }

            if (!email.trim()) {
                setLoading(false)
                return toast.error('Doctor email is required')
            }

            if (!password.trim()) {
                setLoading(false)
                return toast.error('Password is required')
            }

            if (!fees || isNaN(fees) || Number(fees) <= 0) {
                setLoading(false)
                return toast.error('Valid fees amount is required')
            }

            if (!degree.trim()) {
                setLoading(false)
                return toast.error('Degree is required')
            }

            if (!address1.trim()) {
                setLoading(false)
                return toast.error('Address is required')
            }

            if (!about.trim()) {
                setLoading(false)
                return toast.error('About section is required')
            }

            // Check if backend URL and token are available
            if (!backendUrl) {
                setLoading(false)
                return toast.error('Backend URL not configured')
            }

            if (!aToken) {
                setLoading(false)
                return toast.error('Admin authentication token missing')
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
            if (!allowedTypes.includes(docImg.type)) {
                setLoading(false)
                return toast.error('Please select a valid image file (JPG, PNG, or GIF)');
            }

            // Validate file size (5MB limit)
            if (docImg.size > 5 * 1024 * 1024) {
                setLoading(false)
                return toast.error('Image size should be less than 5MB');
            }

            const formData = new FormData();

            formData.append('image', docImg)
            formData.append('name', name.trim())
            formData.append('email', email.toLowerCase().trim())
            formData.append('password', password)
            formData.append('experience', experience)
            formData.append('fees', Number(fees))
            formData.append('about', about.trim())
            formData.append('speciality', speciality)
            formData.append('degree', degree.trim())
            formData.append('address', JSON.stringify({
                line1: address1.trim(),
                line2: address2.trim()
            }))

            if (verification) {
                formData.append('verification', JSON.stringify(verification))
            } else if (regNumber || stateCouncil || qualification || regYear) {
                formData.append('verification', JSON.stringify({
                    submitted_name: name.trim(),
                    registration_number: regNumber.trim(),
                    state_council: stateCouncil.trim(),
                    qualification: qualification.trim(),
                    registered_year: regYear.trim(),
                    verified: false,
                    notes: 'Pending manual verification'
                }))
            }

            // Debug: Log FormData contents
            console.log('FormData prepared');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            console.log('Making API request to:', backendUrl + '/api/admin/add-doctor');

            const { data } = await axios({
                method: 'post',
                url: backendUrl + '/api/admin/add-doctor',
                data: formData,
                headers: {
                    aToken,
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log('Upload Progress:', percentCompleted + '%');
                }
            });

            console.log('API Response:', data);

            if (data.success) {
                toast.success(data.message || 'Doctor added successfully!')
                // Reset form
                setDocImg(false)
                setName('')
                setPassword('')
                setEmail('')
                setAddress1('')
                setAddress2('')
                setDegree('')
                setAbout('')
                setFees('')
                setExperience('1 Year')
                setSpeciality('General physician')
                setRegNumber('')
                setStateCouncil('')
                setQualification('')
                setRegYear('')
                setVerification(null)
                setDocRegCert(null)
                setDocDegreeCert(null)
                setDocGovId(null)
                console.log('Form reset successfully');
            } else {
                console.error('API returned success:false', data);
                toast.error(data.message || 'Failed to add doctor')
            }

        } catch (error) {
            console.error('Error adding doctor:', error);

            if (error.code === 'ECONNABORTED') {
                toast.error('Request timeout. Please try again.');
            } else if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Server Error Status:', error.response.status);
                console.error('Server Error Data:', error.response.data);
                console.error('Server Error Headers:', error.response.headers);

                const errorMessage = error.response.data?.message ||
                    error.response.data?.error ||
                    `Server error: ${error.response.status}`;
                toast.error(errorMessage);
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request);
                toast.error('No response from server. Please check your connection and backend server.');
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Request setup error:', error.message);
                toast.error('Error preparing request: ' + error.message);
            }
        } finally {
            setLoading(false)
        }
    }

    // Section refs for minimalist section navigation
    const basicRef = useRef(null)
    const professionalRef = useRef(null)
    const verificationRef = useRef(null)
    const aboutRef = useRef(null)

    const scrollTo = (ref) => {
        try {
            ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } catch (_) { }
    }

    return (
        <form onSubmit={onSubmitHandler} className='w-full'>

            <div className='max-w-5xl mx-auto px-4 py-6'>
                <header className='mb-6'>
                    <h1 className='text-xl font-semibold text-gray-800'>Add Doctor</h1>
                    <p className='text-sm text-gray-500 mt-1'>Create a new doctor profile and optionally attach verification artifacts.</p>
                </header>

                {/* Minimalist section nav akin to profile pills */}
                <nav className='sticky top-4 z-10 flex items-center gap-2 bg-white/80 backdrop-blur border rounded-full p-1 shadow-sm mb-6 w-max'>
                    <button type='button' onClick={() => scrollTo(basicRef)} className='px-4 py-1.5 text-sm rounded-full text-gray-600 hover:bg-gray-100'>Basic</button>
                    <button type='button' onClick={() => scrollTo(professionalRef)} className='px-4 py-1.5 text-sm rounded-full text-gray-600 hover:bg-gray-100'>Professional</button>
                    <button type='button' onClick={() => scrollTo(verificationRef)} className='px-4 py-1.5 text-sm rounded-full text-gray-600 hover:bg-gray-100'>Verification</button>
                    <button type='button' onClick={() => scrollTo(aboutRef)} className='px-4 py-1.5 text-sm rounded-full text-gray-600 hover:bg-gray-100'>About</button>
                </nav>

                {/* Card: Basic Information */}
                <div className='bg-white px-6 py-6 border rounded-xl shadow-sm w-full mb-6'>
                    <div className='flex items-center gap-4 mb-6 text-gray-600'>
                        <label htmlFor="doc-img" className='flex items-center gap-4 cursor-pointer'>
                            <img className='w-16 h-16 object-cover bg-gray-100 rounded-full border' src={docImg ? URL.createObjectURL(docImg) : assets.upload_area} alt={name ? `${name} profile` : 'Upload profile'} />
                            <div className='text-sm'>
                                <p className='font-medium'>Profile picture</p>
                                <p className='text-gray-500'>JPG/PNG, up to 5MB</p>
                            </div>
                        </label>
                        <input onChange={(e) => setDocImg(e.target.files[0])} type="file" id="doc-img" accept="image/*" hidden />
                    </div>

                    <section ref={basicRef} className='text-gray-700'>
                        <h2 className='text-sm font-medium text-gray-600 mb-4'>Basic Information</h2>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='flex flex-col gap-1'>
                                <label htmlFor='name' className='font-medium'>Full name</label>
                                <input id='name' onChange={e => setName(e.target.value)} value={name} className='border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50' type="text" placeholder='Dr. Jane Doe' required aria-invalid={!name?.trim() ? 'true' : 'false'} />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <label htmlFor='email' className='font-medium'>Email</label>
                                <input id='email' onChange={e => setEmail(e.target.value)} value={email} className='border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50' type="email" placeholder='doctor@example.com' required aria-invalid={!email?.trim() ? 'true' : 'false'} />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <label htmlFor='password' className='font-medium'>Set password</label>
                                <input id='password' onChange={e => setPassword(e.target.value)} value={password} className='border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50' type="password" placeholder='Minimum 6 characters' required minLength="6" aria-invalid={!password?.trim() ? 'true' : 'false'} />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <label htmlFor='experience' className='font-medium'>Experience</label>
                                <select id='experience' onChange={e => setExperience(e.target.value)} value={experience} className='border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50' >
                                    <option value="1 Year">1 Year</option>
                                    <option value="2 Years">2 Years</option>
                                    <option value="3 Years">3 Years</option>
                                    <option value="4 Years">4 Years</option>
                                    <option value="5 Years">5 Years</option>
                                    <option value="6 Years">6 Years</option>
                                    <option value="7 Years">7 Years</option>
                                    <option value="8 Years">8 Years</option>
                                    <option value="9 Years">9 Years</option>
                                    <option value="10+ Years">10+ Years</option>
                                </select>
                            </div>
                            <div className='flex flex-col gap-1 md:col-span-2'>
                                <label htmlFor='fees' className='font-medium'>Consultation fees</label>
                                <input id='fees' onChange={e => setFees(e.target.value)} value={fees} className='border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50' type="number" placeholder='e.g. 500' required min="1" aria-invalid={!fees ? 'true' : 'false'} />
                                <span className='text-xs text-gray-500'>Amount in INR</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Card: Professional Details (separated) */}
                <div ref={professionalRef} className='bg-white px-6 py-6 border rounded-xl shadow-sm w-full mb-6'>
                    <h2 className='text-sm font-medium text-gray-600 mb-4'>Professional Details</h2>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 text-gray-700'>
                        <div className='flex-1 flex flex-col gap-1'>
                            <label htmlFor='speciality' className='font-medium'>Speciality</label>
                            <select id='speciality' onChange={e => setSpeciality(e.target.value)} value={speciality} className='border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50'>
                                <option value="General physician">General physician</option>
                                <option value="Gynecologist">Gynecologist</option>
                                <option value="Dermatologist">Dermatologist</option>
                                <option value="Pediatricians">Pediatricians</option>
                                <option value="Neurologist">Neurologist</option>
                                <option value="Gastroenterologist">Gastroenterologist</option>
                            </select>
                        </div>
                        <div className='flex-1 flex flex-col gap-1'>
                            <label htmlFor='degree' className='font-medium'>Degree</label>
                            <input id='degree' onChange={e => setDegree(e.target.value)} value={degree} className='border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50' type="text" placeholder='e.g. MBBS, MD' required />
                        </div>
                        <div className='flex-1 flex flex-col gap-1'>
                            <label htmlFor='regNumber' className='font-medium'>Registration number</label>
                            <input id='regNumber' onChange={e => setRegNumber(e.target.value)} value={regNumber} className='border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50' type="text" placeholder='e.g. DMC/12345' />
                            <span className='text-xs text-gray-500'>As per council record</span>
                        </div>
                        <div className='flex-1 flex flex-col gap-1'>
                            <label htmlFor='stateCouncil' className='font-medium'>State Medical Council</label>
                            <input id='stateCouncil' onChange={e => setStateCouncil(e.target.value)} value={stateCouncil} className='border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50' type="text" placeholder='e.g. Delhi Medical Council' />
                        </div>
                        <div className='flex-1 flex flex-col gap-1'>
                            <label htmlFor='qualification' className='font-medium'>Qualification (as per portal)</label>
                            <input id='qualification' onChange={e => setQualification(e.target.value)} value={qualification} className='border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50' type="text" placeholder='e.g. MBBS' />
                        </div>
                        <div className='flex-1 flex flex-col gap-1'>
                            <label htmlFor='regYear' className='font-medium'>Registration year</label>
                            <input id='regYear' onChange={e => setRegYear(e.target.value)} value={regYear} className='border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50' type="text" placeholder='e.g. 2015' />
                        </div>
                    </div>
                </div>

                {/* Card: Verification */}
                <div className='bg-white px-6 py-6 border rounded-xl shadow-sm w-full mb-6'>
                    <section ref={verificationRef}>
                        <p className='mb-3 font-semibold text-lg'>Verification</p>
                        <div className='flex flex-wrap items-center gap-2'>
                            <button type='button' onClick={callVerify} disabled={verifying} className={`px-3 py-1.5 text-sm rounded-md inline-flex items-center gap-1.5 transition ${verifying ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-blue-700'}`}>
                                {/* magnifier icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 104.473 8.697l3.165 3.165a.75.75 0 101.06-1.06l-3.165-3.166A5.5 5.5 0 009 3.5zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" /></svg>
                                <span className='hidden sm:inline'>{verifying ? 'Verifying…' : 'IMR Lookup'}</span>
                            </button>
                            <label className='inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition text-gray-700' title='Upload Registration Certificate'>
                                {/* document icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V9l-4-4H5z" /><path d="M9 3v4h4" /></svg>
                                <span className='hidden sm:inline'>Reg Cert</span>
                                <input hidden type='file' accept='image/*,application/pdf' onChange={e => setDocRegCert(e.target.files[0])} />
                            </label>
                            <label className='inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition text-gray-700' title='Upload Degree Certificate'>
                                {/* academic cap icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.513 2.036a1 1 0 00-1.026 0l-7 4a1 1 0 000 1.732l7 4a1 1 0 001.026 0l5.487-3.135V13a1 1 0 11-2 0v-1.382l-3 1.792V16a1 1 0 102 0v-1.236l3.487-2a1 1 0 00.513-.868V7.768l1.026-.586a1 1 0 000-1.732l-7-4z" /></svg>
                                <span className='hidden sm:inline'>Degree</span>
                                <input hidden type='file' accept='image/*,application/pdf' onChange={e => setDocDegreeCert(e.target.files[0])} />
                            </label>
                            <label className='inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition text-gray-700' title='Upload Government ID'>
                                {/* id badge icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6 2a2 2 0 00-2 2v1h12V4a2 2 0 00-2-2H6z" /><path fillRule="evenodd" d="M4 7a2 2 0 00-2 2v5a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2H4zm5 2a2 2 0 100 4 2 2 0 000-4zm5 1.5a.5.5 0 010 1H11a.5.5 0 010-1h3zM9 13H6.5a.5.5 0 010-1H9a.5.5 0 010 1z" clipRule="evenodd" /></svg>
                                <span className='hidden sm:inline'>Govt ID</span>
                                <input hidden type='file' accept='image/*,application/pdf' onChange={e => setDocGovId(e.target.files[0])} />
                            </label>
                            <label className='inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition text-gray-700' title='Upload Portal Screenshot'>
                                {/* image icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm11 3a1 1 0 110 2 1 1 0 010-2z" /><path d="M4 15l3.5-3.5a1 1 0 011.414 0L12 14l2.5-2.5a1 1 0 011.5.134L16 15H4z" /></svg>
                                <span className='hidden sm:inline'>Screenshot</span>
                                <input hidden type='file' accept='image/*' onChange={e => setPortalShot(e.target.files[0])} />
                            </label>
                            <button type='button' onClick={runOCR} className='px-3 py-1.5 text-sm rounded-md inline-flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 transition'>
                                {/* sparkles icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l.473 1.45a1 1 0 00.95.69h1.523c.969 0 1.371 1.24.588 1.81l-1.232.895a1 1 0 00-.364 1.118l.47 1.45c.3.922-.755 1.688-1.54 1.118l-1.232-.895a1 1 0 00-1.176 0l-1.232.895c-.784.57-1.838-.196-1.539-1.118l.47-1.45a1 1 0 00-.364-1.118l-1.232-.895c-.783-.57-.38-1.81.588-1.81H7.626a1 1 0 00.95-.69l.473-1.45z" /></svg>
                                <span className='hidden sm:inline'>Run OCR</span>
                            </button>
                        </div>
                        <div className='mt-3'>
                            <textarea value={portalPaste} onChange={e => setPortalPaste(e.target.value)} className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50' rows={3} placeholder='Paste IMR/State portal text here to auto-parse (optional)'></textarea>
                            <div className='mt-2'>
                                <button type='button' onClick={parsePastedPortal} className='px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition'>Parse Portal Result</button>
                            </div>
                        </div>
                        {verification && (
                            <div className='mt-3 text-sm text-gray-700'>
                                {(verification.status === 'captcha_required' || verification.status === 'manual_required') && (
                                    <div className='mb-3 p-3 rounded-lg border bg-gray-50 flex flex-col gap-2'>
                                        <p className='text-gray-700'>{verification.message || verification.notes}</p>
                                        <div className='flex flex-wrap gap-2'>
                                            {verification.source && (
                                                <a href={verification.source} target='_blank' rel='noreferrer' className='px-3 py-1.5 text-xs rounded-md bg-primary-600 text-white hover:bg-blue-700'>Open IMR Portal</a>
                                            )}
                                            <button type='button' onClick={loadManualInstructions} className='px-3 py-1.5 text-xs rounded-md border hover:bg-gray-100'>
                                                {loadingInstructions ? 'Loading…' : 'View manual steps'}
                                            </button>
                                        </div>
                                        {instructionSteps && instructionSteps.length > 0 && (
                                            <ol className='list-decimal pl-5 text-xs text-gray-600 space-y-1 mt-2'>
                                                {instructionSteps.map((s, i) => (
                                                    <li key={i}>{s}</li>
                                                ))}
                                            </ol>
                                        )}
                                    </div>
                                )}
                                <div>Verified: <span className={verification.verified ? 'text-emerald-600' : 'text-rose-600'}>{String(verification.verified)}</span></div>
                                <div>Documents match: {verification.documents_match === undefined ? 'N/A' : String(verification.documents_match)}</div>
                                <div>Notes: {verification.notes || '-'}</div>
                            </div>
                        )}
                    </section>
                </div>

                {/* Card: About Doctor */}
                <div className='bg-white px-6 py-6 border rounded-xl shadow-sm w-full'>
                    <section ref={aboutRef}>
                        <p className='mb-2 text-sm font-medium text-gray-600'>About Doctor</p>
                        <textarea onChange={e => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50' rows={5} placeholder='Short professional bio and expertise' required></textarea>
                    </section>
                </div>

                {!isReadOnly && <div className='mt-6 flex justify-end'>
                    <button
                        type='submit'
                        disabled={loading}
                        aria-busy={loading ? 'true' : 'false'}
                        className={`px-6 py-2 text-white rounded-md transition ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-primary hover:bg-primary-dark'
                            }`}
                    >
                        {loading ? 'Adding Doctor...' : 'Add Doctor'}
                    </button>
                </div>}

            </div>

        </form>
    )
}

export default AddDoctor