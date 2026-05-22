import React, { useEffect, useMemo, useState, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import QRCode from 'qrcode'
import { toast } from 'react-toastify'
import { jsPDF } from 'jspdf'

const VHealthCard = () => {
	const { backendUrl, token, userData } = useContext(AppContext)
	const [card, setCard] = useState(null)
	const [qrDataUrl, setQrDataUrl] = useState('')
	const [loading, setLoading] = useState(false)
	const [visitorForm, setVisitorForm] = useState({ name: '', relation: '', expiry: '' })
	const [idProofType, setIdProofType] = useState('Aadhaar')
	const [idProofOther, setIdProofOther] = useState('')
	const [userQuery, setUserQuery] = useState('')
	const [userResults, setUserResults] = useState([])
	const [isSearchingUsers, setIsSearchingUsers] = useState(false)
	const [selectedVisitorUser, setSelectedVisitorUser] = useState(null)
	const [showQRModal, setShowQRModal] = useState(false)

	const vhidText = useMemo(() => card?.vhid || '', [card])

	// Generate dynamic QR code with V-HID data
	const generateQRCode = async (vhidValue) => {
		try {
			const qrOptions = {
				errorCorrectionLevel: 'H',
				type: 'image/png',
				quality: 1,
				margin: 2,
				width: 300,
				color: { dark: '#000000', light: '#FFFFFF' }
			}
			const url = await QRCode.toDataURL(vhidValue, qrOptions)
			setQrDataUrl(url)
		} catch (error) {
			console.error('Error generating QR code:', error)
			toast.error('Failed to generate QR code')
		}
	}

	const loadCard = async () => {
		try {
			setLoading(true)
			await axios.post(`${backendUrl}/api/vhid/ensure`, {}, { headers: { token } })
			const { data } = await axios.get(`${backendUrl}/api/vhid/card`, { headers: { token } })
			if (data.success) {
				const c = {
					name: data.card?.name,
					email: data.card?.email,
					image: data.card?.image,
					bloodGroup: data.card?.bloodGroup || '',
					vhid: data.card?.vhid,
					authorizedVisitors: data.card?.authorizedVisitors || []
				}
				setCard(c)
				if (c.vhid) await generateQRCode(c.vhid)
			} else {
				toast.error(data.message || 'Failed to load V-HID card')
			}
		} catch (e) {
			console.error(e)
			toast.error('Failed to load V-HID card')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (token) loadCard()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token])

	const addVisitor = async () => {
		try {
			const proof = idProofType === 'Other' ? idProofOther.trim() : idProofType
			if (!visitorForm.name || !visitorForm.relation || !proof) {
				return toast.error('Fill name, relation, and ID proof')
			}
			const payload = { ...visitorForm, idProof: proof }
			const { data } = await axios.post(`${backendUrl}/api/vhid/authorized/add`, payload, { headers: { token } })
			if (data.success) {
				toast.success('Visitor added')
				setVisitorForm({ name: '', relation: '', expiry: '' })
				setIdProofType('Aadhaar')
				setIdProofOther('')
				setSelectedVisitorUser(null)
				setUserQuery('')
				setCard(prev => ({ ...prev, authorizedVisitors: data.authorizedVisitors }))
			} else {
				toast.error(data.message || 'Failed to add visitor')
			}
		} catch (e) {
			console.error(e)
			toast.error(e.response?.data?.message || 'Failed to add visitor')
		}
	}

	useEffect(() => {
		let t;
		const run = async () => {
			if (!userQuery || userQuery.trim().length < 2) { setUserResults([]); return }
			try {
				setIsSearchingUsers(true)
				const { data } = await axios.get(`${backendUrl}/api/user/search`, { headers: { token }, params: { q: userQuery.trim() } })
				setUserResults(data.success ? (data.users || []) : [])
			} catch (_) { setUserResults([]) }
			finally { setIsSearchingUsers(false) }
		}
		t = setTimeout(run, 350)
		return () => clearTimeout(t)
	}, [userQuery, backendUrl, token])

	const removeVisitor = async (passId) => {
		try {
			const { data } = await axios.post(`${backendUrl}/api/vhid/authorized/remove`, { passId }, { headers: { token } })
			if (data.success) {
				toast.success('Visitor removed')
				setCard(prev => ({ ...prev, authorizedVisitors: data.authorizedVisitors }))
			} else {
				toast.error(data.message || 'Failed to remove visitor')
			}
		} catch (e) {
			console.error(e)
			toast.error(e.response?.data?.message || 'Failed to remove visitor')
		}
	}

	const downloadPDF = () => {
		try {
			if (!card) return
			const doc = new jsPDF({ unit: 'pt', format: 'a4' })
			const x = 40, y = 60
			doc.setFontSize(18)
			doc.text('Virtual Health ID Card (V-HID)', x, y)
			doc.setFontSize(12)
			doc.text(`Name: ${card.name || ''}`, x, y + 30)
			doc.text(`Email: ${card.email || ''}`, x, y + 50)
			doc.text(`Blood Group: ${card.bloodGroup || 'N/A'}`, x, y + 70)
			doc.text(`V-HID: ${card.vhid}`, x, y + 90)
			if (qrDataUrl) {
				doc.addImage(qrDataUrl, 'PNG', x, y + 110, 150, 150)
			}
			doc.save(`V-HID-${card.vhid}.pdf`)
		} catch (e) {
			console.error(e)
			toast.error('Failed to generate PDF')
		}
	}

	return (
		<>
			{/* QR Code Modal - Clean & Simple */}
			{showQRModal && qrDataUrl && (
				<div
					className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4'
					onClick={() => setShowQRModal(false)}
				>
					<div
						className='bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl'
						onClick={(e) => e.stopPropagation()}
					>
						<div className='flex items-center justify-between mb-6'>
							<h3 className='text-lg font-semibold text-gray-900'>Scan to Verify</h3>
							<button
								onClick={() => setShowQRModal(false)}
								className='text-gray-400 hover:text-gray-600 transition-colors'
							>
								<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
								</svg>
							</button>
						</div>

						<div className='bg-gray-50 rounded-xl p-4 mb-5 flex justify-center border border-gray-100'>
							<img
								src={qrDataUrl}
								alt='V-HID QR'
								className='w-56 h-56 object-contain mix-blend-multiply'
							/>
						</div>

						<div className='text-center mb-6'>
							<p className='text-xs text-gray-500 uppercase tracking-wide font-medium'>V-Health ID</p>
							<p className='text-base font-mono font-bold text-gray-900'>{vhidText}</p>
						</div>

						<div className='flex gap-3'>
							<button
								onClick={() => {
									const link = document.createElement('a')
									link.download = `VHID-${vhidText}.png`
									link.href = qrDataUrl
									link.click()
								}}
								className='flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors'
							>
								Download
							</button>
						</div>
					</div>
				</div>
			)}

			<div className='max-w-4xl mx-auto space-y-6'>
				{/* Main Health ID Card - Refined Minimalist Layout */}
				<div className='bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm'>
					<div className='p-6 md:p-8'>
						<div className='flex flex-col md:flex-row gap-8 items-start'>

							{/* Left: Identity & Info */}
							<div className='flex-1 w-full'>
								{/* Header */}
								<div className='flex items-center justify-between mb-6'>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center text-white'>
											<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0' />
											</svg>
										</div>
										<div>
											<h3 className='text-lg font-bold text-gray-900 leading-tight'>Prescripto</h3>
											<p className='text-xs text-gray-500'>Personal Digital Identity</p>
										</div>
									</div>
									<div className='flex gap-2'>
										<button onClick={loadCard} className='p-2 text-gray-400 hover:text-gray-900 transition-colors' title='Refresh'>
											<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' /></svg>
										</button>
										<button onClick={downloadPDF} className='p-2 text-gray-400 hover:text-gray-900 transition-colors' title='Download PDF'>
											<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg>
										</button>
									</div>
								</div>

								{/* Profile Details - Clean List */}
								<div className='flex items-start gap-5 mb-6'>
									<img
										src={(card?.image) || userData?.image}
										alt='Profile'
										className='w-16 h-16 rounded-xl object-cover border border-gray-100'
									/>
									<div>
										<h4 className='text-xl font-bold text-gray-900'>{card?.name || userData?.name}</h4>
										<p className='text-sm text-gray-500 mb-2'>{card?.email || userData?.email}</p>
										<span className='inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-50 text-gray-700 border border-gray-200 uppercase tracking-wide'>Verified Patient</span>
									</div>
								</div>

								{/* Key Metrics - Simple Grid */}
								<div className='grid grid-cols-2 gap-4'>
									<div className='p-3 rounded-lg border border-gray-100 bg-gray-50/50'>
										<p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1'>Blood Group</p>
										<p className='text-base font-bold text-gray-900'>{card?.bloodGroup || '—'}</p>
									</div>
									<div className='p-3 rounded-lg border border-gray-100 bg-gray-50/50'>
										<p className='text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1'>V-Health ID</p>
										<p className='text-sm font-mono font-semibold text-gray-900'>{vhidText || '—'}</p>
									</div>
								</div>
							</div>

							{/* Right: QR Code Visual - Compact */}
							<div className='w-full md:w-auto flex justify-center md:justify-end'>
								{qrDataUrl ? (
									<div
										onClick={() => setShowQRModal(true)}
										className='group relative cursor-pointer p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all'
									>
										<img
											src={qrDataUrl}
											alt='QR'
											className='w-32 h-32 object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity'
										/>
										<div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
											<span className='bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm'>Expand</span>
										</div>
									</div>
								) : (
									<div className='w-32 h-32 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-200'>
										{loading ? <div className='w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin'></div> : <span className='text-xs text-gray-400'>No QR</span>}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Authorized Visitors - Compact Panel */}
				<div className='bg-white rounded-2xl border-2 border-dotted border-gray-300 overflow-hidden shadow-sm'>
					<div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30'>
						<h4 className='text-sm font-bold text-gray-900'>Authorized Visitors</h4>
						<span className='text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full'>
							{card?.authorizedVisitors?.length || 0} / 3
						</span>
					</div>

					<div className='p-6'>
						{/* Add Visitor - Single Line Form */}
						<div className='mb-6'>
							<div className='flex items-center gap-2'>
								{/* Search */}
								<div className="relative w-32 md:w-40 flex-shrink-0">
									<input
										value={userQuery}
										onChange={(e) => { setUserQuery(e.target.value); setSelectedVisitorUser(null); }}
										placeholder='Search...'
										className='w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-gray-900 outline-none'
									/>
									{userResults.length > 0 && (
										<div className='absolute top-full left-0 w-64 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto'>
											{userResults.map(u => (
												<button
													key={u._id}
													onClick={() => {
														setSelectedVisitorUser(u);
														setVisitorForm(prev => ({ ...prev, name: u.name || prev.name }));
														setUserQuery(u.name || u.email || '');
														setUserResults([]);
													}}
													className='w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700 truncate'
												>
													{u.name} <span className='text-gray-400'>({u.email})</span>
												</button>
											))}
										</div>
									)}
								</div>

								{/* Name */}
								<input
									value={visitorForm.name}
									onChange={(e) => setVisitorForm({ ...visitorForm, name: e.target.value })}
									placeholder='Name'
									className='flex-1 min-w-[80px] px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-gray-900 outline-none'
								/>

								{/* Relation */}
								<select
									value={visitorForm.relation}
									onChange={(e) => setVisitorForm({ ...visitorForm, relation: e.target.value })}
									className='w-20 px-1 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-gray-900 outline-none'
								>
									<option value=''>Rel</option>
									<option>Father</option>
									<option>Mother</option>
									<option>Spouse</option>
									<option>Sibling</option>
									<option>Friend</option>
									<option>Other</option>
								</select>

								{/* ID Type */}
								<select
									value={idProofType}
									onChange={(e) => setIdProofType(e.target.value)}
									className='w-20 px-1 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-gray-900 outline-none'
								>
									<option>Aadhaar</option>
									<option>Passport</option>
									<option>License</option>
									<option>Other</option>
								</select>

								{/* Expiry */}
								<input
									type='date'
									value={visitorForm.expiry}
									onChange={(e) => setVisitorForm({ ...visitorForm, expiry: e.target.value })}
									className='w-28 px-1 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-gray-900 outline-none text-gray-500'
								/>

								{/* ID Proof Other - Inline if visible */}
								{idProofType === 'Other' && (
									<input
										className='w-24 px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-gray-900 outline-none'
										placeholder='Proof'
										value={idProofOther}
										onChange={(e) => setIdProofOther(e.target.value)}
									/>
								)}

								{/* Add Button */}
								<button
									onClick={addVisitor}
									disabled={(card?.authorizedVisitors?.length || 0) >= 3}
									className='px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-black disabled:opacity-50 transition-colors whitespace-nowrap'
								>
									Add
								</button>
							</div>
						</div>

						{/* List */}
						<div className='divide-y divide-gray-100 border-t border-gray-100'>
							{(card?.authorizedVisitors || []).length === 0 ? (
								<p className='text-center py-6 text-sm text-gray-400 italic'>No authorized visitors added yet.</p>
							) : (
								(card.authorizedVisitors || []).map((v) => (
									<div key={v.passId} className='flex items-center justify-between py-3 group hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors'>
										<div className='flex items-center gap-3 min-w-0'>
											<div className='w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100'>
												{v.name.charAt(0).toUpperCase()}
											</div>
											<div className='min-w-0'>
												<div className="flex items-center gap-2">
													<p className='text-sm font-medium text-gray-900 truncate'>{v.name}</p>
													<span className='text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium'>{v.relation}</span>
												</div>
												<p className='text-[10px] text-gray-400 truncate'>Pass ID: {v.passId} · Exp: {new Date(v.expiry).toLocaleDateString()}</p>
											</div>
										</div>
										<button
											onClick={() => removeVisitor(v.passId)}
											className='p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100'
											title="Remove"
										>
											<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' /></svg>
										</button>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default VHealthCard
