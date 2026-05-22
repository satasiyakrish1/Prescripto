import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { ArrowRight, CalendarCheck } from 'lucide-react'

const TopDoctors = () => {
    const navigate = useNavigate()
    const { doctors } = useContext(AppContext)

    const go = (id) => { navigate(`/appointment/${id}`); scrollTo(0, 0) }

    return (
        <section className="td-section">
            {/* Header */}
            <h2 className="td-title">Trusted Doctors</h2>
            <p className="td-subtitle">Browse our extensive list of trusted doctors and book your appointment in seconds.</p>

            {/* Grid */}
            <div className="td-grid">
                {doctors.length === 0
                    ? [...Array(4)].map((_, i) => (
                        <div className="td-card" key={i}>
                            <div className="td-skel-avatar" />
                            <div className="td-skel-line" style={{ width: '60%', marginTop: 14 }} />
                            <div className="td-skel-line" style={{ width: '40%', marginTop: 8 }} />
                        </div>
                    ))
                    : doctors.map((doc, i) => (
                        <div className="td-card" key={doc._id || i} onClick={() => go(doc._id)}>
                            {/* Avatar */}
                            <div className="td-avatar-wrap">
                                <img src={doc.image} alt={doc.name} className="td-avatar" loading="lazy" />
                                <span className={`td-dot ${doc.available ? 'td-online' : 'td-offline'}`} />
                            </div>

                            {/* Info */}
                            <p className="td-name">{doc.name}</p>
                            <span className="td-spec-pill">{doc.speciality}</span>

                            {/* Availability label */}
                            <p className={`td-avail-label ${doc.available ? 'td-avail-yes' : 'td-avail-no'}`}>
                                {doc.available ? 'Available today' : 'Not available'}
                            </p>

                            {/* Book button — slides up on hover */}
                            <button
                                className="td-book-btn"
                                onClick={(e) => { e.stopPropagation(); go(doc._id) }}
                            >
                                <CalendarCheck size={14} />
                                Book appointment
                            </button>
                        </div>
                    ))
                }
            </div>

            {/* CTA */}
            {doctors.length > 0 && (
                <button className="td-more" onClick={() => { navigate('/doctors'); scrollTo(0, 0) }}>
                    View all doctors <ArrowRight size={15} />
                </button>
            )}
        </section>
    )
}

export default TopDoctors