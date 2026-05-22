import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const TestPayment = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { backendUrl, token } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [paymentProcessed, setPaymentProcessed] = useState(false);

    const appointmentId = searchParams.get('appointmentId');
    const paymentLinkId = searchParams.get('paymentLinkId');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency') || 'INR';

    useEffect(() => {
        if (!appointmentId || !paymentLinkId) {
            toast.error('Invalid payment parameters');
            navigate('/my-appointments');
        }
    }, [appointmentId, paymentLinkId, navigate]);

    const handlePaymentSuccess = async () => {
        if (paymentProcessed) return;
        
        setLoading(true);
        setPaymentProcessed(true);
        
        try {
            toast.info('Processing payment...');
            
            const { data } = await axios.post(
                backendUrl + '/api/user/verifyZoho',
                {
                    appointmentId,
                    payment_link_id: paymentLinkId
                },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Payment successful! Appointment confirmed.');
                setTimeout(() => {
                    navigate('/my-appointments');
                }, 2000);
            } else {
                toast.error(data.message || 'Payment verification failed');
                setPaymentProcessed(false);
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.response?.data?.message || 'Payment verification failed');
            setPaymentProcessed(false);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentFailure = () => {
        toast.error('Payment cancelled or failed');
        navigate('/my-appointments');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                <div className="text-center">
                    <div className="mb-6">
                        <img 
                            src="https://www.zoho.com/sites/zweb/images/productlogos/payments.svg" 
                            alt="Zoho Payments" 
                            className="mx-auto h-12 mb-4"
                        />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Payment</h2>
                        <p className="text-gray-600">This is a test payment environment</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="text-sm text-gray-600 space-y-2">
                            <div className="flex justify-between">
                                <span>Amount:</span>
                                <span className="font-semibold">{currency} {amount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Payment ID:</span>
                                <span className="font-mono text-xs">{paymentLinkId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Appointment ID:</span>
                                <span className="font-mono text-xs">{appointmentId}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handlePaymentSuccess}
                            disabled={loading || paymentProcessed}
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Processing...' : 'Simulate Successful Payment'}
                        </button>

                        <button
                            onClick={handlePaymentFailure}
                            disabled={loading}
                            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Simulate Payment Failure
                        </button>

                        <button
                            onClick={() => navigate('/my-appointments')}
                            disabled={loading}
                            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="mt-6 text-xs text-gray-500">
                        <p>⚠️ This is a test environment</p>
                        <p>No real payment will be processed</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestPayment;